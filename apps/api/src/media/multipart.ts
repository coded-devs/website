import Busboy from 'busboy';
import type { IncomingMessage } from 'node:http';

export const MAX_MEDIA_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_ALT_TEXT_BYTES = 2 * 1024;

export type MediaUploadErrorCode =
  | 'invalid_content_type'
  | 'malformed_multipart'
  | 'invalid_fields'
  | 'file_too_large'
  | 'request_error';

export class MediaUploadError extends Error {
  constructor(readonly code: MediaUploadErrorCode) {
    super(code);
    this.name = 'MediaUploadError';
  }
}

export interface ParsedMediaUpload {
  bytes: Buffer;
  declaredMimeType: string;
  altText?: string;
}

/** Reads the existing Admin `file` + optional `altText` multipart contract. */
export function readMediaUpload(
  request: IncomingMessage,
): Promise<ParsedMediaUpload> {
  const contentType = request.headers['content-type'];
  if (!contentType || !/^multipart\/form-data(?:\s*;|$)/i.test(contentType)) {
    request.resume();
    return Promise.reject(new MediaUploadError('invalid_content_type'));
  }

  let parser: ReturnType<typeof Busboy>;
  try {
    parser = Busboy({
      headers: request.headers,
      limits: {
        files: 2,
        fields: 2,
        parts: 3,
        fileSize: MAX_MEDIA_UPLOAD_BYTES + 1,
        fieldSize: MAX_ALT_TEXT_BYTES,
        headerPairs: 100,
      },
    });
  } catch {
    request.resume();
    return Promise.reject(new MediaUploadError('malformed_multipart'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let fileCount = 0;
    let altText: string | undefined;
    let hasAltText = false;
    let declaredMimeType: string | undefined;
    let bytesRead = 0;
    const chunks: Buffer[] = [];

    const rejectUpload = (code: MediaUploadErrorCode) => {
      if (settled) return;
      settled = true;
      request.unpipe(parser);
      request.resume();
      reject(new MediaUploadError(code));
    };

    parser.on('field', (name, value, info) => {
      if (name !== 'altText' || hasAltText || info.valueTruncated) {
        rejectUpload('invalid_fields');
        return;
      }
      hasAltText = true;
      altText = value;
    });

    parser.on('file', (name, file, info) => {
      fileCount += 1;
      if (name !== 'file' || fileCount !== 1) {
        file.resume();
        rejectUpload('invalid_fields');
        return;
      }

      declaredMimeType = info.mimeType;
      file.on('limit', () => rejectUpload('file_too_large'));
      file.on('data', (chunk: Buffer) => {
        if (settled) return;
        bytesRead += chunk.byteLength;
        if (bytesRead > MAX_MEDIA_UPLOAD_BYTES) {
          rejectUpload('file_too_large');
          return;
        }
        chunks.push(chunk);
      });
      file.on('error', () => rejectUpload('malformed_multipart'));
      file.on('end', () => {
        if (file.truncated) rejectUpload('file_too_large');
      });
    });

    parser.on('filesLimit', () => rejectUpload('invalid_fields'));
    parser.on('fieldsLimit', () => rejectUpload('invalid_fields'));
    parser.on('partsLimit', () => rejectUpload('invalid_fields'));
    parser.on('error', () => rejectUpload('malformed_multipart'));
    parser.on('close', () => {
      if (settled) return;
      if (fileCount !== 1 || declaredMimeType === undefined) {
        rejectUpload('invalid_fields');
        return;
      }
      settled = true;
      resolve({
        bytes: Buffer.concat(chunks, bytesRead),
        declaredMimeType,
        ...(altText === undefined ? {} : { altText }),
      });
    });

    request.on('error', () => rejectUpload('request_error'));
    request.on('aborted', () => rejectUpload('request_error'));
    request.pipe(parser);
  });
}
