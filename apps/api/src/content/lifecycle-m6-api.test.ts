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
  'authenticated Admin draft lifecycle remains private until publication and survives failed revalidation',
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
      const createdResponse = await sendAdmin(
        '/api/v1/admin/articles',
        'POST',
        {
          title: 'Lifecycle draft',
          slug: 'm6-lifecycle',
          excerpt: 'Draft summary',
          body: 'Draft body',
        },
      );
      assert.equal(createdResponse.status, 201);
      const created = (await createdResponse.json()) as {
        article: { id: string; status: string; publishedPayload: unknown };
      };
      assert.equal(created.article.status, 'draft');
      assert.equal(created.article.publishedPayload, null);

      const draftRead = await sendAdmin(
        `/api/v1/admin/articles/${created.article.id}`,
      );
      assert.equal(draftRead.status, 200);
      assert.equal(
        (
          (await draftRead.json()) as {
            article: { draftPayload: { title: string } };
          }
        ).article.draftPayload.title,
        'Lifecycle draft',
      );
      const draftEdit = await sendAdmin(
        `/api/v1/admin/articles/${created.article.id}`,
        'PUT',
        {
          title: 'Lifecycle published title',
          slug: 'm6-lifecycle',
          excerpt: 'Published summary',
          body: 'Published body',
        },
      );
      assert.equal(draftEdit.status, 200);

      const publicBeforePublish = await fetch(
        `${baseUrl}/api/v1/public/articles`,
      );
      assert.equal(publicBeforePublish.status, 200);
      assert.equal(
        ((await publicBeforePublish.json()) as { total: number }).total,
        0,
      );
      assert.equal(
        (await fetch(`${baseUrl}/api/v1/public/articles/m6-lifecycle`)).status,
        404,
      );

      webStatus = 503;
      const publish = await sendAdmin(
        `/api/v1/admin/articles/${created.article.id}/publish`,
        'POST',
      );
      assert.equal(publish.status, 200);
      const publicAfterPublish = await fetch(
        `${baseUrl}/api/v1/public/articles/m6-lifecycle`,
      );
      assert.equal(publicAfterPublish.status, 200);
      assert.equal(
        ((await publicAfterPublish.json()) as { article: { title: string } })
          .article.title,
        'Lifecycle published title',
      );

      const failedJobResult = await pool.query<{
        id: string;
        status: string;
        attempts: number;
        last_error: string;
      }>(
        `select id, status, attempts, last_error from revalidation_jobs
         where resource_id = $1 order by created_at desc limit 1`,
        [created.article.id],
      );
      const failedJob = failedJobResult.rows[0];
      assert.ok(failedJob);
      assert.equal(failedJob.status, 'failed');
      assert.equal(failedJob.attempts, 1);
      assert.equal(failedJob.last_error, 'invalid_response');
      const jobListResponse = await sendAdmin(
        '/api/v1/admin/revalidation-jobs?status=failed',
      );
      assert.equal(jobListResponse.status, 200);
      const listedJobs = (await jobListResponse.json()) as {
        items: Array<{ id: string; status: string; lastError: string }>;
      };
      assert.ok(
        listedJobs.items.some(
          (job) =>
            job.id === failedJob.id &&
            job.status === 'failed' &&
            job.lastError === 'invalid_response',
        ),
      );

      await pool.query(
        'update revalidation_jobs set next_attempt_at = now() where id = $1',
        [failedJob.id],
      );
      webStatus = 204;
      const retry = await sendAdmin(
        `/api/v1/admin/revalidation-jobs/${failedJob.id}/retry`,
        'POST',
      );
      assert.equal(retry.status, 200);
      assert.deepEqual(await retry.json(), {
        success: true,
        status: 'succeeded',
      });
      const succeeded = await pool.query<{
        status: string;
        attempts: number;
        completed_at: Date | null;
      }>(
        'select status, attempts, completed_at from revalidation_jobs where id = $1',
        [failedJob.id],
      );
      assert.equal(succeeded.rows[0]?.status, 'succeeded');
      assert.equal(succeeded.rows[0]?.attempts, 2);
      assert.ok(succeeded.rows[0]?.completed_at);

      const unpublish = await sendAdmin(
        `/api/v1/admin/articles/${created.article.id}/unpublish`,
        'POST',
      );
      assert.equal(unpublish.status, 200);
      assert.equal(
        (await fetch(`${baseUrl}/api/v1/public/articles/m6-lifecycle`)).status,
        404,
      );

      const revise = await sendAdmin(
        `/api/v1/admin/articles/${created.article.id}`,
        'PUT',
        {
          title: 'Revised final draft',
          slug: 'm6-lifecycle-final',
          excerpt: 'Final summary',
          body: 'Final body',
        },
      );
      assert.equal(revise.status, 200);
      assert.equal(
        (
          (await revise.json()) as {
            article: {
              draftPayload: { title: string };
              publishedPayload: unknown;
            };
          }
        ).article.draftPayload.title,
        'Revised final draft',
      );
      assert.equal(
        (
          (await sendAdmin(`/api/v1/admin/articles/${created.article.id}`).then(
            (response) => response.json(),
          )) as {
            article: { publishedPayload: unknown };
          }
        ).article.publishedPayload,
        null,
      );
      const deletion = await sendAdmin(
        `/api/v1/admin/articles/${created.article.id}`,
        'DELETE',
      );
      assert.equal(deletion.status, 204);
      assert.equal(
        (await sendAdmin(`/api/v1/admin/articles/${created.article.id}`))
          .status,
        404,
      );
      assert.equal(
        (
          await pool.query('select 1 from articles where id = $1', [
            created.article.id,
          ])
        ).rowCount,
        0,
      );
    } finally {
      webStatus = 204;
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
