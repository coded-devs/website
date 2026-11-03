import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import type { MediaStorage, PutMediaObject } from './storage.js';

export interface R2StorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBaseUrl: string;
}

type S3Sender = Pick<S3Client, 'send'>;

const OBJECT_KEY_PATTERN =
  /^media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg|webp)$/i;

function validateKey(key: string): void {
  if (!OBJECT_KEY_PATTERN.test(key)) {
    throw new TypeError('Invalid media object key');
  }
}

function publicBaseUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError('Invalid R2 public base URL');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new TypeError('Invalid R2 public base URL');
  }
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url;
}

/** Cloudflare R2 S3 adapter. Credentials are supplied by the caller and never
 * included in URLs, object metadata, or errors produced by this class. */
export class R2MediaStorage implements MediaStorage {
  private readonly client: S3Sender;
  private readonly bucket: string;
  private readonly baseUrl: URL;

  constructor(config: R2StorageConfig, client?: S3Sender) {
    if (
      !config.accountId ||
      !config.accessKeyId ||
      !config.secretAccessKey ||
      !config.bucket
    ) {
      throw new TypeError('R2 storage configuration is incomplete');
    }
    this.bucket = config.bucket;
    this.baseUrl = publicBaseUrl(config.publicBaseUrl);
    const clientConfig: S3ClientConfig = {
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      region: 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    };
    this.client = client ?? new S3Client(clientConfig);
  }

  async putObject({ key, bytes, mimeType }: PutMediaObject): Promise<void> {
    validateKey(key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentType: mimeType,
        IfNoneMatch: '*',
      }),
    );
  }

  async getObject(key: string): Promise<Buffer | null> {
    validateKey(key);
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      const body = (
        result as
          | { Body?: { transformToByteArray?: () => Promise<Uint8Array> } }
          | undefined
      )?.Body;
      if (!body?.transformToByteArray) return null;
      return Buffer.from(await body.transformToByteArray());
    } catch (error) {
      if (isMissingObject(error)) return null;
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    validateKey(key);
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  resolveUrl(key: string): string {
    validateKey(key);
    return new URL(
      key.split('/').map(encodeURIComponent).join('/'),
      this.baseUrl,
    ).toString();
  }
}

function isMissingObject(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as {
    name?: unknown;
    $metadata?: { httpStatusCode?: unknown };
  };
  return (
    value.name === 'NoSuchKey' ||
    value.name === 'NotFound' ||
    value.$metadata?.httpStatusCode === 404
  );
}
