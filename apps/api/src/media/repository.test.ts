import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { eq } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { runMigrations } from '../db/migrator.js';
import {
  adminUsers,
  auditEvents,
  articles,
  mediaAssetReferences,
  mediaAssets,
} from '../db/schema.js';
import {
  createDrizzleMediaRepository,
  MediaAssetInUseError,
  MediaAssetLifecycleConflictError,
} from './repository.js';
import {
  syncMediaAssetReferences,
  UnknownMediaAssetError,
} from './reference-sync.js';

const databaseUrl = process.env.MEDIA_TEST_DATABASE_URL;
const testDatabaseName = 'cod317_media_test';

function assertDisposableLoopbackDatabase(value: string): void {
  const url = new URL(value);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(url.hostname));
  assert.equal(decodeURIComponent(url.pathname.slice(1)), testDatabaseName);
}

test(
  'media uploads stay pending until ready and ordinary listing hides non-ready rows',
  { skip: !databaseUrl },
  async () => {
    assertDisposableLoopbackDatabase(databaseUrl!);
    await runMigrations(databaseUrl!);
    const { db, pool } = createDatabase(databaseUrl!);
    const adminId = randomUUID();
    const repository = createDrizzleMediaRepository(db);
    const prefix = randomUUID();
    const ids: string[] = [];
    try {
      await db.insert(adminUsers).values({
        id: adminId,
        email: `${adminId}@media-test.invalid`,
        passwordHash: 'not-a-real-password-hash',
      });
      const pending = await repository.createPendingAsset({
        objectKey: `media/${prefix}-pending.png`,
        mimeType: 'image/png',
        byteSize: 128,
        width: 16,
        height: 8,
        altText: 'A sample mark',
        createdByAdminUserId: adminId,
      });
      ids.push(pending.id);
      assert.equal(pending.lifecycleStatus, 'pending');
      assert.equal(
        (await repository.listAssets()).some(
          (asset) => asset.id === pending.id,
        ),
        false,
      );

      const ready = await repository.markAssetReady(pending.id, adminId);
      assert.equal(ready?.lifecycleStatus, 'ready');
      assert.equal(
        (await repository.markAssetReady(pending.id, adminId))?.lifecycleStatus,
        'ready',
      );
      const uploadAudits = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.targetId, pending.id));
      assert.equal(uploadAudits.length, 1);
      assert.equal(uploadAudits[0]?.eventType, 'media.upload');
      assert.equal(uploadAudits[0]?.actorAdminUserId, adminId);
      assert.deepEqual(uploadAudits[0]?.metadata, { lifecycleStatus: 'ready' });
      assert.equal((await repository.getAsset(pending.id))?.referencesCount, 0);
      assert.deepEqual(
        (await repository.listAssets({ mimeType: 'image/png' })).map(
          (asset) => asset.id,
        ),
        [pending.id],
      );
      assert.equal(
        (await repository.listAssets({ mimeType: 'image/png' }))[0]
          ?.referencesCount,
        0,
      );

      const second = await repository.createPendingAsset({
        objectKey: `media/${prefix}-two.webp`,
        mimeType: 'image/webp',
        byteSize: 256,
        createdByAdminUserId: adminId,
      });
      ids.push(second.id);
      assert.deepEqual(
        (await repository.listAssets({ query: `${prefix}-two` })).map(
          (asset) => asset.id,
        ),
        [],
      );
      await repository.markAssetReady(second.id, adminId);
      assert.deepEqual(
        (await repository.listAssets({ query: `${prefix}-two` })).map(
          (asset) => asset.id,
        ),
        [second.id],
      );
      assert.equal(
        (await repository.listAssets({ query: 'does-not-match' })).length,
        0,
      );
    } finally {
      await db
        .delete(auditEvents)
        .where(eq(auditEvents.actorAdminUserId, adminId));
      for (const id of ids) {
        await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
      }
      await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
      await pool.end();
    }
  },
);

