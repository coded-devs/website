import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import { after, before, test } from 'node:test';
import { Pool } from 'pg';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { getSessionCookiePolicy } from '../auth/policy.js';
import { hashPassword } from '../auth/password.js';
import { createApp } from '../app.js';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';

const databaseUrl = process.env.CONTENT_M6_TEST_DATABASE_URL;
const databaseName = 'cod316_content_m6_test';
const adminOrigin = 'http://localhost:3001';
const secret = randomBytes(32).toString('hex');
const adminEmail = 'cod316-m6-admin@codeddevs.test';
const adminPassword = 'COD316 lifecycle password';
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
let adminUserId: string;
let webServer: Server;
let webOrigin = '';
let webStatus = 204;

function assertDedicatedDatabase(value: string) {
  const url = new URL(value);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(url.hostname));
  assert.equal(decodeURIComponent(url.pathname.slice(1)), databaseName);
}

const environment = () =>
  parseApiEnvironment({
    NODE_ENV: 'test',
    AUTH_THROTTLE_HMAC_SECRET: secret,
    WEB_INTERNAL_ORIGIN: webOrigin,
    CONTENT_REVALIDATION_SECRET: secret,
  });

before(async () => {
  if (!databaseUrl || !pool) return;
  assertDedicatedDatabase(databaseUrl);
  await runMigrations(databaseUrl);
  await pool.query('delete from revalidation_jobs');
  await pool.query('delete from articles');
  await pool.query("delete from audit_events where target_type = 'article'");

  const existingAdmin = await pool.query<{ id: string }>(
    'select id from admin_users where is_super_admin = true limit 1',
  );
  adminUserId = existingAdmin.rows[0]?.id ?? randomUUID();
  const passwordHash = await hashPassword(adminPassword);
  if (!existingAdmin.rows[0]) {
    await pool.query(
      `insert into admin_users (id, email, password_hash)
       values ($1, $2, $3)`,
      [adminUserId, adminEmail, passwordHash],
    );
  } else {
    await pool.query(
      `update admin_users set email = $2, password_hash = $3,
       credential_version = 1 where id = $1`,
      [adminUserId, adminEmail, passwordHash],
    );
  }
  await pool.query('delete from sessions where admin_user_id = $1', [
    adminUserId,
  ]);

  webServer = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/api/revalidate');
    assert.equal(request.headers['content-type'], 'application/json');
    assert.equal(request.headers['x-codeddevs-revalidation-secret'], secret);
    const targets = JSON.parse(Buffer.concat(chunks).toString()) as {
      paths: string[];
      tags: string[];
    };
    assert.deepEqual(targets.paths, ['/insights', '/insights/m6-lifecycle']);
    assert.deepEqual(targets.tags, [
      'articles',
      'insights',
      'article-m6-lifecycle',
    ]);
    response
      .writeHead(webStatus)
      .end(webStatus === 204 ? undefined : 'private failure detail');
  });
  webServer.listen(0, '127.0.0.1');
  await once(webServer, 'listening');
  const address = webServer.address();
  assert.ok(address && typeof address !== 'string');
  webOrigin = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (webServer)
    await new Promise<void>((resolve) => webServer.close(() => resolve()));
  if (pool) await pool.end();
});

test(
  'authenticated Admin can create, update, publish, and delete articles',
  { skip: !databaseUrl || !pool },
  async () => {
    assert.ok(databaseUrl && pool);
    const server = createApp({
      databaseUrl,
      environment: environment(),
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const loginResponse = await fetch(`${baseUrl}/api/v1/admin/auth/login`, {
      method: 'POST',
      headers: {
        Origin: adminOrigin,
        [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    assert.equal(loginResponse.status, 200, await loginResponse.text());
    const setCookie = loginResponse.headers.get('set-cookie');
    assert.ok(setCookie);
    const cookie = setCookie.split(';', 1)[0];
    assert.ok(cookie);
    assert.ok(
      cookie.startsWith(`${getSessionCookiePolicy('test').name}=`),
      'login must issue the configured test session cookie',
    );
    const sendAdmin = (path: string, method = 'GET', body?: unknown) =>
      fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Cookie: cookie,
          Origin: adminOrigin,
          [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });

    try {
      const created = await sendAdmin('/api/v1/admin/articles', 'POST', {
        title: 'Lifecycle draft',
        slug: 'm6-lifecycle',
        excerpt: 'Draft summary',
        body: 'Draft body',
      });
      assert.equal(created.status, 201);
      const createdBody = (await created.json()) as {
        article: { id: string };
      };
      const articleId = createdBody.article.id;
      assert.equal(
        (
          await sendAdmin(`/api/v1/admin/articles/${articleId}`, 'PUT', {
            title: 'Changed title',
            slug: 'm6-lifecycle',
            excerpt: 'Changed summary',
            body: 'Changed body',
          })
        ).status,
        200,
      );
      assert.equal(
        (await sendAdmin(`/api/v1/admin/articles/${articleId}/publish`, 'POST'))
          .status,
        200,
      );
      assert.equal(
        (await sendAdmin(`/api/v1/admin/articles/${articleId}`, 'DELETE'))
          .status,
        204,
      );
      const readableArticles = await sendAdmin('/api/v1/admin/articles');
      assert.equal(readableArticles.status, 200);
      assert.equal(
        ((await readableArticles.json()) as { total: number }).total,
        0,
      );
    } finally {
      webStatus = 204;
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
