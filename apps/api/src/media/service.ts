import { ContentError } from '../content/contracts.js';
import {
  MediaAssetInUseError,
  MediaAssetLifecycleConflictError,
  type MediaAssetListOptions,
  type MediaRepository,
} from './repository.js';
import {
  createMediaObjectKey,
  validateMediaUpload,
  type SupportedMediaExtension,
} from './policy.js';
import type { MediaStorage } from './storage.js';

export interface MediaAssetDto {
  id: string;
  objectKey: string;
  url: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  referencesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaUploadInput {
  bytes: Buffer;
  declaredMimeType: string;
  actorAdminUserId: string;
  altText?: string;
}

export interface MediaService {
  list(options: MediaAssetListOptions): Promise<{ assets: MediaAssetDto[] }>;
  get(id: string): Promise<MediaAssetDto>;
  upload(input: MediaUploadInput): Promise<MediaAssetDto>;
  replace(id: string, input: MediaUploadInput): Promise<MediaAssetDto>;
  updateAltText(id: string, altText: string | null): Promise<MediaAssetDto>;
  delete(id: string, actorAdminUserId: string): Promise<void>;
}

function toAssetDto(
  row: {
    id: string;
    objectKey: string;
    mimeType: string;
    byteSize: number;
    width: number | null;
    height: number | null;
    altText: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    lifecycleStatus?: string;
    referencesCount?: number;
  },
  storage: MediaStorage,
): MediaAssetDto {
  return {
    id: row.id,
    objectKey: row.objectKey,
    url: storage.resolveUrl(row.objectKey),
    mimeType: row.mimeType,
    byteSize: row.byteSize,
    width: row.width,
    height: row.height,
    altText: row.altText,
    referencesCount: row.referencesCount ?? 0,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function asServiceError(error: unknown): ContentError {
  if (error instanceof ContentError) return error;
  if (
    error instanceof MediaAssetInUseError ||
    error instanceof MediaAssetLifecycleConflictError
  ) {
    return new ContentError('conflict');
  }
  return new ContentError('internal');
}

export function createMediaService(
  repository: MediaRepository,
  storage: MediaStorage,
): MediaService {
  const upload = async (input: MediaUploadInput): Promise<MediaAssetDto> => {
    const validation = await validateMediaUpload(
      input.bytes,
      input.declaredMimeType,
    );
    if (!validation.ok) {
      if (validation.reason === 'file_too_large')
        throw new ContentError('validation');
      if (validation.reason === 'unsupported_type')
        throw new ContentError('validation');
      throw new ContentError('validation');
    }

    const altText = input.altText?.trim() || null;
    if (altText !== null && [...altText].length > 500) {
      throw new ContentError('validation');
    }

    const objectKey = createMediaObjectKey(
      validation.extension as SupportedMediaExtension,
    );
    let pending;
    try {
      pending = await repository.createPendingAsset({
        objectKey,
        mimeType: validation.mimeType,
        byteSize: validation.byteSize,
        width: validation.width,
        height: validation.height,
        altText,
        createdByAdminUserId: input.actorAdminUserId,
      });
      await storage.putObject({
        key: objectKey,
        bytes: input.bytes,
        mimeType: validation.mimeType,
      });
      const ready = await repository.markAssetReady(
        pending.id,
        input.actorAdminUserId,
      );
      if (!ready) throw new ContentError('internal');
      return toAssetDto(ready, storage);
    } catch (error) {
      throw asServiceError(error);
    }
  };

  return {
    async list(options) {
      try {
        const rows = await repository.listAssets(options);
        return {
          assets: rows
            .filter((row) => row.lifecycleStatus === 'ready')
            .map((row) => toAssetDto(row, storage)),
        };
      } catch (error) {
        throw asServiceError(error);
      }
    },

    async get(id) {
      try {
        const row = await repository.getAsset(id);
        if (!row || row.lifecycleStatus !== 'ready')
          throw new ContentError('not_found');
        return toAssetDto(row, storage);
      } catch (error) {
        throw asServiceError(error);
      }
    },

    upload,

    async replace(id, input) {
      let previous;
      try {
        previous = await repository.getAsset(id);
      } catch (error) {
        throw asServiceError(error);
      }
      if (!previous || previous.lifecycleStatus !== 'ready') {
        throw new ContentError('not_found');
      }
      return upload({
        ...input,
        altText: input.altText ?? previous.altText ?? undefined,
      });
    },

    async updateAltText(id, altText) {
      try {
        const updated = await repository.updateAltText(id, altText);
        if (!updated) throw new ContentError('not_found');
        const row = await repository.getAsset(id);
        if (!row || row.lifecycleStatus !== 'ready')
          throw new ContentError('not_found');
        return toAssetDto(row, storage);
      } catch (error) {
        throw asServiceError(error);
      }
    },

    async delete(id, actorAdminUserId) {
      try {
        const deletion = await repository.beginAssetDeletion(
          id,
          actorAdminUserId,
        );
        if (!deletion) throw new ContentError('not_found');
        await storage.deleteObject(deletion.objectKey);
        await repository.finalizeAssetDeletion(id);
      } catch (error) {
        throw asServiceError(error);
      }
    },
  };
}
