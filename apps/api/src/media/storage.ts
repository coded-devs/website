export interface PutMediaObject {
  key: string;
  bytes: Buffer;
  mimeType: string;
}

/** Private object storage operations used by the media service. */
export interface MediaStorage {
  putObject(input: PutMediaObject): Promise<void>;
  getObject(key: string): Promise<Buffer | null>;
  deleteObject(key: string): Promise<void>;
  resolveUrl(key: string): string;
}
