import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { Pool } from 'pg';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';
import { createApp } from '../app.js';
import { INQUIRY_JSON_BODY_LIMIT_BYTES } from './contracts.js';

const databaseUrl = process.env.INQUIRY_TEST_DATABASE_URL;
const throttleSecret = 'a'.repeat(64);

function requestBody(email = 'ada@example.com') {
  return JSON.stringify({
    name: 'Ada Lovelace',
    email,
    message: 'Please contact me about a software project.',
  });
}

async function withApi<T>(
  url: string | undefined,
  run: (origin: string) => Promise<T>,
): Promise<T> {
  const server = createApp({
    databaseUrl: url,
    environment: parseApiEnvironment({
      NODE_ENV: 'test',
      AUTH_THROTTLE_HMAC_SECRET: throttleSecret,
      API_TRUST_PROXY_HOPS: '1',
    }),
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    return await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('public inquiry submission fails safely without a database', async () => {
  await withApi(undefined, async (origin) => {
    const response = await fetch(`${origin}/api/v1/public/inquiries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), {
      error: 'Service unavailable',
      code: 'INQUIRY_UNAVAILABLE',
    });
  });
});

test(
  'public inquiries validate, normalize and durably store JSON submissions',
  { skip: !databaseUrl },
  async () => {
    const parsed = new URL(databaseUrl!);
    assert.ok(['127.0.0.1', '::1', 'localhost'].includes(parsed.hostname));
    assert.equal(
      decodeURIComponent(parsed.pathname.slice(1)),
      'cod318_inquiry_test',
    );
    await runMigrations(databaseUrl!);
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await pool.query('delete from inquiries');
      await pool.query('delete from inquiry_throttle_buckets');
      await withApi(databaseUrl, async (origin) => {
        const response = await fetch(`${origin}/api/v1/public/inquiries`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: '  Ada Lovelace ',
            email: ' ADA@Example.COM ',
            company: ' ',
            message: '  Please contact me about a software project.  ',
          }),
        });
        assert.equal(response.status, 201);
        assert.equal(response.headers.get('cache-control'), 'no-store');
        assert.deepEqual(await response.json(), { received: true });
        const saved = await pool.query(
          'select name, email, company, message, status from inquiries',
        );
        assert.deepEqual(saved.rows, [
          {
            name: 'Ada Lovelace',
            email: 'ada@example.com',
            company: null,
            message: 'Please contact me about a software project.',
            status: 'new',
          },
        ]);

        for (const request of [
          {
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ name: 'A', email: 'bad', message: 'short' }),
          },
          {
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              name: 'Ada User',
              email: 'ada@example.com',
              message: 'A sufficiently long message with an unexpected field.',
              extra: true,
            }),
          },
          {
            headers: { 'content-type': 'text/plain' },
            body: JSON.stringify({
              name: 'Ada User',
              email: 'ada@example.com',
              message: 'A sufficiently long message to pass validation.',
            }),
          },
          { headers: { 'content-type': 'application/json' }, body: '{' },
        ]) {
          const invalid = await fetch(`${origin}/api/v1/public/inquiries`, {
            method: 'POST',
            ...request,
          });
          assert.equal(invalid.status, 400);
          assert.equal(invalid.headers.get('cache-control'), 'no-store');
          assert.deepEqual(await invalid.json(), {
            error: 'Invalid inquiry request',
            code: 'INQUIRY_INVALID_REQUEST',
          });
        }

        const oversized = await fetch(`${origin}/api/v1/public/inquiries`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'Ada User',
            email: 'ada@example.com',
            message: 'x'.repeat(INQUIRY_JSON_BODY_LIMIT_BYTES),
          }),
        });
        assert.equal(oversized.status, 400);
        assert.equal(oversized.headers.get('cache-control'), 'no-store');
        assert.deepEqual(await oversized.json(), {
          error: 'Invalid inquiry request',
          code: 'INQUIRY_INVALID_REQUEST',
        });
        assert.equal((await fetch(`${origin}/api/v1/public/site`)).status, 200);
        assert.equal(
          (await fetch(`${origin}/api/v1/public/inquiries`)).status,
          404,
        );
        assert.equal(
          (await pool.query('select count(*)::int as count from inquiries'))
            .rows[0]?.count,
          1,
        );
      });

      await pool.query('delete from inquiries');
      await pool.query('delete from inquiry_throttle_buckets');
      await withApi(databaseUrl, async (origin) => {
        const send = (ip: string, email: string) =>
          fetch(`${origin}/api/v1/public/inquiries`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forwarded-for': ip,
            },
            body: requestBody(email),
          });

        // Parser and schema failures both consume IP attempts, but no email bucket.
        const malformed = await fetch(`${origin}/api/v1/public/inquiries`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '192.0.2.1',
          },
          body: '{',
        });
        assert.equal(malformed.status, 400);
        assert.equal((await send('192.0.2.2', 'bad')).status, 400);
        const nul = await fetch(`${origin}/api/v1/public/inquiries`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forwarded-for': '192.0.2.8',
          },
          body: JSON.stringify({
            name: 'Ada\u0000',
            email: 'nul@example.com',
            message: 'A sufficiently long inquiry message.',
          }),
        });
        assert.equal(nul.status, 400);
        assert.equal(
          (
            await pool.query(
              "select sum(request_count)::int as count from inquiry_throttle_buckets where kind = 'ip'",
            )
          ).rows[0]?.count,
          3,
        );
        assert.equal(
          (
            await pool.query(
              "select count(*)::int as count from inquiry_throttle_buckets where kind = 'email'",
            )
          ).rows[0]?.count,
          0,
        );

        // The first 60 attempts from one IP are accepted; attempt 61 is blocked.
        let last!: Response;
        for (let attempt = 0; attempt < 61; attempt++) {
          last = await send('192.0.2.3', `person${attempt}@example.com`);
          assert.equal(
            last.status,
            attempt < 60 ? 201 : 429,
            `attempt ${attempt + 1}`,
          );
        }
        const ipHash = createHmac('sha256', Buffer.from(throttleSecret, 'hex'))
          .update('codeddevs:public-inquiry:ip:v1\0' + '192.0.2.3')
          .digest('hex');
        const ipExpiry = (
          await pool.query(
            "select expires_at from inquiry_throttle_buckets where kind = 'ip' and key_hash = $1",
            [ipHash],
          )
        ).rows[0]?.expires_at as Date;
        const ipRetryAfter = Number(last.headers.get('retry-after'));
        const ipSecondsUntilExpiry = Math.max(
          1,
          Math.ceil((ipExpiry.getTime() - Date.now()) / 1_000),
        );
        assert.ok(
          Number.isInteger(ipRetryAfter) &&
            ipRetryAfter >= ipSecondsUntilExpiry - 1 &&
            ipRetryAfter <= ipSecondsUntilExpiry + 1,
          `${ipRetryAfter} not within ${ipSecondsUntilExpiry} ± 1`,
        );

        // Distinct emails still share the IP budget; normalized emails share a cross-IP budget.
        assert.equal((await send('192.0.2.4', 'same@example.com')).status, 201);
        assert.equal(
          (await send('192.0.2.5', ' SAME@EXAMPLE.COM ')).status,
          201,
        );
        assert.equal((await send('192.0.2.6', 'same@example.com')).status, 201);
        const emailHash = createHmac(
          'sha256',
          Buffer.from(throttleSecret, 'hex'),
        )
          .update('codeddevs:public-inquiry:email:v1\0same@example.com')
          .digest('hex');
        const emailExpiry = (
          await pool.query(
            "select expires_at from inquiry_throttle_buckets where kind = 'email' and key_hash = $1",
            [emailHash],
          )
        ).rows[0]?.expires_at as Date;
        const beforeLimitRequest = Date.now();
        const limitedEmail = await send('192.0.2.7', 'same@example.com');
        const afterLimitRequest = Date.now();
        assert.equal(limitedEmail.status, 429);
        const retryAfter = Number(limitedEmail.headers.get('retry-after'));
        const earliestRetry = Math.max(
          1,
          Math.ceil((emailExpiry.getTime() - afterLimitRequest) / 1_000),
        );
        const latestRetry = Math.max(
          1,
          Math.ceil((emailExpiry.getTime() - beforeLimitRequest) / 1_000),
        );
        assert.ok(
          Number.isInteger(retryAfter) &&
            retryAfter >= earliestRetry - 1 &&
            retryAfter <= latestRetry + 1,
          `${retryAfter} not within ${earliestRetry}..${latestRetry}`,
        );
        assert.equal(limitedEmail.headers.get('cache-control'), 'no-store');
        assert.deepEqual(await limitedEmail.json(), {
          error: 'Too many inquiry submissions',
          code: 'INQUIRY_RATE_LIMITED',
        });

        // Separate app instances contend on the same normalized email bucket.
        const concurrent = await Promise.all(
          Array.from({ length: 4 }, (_, index) =>
            withApi(databaseUrl, async (origin) =>
              fetch(`${origin}/api/v1/public/inquiries`, {
                method: 'POST',
                headers: {
                  'content-type': 'application/json',
                  'x-forwarded-for': `198.51.100.${index + 1}`,
                },
                body: requestBody(
                  index === 0 ? 'race@example.com' : 'RACE@example.com',
                ),
              }),
            ),
          ),
        );
        assert.deepEqual(
          concurrent.map((response) => response.status).sort(),
          [201, 201, 201, 429],
        );

        // Expired HMAC-only buckets are indexed and eligible for later cleanup; no worker runs here.
        await pool.query(
          "update inquiry_throttle_buckets set window_started_at = now() - interval '1 hour', expires_at = now() - interval '1 second' where id = (select id from inquiry_throttle_buckets where kind = 'ip' limit 1)",
        );
        const eligible = await pool.query(
          'select count(*)::int as count from inquiry_throttle_buckets where expires_at <= now()',
        );
        assert.equal(eligible.rows[0]?.count, 1);
        const storedKeys = await pool.query(
          "select bool_and(key_hash ~ '^[0-9a-f]{64}$') as valid from inquiry_throttle_buckets",
        );
        assert.equal(storedKeys.rows[0]?.valid, true);
      });
    } finally {
      await pool.end();
    }
  },
);
