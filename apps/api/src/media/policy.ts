import { randomUUID } from 'node:crypto';
import sharp from 'sharp';

export const MEDIA_UPLOAD_POLICY = {
  maximumBytes: 10 * 1024 * 1024,
  maximumInputPixels: 20_000_000,
  maximumDimension: 12_000,
  supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export type SupportedMediaExtension = 'jpg' | 'png' | 'webp';
export type SupportedMediaMimeType =
  (typeof MEDIA_UPLOAD_POLICY.supportedMimeTypes)[number];

export type MediaUploadValidation =
  | {
      ok: true;
      byteSize: number;
      mimeType: SupportedMediaMimeType;
      extension: SupportedMediaExtension;
      width: number;
      height: number;
    }
  | {
      ok: false;
      reason:
        | 'empty_file'
        | 'file_too_large'
        | 'unsupported_type'
        | 'unsupported_content'
        | 'content_type_mismatch'
        | 'malformed_content'
        | 'dimensions_too_large';
    };

type DetectedImage = {
  mimeType: SupportedMediaMimeType;
  extension: SupportedMediaExtension;
  format: 'jpeg' | 'png' | 'webp';
};

const DETECTED_IMAGES: readonly DetectedImage[] = [
  { mimeType: 'image/png', extension: 'png', format: 'png' },
  { mimeType: 'image/jpeg', extension: 'jpg', format: 'jpeg' },
  { mimeType: 'image/webp', extension: 'webp', format: 'webp' },
];

function detectImage(bytes: Uint8Array): DetectedImage | undefined {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return DETECTED_IMAGES[0];
  }

  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return DETECTED_IMAGES[1];
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  ) {
    return DETECTED_IMAGES[2];
  }
}

export async function validateMediaUpload(
  bytes: Uint8Array,
  declaredMimeType: string,
): Promise<MediaUploadValidation> {
  if (bytes.byteLength === 0) return { ok: false, reason: 'empty_file' };
  if (bytes.byteLength > MEDIA_UPLOAD_POLICY.maximumBytes) {
    return { ok: false, reason: 'file_too_large' };
  }
  if (
    !MEDIA_UPLOAD_POLICY.supportedMimeTypes.includes(
      declaredMimeType as SupportedMediaMimeType,
    )
  ) {
    return { ok: false, reason: 'unsupported_type' };
  }

  const detected = detectImage(bytes);
  if (!detected) return { ok: false, reason: 'unsupported_content' };
  if (detected.mimeType !== declaredMimeType) {
    return { ok: false, reason: 'content_type_mismatch' };
  }
  if (!hasCompleteContainer(bytes, detected)) {
    return { ok: false, reason: 'malformed_content' };
  }

  const sharpOptions = {
    limitInputPixels: MEDIA_UPLOAD_POLICY.maximumInputPixels,
    failOn: 'warning' as const,
  };

  try {
    const metadata = await sharp(bytes, sharpOptions).metadata();
    if (
      metadata.format !== detected.format ||
      !metadata.width ||
      !metadata.height
    ) {
      return { ok: false, reason: 'malformed_content' };
    }

    if (
      metadata.width > MEDIA_UPLOAD_POLICY.maximumDimension ||
      metadata.height > MEDIA_UPLOAD_POLICY.maximumDimension ||
      metadata.width * metadata.height > MEDIA_UPLOAD_POLICY.maximumInputPixels
    ) {
      return { ok: false, reason: 'dimensions_too_large' };
    }

    // metadata() parses headers only; decoding to raw pixels also catches truncated payloads.
    await sharp(bytes, sharpOptions).raw().toBuffer();

    return {
      ok: true,
      byteSize: bytes.byteLength,
      mimeType: detected.mimeType,
      extension: detected.extension,
      width: metadata.width,
      height: metadata.height,
    };
  } catch {
    return { ok: false, reason: 'malformed_content' };
  }
}

export function createMediaObjectKey(
  extension: SupportedMediaExtension,
): string {
  return `media/${randomUUID()}.${extension}`;
}

function hasCompleteContainer(
  bytes: Uint8Array,
  image: DetectedImage,
): boolean {
  if (image.format === 'png') {
    const end = bytes.length - 12;
    return (
      end >= 8 &&
      bytes[end] === 0 &&
      bytes[end + 1] === 0 &&
      bytes[end + 2] === 0 &&
      bytes[end + 3] === 0 &&
      bytes[end + 4] === 0x49 &&
      bytes[end + 5] === 0x45 &&
      bytes[end + 6] === 0x4e &&
      bytes[end + 7] === 0x44 &&
      bytes[end + 8] === 0xae &&
      bytes[end + 9] === 0x42 &&
      bytes[end + 10] === 0x60 &&
      bytes[end + 11] === 0x82
    );
  }

  if (image.format === 'jpeg') {
    return bytes.length >= 4 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  }

  if (bytes.length < 12) return false;
  const riffSize =
    bytes[4]! +
    bytes[5]! * 0x100 +
    bytes[6]! * 0x1_0000 +
    bytes[7]! * 0x1_000000;
  return riffSize === bytes.length - 8;
}
