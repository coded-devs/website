import { and, count, desc, eq, getTableColumns, ilike, or } from 'drizzle-orm';
import type { createDatabase } from '../db/client.js';
import {
  auditEvents,
  mediaAssetReferences,
  mediaAssets,
} from '../db/schema.js';

type Database = ReturnType<typeof createDatabase>['db'];
type MediaAsset = typeof mediaAssets.$inferSelect;
type NewMediaAsset = typeof mediaAssets.$inferInsert;

export type MediaAssetLifecycleStatus = 'pending' | 'ready' | 'deleting';

export type MediaAssetInput = Pick<
  NewMediaAsset,
  'objectKey' | 'mimeType' | 'byteSize' | 'createdByAdminUserId'
> &
  Partial<Pick<NewMediaAsset, 'width' | 'height' | 'altText'>>;

export type MediaAssetListOptions = {
  query?: string;
  mimeType?: string;
  limit?: number;
  offset?: number;
};

export type MediaAssetWithReferencesCount = MediaAsset & {
  referencesCount: number;
};

export type MediaAssetDeletion = Pick<MediaAsset, 'id' | 'objectKey'>;

export class MediaAssetInUseError extends Error {
  readonly code = 'MEDIA_ASSET_IN_USE';

  constructor(
    readonly draftReferences: number,
    readonly publishedReferences: number,
  ) {
    super('Media asset cannot be deleted while references exist');
    this.name = 'MediaAssetInUseError';
  }
}

export class MediaAssetLifecycleConflictError extends Error {
  readonly code = 'MEDIA_ASSET_LIFECYCLE_CONFLICT';

  constructor(
    readonly lifecycleStatus: string,
    operation: string,
  ) {
    super(`Cannot ${operation} media asset while it is ${lifecycleStatus}`);
    this.name = 'MediaAssetLifecycleConflictError';
  }
}

export interface MediaRepository {
  createPendingAsset(input: MediaAssetInput): Promise<MediaAsset>;
  markAssetReady(
    id: string,
    actorAdminUserId: string,
  ): Promise<MediaAsset | null>;
  listAssets(
    options?: MediaAssetListOptions,
  ): Promise<MediaAssetWithReferencesCount[]>;
  getAsset(id: string): Promise<MediaAssetWithReferencesCount | null>;
  updateAltText(id: string, altText: string | null): Promise<MediaAsset | null>;
  beginAssetDeletion(
    id: string,
    actorAdminUserId: string,
  ): Promise<MediaAssetDeletion | null>;
  finalizeAssetDeletion(id: string): Promise<boolean>;
}

function throwIfReferenced(
  references: Array<{ snapshot: string; total: number }>,
): void {
  const draftReferences = Number(
    references.find((row) => row.snapshot === 'draft')?.total ?? 0,
  );
  const publishedReferences = Number(
    references.find((row) => row.snapshot === 'published')?.total ?? 0,
  );
  if (draftReferences + publishedReferences > 0) {
    throw new MediaAssetInUseError(draftReferences, publishedReferences);
  }
}

