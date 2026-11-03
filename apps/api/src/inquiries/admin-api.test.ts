import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { Pool } from 'pg';
import { getSessionCookiePolicy } from '../auth/policy.js';
import { createApp } from '../app.js';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';
import { inquiryStatusTransitions } from './contracts.js';

const databaseUrl = process.env.INQUIRY_ADMIN_TEST_DATABASE_URL;
const databaseName = 'cod318_inquiry_admin_test';
const adminOrigin = 'http://localhost:3001';
const sessionToken = randomBytes(32).toString('base64url');
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
let adminUserId: string;

function assertDisposableDatabase(value: string) {
  const url = new URL(value);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(url.hostname));
  assert.equal(decodeURIComponent(url.pathname.slice(1)), databaseName);
}

async function withApi<T>(run: (baseUrl: string) => Promise<T>): Promise<T> {
  assert.ok(databaseUrl);
  const server = createApp({
    databaseUrl,
    environment: parseApiEnvironment({ NODE_ENV: 'test' }),
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

before(async () => {
  if (!databaseUrl || !pool) return;
  assertDisposableDatabase(databaseUrl);
  await runMigrations(databaseUrl);
  const existing = await pool.query<{ id: string; credential_version: number }>(
    'select id, credential_version from admin_users where is_super_admin = true limit 1',
  );
  adminUserId = existing.rows[0]?.id ?? randomUUID();
  if (!existing.rows[0]) {
    await pool.query(
      `insert into admin_users (id, email, password_hash) values ($1, $2, 'fixture-hash-not-used-for-auth')`,
      [adminUserId, `inquiry-admin-${adminUserId}@codeddevs.test`],
    );
  }
  await pool.query(
    `insert into sessions (admin_user_id, token_hash, credential_version, expires_at)
     values ($1, $2, $3, now() + interval '1 hour')
     on conflict (token_hash) do nothing`,
    [
      adminUserId,
      createHash('sha256').update(sessionToken).digest('hex'),
      existing.rows[0]?.credential_version ?? 1,
    ],
  );
});

after(async () => {
  if (pool) await pool.end();
});

test(
  'Admin inquiry API enforces session before lookup and exact mutation policy',
  { skip: !databaseUrl },
  async () => {
    assert.ok(pool);
    const missingId = randomUUID();
    await withApi(async (baseUrl) => {
      const anonymous = await fetch(
        `${baseUrl}/api/v1/admin/inquiries/not-an-id`,
      );
      assert.equal(anonymous.status, 401);
      const { name } = getSessionCookiePolicy('test');
      const cookie = `${name}=${sessionToken}`;
      const request = (options: Record<string, string>) =>
        fetch(`${baseUrl}/api/v1/admin/inquiries/${missingId}/status`, {
          method: 'PUT',
          headers: { Cookie: cookie, ...options },
          body: JSON.stringify({ status: 'closed' }),
        });
      assert.equal(
        (
          await request({
            Origin: 'http://attacker.test',
            [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
            'Content-Type': 'application/json',
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request({
            [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
            'Content-Type': 'application/json',
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request({
            Origin: adminOrigin,
            'Content-Type': 'application/json',
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request({
            Origin: adminOrigin,
            [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
            'Content-Type': 'text/plain',
          })
        ).status,
        415,
      );
      const response = await fetch(
        `${baseUrl}/api/v1/admin/inquiries/${missingId}`,
        { headers: { Cookie: cookie } },
      );
      assert.equal(response.status, 404);
    });
  },
);

test(
  'Admin inquiry API lists deterministically, filters/searches safely, and returns full detail only by id',
  { skip: !databaseUrl },
  async () => {
    assert.ok(pool);
    await pool.query('delete from inquiries');
    const firstId = '11111111-1111-4111-8111-111111111111';
    const secondId = '22222222-2222-4222-8222-222222222222';
    await pool.query(
      `insert into inquiries (id, name, email, company, message, status, created_at, updated_at)
     values ($1, 'Ada Lovelace', 'ada@example.test', 'Engines', 'private alpha message', 'new', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
            ($2, 'Grace Hopper', 'grace@example.test', null, 'private beta message', 'in_progress', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z')`,
      [firstId, secondId],
    );
    await withApi(async (baseUrl) => {
      const listResponse = await fetch(
        `${baseUrl}/api/v1/admin/inquiries?page=1&limit=1`,
        { headers: { Cookie: cookieForTest() } },
      );
      assert.equal(listResponse.status, 200);
      const list = (await listResponse.json()) as {
        items: Array<Record<string, unknown>>;
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
      assert.deepEqual(
        {
          total: list.total,
          page: list.page,
          limit: list.limit,
          totalPages: list.totalPages,
        },
        { total: 2, page: 1, limit: 1, totalPages: 2 },
      );
      assert.equal(list.items[0]?.id, secondId);
      assert.equal('message' in list.items[0]!, false);
      assert.equal(JSON.stringify(list).includes('private'), false);
      const filtered = await fetch(
        `${baseUrl}/api/v1/admin/inquiries?status=new&search=%25_`,
        { headers: { Cookie: cookieForTest() } },
      );
      assert.deepEqual(await filtered.json(), {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
      const matched = await fetch(
        `${baseUrl}/api/v1/admin/inquiries?status=new&search=Ada`,
        { headers: { Cookie: cookieForTest() } },
      );
      assert.equal(((await matched.json()) as { total: number }).total, 1);
      const detail = await fetch(
        `${baseUrl}/api/v1/admin/inquiries/${firstId}`,
        { headers: { Cookie: cookieForTest() } },
      );
      assert.equal(
        ((await detail.json()) as { inquiry: { message: string } }).inquiry
          .message,
        'private alpha message',
      );
      for (const query of [
        'page=0',
        'limit=101',
        'status=invalid',
        'search=x'.repeat(201),
        'unexpected=yes',
      ]) {
        assert.equal(
          (
            await fetch(`${baseUrl}/api/v1/admin/inquiries?${query}`, {
              headers: { Cookie: cookieForTest() },
            })
          ).status,
          400,
        );
      }
      assert.equal(
        (
          await fetch(`${baseUrl}/api/v1/admin/inquiries/not-a-uuid`, {
            headers: { Cookie: cookieForTest() },
          })
        ).status,
        400,
      );
    });
  },
);

function cookieForTest() {
  const { name } = getSessionCookiePolicy('test');
  return `${name}=${sessionToken}`;
}

test(
  'Admin inquiry status transitions audit only approved metadata and commit atomically',
  { skip: !databaseUrl },
  async () => {
    assert.ok(pool);
    await pool.query('delete from inquiries');
    await pool.query(
      "delete from audit_events where event_type = 'inquiry.update'",
    );
    const ids = new Map<string, string>();
    for (const status of Object.keys(inquiryStatusTransitions) as Array<
      keyof typeof inquiryStatusTransitions
    >) {
      const id = randomUUID();
      ids.set(status, id);
      await pool.query(
        'insert into inquiries (id, name, email, message, status) values ($1, $2, $3, $4, $5)',
        [
          id,
          `Name ${status}`,
          `${status}@example.test`,
          'A private inquiry message.',
          status,
        ],
      );
    }
    await withApi(async (baseUrl) => {
      const update = (id: string, status: string, body: unknown = { status }) =>
        fetch(`${baseUrl}/api/v1/admin/inquiries/${id}/status`, {
          method: 'PUT',
          headers: {
            Cookie: cookieForTest(),
            Origin: adminOrigin,
            [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      assert.equal((await update(ids.get('new')!, 'bogus')).status, 400);
      assert.equal((await update(ids.get('new')!, 'new')).status, 409);
      assert.equal((await update(ids.get('closed')!, 'closed')).status, 409);
      assert.equal((await update(randomUUID(), 'closed')).status, 404);
      assert.equal(
        (
          await update(ids.get('new')!, 'closed', {
            status: 'closed',
            message: 'forbidden',
          })
        ).status,
        400,
      );
      for (const [from, allowed] of Object.entries(inquiryStatusTransitions)) {
        for (const to of allowed) {
          const id = randomUUID();
          await pool.query(
            'insert into inquiries (id, name, email, message, status) values ($1, $2, $3, $4, $5)',
            [
              id,
              `Test ${from} ${to}`,
              `${randomUUID()}@example.test`,
              'Private test message.',
              from,
            ],
          );
          const response = await update(id, to);
          assert.equal(response.status, 200, `${from} -> ${to}`);
          const inquiry = (
            (await response.json()) as { inquiry: Record<string, unknown> }
          ).inquiry;
          assert.equal(inquiry.status, to);
          assert.equal(inquiry.message, 'Private test message.');
          assert.equal(inquiry.statusUpdatedByAdminUserId, adminUserId);
          assert.ok(inquiry.statusUpdatedAt);
          const eventResult: { rows: Array<{ metadata: unknown }> } =
            await pool.query(
              "select metadata from audit_events where event_type = 'inquiry.update' and target_id = $1",
              [id],
            );
          assert.deepEqual(eventResult.rows[0]?.metadata, {
            fromStatus: from,
            toStatus: to,
          });
        }
      }
      const beforeRow = await pool.query<{
        status: string;
        status_updated_at: Date | null;
      }>('select status, status_updated_at from inquiries where id = $1', [
        ids.get('new'),
      ]);
      await pool.query(
        `create or replace function reject_inquiry_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'inquiry.update' then raise exception 'audit unavailable'; end if; return new; end $$`,
      );
      await pool.query(
        'create trigger reject_inquiry_audit before insert on audit_events for each row execute function reject_inquiry_audit()',
      );
      try {
        assert.equal(
          (await update(ids.get('new')!, 'in_progress')).status,
          503,
        );
        const afterRow = await pool.query<{
          status: string;
          status_updated_at: Date | null;
        }>('select status, status_updated_at from inquiries where id = $1', [
          ids.get('new'),
        ]);
        assert.deepEqual(afterRow.rows[0], beforeRow.rows[0]);
      } finally {
        await pool.query('drop trigger reject_inquiry_audit on audit_events');
        await pool.query('drop function reject_inquiry_audit()');
      }
    });
  },
);
