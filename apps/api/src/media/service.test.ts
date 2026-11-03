import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { test } from 'node:test';
import { ContentError } from '../content/contracts.js';
import type { MediaRepository } from './repository.js';
import { createMediaService } from './service.js';

const ADMIN_ID = randomUUID();
const png = await sharp({
  create: { width: 2, height: 3, channels: 3, background: '#336699' },
})
  .png()
  .toBuffer();

function fixture() {
  const rows = new Map<string, Record<string, unknown>>();
  const calls: string[] = [];
  let failPut = false;
  let failDelete = false;
  const repository = {
    async createPendingAsset(input: Record<string, unknown>) {
      calls.push('createPendingAsset');
      const row = {
        id: randomUUID(),
        ...input,
        width: 2,
        height: 3,
        lifecycleStatus: 'pending',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        altText: input.altText ?? null,
      };
      rows.set(row.id as string, row);
      return row as never;
    },
    async markAssetReady(id: string) {
      calls.push('markAssetReady');
      const row = rows.get(id);
      if (!row) return null;
      row.lifecycleStatus = 'ready';
      return row as never;
    },
    async listAssets() {
      calls.push('listAssets');
      return [...rows.values()].filter(
        (row) => row.lifecycleStatus === 'ready',
      ) as never;
    },
    async getAsset(id: string) {
      calls.push(`getAsset:${id}`);
      const row = rows.get(id);
      return row ? ({ ...row, referencesCount: 0 } as never) : null;
    },
    async updateAltText(id: string, altText: string | null) {
      calls.push('updateAltText');
      const row = rows.get(id);
      if (!row || row.lifecycleStatus !== 'ready') return null;
      row.altText = altText;
      return row as never;
    },
    async beginAssetDeletion(id: string) {
      calls.push('beginAssetDeletion');
      const row = rows.get(id);
      if (!row) return null;
      row.lifecycleStatus = 'deleting';
      return { id, objectKey: row.objectKey as string };
    },
    async finalizeAssetDeletion(id: string) {
      calls.push('finalizeAssetDeletion');
      rows.delete(id);
      return true;
    },
  } satisfies MediaRepository;
  const storage = {
    async putObject(input: { key: string; bytes: Buffer; mimeType: string }) {
      calls.push('putObject');
      if (failPut) throw new Error('sensitive storage detail');
      assert.match(input.key, /^media\/[0-9a-f-]{36}\.png$/);
      assert.equal(input.mimeType, 'image/png');
    },
    async getObject() {
      return null;
    },
    async deleteObject() {
      calls.push('deleteObject');
      if (failDelete) throw new Error('sensitive storage detail');
    },
    resolveUrl(key: string) {
      return `https://media.example.test/${key}`;
    },
  };
  return {
    service: createMediaService(repository, storage),
    calls,
    rows,
    setFailPut(value: boolean) {
      failPut = value;
    },
    setFailDelete(value: boolean) {
      failDelete = value;
    },
  };
}

test('upload validates image bytes and transitions pending storage to ready', async () => {
  const { service, calls } = fixture();
  const asset = await service.upload({
    bytes: png,
    declaredMimeType: 'image/png',
    altText: 'A mark',
    actorAdminUserId: ADMIN_ID,
  });
  assert.deepEqual(calls.slice(0, 3), [
    'createPendingAsset',
    'putObject',
    'markAssetReady',
  ]);
  assert.match(asset.objectKey, /^media\/[0-9a-f-]{36}\.png$/);
  assert.equal(asset.byteSize, png.length);
  assert.equal(asset.width, 2);
  assert.equal(asset.height, 3);
  assert.equal(asset.altText, 'A mark');
  assert.equal(asset.url, `https://media.example.test/${asset.objectKey}`);
  assert.equal(asset.referencesCount, 0);
});

test('invalid images fail before creating metadata or writing storage', async () => {
  const { service, calls } = fixture();
  await assert.rejects(
    service.upload({
      bytes: Buffer.from('not an image'),
      declaredMimeType: 'image/png',
      actorAdminUserId: ADMIN_ID,
    }),
    (error: unknown) =>
      error instanceof ContentError && error.kind === 'validation',
  );
  assert.deepEqual(calls, []);
});

test('upload alt text follows the 500-character metadata contract', async () => {
  const { service, calls } = fixture();
  await assert.rejects(
    service.upload({
      bytes: png,
      declaredMimeType: 'image/png',
      altText: 'x'.repeat(501),
      actorAdminUserId: ADMIN_ID,
    }),
    (error: unknown) =>
      error instanceof ContentError && error.kind === 'validation',
  );
  assert.deepEqual(calls, []);

  const asset = await service.upload({
    bytes: png,
    declaredMimeType: 'image/png',
    altText: '  Company logo  ',
    actorAdminUserId: ADMIN_ID,
  });
  assert.equal(asset.altText, 'Company logo');
});

test('storage failures return a safe unavailable error and retain pending metadata', async () => {
  const { service, calls, setFailPut } = fixture();
  setFailPut(true);
  await assert.rejects(
    service.upload({
      bytes: png,
      declaredMimeType: 'image/png',
      actorAdminUserId: ADMIN_ID,
    }),
    (error: unknown) =>
      error instanceof Error && error.message === 'Service unavailable',
  );
  assert.deepEqual(calls, ['createPendingAsset', 'putObject']);
});

test('replacement creates a new independent asset and keeps old metadata untouched', async () => {
  const { service, rows, calls } = fixture();
  const oldAsset = await service.upload({
    bytes: png,
    declaredMimeType: 'image/png',
    altText: 'Original alt',
    actorAdminUserId: ADMIN_ID,
  });
  calls.length = 0;
  const replaced = await service.replace(oldAsset.id, {
    bytes: png,
    declaredMimeType: 'image/png',
    actorAdminUserId: ADMIN_ID,
  });
  assert.notEqual(replaced.id, oldAsset.id);
  assert.notEqual(replaced.objectKey, oldAsset.objectKey);
  assert.equal(replaced.altText, 'Original alt');
  assert.equal(rows.get(oldAsset.id)?.lifecycleStatus, 'ready');
  assert.equal(rows.get(oldAsset.id)?.objectKey, oldAsset.objectKey);
  assert.deepEqual(calls.slice(0, 3), [
    'getAsset:' + oldAsset.id,
    'createPendingAsset',
    'putObject',
  ]);
});

test('deletion begins lifecycle transition, removes object, then finalizes metadata', async () => {
  const { service, calls } = fixture();
  const asset = await service.upload({
    bytes: png,
    declaredMimeType: 'image/png',
    actorAdminUserId: ADMIN_ID,
  });
  calls.length = 0;
  await service.delete(asset.id, ADMIN_ID);
  assert.deepEqual(calls, [
    'beginAssetDeletion',
    'deleteObject',
    'finalizeAssetDeletion',
  ]);
});

test('storage delete failures retain deleting state for a safe retry', async () => {
  const { service, calls, setFailDelete } = fixture();
  const asset = await service.upload({
    bytes: png,
    declaredMimeType: 'image/png',
    actorAdminUserId: ADMIN_ID,
  });
  calls.length = 0;
  setFailDelete(true);
  await assert.rejects(
    service.delete(asset.id, ADMIN_ID),
    (error: unknown) =>
      error instanceof Error && error.message === 'Service unavailable',
  );
  assert.deepEqual(calls, ['beginAssetDeletion', 'deleteObject']);
});