test(
  'media deletion stages, retries, and finalizes only unreferenced ready assets',
  { skip: !databaseUrl },
  async () => {
    assertDisposableLoopbackDatabase(databaseUrl!);
    await runMigrations(databaseUrl!);
    const { db, pool } = createDatabase(databaseUrl!);
    const adminId = randomUUID();
    const repository = createDrizzleMediaRepository(db);
    let assetId: string | undefined;
    try {
      await db.insert(adminUsers).values({
        id: adminId,
        email: `${adminId}@media-test.invalid`,
        passwordHash: 'not-a-real-password-hash',
      });
      const pending = await repository.createPendingAsset({
        objectKey: `media/${randomUUID()}.png`,
        mimeType: 'image/png',
        byteSize: 64,
        createdByAdminUserId: adminId,
      });
      assetId = pending.id;
      await assert.rejects(
        repository.beginAssetDeletion(pending.id, adminId),
        (error: unknown) => error instanceof MediaAssetLifecycleConflictError,
      );
      await assert.rejects(repository.markAssetReady(pending.id, randomUUID()));
      assert.equal(
        (await repository.getAsset(pending.id))?.lifecycleStatus,
        'pending',
      );
      await repository.markAssetReady(pending.id, adminId);

      await assert.rejects(
        repository.beginAssetDeletion(pending.id, randomUUID()),
      );
      assert.equal(
        (await repository.getAsset(pending.id))?.lifecycleStatus,
        'ready',
      );
      const deleting = await repository.beginAssetDeletion(pending.id, adminId);
      assert.deepEqual(deleting, {
        id: pending.id,
        objectKey: pending.objectKey,
      });
      assert.equal(
        (await repository.getAsset(pending.id))?.lifecycleStatus,
        'deleting',
      );
      assert.equal(
        (await repository.listAssets()).some(
          (asset) => asset.id === pending.id,
        ),
        false,
      );
      assert.deepEqual(
        await repository.beginAssetDeletion(pending.id, adminId),
        deleting,
      );
      const deleteAudits = await db
        .select()
        .from(auditEvents)
        .where(eq(auditEvents.targetId, pending.id));
      assert.deepEqual(deleteAudits.map((event) => event.eventType).sort(), [
        'media.delete',
        'media.upload',
      ]);
      assert.ok(
        deleteAudits.every((event) => event.actorAdminUserId === adminId),
      );
      assert.equal(await repository.finalizeAssetDeletion(pending.id), true);
      assert.equal(await repository.finalizeAssetDeletion(pending.id), false);
      assert.equal(await repository.getAsset(pending.id), null);
    } finally {
      await db
        .delete(auditEvents)
        .where(eq(auditEvents.actorAdminUserId, adminId));
      if (assetId)
        await db.delete(mediaAssets).where(eq(mediaAssets.id, assetId));
      await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
      await pool.end();
    }
  },
);

test(
  'reference trigger accepts only ready assets and deletion preserves draft and published references',
  { skip: !databaseUrl },
  async () => {
    assertDisposableLoopbackDatabase(databaseUrl!);
    await runMigrations(databaseUrl!);
    const { db, pool } = createDatabase(databaseUrl!);
    const adminId = randomUUID();
    const articleId = randomUUID();
    const repository = createDrizzleMediaRepository(db);
    let assetId: string | undefined;
    try {
      await db.insert(adminUsers).values({
        id: adminId,
        email: `${adminId}@media-test.invalid`,
        passwordHash: 'not-a-real-password-hash',
      });
      await db.insert(articles).values({
        id: articleId,
        draftSlug: `draft-${articleId}`,
        draftPayload: { title: 'Draft' },
      });
      const asset = await repository.createPendingAsset({
        objectKey: `media/${randomUUID()}.png`,
        mimeType: 'image/png',
        byteSize: 64,
        createdByAdminUserId: adminId,
      });
      assetId = asset.id;
      const refs = [
        {
          mediaAssetId: asset.id,
          snapshot: 'draft' as const,
          fieldKey: 'heroImage',
          articleId,
        },
        {
          mediaAssetId: asset.id,
          snapshot: 'published' as const,
          fieldKey: 'heroImage',
          articleId,
        },
      ];
      await assert.rejects(
        db.transaction((transaction) =>
          syncMediaAssetReferences(transaction, {
            payload: {
              coverImage: `https://media.example.test/${asset.objectKey}`,
            },
            publicMediaBaseUrl: 'https://media.example.test',
            owner: { kind: 'article', id: articleId },
            snapshot: 'draft',
          }),
        ),
        UnknownMediaAssetError,
      );
      await assert.rejects(db.insert(mediaAssetReferences).values(refs[0]!));
      await assert.rejects(repository.markAssetReady(asset.id, randomUUID()));
      assert.equal(
        (await repository.getAsset(asset.id))?.lifecycleStatus,
        'pending',
      );
      await repository.markAssetReady(asset.id, adminId);
      await db.insert(mediaAssetReferences).values(refs);
      assert.equal((await repository.getAsset(asset.id))?.referencesCount, 2);
      assert.equal(
        (await repository.listAssets()).find((row) => row.id === asset.id)
          ?.referencesCount,
        2,
      );
      await assert.rejects(
        repository.beginAssetDeletion(asset.id, adminId),
        (error: unknown) => {
          assert.ok(error instanceof MediaAssetInUseError);
          assert.equal(error.draftReferences, 1);
          assert.equal(error.publishedReferences, 1);
          return true;
        },
      );
      assert.equal(
        (await repository.getAsset(asset.id))?.lifecycleStatus,
        'ready',
      );

      await db
        .delete(mediaAssetReferences)
        .where(eq(mediaAssetReferences.mediaAssetId, asset.id));
      await repository.beginAssetDeletion(asset.id, adminId);
      await assert.rejects(db.insert(mediaAssetReferences).values(refs[0]!));
      assert.equal(await repository.finalizeAssetDeletion(asset.id), true);
      assetId = undefined;
    } finally {
      await db
        .delete(auditEvents)
        .where(eq(auditEvents.actorAdminUserId, adminId));
      if (assetId) {
        await db
          .delete(mediaAssetReferences)
          .where(eq(mediaAssetReferences.mediaAssetId, assetId));
        await db.delete(mediaAssets).where(eq(mediaAssets.id, assetId));
      }
      await db.delete(articles).where(eq(articles.id, articleId));
      await db.delete(adminUsers).where(eq(adminUsers.id, adminId));
      await pool.end();
    }
  },
);
