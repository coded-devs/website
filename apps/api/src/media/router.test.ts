import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import express from 'express';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { test } from 'node:test';
import { createApp } from '../app.js';
import type { ApiEnvironment } from '../config/env.js';
import type { MediaStorage } from './storage.js';
import type { MediaService } from './service.js';
import { createMediaRouter } from './router.js';

const ORIGIN = 'https://admin.example.test';
const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ASSET_ID = '123e4567-e89b-42d3-a456-426614174000';
const ASSET = {
  id: ASSET_ID,
  objectKey: 'media/123e4567-e89b-42d3-a456-426614174001.png',
  url: 'https://media.example.test/media/123e4567-e89b-42d3-a456-426614174001.png',
  mimeType: 'image/png',
  byteSize: 12,
  width: 2,
  height: 3,
  altText: 'A sample',
  referencesCount: 0,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};
const ENV = {
  adminOrigin: ORIGIN,
  nodeEnvironment: 'test',
  trustProxy: false,
} as ApiEnvironment;

function makeHarness() {
  const calls: Array<[string, unknown[]]> = [];
  const service: MediaService = {
    async list(options) {
      calls.push(['list', [options]]);
      return { assets: [ASSET] };
    },
    async get(id) {
      calls.push(['get', [id]]);
      return ASSET;
    },
    async upload(input) {
      calls.push(['upload', [input]]);
      return ASSET;
    },
    async replace(id, input) {
      calls.push(['replace', [id, input]]);
      return ASSET;
    },
    async updateAltText(id, altText) {
      calls.push(['updateAltText', [id, altText]]);
      return { ...ASSET, altText };
    },
    async delete(id, actorId) {
      calls.push(['delete', [id, actorId]]);
    },
  };
  const storage: MediaStorage = {
    async putObject() {},
    async getObject() {
      return null;
    },
    async deleteObject() {},
    resolveUrl(key) {
      return `https://media.example.test/${key}`;
    },
  };
  const app = express();
  app.use((_request, response, next) => {
    response.locals.principal = {
      admin: { id: ADMIN_ID, email: 'admin@example.test', role: 'SUPER_ADMIN' },
      session: { expiresAt: '2026-10-02T00:00:00.000Z' },
    };
    next();
  });
  app.use(
    '/api/v1/admin/media',
    createMediaRouter(undefined, ENV, storage, service),
  );
  return { app, calls };
}

