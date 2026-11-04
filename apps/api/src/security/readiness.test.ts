import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createApp } from '../app.js';
import express from 'express';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';
import { createReadinessHandler } from './readiness.js';

const databaseUrl = process.env.READINESS_TEST_DATABASE_URL;
const environment = parseApiEnvironment({ NODE_ENV: 'test' });

async function withApi(
  url: string | undefined,
  run: (origin: string) => Promise<void>,
) {
  const server = createApp({ databaseUrl: url, environment }).listen(
    0,
    '127.0.0.1',
  );
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('liveness stays healthy while readiness fails safely without storage', async () => {
  await withApi(undefined, async (origin) => {
    const live = await fetch(`${origin}/api/v1/health`);
    assert.equal(live.status, 200);
    assert.deepEqual(await live.json(), { status: 'ok' });

    const ready = await fetch(`${origin}/api/v1/ready`);
    assert.equal(ready.status, 503);
    assert.equal(ready.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await ready.json(), { status: 'unavailable' });
  });
});

test('concurrent readiness requests never start unbounded database probes', async () => {
  let releaseProbe: (() => void) | undefined;
  let signalProbe: (() => void) | undefined;
  let probeCount = 0;
  const probeStarted = new Promise<void>((resolve) => {
    signalProbe = resolve;
  });
  const app = express();
  app.get(
    '/ready',
    createReadinessHandler('postgresql://localhost/test', async () => {
      probeCount += 1;
      signalProbe?.();
      await new Promise<void>((release) => {
        releaseProbe = release;
      });
      return true;
    }),
  );
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/ready`;
  try {
    const first = fetch(url);
    await probeStarted;
    const second = fetch(url);
    await new Promise((resolve) => setTimeout(resolve, 100));
    releaseProbe?.();
    const [firstResponse, secondResponse] = await Promise.all([first, second]);
    assert.equal(firstResponse.status, 200);
    assert.equal(secondResponse.status, 200);
    assert.equal(probeCount, 1);
  } finally {
    releaseProbe?.();
    server.close();
    await once(server, 'close');
  }
});

test(
  'readiness becomes healthy only after explicit migrations',
  { skip: !databaseUrl },
  async () => {
    const target = new URL(databaseUrl!);
    assert.ok(['127.0.0.1', '::1', 'localhost'].includes(target.hostname));
    assert.equal(target.pathname.slice(1), 'cod319_readiness_test');

    await withApi(databaseUrl, async (origin) => {
      const before = await fetch(`${origin}/api/v1/ready`);
      assert.equal(before.status, 503);
      assert.deepEqual(await before.json(), { status: 'unavailable' });

      await runMigrations(databaseUrl!);

      const after = await fetch(`${origin}/api/v1/ready`);
      assert.equal(after.status, 200);
      assert.equal(after.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await after.json(), { status: 'ready' });
    });
  },
);

test('operational OpenAPI documents liveness and readiness response shapes', async () => {
  const path = fileURLToPath(
    new URL('../../../../docs/openapi/operations.json', import.meta.url),
  );
  const document = JSON.parse(await readFile(path, 'utf8')) as {
    openapi: string;
    paths: Record<
      string,
      Record<string, { responses: Record<string, unknown> }>
    >;
  };
  assert.equal(document.openapi, '3.1.0');
  assert.deepEqual(Object.keys(document.paths).sort(), [
    '/api/v1/health',
    '/api/v1/ready',
  ]);
  assert.deepEqual(
    Object.keys(document.paths['/api/v1/health']?.get?.responses ?? {}),
    ['200'],
  );
  assert.deepEqual(
    Object.keys(document.paths['/api/v1/ready']?.get?.responses ?? {}),
    ['200', '503'],
  );
  type DocumentedResponse = {
    headers?: Record<string, { schema: { const: string } }>;
    content: {
      'application/json': {
        schema: { properties: { status: { const: string } } };
      };
    };
  };
  for (const [path, code, status] of [
    ['/api/v1/health', '200', 'ok'],
    ['/api/v1/ready', '200', 'ready'],
    ['/api/v1/ready', '503', 'unavailable'],
  ] as const) {
    const response = document.paths[path]?.get?.responses[
      code
    ] as DocumentedResponse;
    assert.equal(
      response.content['application/json'].schema.properties.status.const,
      status,
    );
    if (path === '/api/v1/ready') {
      assert.equal(
        response.headers?.['Cache-Control']?.schema.const,
        'no-store',
      );
    }
  }
});
