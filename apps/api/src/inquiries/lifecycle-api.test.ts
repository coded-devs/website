import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { hash } from 'argon2';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { Pool } from 'pg';
import { getSessionCookiePolicy } from '../auth/policy.js';
import { createApp } from '../app.js';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';

const databaseUrl = process.env.INQUIRY_LIFECYCLE_TEST_DATABASE_URL;
const databaseName = 'cod318_lifecycle_test';
const adminOrigin = 'http://localhost:3001';
const throttleSecret = 'a'.repeat(64);

function assertDisposableDatabase(value: string) {
  const url = new URL(value);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(url.hostname));
  assert.equal(decodeURIComponent(url.pathname.slice(1)), databaseName);
}

async function withApi<T>(run: (baseUrl: string) => Promise<T>): Promise<T> {
  assert.ok(databaseUrl);
  const server = createApp({
    databaseUrl,
    environment: parseApiEnvironment({
      NODE_ENV: 'test',
      API_TRUST_PROXY_HOPS: '1',
      AUTH_THROTTLE_HMAC_SECRET: throttleSecret,
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

test(
  'inquiry and settings lifecycle works through public and authenticated API boundaries',
  { skip: !databaseUrl },
  async () => {
    assert.ok(databaseUrl);
    assertDisposableDatabase(databaseUrl);
    await runMigrations(databaseUrl);
    const pool = new Pool({ connectionString: databaseUrl });
    const existingAdmin = await pool.query<{
      id: string;
      email: string;
      password_hash: string;
    }>(
      'select id, email, password_hash from admin_users where is_super_admin = true limit 1',
    );
    const previousAdmin = existingAdmin.rows[0];
    const adminUserId = previousAdmin?.id ?? randomUUID();
    const adminEmail = `lifecycle-${adminUserId}@codeddevs.test`;
    const adminPassword = 'test-only-password-with-enough-length-42';
    const passwordHash = await hash(adminPassword);
    try {
      await pool.query('delete from inquiries');
      await pool.query('delete from inquiry_throttle_buckets');
      await pool.query(
        "delete from audit_events where event_type = 'inquiry.update'",
      );
      await pool.query('delete from site_settings');
      if (previousAdmin) {
        await pool.query(
          'update admin_users set email = $2, password_hash = $3 where id = $1',
          [adminUserId, adminEmail, passwordHash],
        );
      } else {
        await pool.query(
          'insert into admin_users (id, email, password_hash) values ($1, $2, $3)',
          [adminUserId, adminEmail, passwordHash],
        );
      }

      await withApi(async (baseUrl) => {
        const submit = async (ip: string, email: string) =>
          fetch(`${baseUrl}/api/v1/public/inquiries`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Forwarded-For': ip,
            },
            body: JSON.stringify({
              name: 'Ada Lovelace',
              email,
              company: 'Analytical Engines',
              message: 'Please contact me about an integration project.',
            }),
          });

        const accepted = await submit('192.0.2.10', 'ada@example.test');
        assert.equal(accepted.status, 201);
        assert.equal(accepted.headers.get('cache-control'), 'no-store');
        assert.deepEqual(await accepted.json(), { received: true });
        for (const ip of ['192.0.2.11', '192.0.2.12'])
          assert.equal((await submit(ip, 'ADA@EXAMPLE.TEST')).status, 201);
        const rateLimited = await submit('192.0.2.13', 'ada@example.test');
        assert.equal(rateLimited.status, 429);
        assert.match(rateLimited.headers.get('retry-after') ?? '', /^\d+$/);
        assert.equal(rateLimited.headers.get('cache-control'), 'no-store');

        const invalid = await fetch(`${baseUrl}/api/v1/public/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'A', email: 'bad', message: 'short' }),
        });
        assert.equal(invalid.status, 400);
        assert.deepEqual(await invalid.json(), {
          error: 'Invalid inquiry request',
          code: 'INQUIRY_INVALID_REQUEST',
        });
        assert.equal(
          (await fetch(`${baseUrl}/api/v1/public/inquiries`)).status,
          404,
        );
        assert.equal(
          (
            await fetch(
              `${baseUrl}/api/v1/public/inquiries/00000000-0000-4000-8000-000000000000`,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await fetch(`${baseUrl}/api/v1/public/inquiries`, {
              method: 'DELETE',
            })
          ).status,
          404,
        );

        const login = await fetch(`${baseUrl}/api/v1/admin/auth/login`, {
          method: 'POST',
          headers: {
            Origin: adminOrigin,
            [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: adminEmail, password: adminPassword }),
        });
        assert.equal(login.status, 200);
        assert.equal(login.headers.get('cache-control'), 'no-store');
        const setCookie = login.headers.get('set-cookie');
        assert.ok(setCookie);
        const cookiePair = setCookie.split(';', 1)[0];
        assert.ok(cookiePair);
        const { name } = getSessionCookiePolicy('test');
        assert.ok(cookiePair.startsWith(`${name}=`));

        const list = await fetch(
          `${baseUrl}/api/v1/admin/inquiries?page=1&limit=20`,
          {
            headers: { Cookie: cookiePair },
          },
        );
        assert.equal(list.status, 200);
        assert.equal(list.headers.get('cache-control'), 'no-store');
        const listing = (await list.json()) as {
          items: Array<Record<string, unknown>>;
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
        assert.deepEqual(
          {
            total: listing.total,
            page: listing.page,
            limit: listing.limit,
            totalPages: listing.totalPages,
          },
          { total: 3, page: 1, limit: 20, totalPages: 1 },
        );
        assert.equal(listing.items[0]?.email, 'ada@example.test');
        assert.equal('message' in listing.items[0]!, false);
        const inquiryId = String(listing.items[0]?.id);

        const detail = await fetch(
          `${baseUrl}/api/v1/admin/inquiries/${inquiryId}`,
          {
            headers: { Cookie: cookiePair },
          },
        );
        assert.equal(detail.status, 200);
        assert.equal(detail.headers.get('cache-control'), 'no-store');
        const detailBody = (await detail.json()) as {
          inquiry: Record<string, unknown>;
        };
        assert.equal(
          detailBody.inquiry.message,
          'Please contact me about an integration project.',
        );

        const status = await fetch(
          `${baseUrl}/api/v1/admin/inquiries/${inquiryId}/status`,
          {
            method: 'PUT',
            headers: {
              Cookie: cookiePair,
              Origin: adminOrigin,
              [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'in_progress' }),
          },
        );
        assert.equal(status.status, 200);
        assert.equal(status.headers.get('cache-control'), 'no-store');
        const updated = (await status.json()) as {
          inquiry: Record<string, unknown>;
        };
        assert.equal(updated.inquiry.status, 'in_progress');
        assert.equal(updated.inquiry.statusUpdatedByAdminUserId, adminUserId);
        assert.ok(updated.inquiry.statusUpdatedAt);
        const audit = await pool.query<{
          metadata: unknown;
          actor_admin_user_id: string;
        }>(
          "select metadata, actor_admin_user_id from audit_events where event_type = 'inquiry.update' and target_id = $1",
          [inquiryId],
        );
        assert.deepEqual(audit.rows, [
          {
            metadata: { fromStatus: 'new', toStatus: 'in_progress' },
            actor_admin_user_id: adminUserId,
          },
        ]);

        const settingsNotYetCreated = await fetch(
          `${baseUrl}/api/v1/admin/settings`,
          {
            headers: { Cookie: cookiePair },
          },
        );
        assert.equal(settingsNotYetCreated.status, 404);
        const settingsDraft = {
          companyName: 'CodedDevs',
          contactEmail: 'hello@codeddevs.test',
          metaTitle: 'Lifecycle compatibility',
        };
        const savedSettings = await fetch(
          `${baseUrl}/api/v1/admin/settings/draft`,
          {
            method: 'PUT',
            headers: {
              Cookie: cookiePair,
              Origin: adminOrigin,
              [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ settings: settingsDraft }),
          },
        );
        assert.equal(savedSettings.status, 200);
        assert.equal(savedSettings.headers.get('cache-control'), 'no-store');
        const readSettings = await fetch(`${baseUrl}/api/v1/admin/settings`, {
          headers: { Cookie: cookiePair },
        });
        assert.equal(readSettings.status, 200);
        assert.equal(readSettings.headers.get('cache-control'), 'no-store');
        const settings = (await readSettings.json()) as {
          settings: {
            draftPayload: typeof settingsDraft;
            publishedPayload: unknown;
          };
        };
        assert.deepEqual(settings.settings.draftPayload, settingsDraft);
        assert.equal(settings.settings.publishedPayload, null);
      });
    } finally {
      await pool.query('delete from inquiries');
      await pool.query('delete from inquiry_throttle_buckets');
      await pool.query('delete from site_settings');
      await pool.query('delete from sessions where admin_user_id = $1', [
        adminUserId,
      ]);
      await pool.query(
        'delete from audit_events where actor_admin_user_id = $1',
        [adminUserId],
      );
      if (previousAdmin) {
        await pool.query(
          'update admin_users set email = $2, password_hash = $3 where id = $1',
          [adminUserId, previousAdmin.email, previousAdmin.password_hash],
        );
      } else {
        await pool.query('delete from admin_users where id = $1', [
          adminUserId,
        ]);
      }
      await pool.end();
    }
  },
);
