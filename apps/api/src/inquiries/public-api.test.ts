import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { Pool } from 'pg';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';
import { createApp } from '../app.js';
import { INQUIRY_JSON_BODY_LIMIT_BYTES } from './contracts.js';

const databaseUrl = process.env.INQUIRY_TEST_DATABASE_URL;

async function withApi(url: string | undefined, run: (origin: string) => Promise<void>) {
  const server = createApp({ databaseUrl: url, environment: parseApiEnvironment({ NODE_ENV: 'test' }) })
    .listen(0, '127.0.0.1');
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

test('public inquiry submission fails safely without a database', async () => {
  await withApi(undefined, async (origin) => {
    const response = await fetch(`${origin}/api/v1/public/inquiries`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'Service unavailable', code: 'INQUIRY_UNAVAILABLE' });
  });
});

test('public inquiries validate, normalize and durably store JSON submissions', { skip: !databaseUrl }, async () => {
  const parsed = new URL(databaseUrl!);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(parsed.hostname));
  assert.equal(decodeURIComponent(parsed.pathname.slice(1)), 'cod318_inquiry_test');
  await runMigrations(databaseUrl!);
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    await pool.query('delete from inquiries');
    await withApi(databaseUrl, async (origin) => {
      const response = await fetch(`${origin}/api/v1/public/inquiries`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: '  Ada Lovelace ', email: ' ADA@Example.COM ', company: ' ', message: '  Please contact me about a software project.  ' }),
      });
      assert.equal(response.status, 201);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), { received: true });
      const saved = await pool.query('select name, email, company, message, status from inquiries');
      assert.deepEqual(saved.rows, [{ name: 'Ada Lovelace', email: 'ada@example.com', company: null, message: 'Please contact me about a software project.', status: 'new' }]);

      for (const request of [
        { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'A', email: 'bad', message: 'short' }) },
        { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Ada User', email: 'ada@example.com', message: 'A sufficiently long message with an unexpected field.', extra: true }) },
        { headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ name: 'Ada User', email: 'ada@example.com', message: 'A sufficiently long message to pass validation.' }) },
        { headers: { 'content-type': 'application/json' }, body: '{' },
      ]) {
        const invalid = await fetch(`${origin}/api/v1/public/inquiries`, { method: 'POST', ...request });
        assert.equal(invalid.status, 400);
        assert.equal(invalid.headers.get('cache-control'), 'no-store');
        assert.deepEqual(await invalid.json(), { error: 'Invalid inquiry request', code: 'INQUIRY_INVALID_REQUEST' });
      }

      const oversized = await fetch(`${origin}/api/v1/public/inquiries`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Ada User', email: 'ada@example.com', message: 'x'.repeat(INQUIRY_JSON_BODY_LIMIT_BYTES) }),
      });
      assert.equal(oversized.status, 400);
      assert.equal(oversized.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await oversized.json(), { error: 'Invalid inquiry request', code: 'INQUIRY_INVALID_REQUEST' });
      assert.equal((await fetch(`${origin}/api/v1/public/site`)).status, 200);
      assert.equal((await fetch(`${origin}/api/v1/public/inquiries`)).status, 404);
      assert.equal((await pool.query('select count(*)::int as count from inquiries')).rows[0]?.count, 1);
    });
  } finally {
    await pool.end();
  }
});
