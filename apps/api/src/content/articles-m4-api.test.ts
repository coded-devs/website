import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { Pool } from 'pg';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { getSessionCookiePolicy } from '../auth/policy.js';
import { createApp } from '../app.js';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';

const databaseUrl = process.env.ARTICLES_M4_TEST_DATABASE_URL;
const databaseName = 'cod316_articles_m4_test';
const adminOrigin = 'http://localhost:3001';
const mediaBaseUrl = 'https://cdn.example.test/assets/';
const sessionToken = randomBytes(32).toString('base64url');
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
let adminUserId: string;

function assertDisposableDatabase(value: string) {
  const url = new URL(value);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(url.hostname));
  assert.equal(decodeURIComponent(url.pathname.slice(1)), databaseName);
}

before(async () => {
  if (!databaseUrl || !pool) return;
  assertDisposableDatabase(databaseUrl);
  await runMigrations(databaseUrl);
  const existingAdmin = await pool.query<{ id: string }>(
    'select id from admin_users where is_super_admin = true limit 1',
  );
  adminUserId = existingAdmin.rows[0]?.id ?? randomUUID();
  if (!existingAdmin.rows[0]) {
    await pool.query(
      `insert into admin_users (id, email, password_hash)
       values ($1, $2, 'fixture-hash-not-used-for-auth')`,
      [adminUserId, `cod316-m4-${adminUserId}@codeddevs.test`],
    );
  }
  await pool.query(
    `insert into sessions (admin_user_id, token_hash, credential_version, expires_at)
     values ($1, $2, 1, now() + interval '1 hour')`,
    [adminUserId, createHash('sha256').update(sessionToken).digest('hex')],
  );
});

after(async () => {
  if (pool) await pool.end();
});

const article = (slug: string, title = 'A Test Article') => ({
  title,
  slug,
  excerpt: 'A concise summary',
  body: 'The full article body.',
});

