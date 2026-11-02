import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { createServer, type Server } from 'node:http';
import { after, before, test } from 'node:test';
import { Pool } from 'pg';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { getSessionCookiePolicy } from '../auth/policy.js';
import { createApp } from '../app.js';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';
import { createArticleService } from './article-service.js';
import { processRevalidationJob } from './revalidation.js';

const databaseUrl = process.env.PUBLICATION_M5_TEST_DATABASE_URL;
const databaseName = 'cod316_publication_m5_test';
const secret = randomBytes(32).toString('hex');
const sessionToken = randomBytes(32).toString('base64url');
const adminOrigin = 'http://localhost:3001';
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
let adminUserId: string;
let webServer: Server;
let webOrigin = '';
const receivedTargets: unknown[] = [];
let webStatus = 204;
let webDelay = 0;

function assertDedicatedDatabase(value: string) {
  const url = new URL(value);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(url.hostname));
  assert.equal(decodeURIComponent(url.pathname.slice(1)), databaseName);
}

const environment = () =>
  parseApiEnvironment({
    NODE_ENV: 'test',
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
  if (!existingAdmin.rows[0]) {
    await pool.query(
      `insert into admin_users (id, email, password_hash)
       values ($1, $2, 'fixture-hash-not-used-for-auth')`,
      [adminUserId, `cod316-m5-${adminUserId}@codeddevs.test`],
    );
  }
  await pool.query(
    `insert into sessions (admin_user_id, token_hash, credential_version, expires_at)
     values ($1, $2, 1, now() + interval '1 hour')`,
    [adminUserId, createHash('sha256').update(sessionToken).digest('hex')],
  );
  webServer = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/api/revalidate');
    assert.equal(request.headers['content-type'], 'application/json');
    assert.equal(request.headers['x-codeddevs-revalidation-secret'], secret);
    receivedTargets.push(JSON.parse(Buffer.concat(chunks).toString()));
    if (webDelay) await new Promise((resolve) => setTimeout(resolve, webDelay));
    response
      .writeHead(webStatus)
      .end(webStatus === 204 ? undefined : 'private body must not be stored');
  });
  webServer.listen(0, '127.0.0.1');
  await once(webServer, 'listening');
  const address = webServer.address();
  assert.ok(address && typeof address !== 'string');
  webOrigin = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (webServer) webServer.close();
  if (pool) await pool.end();
});

