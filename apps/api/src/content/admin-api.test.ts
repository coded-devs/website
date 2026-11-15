import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { Pool } from 'pg';
import { createApp } from '../app.js';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';
import { getSessionCookiePolicy } from '../auth/policy.js';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';

const databaseUrl = process.env.ADMIN_CONTENT_TEST_DATABASE_URL;
const databaseName = 'cod316_m3_review_test';
const adminOrigin = 'http://localhost:3001';
const mediaBaseUrl = 'https://cdn.example.test/assets/';
let adminUserId: string | undefined;
const sessionToken = randomBytes(32).toString('base64url');
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

function assertDisposableDatabase(value: string): void {
  const url = new URL(value);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(url.hostname));
  assert.equal(decodeURIComponent(url.pathname.slice(1)), databaseName);
}

before(async () => {
  if (!databaseUrl || !pool) return;
  assertDisposableDatabase(databaseUrl);
  await runMigrations(databaseUrl);
  await pool.query('delete from content_sections');
  await pool.query('delete from services');
  await pool.query('delete from products');
  await pool.query('delete from projects');
  await pool.query('delete from team_members');
  await pool.query('delete from site_settings');
  await pool.query(`insert into content_sections (section_key, position, draft_payload)
    select section_key, position - 1, '{}'::jsonb
    from unnest(array['hero','about','services','products','projects','team','featured_insights','contact']::text[])
      with ordinality as keys(section_key, position)`);
  const existingAdmin = await pool.query<{ id: string }>(
    'select id from admin_users where is_super_admin = true limit 1',
  );
  adminUserId = existingAdmin.rows[0]?.id ?? randomUUID();
  if (!existingAdmin.rows[0]) {
    await pool.query(
      `insert into admin_users (id, email, password_hash)
       values ($1, $2, 'fixture-hash-not-used-for-auth')`,
      [adminUserId, `m3-${adminUserId}@codeddevs.test`],
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

test(
  'content reads remain available while all content writes are rejected',
  { skip: !databaseUrl },
  async () => {
    assert.ok(pool && adminUserId);
    await pool.query('delete from services');
    await pool.query('delete from products');
    await pool.query('delete from projects');
    await pool.query('delete from team_members');
    await pool.query('delete from site_settings');
    await pool.query(
      `delete from audit_events where actor_admin_user_id = $1`,
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
    const server = createApp({ databaseUrl, environment }).listen(
      0,
      '127.0.0.1',
    );
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const { name } = getSessionCookiePolicy('test');
    const cookie = `${name}=${sessionToken}`;
    const send = (
      path: string,
      method: string,
      body: unknown,
      options: { origin?: string; csrf?: boolean; contentType?: string } = {},
    ) =>
      fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Cookie: cookie,
          ...(options.origin === undefined || options.origin !== ''
            ? { Origin: options.origin ?? adminOrigin }
            : {}),
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
      const anonymous = await fetch(`${baseUrl}/api/v1/admin/content/sections`);
      assert.equal(anonymous.status, 401);

      const response = await fetch(`${baseUrl}/api/v1/admin/content/sections`, {
        headers: { Cookie: cookie },
      });
      assert.equal(response.status, 200);
      const initialSections = (await response.json()) as {
        sections: Array<{
          sectionKey: string;
          position: number;
          draftPayload: unknown;
        }>;
      };
      assert.deepEqual(
        initialSections.sections.map(({ sectionKey, position }) => [
          sectionKey,
          position,
        ]),
        [
          ['hero', 0],
          ['about', 1],
          ['services', 2],
          ['products', 3],
          ['projects', 4],
          ['team', 5],
          ['featured_insights', 6],
          ['contact', 7],
        ],
      );
      assert.ok(
        initialSections.sections.every(
          ({ draftPayload }) => JSON.stringify(draftPayload) === '{}',
        ),
      );
      assert.equal(response.headers.get('cache-control'), 'no-store');

      const sectionPath = '/api/v1/admin/content/sections/hero/draft';
      assert.equal(
        (await send(sectionPath, 'PUT', { payload: { heading: 'Hacked' } }))
          .status,
        403,
      );
      assert.equal(
        (
          await send('/api/v1/admin/content/sections/reorder', 'POST', {
            order: [],
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await send(
            '/api/v1/admin/content/sections/hero/publish',
            'POST',
            undefined,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await send('/api/v1/admin/settings/draft', 'PUT', {
            settings: { metaTitle: 'Hacked' },
          })
        ).status,
        403,
      );
      const afterDeniedWrites = await fetch(
        `${baseUrl}/api/v1/admin/content/sections`,
        {
          headers: { Cookie: cookie },
        },
      );
      assert.equal(afterDeniedWrites.status, 200);
      assert.deepEqual(await afterDeniedWrites.json(), {
        sections: initialSections.sections,
      });
    } finally {
      server.close();
      await once(server, 'close');
    }
  },
);