test(
  'authenticated Admin can create, edit, publish, unpublish, and delete an article',
  { skip: !databaseUrl },
  async () => {
    assert.ok(databaseUrl && pool);
    await pool.query('delete from articles');
    await pool.query(
      'delete from audit_events where actor_admin_user_id = $1',
      [adminUserId],
    );
    const environment = parseApiEnvironment({
      NODE_ENV: 'test',
      R2_ACCOUNT_ID: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      R2_ACCESS_KEY_ID: 'test-access-key',
      R2_SECRET_ACCESS_KEY: 'test-secret-key',
      R2_BUCKET: 'test-bucket',
      R2_PUBLIC_BASE_URL: mediaBaseUrl,
    });
    const server = createApp({
      databaseUrl,
      environment,
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const cookieName = getSessionCookiePolicy('test').name;
    const cookie = `${cookieName}=${sessionToken}`;
    const send = (
      path: string,
      method = 'GET',
      body?: unknown,
      options: { origin?: string; csrf?: boolean; contentType?: string } = {},
    ) =>
      fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Cookie: cookie,
          ...(options.origin === ''
            ? {}
            : { Origin: options.origin ?? adminOrigin }),
          ...(options.csrf === false
            ? {}
            : { [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE }),
          ...(options.contentType === ''
            ? {}
            : { 'Content-Type': options.contentType ?? 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    try {
      assert.equal(
        (await fetch(`${baseUrl}/api/v1/admin/articles`)).status,
        401,
      );
      assert.equal(
        (await fetch(`${baseUrl}/api/v1/admin/articles/not-an-id/preview`, {}))
          .status,
        401,
      );

      const initial = await send('/api/v1/admin/articles');
      assert.equal(initial.status, 200);
      assert.equal(initial.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await initial.json(), {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
      for (const invalidQuery of [
        '?status=archived',
        '?page=0',
        '?limit=51',
        `?search=${'x'.repeat(201)}`,
        '?unexpected=true',
      ]) {
        assert.equal(
          (await send(`/api/v1/admin/articles${invalidQuery}`)).status,
          400,
        );
      }

      const created = await send('/api/v1/admin/articles', 'POST', {
        ...article('cod316-m4-spotlight'),
        isSpotlight: true,
      });
      assert.equal(created.status, 201);
      const createdBody = (await created.json()) as {
        article: { id: string };
      };
      const articleId = createdBody.article.id;

      assert.equal(
        (
          await send(`/api/v1/admin/articles/${articleId}`, 'PUT', {
            ...article('cod316-m4-spotlight', 'Updated test article'),
            isSpotlight: true,
          })
        ).status,
        200,
      );
      const published = await send(
        `/api/v1/admin/articles/${articleId}/publish`,
        'POST',
      );
      assert.equal(published.status, 200);
      const publishedBody = (await published.json()) as {
        article: { publishedPayload: { isSpotlight?: boolean } | null };
      };
      assert.equal(publishedBody.article.publishedPayload?.isSpotlight, true);

      const second = await send('/api/v1/admin/articles', 'POST', {
        ...article('cod316-m4-spotlight-second', 'Second spotlight article'),
        isSpotlight: true,
      });
      assert.equal(second.status, 201);
      const secondBody = (await second.json()) as {
        article: { id: string };
      };
      const secondId = secondBody.article.id;
      assert.equal(
        (await send(`/api/v1/admin/articles/${secondId}/publish`, 'POST'))
          .status,
        200,
      );

      const publishedFirst = await send(`/api/v1/admin/articles/${articleId}`);
      const publishedFirstBody = (await publishedFirst.json()) as {
        article: { publishedPayload: { isSpotlight?: boolean } | null };
      };
      assert.equal(
        publishedFirstBody.article.publishedPayload?.isSpotlight,
        false,
      );
      const publishedSecond = await send(`/api/v1/admin/articles/${secondId}`);
      const publishedSecondBody = (await publishedSecond.json()) as {
        article: { publishedPayload: { isSpotlight?: boolean } | null };
      };
      assert.equal(
        publishedSecondBody.article.publishedPayload?.isSpotlight,
        true,
      );
      const publicList = await fetch(
        `${baseUrl}/api/v1/public/articles?limit=10`,
      );
      assert.equal(publicList.status, 200);
      const publicListBody = (await publicList.json()) as {
        items: Array<{ slug: string }>;
      };
      assert.equal(publicListBody.items[0]?.slug, 'cod316-m4-spotlight-second');

      const immediate = await send('/api/v1/admin/articles', 'POST', {
        ...article('cod316-m4-spotlight-immediate', 'Immediate spotlight'),
        isSpotlight: true,
        publishImmediately: true,
      });
      assert.equal(immediate.status, 201);
      const immediateBody = (await immediate.json()) as {
        article: {
          id: string;
          publishedPayload: { isSpotlight?: boolean } | null;
        };
      };
      assert.equal(immediateBody.article.publishedPayload?.isSpotlight, true);
      const replacedSecond = await send(`/api/v1/admin/articles/${secondId}`);
      const replacedSecondBody = (await replacedSecond.json()) as {
        article: { publishedPayload: { isSpotlight?: boolean } | null };
      };
      assert.equal(
        replacedSecondBody.article.publishedPayload?.isSpotlight,
        false,
      );
      const immediatePublicList = await fetch(
        `${baseUrl}/api/v1/public/articles?limit=10`,
      );
      const immediatePublicListBody = (await immediatePublicList.json()) as {
        items: Array<{ slug: string }>;
      };
      assert.equal(
        immediatePublicListBody.items[0]?.slug,
        'cod316-m4-spotlight-immediate',
      );

      assert.equal(
        (await send(`/api/v1/admin/articles/${articleId}/unpublish`, 'POST'))
          .status,
        200,
      );
      assert.equal(
        (await send(`/api/v1/admin/articles/${articleId}`, 'DELETE')).status,
        204,
      );
    } finally {
      server.close();
      await once(server, 'close');
      await pool.query('delete from articles');
    }
  },
);