export function createDrizzleMediaRepository(db: Database): MediaRepository {
  return {
    async createPendingAsset(input) {
      const rows = await db
        .insert(mediaAssets)
        .values({ ...input, lifecycleStatus: 'pending' })
        .returning();
      return rows[0]!;
    },

    async markAssetReady(id, actorAdminUserId) {
      return db.transaction(async (tx) => {
        const assetRows = await tx
          .select()
          .from(mediaAssets)
          .where(eq(mediaAssets.id, id))
          .for('update');
        const asset = assetRows[0];
        if (!asset) return null;
        if (asset.lifecycleStatus === 'ready') return asset;
        if (asset.lifecycleStatus !== 'pending') {
          throw new MediaAssetLifecycleConflictError(
            asset.lifecycleStatus,
            'mark ready',
          );
        }
        const rows = await tx
          .update(mediaAssets)
          .set({ lifecycleStatus: 'ready', updatedAt: new Date() })
          .where(eq(mediaAssets.id, id))
          .returning();
        await tx.insert(auditEvents).values({
          actorAdminUserId,
          eventType: 'media.upload',
          targetType: 'media_asset',
          targetId: id,
          metadata: { lifecycleStatus: 'ready' },
        });
        return rows[0] ?? null;
      });
    },

    async listAssets(options = {}) {
      const { query, mimeType, limit = 50, offset = 0 } = options;
      const filters = [eq(mediaAssets.lifecycleStatus, 'ready')];
      if (mimeType) filters.push(eq(mediaAssets.mimeType, mimeType));
      if (query?.trim()) {
        const term = `%${query.trim()}%`;
        filters.push(
          or(
            ilike(mediaAssets.objectKey, term),
            ilike(mediaAssets.altText, term),
          )!,
        );
      }
      return db
        .select({
          ...getTableColumns(mediaAssets),
          referencesCount: count(mediaAssetReferences.id),
        })
        .from(mediaAssets)
        .leftJoin(
          mediaAssetReferences,
          eq(mediaAssetReferences.mediaAssetId, mediaAssets.id),
        )
        .where(and(...filters))
        .groupBy(mediaAssets.id)
        .orderBy(desc(mediaAssets.createdAt), desc(mediaAssets.id))
        .limit(limit)
        .offset(offset);
    },

    async getAsset(id) {
      const [assetRows, referenceRows] = await Promise.all([
        db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1),
        db
          .select({ referencesCount: count() })
          .from(mediaAssetReferences)
          .where(eq(mediaAssetReferences.mediaAssetId, id)),
      ]);
      const asset = assetRows[0];
      return asset
        ? { ...asset, referencesCount: referenceRows[0]?.referencesCount ?? 0 }
        : null;
    },

    async updateAltText(id, altText) {
      const rows = await db
        .update(mediaAssets)
        .set({ altText, updatedAt: new Date() })
        .where(
          and(eq(mediaAssets.id, id), eq(mediaAssets.lifecycleStatus, 'ready')),
        )
        .returning();
      return rows[0] ?? null;
    },

    async beginAssetDeletion(id, actorAdminUserId) {
      return db.transaction(async (tx) => {
        const assetRows = await tx
          .select()
          .from(mediaAssets)
          .where(eq(mediaAssets.id, id))
          .for('update');
        const asset = assetRows[0];
        if (!asset) return null;
        if (asset.lifecycleStatus === 'pending') {
          throw new MediaAssetLifecycleConflictError(
            asset.lifecycleStatus,
            'delete',
          );
        }

        const references = await tx
          .select({ snapshot: mediaAssetReferences.snapshot, total: count() })
          .from(mediaAssetReferences)
          .where(eq(mediaAssetReferences.mediaAssetId, id))
          .groupBy(mediaAssetReferences.snapshot);
        throwIfReferenced(references);

        if (asset.lifecycleStatus === 'deleting') {
          return { id: asset.id, objectKey: asset.objectKey };
        }
        const rows = await tx
          .update(mediaAssets)
          .set({ lifecycleStatus: 'deleting', updatedAt: new Date() })
          .where(eq(mediaAssets.id, id))
          .returning({ id: mediaAssets.id, objectKey: mediaAssets.objectKey });
        await tx.insert(auditEvents).values({
          actorAdminUserId,
          eventType: 'media.delete',
          targetType: 'media_asset',
          targetId: id,
          metadata: { lifecycleStatus: 'deleting' },
        });
        return rows[0] ?? null;
      });
    },

    async finalizeAssetDeletion(id) {
      return db.transaction(async (tx) => {
        const assetRows = await tx
          .select()
          .from(mediaAssets)
          .where(eq(mediaAssets.id, id))
          .for('update');
        const asset = assetRows[0];
        if (!asset) return false;
        if (asset.lifecycleStatus !== 'deleting') {
          throw new MediaAssetLifecycleConflictError(
            asset.lifecycleStatus,
            'finalize deletion of',
          );
        }
        const references = await tx
          .select({ snapshot: mediaAssetReferences.snapshot, total: count() })
          .from(mediaAssetReferences)
          .where(eq(mediaAssetReferences.mediaAssetId, id))
          .groupBy(mediaAssetReferences.snapshot);
        throwIfReferenced(references);
        await tx.delete(mediaAssets).where(eq(mediaAssets.id, id));
        return true;
      });
    },
  };
}