async function withServer<T>(
  app: express.Express,
  operation: (baseUrl: string) => Promise<T>,
) {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('Test server did not start');
  try {
    return await operation(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

const writeHeaders = {
  Origin: ORIGIN,
  [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
};

test('the mounted media API rejects requests without a Super Admin session', async () => {
  const app = createApp({
    environment: {
      ...ENV,
      r2: {
        accountId: 'a'.repeat(32),
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
        bucket: 'codeddevs-test-media',
        publicBaseUrl: 'https://media.example.test',
      },
    },
  });
  await withServer(app, async (baseUrl) => {
    const list = await fetch(`${baseUrl}/api/v1/admin/media`);
    assert.equal(list.status, 401);
    const upload = await fetch(`${baseUrl}/api/v1/admin/media/upload`, {
      method: 'POST',
      headers: writeHeaders,
    });
    assert.equal(upload.status, 401);
  });
});

test('lists and reads media assets with safe URLs', async () => {
  const { app, calls } = makeHarness();
  await withServer(app, async (baseUrl) => {
    const list = await fetch(
      `${baseUrl}/api/v1/admin/media?search=logo&mimeType=image/png&page=2&limit=10`,
    );
    assert.equal(list.status, 200);
    assert.equal(list.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await list.json(), { assets: [ASSET] });
    const get = await fetch(`${baseUrl}/api/v1/admin/media/${ASSET_ID}`);
    assert.equal(get.status, 200);
    assert.deepEqual(await get.json(), { asset: ASSET });
  });
  assert.equal(calls[0]?.[0], 'list');
  assert.equal(calls[1]?.[0], 'get');
});

test('uploads and replaces multipart assets only after Origin and CSRF checks', async () => {
  const { app, calls } = makeHarness();
  await withServer(app, async (baseUrl) => {
    const form = new FormData();
    form.append(
      'file',
      new Blob([Buffer.from([1, 2, 3])], { type: 'image/png' }),
      'logo.png',
    );
    form.append('altText', 'Logo');
    const uploaded = await fetch(`${baseUrl}/api/v1/admin/media/upload`, {
      method: 'POST',
      headers: writeHeaders,
      body: form,
    });
    assert.equal(uploaded.status, 201);
    assert.deepEqual(await uploaded.json(), { asset: ASSET });

    const replaceForm = new FormData();
    replaceForm.append(
      'file',
      new Blob([Buffer.from([4, 5])], { type: 'image/png' }),
      'new.png',
    );
    const replaced = await fetch(
      `${baseUrl}/api/v1/admin/media/${ASSET_ID}/replace`,
      {
        method: 'POST',
        headers: writeHeaders,
        body: replaceForm,
      },
    );
    assert.equal(replaced.status, 201);
    assert.deepEqual(await replaced.json(), { asset: ASSET });

    const blockedForm = new FormData();
    blockedForm.append(
      'file',
      new Blob(['x'], { type: 'image/png' }),
      'no.png',
    );
    const blocked = await fetch(`${baseUrl}/api/v1/admin/media/upload`, {
      method: 'POST',
      headers: {
        Origin: 'https://attacker.example.test',
        [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
      },
      body: blockedForm,
    });
    assert.equal(blocked.status, 403);
  });
  assert.deepEqual(
    calls.map(([name]) => name),
    ['upload', 'replace'],
  );
  assert.equal(
    (calls[0]?.[1][0] as { actorAdminUserId: string }).actorAdminUserId,
    ADMIN_ID,
  );
  assert.deepEqual(
    (calls[0]?.[1][0] as { bytes: Buffer }).bytes,
    Buffer.from([1, 2, 3]),
  );
  assert.equal(
    (calls[0]?.[1][0] as { declaredMimeType: string }).declaredMimeType,
    'image/png',
  );
  assert.equal((calls[0]?.[1][0] as { altText?: string }).altText, 'Logo');
});

test('updates alt text and deletes through protected writes', async () => {
  const { app, calls } = makeHarness();
  await withServer(app, async (baseUrl) => {
    const updated = await fetch(
      `${baseUrl}/api/v1/admin/media/${ASSET_ID}/alt-text`,
      {
        method: 'PUT',
        headers: { ...writeHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText: 'Updated' }),
      },
    );
    assert.equal(updated.status, 200);
    assert.deepEqual(await updated.json(), {
      asset: { ...ASSET, altText: 'Updated' },
    });

    const deleted = await fetch(`${baseUrl}/api/v1/admin/media/${ASSET_ID}`, {
      method: 'DELETE',
      headers: writeHeaders,
    });
    assert.equal(deleted.status, 204);
  });
  assert.deepEqual(
    calls.map(([name]) => name),
    ['updateAltText', 'delete'],
  );
  assert.deepEqual(calls[0]?.[1], [ASSET_ID, 'Updated']);
  assert.deepEqual(calls[1]?.[1], [ASSET_ID, ADMIN_ID]);
});

test('rejects invalid identifiers, JSON fields, bodyless delete violations and content types', async () => {
  const { app, calls } = makeHarness();
  await withServer(app, async (baseUrl) => {
    const missing = await fetch(`${baseUrl}/api/v1/admin/media/not-an-id`);
    assert.equal(missing.status, 404);
    const badAlt = await fetch(
      `${baseUrl}/api/v1/admin/media/${ASSET_ID}/alt-text`,
      {
        method: 'PUT',
        headers: { ...writeHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText: 'x', unexpected: true }),
      },
    );
    assert.equal(badAlt.status, 400);
    const badType = await fetch(`${baseUrl}/api/v1/admin/media/upload`, {
      method: 'POST',
      headers: writeHeaders,
      body: JSON.stringify({}),
    });
    assert.equal(badType.status, 415);
    const bodyDelete = await fetch(
      `${baseUrl}/api/v1/admin/media/${ASSET_ID}`,
      {
        method: 'DELETE',
        headers: { ...writeHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ unexpected: true }),
      },
    );
    assert.equal(bodyDelete.status, 400);
  });
  assert.deepEqual(calls, []);
});