test(
  'publication commits atomically, revalidates safely, preserves old slugs, and supports single-claim retries',
  { skip: !databaseUrl || !pool },
  async () => {
    assert.ok(databaseUrl && pool);
    const service = createArticleService(databaseUrl, environment());
    const first = await service.create(
      {
        title: 'Published now',
        slug: 'published-now',
        excerpt: 'A summary',
        body: 'Public content',
        publishImmediately: true,
      },
      adminUserId,
    );
    assert.equal(first.status, 'published');
    const firstJob = await pool.query(
      `select status, attempts, targets, last_error, completed_at
       from revalidation_jobs where resource_id = $1`,
      [first.id],
    );
    assert.deepEqual(firstJob.rows[0].targets, {
      paths: ['/insights', '/insights/published-now'],
      tags: ['articles', 'insights', 'article-published-now'],
    });
    assert.equal(firstJob.rows[0].status, 'succeeded');
    assert.equal(firstJob.rows[0].attempts, 1);
    assert.ok(firstJob.rows[0].completed_at);

    webStatus = 503;
    const draft = await service.create(
      {
        title: 'Retry article',
        slug: 'retry-article',
        excerpt: 'A summary',
        body: 'Public content after publish',
      },
      adminUserId,
    );
    const published = await service.publish(draft.id, adminUserId);
    assert.equal(published.status, 'published');
    const failed = await pool.query(
      `select id, status, attempts, last_error, next_attempt_at, targets
       from revalidation_jobs where resource_id = $1`,
      [draft.id],
    );
    assert.equal(failed.rows[0].status, 'failed');
    assert.equal(failed.rows[0].attempts, 1);
    assert.equal(failed.rows[0].last_error, 'invalid_response');
    assert.ok(failed.rows[0].next_attempt_at);
    assert.ok(
      Math.abs(
        new Date(failed.rows[0].next_attempt_at).getTime() -
          Date.now() -
          60_000,
      ) < 10_000,
      'first retry is scheduled one minute after the failed attempt',
    );
    assert.ok(
      (
        await pool.query(
          'select 1 from articles where id = $1 and published_slug = $2',
          [draft.id, 'retry-article'],
        )
      ).rowCount === 1,
      'revalidation failure must not roll back publication',
    );

    const jobId = failed.rows[0].id as string;
    await pool.query(
      'update revalidation_jobs set next_attempt_at = now() where id = $1',
      [jobId],
    );
    webStatus = 204;
    webDelay = 80;
    const server = createApp({
      databaseUrl,
      environment: environment(),
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const cookie = `${getSessionCookiePolicy('test').name}=${sessionToken}`;
    const sendRetry = () =>
      fetch(
        `http://127.0.0.1:${address.port}/api/v1/admin/revalidation-jobs/${jobId}/retry`,
        {
          method: 'POST',
          headers: {
            Cookie: cookie,
            Origin: adminOrigin,
            [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
          },
        },
      );
    const beforeRetries = receivedTargets.length;
    try {
      assert.equal(
        (
          await fetch(
            `http://127.0.0.1:${address.port}/api/v1/admin/revalidation-jobs`,
          )
        ).status,
        401,
      );
      const invalidPageResponse = await fetch(
        `http://127.0.0.1:${address.port}/api/v1/admin/revalidation-jobs?limit=101`,
        { headers: { Cookie: cookie } },
      );
      assert.equal(
        invalidPageResponse.status,
        400,
        await invalidPageResponse.text(),
      );
      assert.equal(
        (
          await fetch(
            `http://127.0.0.1:${address.port}/api/v1/admin/revalidation-jobs/${jobId}/retry`,
            { method: 'POST', headers: { Cookie: cookie } },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await fetch(
            `http://127.0.0.1:${address.port}/api/v1/admin/revalidation-jobs/${jobId}/retry`,
            {
              method: 'POST',
              headers: {
                Cookie: cookie,
                Origin: adminOrigin,
                [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
                'Content-Type': 'application/json',
              },
              body: '{}',
            },
          )
        ).status,
        400,
      );
      const responses = await Promise.all([sendRetry(), sendRetry()]);
      assert.deepEqual(
        responses.map((response) => response.status).sort(),
        [200, 409],
      );
      assert.equal(receivedTargets.length, beforeRetries + 1);
      const duplicate = await sendRetry();
      assert.equal(duplicate.status, 409);
      const listed = await fetch(
        `http://127.0.0.1:${address.port}/api/v1/admin/revalidation-jobs?status=succeeded&limit=1`,
        { headers: { Cookie: cookie } },
      );
      assert.equal(listed.status, 200);
      const page = (await listed.json()) as {
        items: Array<Record<string, unknown>>;
        total: number;
        limit: number;
      };
      assert.equal(page.limit, 1);
      assert.ok(page.total >= 1);
      assert.ok(
        page.items.every((item) => !JSON.stringify(item).includes(secret)),
      );
    } finally {
      webDelay = 0;
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }

    await pool.query(`insert into revalidation_jobs
      (resource_type, status, attempts, targets, last_error)
      values ('article', 'failed', 5, '{"paths":["/insights"],"tags":["articles"]}', 'timeout')`);
    const exhausted = await pool.query<{ id: string }>(
      `select id from revalidation_jobs where attempts = 5 limit 1`,
    );
    assert.ok(exhausted.rows[0]);
    const claimed = await pool.query(
      `update revalidation_jobs set next_attempt_at = null where id = $1`,
      [exhausted.rows[0].id],
    );
    assert.equal(claimed.rowCount, 1);
    const fifth = await pool.query(
      `select status, attempts, last_error, next_attempt_at from revalidation_jobs where id = $1`,
      [exhausted.rows[0].id],
    );
    assert.equal(fifth.rows[0].status, 'failed');
    assert.equal(fifth.rows[0].attempts, 5);
    assert.equal(fifth.rows[0].last_error, 'timeout');
    assert.equal(fifth.rows[0].next_attempt_at, null);
    assert.deepEqual(
      await processRevalidationJob(
        databaseUrl,
        environment(),
        exhausted.rows[0].id,
      ),
      { claimed: false },
    );
    const maxAttemptsServer = createApp({
      databaseUrl,
      environment: environment(),
    }).listen(0, '127.0.0.1');
    await once(maxAttemptsServer, 'listening');
    const maxAddress = maxAttemptsServer.address();
    assert.ok(maxAddress && typeof maxAddress !== 'string');
    try {
      const maxResponse = await fetch(
        `http://127.0.0.1:${maxAddress.port}/api/v1/admin/revalidation-jobs/${exhausted.rows[0].id}/retry`,
        {
          method: 'POST',
          headers: {
            Cookie: `${getSessionCookiePolicy('test').name}=${sessionToken}`,
            Origin: adminOrigin,
            [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
          },
        },
      );
      assert.equal(maxResponse.status, 409);
    } finally {
      await new Promise<void>((resolve) =>
        maxAttemptsServer.close(() => resolve()),
      );
    }

    const renameDraft = await service.create(
      {
        title: 'Old path',
        slug: 'old-public-slug',
        excerpt: 'A summary',
        body: 'Public content',
        publishImmediately: true,
      },
      adminUserId,
    );
    await service.update(
      renameDraft.id,
      {
        title: 'New draft slug',
        slug: 'new-draft-slug',
        excerpt: 'A summary',
        body: 'Updated body',
      },
      adminUserId,
    );
    await service.unpublish(renameDraft.id, adminUserId);
    const unpublishJob = await pool.query(
      `select targets from revalidation_jobs where resource_id = $1 order by created_at desc limit 1`,
      [renameDraft.id],
    );
    assert.deepEqual(unpublishJob.rows[0].targets, {
      paths: ['/insights', '/insights/old-public-slug'],
      tags: ['articles', 'insights', 'article-old-public-slug'],
    });

    const rollbackDraft = await service.create(
      {
        title: 'Rollback me',
        slug: 'rollback-me',
        excerpt: 'A summary',
        body: 'Draft only',
      },
      adminUserId,
    );
    await pool.query(
      `create function reject_m5_revalidation_job() returns trigger language plpgsql as $$ begin raise exception 'test job insert failure'; end $$`,
    );
    await pool.query(
      `create trigger reject_m5_revalidation_job before insert on revalidation_jobs for each row execute function reject_m5_revalidation_job()`,
    );
    try {
      await assert.rejects(() =>
        service.publish(rollbackDraft.id, adminUserId),
      );
      assert.equal(
        (
          await pool.query(
            'select published_slug from articles where id = $1',
            [rollbackDraft.id],
          )
        ).rows[0].published_slug,
        null,
      );
    } finally {
      await pool.query(
        'drop trigger reject_m5_revalidation_job on revalidation_jobs',
      );
      await pool.query('drop function reject_m5_revalidation_job()');
    }

    assert.ok(!JSON.stringify(receivedTargets).includes(secret));
    const stored = await pool.query(
      `select metadata from audit_events where target_type = 'article'
       union all select jsonb_build_object('targets', targets, 'last_error', last_error)
       from revalidation_jobs`,
    );
    assert.ok(!JSON.stringify(stored.rows).includes(secret));
    assert.ok(!JSON.stringify(stored.rows).includes('Public content'));
  },
);
