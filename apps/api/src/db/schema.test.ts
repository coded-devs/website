import assert from 'node:assert/strict';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { Pool } from 'pg';
import { runMigrations } from './migrator.js';
import { createApp } from '../app.js';
import { hashPassword } from '../auth/password.js';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error(
    'TEST_DATABASE_URL is required for database tests and must name a dedicated test database.',
  );
}

const parsedTestDatabaseUrl = new URL(testDatabaseUrl);
const testDatabaseName = parsedTestDatabaseUrl.pathname.slice(1);

if (!/(^|[-_])test($|[-_])/.test(testDatabaseName)) {
  throw new Error(
    `Refusing to reset database "${testDatabaseName}" because its name is not explicitly marked as a test database.`,
  );
}

async function expectDatabaseError(
  operation: Promise<unknown>,
  code: string,
  constraint: string,
) {
  await assert.rejects(operation, (error: unknown) => {
    if (!(error instanceof Error)) return false;

    const databaseError = error as Error & {
      code?: string;
      constraint?: string;
    };
    assert.equal(databaseError.code, code);
    assert.equal(databaseError.constraint, constraint);
    return true;
  });
}

async function waitForApiStartup(child: ReturnType<typeof spawn>) {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('API did not start within 30 seconds.')),
      30_000,
    );

    child.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`API exited before startup with code ${String(code)}.`));
    });
    child.stdout?.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('api.listening')) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}

test('reviewed migrations and database invariants', async (context) => {
  const pool = new Pool({ connectionString: testDatabaseUrl });
  context.after(async () => pool.end());

  await pool.query('drop schema if exists drizzle cascade');
  await pool.query('drop schema if exists public cascade');
  await pool.query('create schema public');

  await context.test('API startup never runs migrations', async () => {
    const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
        PORT: '0',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    try {
      await waitForApiStartup(child);
      const result = await pool.query<{ table_name: string }>(
        `select table_name
         from information_schema.tables
         where table_schema = 'public'`,
      );
      assert.deepEqual(result.rows, []);
    } finally {
      if (child.exitCode === null) {
        child.kill();
        await Promise.race([once(child, 'exit'), delay(5_000)]);
      }
    }
  });

  await context.test(
    'migrations apply to a clean PostgreSQL database',
    async () => {
      await runMigrations(testDatabaseUrl);

      const result = await pool.query<{ table_name: string }>(
        `select table_name
       from information_schema.tables
       where table_schema = 'public'
       order by table_name`,
      );
      const tableNames = result.rows.map((row) => row.table_name);

      assert.ok(tableNames.includes('admin_users'));
      assert.ok(tableNames.includes('articles'));
      assert.ok(tableNames.includes('content_sections'));
      assert.ok(tableNames.includes('media_asset_references'));
      assert.ok(tableNames.includes('recovery_code_sets'));
      assert.ok(tableNames.includes('recovery_codes'));
      assert.ok(tableNames.includes('auth_throttle_buckets'));
      const adminCount = await pool.query<{ count: string }>(
        'select count(*) from admin_users',
      );
      assert.equal(adminCount.rows[0]?.count, '0');
      const codeColumns = await pool.query<{ column_name: string }>(
        `select column_name from information_schema.columns where table_schema = 'public' and table_name = 'recovery_codes' order by ordinal_position`,
      );
      assert.deepEqual(
        codeColumns.rows.map((row) => row.column_name),
        ['id', 'set_id', 'position', 'code_hash', 'created_at'],
      );
    },
  );

  await context.test(
    'provisioning is atomic, one-time, and stores only verifiers',
    async () => {
      async function provision(args: string[] = ['admin@codeddevs.test']) {
        const child = spawn(
          process.execPath,
          ['--import', 'tsx', 'src/auth/provision-admin.ts', ...args],
          {
            cwd: process.cwd(),
            env: { ...process.env, DATABASE_URL: testDatabaseUrl },
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        );
        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8').on('data', (value: string) => {
          stdout += value;
        });
        child.stderr.setEncoding('utf8').on('data', (value: string) => {
          stderr += value;
        });
        child.stdin.end('test password with adequate length\n');
        const [code] = await once(child, 'close');
        return { code, stdout, stderr };
      }

      await pool.query(
        `create function test_fail_recovery_code() returns trigger language plpgsql as $$ begin raise exception 'injected failure'; end $$`,
      );
      await pool.query(
        `create trigger test_fail_recovery_code before insert on recovery_codes for each row execute function test_fail_recovery_code()`,
      );
      const failed = await provision();
      assert.notEqual(failed.code, 0);
      assert.equal(failed.stdout.trim(), '');
      for (const table of [
        'admin_users',
        'recovery_code_sets',
        'recovery_codes',
      ]) {
        const rows = await pool.query<{ count: string }>(
          `select count(*) from ${table}`,
        );
        assert.equal(rows.rows[0]?.count, '0');
      }
      await pool.query(
        'drop trigger test_fail_recovery_code on recovery_codes',
      );
      await pool.query('drop function test_fail_recovery_code()');

      const argsAttempt = await provision([
        'admin@codeddevs.test',
        'password-on-command-line',
      ]);
      assert.notEqual(argsAttempt.code, 0);
      assert.equal(argsAttempt.stdout.trim(), '');
      assert.equal(
        (
          await pool.query<{ count: string }>(
            'select count(*) from admin_users',
          )
        ).rows[0]?.count,
        '0',
      );

      const result = await provision();
      assert.equal(result.code, 0, result.stderr);
      const codes = result.stdout.trim().split(/\r?\n/);
      assert.equal(codes.length, 8);
      assert.equal(new Set(codes).size, 8);
      assert.ok(codes.every((code) => /^[A-Za-z0-9_-]{43}$/.test(code)));
      const admins = await pool.query<{
        id: string;
        password_hash: string;
        credential_version: number;
      }>('select id, password_hash, credential_version from admin_users');
      assert.equal(admins.rowCount, 1);
      assert.match(admins.rows[0]!.password_hash, /^\$argon2id\$/);
      const { verify } = await import('argon2');
      assert.equal(
        await verify(
          admins.rows[0]!.password_hash,
          'test password with adequate length',
        ),
        true,
      );
      assert.equal(admins.rows[0]!.credential_version, 1);
      const stored = await pool.query<{ code_hash: string }>(
        'select code_hash from recovery_codes',
      );
      assert.equal(stored.rowCount, 8);
      assert.deepEqual(
        new Set(stored.rows.map((row) => row.code_hash)),
        new Set(
          codes.map((code) => createHash('sha256').update(code).digest('hex')),
        ),
      );
      assert.ok(stored.rows.every((row) => !codes.includes(row.code_hash)));
      const duplicate = await provision();
      assert.notEqual(duplicate.code, 0);
      assert.equal(duplicate.stdout.trim(), '');
      assert.doesNotMatch(
        duplicate.stderr,
        /test password with adequate length/,
      );
      assert.deepEqual(
        (
          await pool.query(
            'select id, password_hash, credential_version from admin_users',
          )
        ).rows,
        admins.rows,
      );
      assert.deepEqual(
        (await pool.query('select code_hash from recovery_codes')).rows,
        stored.rows,
      );
      await pool.query('delete from recovery_codes');
      await pool.query('delete from recovery_code_sets');
      await pool.query('delete from admin_users');
    },
  );

  await context.test(
    'complete authentication lifecycle uses explicit migrations and public endpoints',
    async () => {
      const email = 'lifecycle@codeddevs.test';
      const originalPassword = 'initial lifecycle passphrase';
      const replacementPassword = 'replacement lifecycle passphrase';
      const environment = {
        nodeEnvironment: 'test' as const,
        adminOrigin: 'http://localhost:3001',
        trustProxy: false as const,
        throttleHmacSecret: randomBytes(32).toString('hex'),
      };

      await runMigrations(testDatabaseUrl);

      const provision = spawn(
        process.execPath,
        ['--import', 'tsx', 'src/auth/provision-admin.ts', email],
        {
          cwd: process.cwd(),
          env: { ...process.env, DATABASE_URL: testDatabaseUrl },
          stdio: ['pipe', 'pipe', 'pipe'],
        },
      );
      let provisioningOutput = '';
      let provisioningError = '';
      provision.stdout.setEncoding('utf8').on('data', (value: string) => {
        provisioningOutput += value;
      });
      provision.stderr.setEncoding('utf8').on('data', (value: string) => {
        provisioningError += value;
      });
      provision.stdin.end(`${originalPassword}\n`);
      const [provisioningStatus] = await once(provision, 'close');
      assert.equal(provisioningStatus, 0, provisioningError);
      const originalCodes = provisioningOutput.trim().split(/\r?\n/);
      assert.equal(originalCodes.length, 8);
      assert.equal(new Set(originalCodes).size, 8);
      const recoveryCode = originalCodes[0];
      assert.ok(recoveryCode);

      const server = createApp({
        databaseUrl: testDatabaseUrl,
        environment,
      }).listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const base = `http://127.0.0.1:${address.port}`;
      const stateChangingHeaders = {
        'Content-Type': 'application/json',
        Origin: environment.adminOrigin,
        'X-CodedDevs-CSRF': '1',
      };
      const login = (password: string, cookie?: string) =>
        fetch(`${base}/api/v1/admin/auth/login`, {
          method: 'POST',
          headers: {
            ...stateChangingHeaders,
            ...(cookie ? { Cookie: cookie } : {}),
          },
          body: JSON.stringify({ email, password }),
        });
      const sessionCookie = (response: Response) => {
        const value = response.headers.get('set-cookie');
        assert.ok(value);
        return value.split(';')[0]!;
      };
      const me = (cookie: string) =>
        fetch(`${base}/api/v1/admin/auth/me`, { headers: { Cookie: cookie } });

      try {
        const firstLogin = await login(originalPassword);
        assert.equal(firstLogin.status, 200);
        const firstCookie = sessionCookie(firstLogin);

        assert.equal((await me(firstCookie)).status, 200);
        assert.equal(
          (
            await fetch(`${base}/api/v1/admin/content`, {
              headers: { Cookie: firstCookie },
            })
          ).status,
          404,
        );

        const logout = await fetch(`${base}/api/v1/admin/auth/logout`, {
          method: 'POST',
          headers: { ...stateChangingHeaders, Cookie: firstCookie },
        });
        assert.equal(logout.status, 204);
        assert.equal((await me(firstCookie)).status, 401);

        const secondLogin = await login(originalPassword);
        assert.equal(secondLogin.status, 200);
        const secondCookie = sessionCookie(secondLogin);
        const rotatedLogin = await login(originalPassword, secondCookie);
        assert.equal(rotatedLogin.status, 200);
        const rotatedCookie = sessionCookie(rotatedLogin);
        assert.equal((await me(secondCookie)).status, 401);
        assert.equal((await me(rotatedCookie)).status, 200);

        const recovery = await fetch(
          `${base}/api/v1/admin/auth/recovery/reset`,
          {
            method: 'POST',
            headers: stateChangingHeaders,
            body: JSON.stringify({
              email,
              recoveryCode,
              newPassword: replacementPassword,
            }),
          },
        );
        assert.equal(recovery.status, 204);
        assert.equal((await me(firstCookie)).status, 401);
        assert.equal((await me(secondCookie)).status, 401);
        assert.equal((await me(rotatedCookie)).status, 401);
        assert.equal((await login(originalPassword)).status, 401);

        const replacementLogin = await login(replacementPassword);
        assert.equal(replacementLogin.status, 200);
        const replacementCookie = sessionCookie(replacementLogin);
        const regenerated = await fetch(
          `${base}/api/v1/admin/auth/recovery/codes`,
          {
            method: 'POST',
            headers: { ...stateChangingHeaders, Cookie: replacementCookie },
            body: JSON.stringify({ currentPassword: replacementPassword }),
          },
        );
        assert.equal(regenerated.status, 200);
        const replacementKit = (await regenerated.json()) as {
          recoveryCodes: string[];
        };
        assert.equal(replacementKit.recoveryCodes.length, 8);
        assert.equal(new Set(replacementKit.recoveryCodes).size, 8);

        for (const path of [
          '/api/v1/admin/auth/register',
          '/api/v1/admin/auth/operator-recovery',
        ]) {
          const publicRequest = await fetch(`${base}${path}`, {
            method: 'POST',
            headers: stateChangingHeaders,
            body: '{}',
          });
          assert.equal(publicRequest.status, 401);
          const absentRoute = await fetch(`${base}${path}`, {
            method: 'POST',
            headers: {
              ...stateChangingHeaders,
              Cookie: replacementCookie,
            },
            body: '{}',
          });
          assert.equal(absentRoute.status, 404);
        }
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        await pool.query('delete from audit_events');
        await pool.query(
          'delete from sessions where admin_user_id in (select id from admin_users where email = $1)',
          [email],
        );
        await pool.query(
          'delete from recovery_codes where set_id in (select id from recovery_code_sets where admin_user_id in (select id from admin_users where email = $1))',
          [email],
        );
        await pool.query(
          'delete from recovery_code_sets where admin_user_id in (select id from admin_users where email = $1)',
          [email],
        );
        await pool.query('delete from admin_users where email = $1', [email]);
        await pool.query('delete from auth_throttle_buckets');
      }
    },
  );

  const adminResult = await pool.query<{ id: string }>(
    `insert into admin_users (email, password_hash)
     values ('admin@codeddevs.test', 'test-password-hash')
     returning id`,
  );
  const adminUserId = adminResult.rows[0]?.id;
  assert.ok(adminUserId);
  const testThrottleSecret = randomBytes(32).toString('hex');

  await context.test(
    'authenticated recovery-kit regeneration is reauthenticated, atomic and secret-safe',
    async () => {
      const environment = {
        nodeEnvironment: 'test' as const,
        adminOrigin: 'http://localhost:3001',
        trustProxy: false as const,
        throttleHmacSecret: testThrottleSecret,
      };
      const server = createApp({
        databaseUrl: testDatabaseUrl,
        environment,
      }).listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const base = `http://127.0.0.1:${address.port}`;
      const password = 'valid original regeneration password';
      const token = randomBytes(32).toString('base64url');
      const oldCodes = Array.from({ length: 8 }, () =>
        randomBytes(32).toString('base64url'),
      );
      const logs: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;
      console.log = (...args: unknown[]) => {
        logs.push(args.map(String).join(' '));
      };
      console.error = (...args: unknown[]) => {
        logs.push(args.map(String).join(' '));
      };
      const headers = {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3001',
        'X-CodedDevs-CSRF': '1',
        Cookie: `codeddevs-admin-session=${token}`,
      };
      const regenerate = (currentPassword: string, requestHeaders = headers) =>
        fetch(`${base}/api/v1/admin/auth/recovery/codes`, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify({ currentPassword }),
        });
      try {
        await pool.query(
          'update admin_users set password_hash = $1, credential_version = 1 where id = $2',
          [await hashPassword(password), adminUserId],
        );
        await pool.query(
          "insert into sessions (admin_user_id, token_hash, credential_version, expires_at) values ($1, $2, 1, now() + interval '1 hour')",
          [adminUserId, createHash('sha256').update(token).digest('hex')],
        );
        const oldSet = (
          await pool.query<{ id: string }>(
            'insert into recovery_code_sets (admin_user_id) values ($1) returning id',
            [adminUserId],
          )
        ).rows[0]!.id;
        for (const [position, code] of oldCodes.entries())
          await pool.query(
            'insert into recovery_codes (set_id, position, code_hash) values ($1, $2, $3)',
            [oldSet, position, createHash('sha256').update(code).digest('hex')],
          );
        assert.equal(
          (await regenerate(password, { ...headers, Cookie: '' })).status,
          401,
        );
        assert.equal(
          (
            await regenerate(password, {
              ...headers,
              Origin: 'http://attacker.test',
            })
          ).status,
          403,
        );
        assert.equal(
          (await regenerate(password, { ...headers, 'X-CodedDevs-CSRF': '' }))
            .status,
          403,
        );
        assert.equal(
          (
            await regenerate(password, {
              ...headers,
              'Content-Type': 'text/plain',
            })
          ).status,
          415,
        );
        for (let attempt = 0; attempt < 3; attempt++)
          assert.equal(
            (await regenerate('wrong current password')).status,
            401,
          );
        const rejectedRegenerations = await pool.query<{ count: string }>(
          "select count(*) from audit_events where event_type = 'auth.recovery' and metadata->>'outcome' = 'rejected' and metadata->>'action' = 'regenerate'",
        );
        assert.equal(rejectedRegenerations.rows[0]?.count, '1');
        assert.equal(
          (
            await pool.query(
              'select id from recovery_code_sets where id = $1 and consumed_at is null',
              [oldSet],
            )
          ).rowCount,
          1,
        );
        await pool.query(
          `create function test_fail_kit_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'auth.recovery' and new.metadata->>'action' = 'regenerate' then raise exception 'injected failure'; end if; return new; end $$`,
        );
        await pool.query(
          'create trigger test_fail_kit_audit before insert on audit_events for each row execute function test_fail_kit_audit()',
        );
        try {
          const failed = await regenerate(password);
          assert.equal(failed.status, 503);
          assert.ok(!(await failed.text()).includes(oldCodes[0]!));
          assert.equal(
            (
              await pool.query(
                'select id from recovery_code_sets where id = $1 and consumed_at is null',
                [oldSet],
              )
            ).rowCount,
            1,
          );
          assert.equal(
            (
              await pool.query(
                'select id from recovery_code_sets where admin_user_id = $1',
                [adminUserId],
              )
            ).rowCount,
            1,
          );
          assert.equal(
            (
              await pool.query(
                'select id from recovery_codes where set_id = $1',
                [oldSet],
              )
            ).rowCount,
            8,
          );
        } finally {
          await pool.query('drop trigger test_fail_kit_audit on audit_events');
          await pool.query('drop function test_fail_kit_audit()');
        }
        const result = await regenerate(password);
        assert.equal(result.status, 200);
        assert.match(result.headers.get('cache-control') ?? '', /no-store/);
        const payload = (await result.json()) as { recoveryCodes: string[] };
        assert.deepEqual(Object.keys(payload), ['recoveryCodes']);
        assert.equal(payload.recoveryCodes.length, 8);
        assert.equal(new Set(payload.recoveryCodes).size, 8);
        assert.ok(
          payload.recoveryCodes.every((code) =>
            /^[A-Za-z0-9_-]{43}$/.test(code),
          ),
        );
        assert.equal(
          (
            await pool.query(
              'select id from recovery_code_sets where id = $1 and consumed_at is not null',
              [oldSet],
            )
          ).rowCount,
          1,
        );
        const hashes = await pool.query<{ code_hash: string }>(
          'select c.code_hash from recovery_codes c join recovery_code_sets s on s.id = c.set_id where s.admin_user_id = $1 and s.consumed_at is null',
          [adminUserId],
        );
        assert.deepEqual(
          new Set(hashes.rows.map((row) => row.code_hash)),
          new Set(
            payload.recoveryCodes.map((code) =>
              createHash('sha256').update(code).digest('hex'),
            ),
          ),
        );
        const audit = await pool.query<{ metadata: unknown }>(
          "select metadata from audit_events where event_type = 'auth.recovery'",
        );
        assert.ok(
          audit.rows.some(
            (row) =>
              (row.metadata as { action?: string }).action === 'regenerate',
          ),
        );
        for (const secret of [
          ...payload.recoveryCodes,
          ...oldCodes,
          token,
          password,
          testThrottleSecret,
        ])
          assert.ok(
            !(JSON.stringify(audit.rows) + logs.join('\n')).includes(secret),
          );
        const oldCode = await fetch(
          `${base}/api/v1/admin/auth/recovery/reset`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              email: 'admin@codeddevs.test',
              recoveryCode: oldCodes[0],
              newPassword: 'another valid recovery passphrase',
            }),
          },
        );
        assert.equal(oldCode.status, 401);
        assert.equal(
          (
            await fetch(`${base}/api/v1/admin/auth/recovery/codes`, {
              headers: { Cookie: headers.Cookie },
            })
          ).status,
          404,
        );
        assert.equal(
          (
            await fetch(`${base}/api/v1/admin/auth/recovery/operator`, {
              method: 'POST',
              headers,
            })
          ).status,
          404,
        );
      } finally {
        console.log = originalLog;
        console.error = originalError;
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        await pool.query(
          "delete from audit_events where event_type = 'auth.recovery'",
        );
        await pool.query('delete from auth_throttle_buckets');
        await pool.query('delete from sessions where admin_user_id = $1', [
          adminUserId,
        ]);
        await pool.query(
          'delete from recovery_codes where set_id in (select id from recovery_code_sets where admin_user_id = $1)',
          [adminUserId],
        );
        await pool.query(
          'delete from recovery_code_sets where admin_user_id = $1',
          [adminUserId],
        );
      }
    },
  );

  await context.test(
    'offline operator recovery requires stdin confirmation and commits one replacement kit',
    async () => {
      const oldPassword = 'old operator test passphrase';
      const newPassword = 'new operator test passphrase';
      const oldHash = await hashPassword(oldPassword);
      const token = randomBytes(32).toString('base64url');
      async function operator(input: string, args: string[] = []) {
        const child = spawn(
          process.execPath,
          ['--import', 'tsx', 'src/auth/operator-recover.ts', ...args],
          {
            cwd: process.cwd(),
            env: { ...process.env, DATABASE_URL: testDatabaseUrl },
            stdio: ['pipe', 'pipe', 'pipe'],
          },
        );
        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8').on('data', (value: string) => {
          stdout += value;
        });
        child.stderr.setEncoding('utf8').on('data', (value: string) => {
          stderr += value;
        });
        child.stdin.end(input);
        const [code] = await once(child, 'close');
        return { code, stdout, stderr };
      }
      try {
        await pool.query(
          'update admin_users set password_hash = $1, credential_version = 1 where id = $2',
          [oldHash, adminUserId],
        );
        await pool.query(
          "insert into sessions (admin_user_id, token_hash, credential_version, expires_at) values ($1, $2, 1, now() + interval '1 hour')",
          [adminUserId, createHash('sha256').update(token).digest('hex')],
        );
        const oldSet = (
          await pool.query<{ id: string }>(
            'insert into recovery_code_sets (admin_user_id) values ($1) returning id',
            [adminUserId],
          )
        ).rows[0]!.id;
        await pool.query(
          'insert into recovery_codes (set_id, position, code_hash) values ($1, 0, $2)',
          [oldSet, 'b'.repeat(64)],
        );
        for (const result of [
          await operator(`NO\n${newPassword}\n`),
          await operator(`RECOVER\n${newPassword}\n`, ['forbidden']),
        ]) {
          assert.notEqual(result.code, 0);
          assert.equal(result.stdout.trim(), '');
        }
        await pool.query(
          `create function test_fail_operator_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'auth.recovery' and new.metadata->>'action' = 'operator_reset' then raise exception 'injected failure'; end if; return new; end $$`,
        );
        await pool.query(
          'create trigger test_fail_operator_audit before insert on audit_events for each row execute function test_fail_operator_audit()',
        );
        try {
          const failure = await operator(`RECOVER\n${newPassword}\n`);
          assert.notEqual(failure.code, 0);
          assert.equal(failure.stdout.trim(), '');
          assert.ok(!failure.stderr.includes(newPassword));
          const unchanged = await pool.query<{
            password_hash: string;
            credential_version: number;
          }>(
            'select password_hash, credential_version from admin_users where id = $1',
            [adminUserId],
          );
          assert.equal(unchanged.rows[0]?.password_hash, oldHash);
          assert.equal(unchanged.rows[0]?.credential_version, 1);
          assert.equal(
            (
              await pool.query(
                'select id from sessions where admin_user_id = $1 and revoked_at is null',
                [adminUserId],
              )
            ).rowCount,
            1,
          );
          assert.equal(
            (
              await pool.query(
                'select id from recovery_code_sets where id = $1 and consumed_at is null',
                [oldSet],
              )
            ).rowCount,
            1,
          );
          assert.equal(
            (
              await pool.query(
                'select id from recovery_code_sets where admin_user_id = $1',
                [adminUserId],
              )
            ).rowCount,
            1,
          );
        } finally {
          await pool.query(
            'drop trigger test_fail_operator_audit on audit_events',
          );
          await pool.query('drop function test_fail_operator_audit()');
        }
        const success = await operator(`RECOVER\n${newPassword}\n`);
        assert.equal(success.code, 0, success.stderr);
        const codes = success.stdout.trim().split(/\r?\n/);
        assert.equal(codes.length, 8);
        assert.equal(new Set(codes).size, 8);
        assert.ok(codes.every((code) => /^[A-Za-z0-9_-]{43}$/.test(code)));
        const updated = await pool.query<{
          password_hash: string;
          credential_version: number;
        }>(
          'select password_hash, credential_version from admin_users where id = $1',
          [adminUserId],
        );
        const { verify } = await import('argon2');
        assert.equal(
          await verify(updated.rows[0]!.password_hash, newPassword),
          true,
        );
        assert.equal(updated.rows[0]!.credential_version, 2);
        assert.equal(
          (
            await pool.query(
              'select id from sessions where admin_user_id = $1 and revoked_at is not null',
              [adminUserId],
            )
          ).rowCount,
          1,
        );
        assert.equal(
          (
            await pool.query(
              'select id from recovery_code_sets where id = $1 and consumed_at is not null',
              [oldSet],
            )
          ).rowCount,
          1,
        );
        const hashes = await pool.query<{ code_hash: string }>(
          'select c.code_hash from recovery_codes c join recovery_code_sets s on s.id = c.set_id where s.admin_user_id = $1 and s.consumed_at is null',
          [adminUserId],
        );
        assert.deepEqual(
          new Set(hashes.rows.map((row) => row.code_hash)),
          new Set(
            codes.map((code) =>
              createHash('sha256').update(code).digest('hex'),
            ),
          ),
        );
        const audit = await pool.query<{ metadata: unknown }>(
          "select metadata from audit_events where event_type = 'auth.recovery'",
        );
        assert.ok(
          audit.rows.some(
            (row) =>
              (row.metadata as { action?: string }).action === 'operator_reset',
          ),
        );
        for (const secret of [...codes, token, newPassword])
          assert.ok(
            !JSON.stringify(audit.rows).includes(secret) &&
              !success.stderr.includes(secret),
          );
      } finally {
        await pool.query(
          "delete from audit_events where event_type = 'auth.recovery'",
        );
        await pool.query('delete from sessions where admin_user_id = $1', [
          adminUserId,
        ]);
        await pool.query(
          'delete from recovery_codes where set_id in (select id from recovery_code_sets where admin_user_id = $1)',
          [adminUserId],
        );
        await pool.query(
          'delete from recovery_code_sets where admin_user_id = $1',
          [adminUserId],
        );
        await pool.query(
          'update admin_users set credential_version = 1 where id = $1',
          [adminUserId],
        );
      }
    },
  );

  await context.test(
    'offline recovery is atomic, single-use, abuse-protected and does not log in',
    async () => {
      const environment = {
        nodeEnvironment: 'test' as const,
        adminOrigin: 'http://localhost:3001',
        trustProxy: 1 as const,
        throttleHmacSecret: testThrottleSecret,
      };
      const server = createApp({
        databaseUrl: testDatabaseUrl,
        environment,
      }).listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const base = `http://127.0.0.1:${address.port}`;
      const headers = {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3001',
        'X-CodedDevs-CSRF': '1',
      };
      const oldPassword = 'old recovery test passphrase';
      const newPassword = 'new recovery test passphrase';
      const codes = Array.from({ length: 8 }, () =>
        randomBytes(32).toString('base64url'),
      );
      const rawSessions = Array.from({ length: 2 }, () =>
        randomBytes(32).toString('base64url'),
      );
      const oldHash = await hashPassword(oldPassword);
      const logs: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;
      console.log = (...args: unknown[]) => {
        logs.push(args.map(String).join(' '));
      };
      console.error = (...args: unknown[]) => {
        logs.push(args.map(String).join(' '));
      };
      const recover = (
        email: string,
        recoveryCode: string,
        next = newPassword,
        source?: string,
      ) =>
        fetch(`${base}/api/v1/admin/auth/recovery/reset`, {
          method: 'POST',
          headers: {
            ...headers,
            ...(source ? { 'X-Forwarded-For': source } : {}),
          },
          body: JSON.stringify({ email, recoveryCode, newPassword: next }),
        });
      try {
        await pool.query(
          'update admin_users set password_hash = $1, credential_version = 1 where id = $2',
          [oldHash, adminUserId],
        );
        const setResult = await pool.query<{ id: string }>(
          'insert into recovery_code_sets (admin_user_id) values ($1) returning id',
          [adminUserId],
        );
        const setId = setResult.rows[0]!.id;
        for (const [position, code] of codes.entries())
          await pool.query(
            'insert into recovery_codes (set_id, position, code_hash) values ($1, $2, $3)',
            [setId, position, createHash('sha256').update(code).digest('hex')],
          );
        for (const token of rawSessions)
          await pool.query(
            "insert into sessions (admin_user_id, token_hash, credential_version, expires_at) values ($1, $2, 1, now() + interval '1 hour')",
            [adminUserId, createHash('sha256').update(token).digest('hex')],
          );
        const badOrigin = await fetch(
          `${base}/api/v1/admin/auth/recovery/reset`,
          {
            method: 'POST',
            headers: { ...headers, Origin: 'http://attacker.test' },
            body: '{}',
          },
        );
        assert.equal(badOrigin.status, 403);
        const badCsrf = await fetch(
          `${base}/api/v1/admin/auth/recovery/reset`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Origin: headers.Origin,
            },
            body: '{}',
          },
        );
        assert.equal(badCsrf.status, 403);
        assert.equal(
          (
            await fetch(`${base}/api/v1/admin/auth/recovery/reset`, {
              method: 'POST',
              headers: { ...headers, 'Content-Type': 'text/plain' },
              body: '{}',
            })
          ).status,
          415,
        );
        assert.equal(
          (
            await fetch(`${base}/api/v1/admin/auth/recovery/reset`, {
              method: 'POST',
              headers,
              body: 'x'.repeat(20_000),
            })
          ).status,
          413,
        );
        await pool.query('delete from auth_throttle_buckets');
        await pool.query(
          "delete from audit_events where event_type = 'auth.recovery'",
        );
        const distributedFailures = await Promise.all(
          Array.from({ length: 6 }, (_, index) =>
            recover(
              `missing-${index}@codeddevs.test`,
              codes[0]!,
              newPassword,
              `203.0.113.${index + 1}`,
            ),
          ),
        );
        assert.ok(
          distributedFailures.every((response) => response.status === 401),
        );
        const rejectedDistributedRecoveryAudits = await pool.query<{
          count: string;
        }>(
          "select count(*) from audit_events where event_type = 'auth.recovery' and metadata->>'outcome' = 'rejected' and metadata->>'reason' = 'invalid_credentials'",
        );
        assert.equal(rejectedDistributedRecoveryAudits.rows[0]?.count, '1');
        const wrongEmail = await recover('missing@codeddevs.test', codes[0]!);
        const wrongCode = await recover(
          'admin@codeddevs.test',
          randomBytes(32).toString('base64url'),
        );
        assert.equal(wrongEmail.status, 401);
        assert.equal(wrongCode.status, 401);
        const genericFailure = await wrongCode.text();
        assert.equal(await wrongEmail.text(), genericFailure);
        await pool.query(
          `create function test_fail_recovery_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'auth.recovery' and new.metadata->>'outcome' = 'success' then raise exception 'injected failure'; end if; return new; end $$`,
        );
        await pool.query(
          'create trigger test_fail_recovery_audit before insert on audit_events for each row execute function test_fail_recovery_audit()',
        );
        try {
          const failure = await recover('admin@codeddevs.test', codes[0]!);
          assert.equal(failure.status, 503);
          assert.equal(failure.headers.get('set-cookie'), null);
          const unchanged = await pool.query<{
            password_hash: string;
            credential_version: number;
          }>(
            'select password_hash, credential_version from admin_users where id = $1',
            [adminUserId],
          );
          assert.equal(unchanged.rows[0]?.password_hash, oldHash);
          assert.equal(unchanged.rows[0]?.credential_version, 1);
          assert.equal(
            (
              await pool.query(
                'select id from sessions where admin_user_id = $1 and revoked_at is not null',
                [adminUserId],
              )
            ).rowCount,
            0,
          );
          assert.equal(
            (
              await pool.query(
                'select id from recovery_code_sets where id = $1 and consumed_at is null',
                [setId],
              )
            ).rowCount,
            1,
          );
        } finally {
          await pool.query(
            'drop trigger test_fail_recovery_audit on audit_events',
          );
          await pool.query('drop function test_fail_recovery_audit()');
        }
        const concurrent = await Promise.all([
          recover('admin@codeddevs.test', codes[0]!),
          recover('admin@codeddevs.test', codes[0]!),
        ]);
        assert.deepEqual(
          concurrent.map((response) => response.status).sort(),
          [204, 401],
        );
        assert.ok(
          concurrent.every(
            (response) => response.headers.get('set-cookie') === null,
          ),
        );
        assert.equal(
          await concurrent.find((response) => response.status === 401)!.text(),
          genericFailure,
        );
        assert.equal(
          (
            await pool.query<{ credential_version: number }>(
              'select credential_version from admin_users where id = $1',
              [adminUserId],
            )
          ).rows[0]?.credential_version,
          2,
        );
        assert.equal(
          (
            await pool.query(
              'select id from sessions where admin_user_id = $1 and revoked_at is not null',
              [adminUserId],
            )
          ).rowCount,
          2,
        );
        assert.equal(
          (
            await pool.query(
              'select id from recovery_code_sets where id = $1 and consumed_at is not null',
              [setId],
            )
          ).rowCount,
          1,
        );
        for (const token of rawSessions)
          assert.equal(
            (
              await fetch(`${base}/api/v1/admin/auth/me`, {
                headers: { Cookie: `codeddevs-admin-session=${token}` },
              })
            ).status,
            401,
          );
        const login = (password: string) =>
          fetch(`${base}/api/v1/admin/auth/login`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email: 'admin@codeddevs.test', password }),
          });
        assert.equal((await login(oldPassword)).status, 401);
        const newLogin = await login(newPassword);
        assert.equal(newLogin.status, 200);
        const newCookie = newLogin.headers.get('set-cookie');
        assert.ok(newCookie);
        const newToken = newCookie.split(';')[0]!.split('=')[1]!;
        const replay = await recover('admin@codeddevs.test', codes[0]!);
        const unused = await recover('admin@codeddevs.test', codes[1]!);
        assert.equal(replay.status, 401);
        assert.equal(unused.status, 401);
        assert.equal(await replay.text(), genericFailure);
        assert.equal(await unused.text(), genericFailure);
        const audit = await pool.query<{
          event_type: string;
          metadata: unknown;
        }>(
          "select event_type, metadata from audit_events where event_type in ('auth.recovery', 'auth.login')",
        );
        assert.ok(
          audit.rows.some(
            (row) =>
              row.event_type === 'auth.recovery' &&
              (row.metadata as { outcome?: string }).outcome === 'success',
          ),
        );
        const serialized = JSON.stringify(audit.rows) + logs.join('\n');
        for (const secret of [
          ...codes,
          ...rawSessions,
          newToken,
          oldPassword,
          newPassword,
          testThrottleSecret,
        ])
          assert.ok(!serialized.includes(secret));
        await pool.query('delete from auth_throttle_buckets');
        for (let i = 0; i < 5; i++)
          assert.equal(
            (
              await recover(
                'throttled@codeddevs.test',
                randomBytes(32).toString('base64url'),
              )
            ).status,
            401,
          );
        const blocked = await recover(
          'throttled@codeddevs.test',
          randomBytes(32).toString('base64url'),
        );
        assert.equal(blocked.status, 429);
        assert.ok(Number(blocked.headers.get('retry-after')) > 0);
      } finally {
        console.log = originalLog;
        console.error = originalError;
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        await pool.query(
          "delete from audit_events where event_type in ('auth.recovery', 'auth.login')",
        );
        await pool.query('delete from auth_throttle_buckets');
        await pool.query('delete from sessions where admin_user_id = $1', [
          adminUserId,
        ]);
        await pool.query(
          'delete from recovery_codes where set_id in (select id from recovery_code_sets where admin_user_id = $1)',
          [adminUserId],
        );
        await pool.query(
          'delete from recovery_code_sets where admin_user_id = $1',
          [adminUserId],
        );
        await pool.query(
          'update admin_users set credential_version = 1 where id = $1',
          [adminUserId],
        );
      }
    },
  );

  await context.test(
    'session guard validates all session states and protects the admin tree',
    async () => {
      const environment = {
        nodeEnvironment: 'test' as const,
        adminOrigin: 'http://localhost:3001',
        trustProxy: false as const,
        throttleHmacSecret: testThrottleSecret,
      };
      const server = createApp({
        databaseUrl: testDatabaseUrl,
        environment,
      }).listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const base = `http://127.0.0.1:${address.port}`;
      const cookieName = 'codeddevs-admin-session';
      const token = () => randomBytes(32).toString('base64url');
      const makeSession = async (
        raw: string,
        created: string,
        expires: string,
        lastUsed: string | null,
        revoked: boolean,
        version: number,
      ) =>
        pool.query(
          `insert into sessions (admin_user_id, token_hash, created_at, expires_at, last_used_at, revoked_at, credential_version)
       values ($1, $2, now() + $3::interval, now() + $4::interval, case when $5::text is null then null else now() + $5::interval end, case when $6::boolean then now() else null end, $7)`,
          [
            adminUserId,
            createHash('sha256').update(raw).digest('hex'),
            created,
            expires,
            lastUsed,
            revoked,
            version,
          ],
        );
      const me = (raw?: string) =>
        fetch(`${base}/api/v1/admin/auth/me`, {
          headers: raw ? { Cookie: `${cookieName}=${raw}` } : {},
        });
      try {
        const revoked = token();
        const expired = token();
        const idle = token();
        const mismatch = token();
        const valid = token();
        const neverUsedExpired = token();
        const neverUsedFresh = token();
        const recentlyUsed = token();
        await makeSession(revoked, '-1 hour', '1 hour', '-10 minutes', true, 1);
        await makeSession(
          expired,
          '-2 hours',
          '-1 hour',
          '-10 minutes',
          false,
          1,
        );
        await makeSession(idle, '-1 hour', '1 hour', '-31 minutes', false, 1);
        await makeSession(
          mismatch,
          '-1 hour',
          '1 hour',
          '-10 minutes',
          false,
          2,
        );
        await makeSession(valid, '-1 hour', '1 hour', '-10 minutes', false, 1);
        await makeSession(
          neverUsedExpired,
          '-31 minutes',
          '1 hour',
          null,
          false,
          1,
        );
        await makeSession(
          neverUsedFresh,
          '-10 minutes',
          '1 hour',
          null,
          false,
          1,
        );
        await makeSession(
          recentlyUsed,
          '-1 hour',
          '1 hour',
          '-4 minutes',
          false,
          1,
        );
        const responses = [
          await me(),
          await me('not-a-token'),
          await me(token()),
          await me(revoked),
          await me(expired),
          await me(idle),
          await me(mismatch),
          await me(neverUsedExpired),
        ];
        for (const response of responses) {
          assert.equal(response.status, 401);
          assert.deepEqual(await response.json(), { error: 'Unauthorized' });
          assert.match(response.headers.get('cache-control') ?? '', /no-store/);
          assert.match(
            response.headers.get('set-cookie') ?? '',
            /^codeddevs-admin-session=;/,
          );
          assert.match(response.headers.get('set-cookie') ?? '', /Expires=/i);
        }
        const bearerOnly = await fetch(`${base}/api/v1/admin/auth/me`, {
          headers: { Authorization: `Bearer ${valid}` },
        });
        assert.equal(bearerOnly.status, 401);
        const duplicate = await fetch(`${base}/api/v1/admin/auth/me`, {
          headers: {
            Cookie: `${cookieName}=${valid}; ${cookieName}=${token()}`,
          },
        });
        assert.equal(duplicate.status, 401);
        const unauthorizedDomain = await fetch(`${base}/api/v1/admin/content`);
        assert.equal(unauthorizedDomain.status, 401);
        const before = await pool.query<{
          expires_at: Date;
          last_used_at: Date | null;
        }>(
          'select expires_at, last_used_at from sessions where token_hash = $1',
          [createHash('sha256').update(valid).digest('hex')],
        );
        const authenticated = await me(valid);
        assert.equal(authenticated.status, 200);
        assert.match(
          authenticated.headers.get('cache-control') ?? '',
          /no-store/,
        );
        assert.deepEqual(await authenticated.json(), {
          admin: {
            id: adminUserId,
            email: 'admin@codeddevs.test',
            role: 'SUPER_ADMIN',
          },
          session: { expiresAt: before.rows[0]?.expires_at.toISOString() },
        });
        const afterFirstRead = await pool.query<{
          last_used_at: Date;
          expires_at: Date;
        }>(
          'select last_used_at, expires_at from sessions where token_hash = $1',
          [createHash('sha256').update(valid).digest('hex')],
        );
        assert.equal(
          afterFirstRead.rows[0]!.last_used_at.getTime() >
            before.rows[0]!.last_used_at!.getTime(),
          true,
        );
        assert.equal(
          afterFirstRead.rows[0]!.expires_at.getTime(),
          before.rows[0]!.expires_at.getTime(),
        );
        assert.equal((await me(valid)).status, 200);
        const second = await pool.query<{
          last_used_at: Date;
          expires_at: Date;
        }>(
          'select last_used_at, expires_at from sessions where token_hash = $1',
          [createHash('sha256').update(valid).digest('hex')],
        );
        assert.equal(
          second.rows[0]!.last_used_at.getTime(),
          afterFirstRead.rows[0]!.last_used_at.getTime(),
        );
        assert.equal(
          second.rows[0]!.expires_at.getTime(),
          before.rows[0]!.expires_at.getTime(),
        );
        assert.equal((await me(neverUsedFresh)).status, 200);
        const firstUse = await pool.query<{ last_used_at: Date | null }>(
          'select last_used_at from sessions where token_hash = $1',
          [createHash('sha256').update(neverUsedFresh).digest('hex')],
        );
        assert.ok(firstUse.rows[0]?.last_used_at);
        const recentBefore = await pool.query<{ last_used_at: Date }>(
          'select last_used_at from sessions where token_hash = $1',
          [createHash('sha256').update(recentlyUsed).digest('hex')],
        );
        assert.equal((await me(recentlyUsed)).status, 200);
        const recentAfter = await pool.query<{ last_used_at: Date }>(
          'select last_used_at from sessions where token_hash = $1',
          [createHash('sha256').update(recentlyUsed).digest('hex')],
        );
        assert.equal(
          recentAfter.rows[0]!.last_used_at.getTime(),
          recentBefore.rows[0]!.last_used_at.getTime(),
        );
        assert.equal(
          (
            await fetch(`${base}/api/v1/admin/content`, {
              headers: { Cookie: `${cookieName}=${valid}` },
            })
          ).status,
          404,
        );
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        await pool.query('delete from sessions where admin_user_id = $1', [
          adminUserId,
        ]);
      }
    },
  );

  await context.test(
    'logout is idempotent, atomic, CSRF-protected and audited once',
    async () => {
      const environment = {
        nodeEnvironment: 'test' as const,
        adminOrigin: 'http://localhost:3001',
        trustProxy: false as const,
        throttleHmacSecret: testThrottleSecret,
      };
      const server = createApp({
        databaseUrl: testDatabaseUrl,
        environment,
      }).listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const base = `http://127.0.0.1:${address.port}`;
      const headers = {
        Origin: 'http://localhost:3001',
        'X-CodedDevs-CSRF': '1',
      };
      const cookieName = 'codeddevs-admin-session';
      const makeSession = async (
        raw: string,
        created: string,
        expires: string,
        lastUsed: string | null,
        revoked: boolean,
        version: number,
      ) =>
        pool.query(
          `insert into sessions (admin_user_id, token_hash, created_at, expires_at, last_used_at, revoked_at, credential_version)
       values ($1, $2, now() + $3::interval, now() + $4::interval, case when $5::text is null then null else now() + $5::interval end, case when $6::boolean then now() else null end, $7)`,
          [
            adminUserId,
            createHash('sha256').update(raw).digest('hex'),
            created,
            expires,
            lastUsed,
            revoked,
            version,
          ],
        );
      const logout = (raw?: string, override = headers) =>
        fetch(`${base}/api/v1/admin/auth/logout`, {
          method: 'POST',
          headers: {
            ...override,
            ...(raw ? { Cookie: `${cookieName}=${raw}` } : {}),
          },
        });
      const raw = randomBytes(32).toString('base64url');
      const concurrent = randomBytes(32).toString('base64url');
      const expired = randomBytes(32).toString('base64url');
      const revoked = randomBytes(32).toString('base64url');
      const idle = randomBytes(32).toString('base64url');
      const mismatch = randomBytes(32).toString('base64url');
      const tokenHash = (value: string) =>
        createHash('sha256').update(value).digest('hex');
      try {
        await makeSession(raw, '-10 minutes', '1 hour', '-1 minute', false, 1);
        await makeSession(
          concurrent,
          '-10 minutes',
          '1 hour',
          '-1 minute',
          false,
          1,
        );
        await makeSession(
          expired,
          '-2 hours',
          '-1 hour',
          '-10 minutes',
          false,
          1,
        );
        await makeSession(
          revoked,
          '-10 minutes',
          '1 hour',
          '-1 minute',
          true,
          1,
        );
        await makeSession(idle, '-1 hour', '1 hour', '-31 minutes', false, 1);
        await makeSession(
          mismatch,
          '-10 minutes',
          '1 hour',
          '-1 minute',
          false,
          2,
        );
        for (const override of [
          { Origin: 'http://attacker.test', 'X-CodedDevs-CSRF': '1' },
          { Origin: 'http://localhost:3001', 'X-CodedDevs-CSRF': '' },
          { Origin: '', 'X-CodedDevs-CSRF': '1' },
        ]) {
          const rejected = await logout(raw, override);
          assert.equal(rejected.status, 403);
          assert.equal(rejected.headers.get('set-cookie'), null);
        }
        assert.equal(
          (
            await pool.query<{ revoked_at: Date | null }>(
              'select revoked_at from sessions where token_hash = $1',
              [tokenHash(raw)],
            )
          ).rows[0]?.revoked_at,
          null,
        );
        for (const invalid of [
          undefined,
          'invalid',
          randomBytes(32).toString('base64url'),
          expired,
          revoked,
          idle,
          mismatch,
        ]) {
          const result = await logout(invalid);
          assert.equal(result.status, 204);
          assert.equal(await result.text(), '');
          const cleared = result.headers.get('set-cookie') ?? '';
          assert.match(cleared, /^codeddevs-admin-session=;/);
          assert.match(cleared, /; Path=\//i);
          assert.match(cleared, /; HttpOnly/i);
          assert.match(cleared, /; SameSite=Strict/i);
          assert.match(cleared, /Expires=/i);
          assert.doesNotMatch(cleared, /; Secure/i);
        }
        const alternateCredential = await fetch(
          `${base}/api/v1/admin/auth/logout`,
          {
            method: 'POST',
            headers: {
              ...headers,
              Authorization: `Bearer ${raw}`,
              Cookie: `unrelated=${raw}`,
            },
          },
        );
        assert.equal(alternateCredential.status, 204);
        const duplicateCookies = await fetch(
          `${base}/api/v1/admin/auth/logout`,
          {
            method: 'POST',
            headers: {
              ...headers,
              Cookie: `${cookieName}=${raw}; ${cookieName}=${raw}`,
            },
          },
        );
        assert.equal(duplicateCookies.status, 204);
        assert.equal(
          (
            await pool.query<{ revoked_at: Date | null }>(
              'select revoked_at from sessions where token_hash = $1',
              [tokenHash(raw)],
            )
          ).rows[0]?.revoked_at,
          null,
        );
        assert.equal(
          (
            await pool.query(
              "select id from audit_events where event_type = 'auth.logout'",
            )
          ).rowCount,
          0,
        );
        await pool.query(
          `create function test_fail_logout_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'auth.logout' then raise exception 'injected failure'; end if; return new; end $$`,
        );
        await pool.query(
          'create trigger test_fail_logout_audit before insert on audit_events for each row execute function test_fail_logout_audit()',
        );
        try {
          const failed = await logout(raw);
          assert.equal(failed.status, 503);
          assert.equal(failed.headers.get('set-cookie'), null);
          assert.equal(
            (
              await pool.query<{ revoked_at: Date | null }>(
                'select revoked_at from sessions where token_hash = $1',
                [tokenHash(raw)],
              )
            ).rows[0]?.revoked_at,
            null,
          );
        } finally {
          await pool.query(
            'drop trigger test_fail_logout_audit on audit_events',
          );
          await pool.query('drop function test_fail_logout_audit()');
        }
        const success = await logout(raw);
        assert.equal(success.status, 204);
        assert.match(
          success.headers.get('set-cookie') ?? '',
          /^codeddevs-admin-session=;/,
        );
        assert.ok(!(success.headers.get('set-cookie') ?? '').includes(raw));
        assert.ok(
          (
            await pool.query<{ revoked_at: Date | null }>(
              'select revoked_at from sessions where token_hash = $1',
              [tokenHash(raw)],
            )
          ).rows[0]?.revoked_at,
        );
        assert.equal(
          (
            await fetch(`${base}/api/v1/admin/auth/me`, {
              headers: { Cookie: `${cookieName}=${raw}` },
            })
          ).status,
          401,
        );
        assert.equal((await logout(raw)).status, 204);
        const simultaneous = await Promise.all(
          Array.from({ length: 6 }, () => logout(concurrent)),
        );
        assert.ok(simultaneous.every((response) => response.status === 204));
        const audit = await pool.query<{
          actor_admin_user_id: string;
          metadata: unknown;
        }>(
          "select actor_admin_user_id, metadata from audit_events where event_type = 'auth.logout'",
        );
        assert.equal(audit.rowCount, 2);
        assert.ok(
          audit.rows.every(
            (event) => event.actor_admin_user_id === adminUserId,
          ),
        );
        for (const secret of [
          raw,
          concurrent,
          tokenHash(raw),
          tokenHash(concurrent),
          testThrottleSecret,
        ])
          assert.ok(!JSON.stringify(audit.rows).includes(secret));
        const unavailable = createApp({
          databaseUrl: 'postgresql://test:test@127.0.0.1:1/codeddevs_test',
          environment,
        }).listen(0, '127.0.0.1');
        await once(unavailable, 'listening');
        try {
          const unavailableAddress = unavailable.address();
          assert.ok(
            unavailableAddress && typeof unavailableAddress !== 'string',
          );
          const failure = await fetch(
            `http://127.0.0.1:${unavailableAddress.port}/api/v1/admin/auth/logout`,
            {
              method: 'POST',
              headers: { ...headers, Cookie: `${cookieName}=${raw}` },
            },
          );
          assert.equal(failure.status, 503);
          assert.equal(failure.headers.get('set-cookie'), null);
        } finally {
          await new Promise<void>((resolve, reject) =>
            unavailable.close((error) => (error ? reject(error) : resolve())),
          );
        }
        const production = createApp({
          databaseUrl: testDatabaseUrl,
          environment: {
            ...environment,
            nodeEnvironment: 'production',
            adminOrigin: 'https://admin.example.test',
          },
        }).listen(0, '127.0.0.1');
        await once(production, 'listening');
        try {
          const productionAddress = production.address();
          assert.ok(productionAddress && typeof productionAddress !== 'string');
          const response = await fetch(
            `http://127.0.0.1:${productionAddress.port}/api/v1/admin/auth/logout`,
            {
              method: 'POST',
              headers: {
                Origin: 'https://admin.example.test',
                'X-CodedDevs-CSRF': '1',
              },
            },
          );
          assert.equal(response.status, 204);
          const cleared = response.headers.get('set-cookie') ?? '';
          assert.match(cleared, /^__Host-codeddevs-admin-session=;/);
          assert.match(cleared, /; Secure/i);
          assert.match(cleared, /; HttpOnly/i);
          assert.match(cleared, /; SameSite=Strict/i);
          assert.match(cleared, /; Path=\//i);
          assert.doesNotMatch(cleared, /; Domain=/i);
        } finally {
          await new Promise<void>((resolve, reject) =>
            production.close((error) => (error ? reject(error) : resolve())),
          );
        }
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        await pool.query(
          "delete from audit_events where event_type = 'auth.logout'",
        );
        await pool.query('delete from sessions where admin_user_id = $1', [
          adminUserId,
        ]);
      }
    },
  );

  await context.test(
    'policy rejection audit is bounded by a durable keyed IP bucket',
    async () => {
      const environment = {
        nodeEnvironment: 'test' as const,
        adminOrigin: 'http://localhost:3001',
        trustProxy: false as const,
        throttleHmacSecret: testThrottleSecret,
      };
      const server = createApp({
        databaseUrl: testDatabaseUrl,
        environment,
      }).listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const endpoint = `http://127.0.0.1:${address.port}/api/v1/admin/auth/login`;
      try {
        const expected = createHmac(
          'sha256',
          Buffer.from(testThrottleSecret, 'hex'),
        )
          .update('ip\0' + '127.0.0.1')
          .digest('hex');
        await pool.query(
          "insert into auth_throttle_buckets (bucket_type, key_hash, failure_count, window_started_at) values ('ip', $1, 3, now())",
          [expected],
        );
        for (let i = 0; i < 30; i++) {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Origin: 'http://attacker.test',
              'Content-Type': 'text/plain',
            },
            body: 'invalid',
          });
          assert.ok(response.status === 403 || response.status === 429);
        }
        const auditBefore = await pool.query<{ count: string }>(
          "select count(*) from audit_events where event_type = 'auth.login'",
        );
        const count = Number(auditBefore.rows[0]?.count);
        assert.ok(count >= 1 && count <= 2);
        const securityAudits = await pool.query<{ count: string }>(
          "select count(*) from audit_events where event_type = 'auth.login' and metadata->>'reason' = 'request_security'",
        );
        assert.equal(securityAudits.rows[0]?.count, '1');
        const blocked = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Origin: 'http://localhost:3001',
            'Content-Type': 'application/json',
            'X-CodedDevs-CSRF': '1',
          },
          body: JSON.stringify({
            email: 'another@example.test',
            password: 'invalid',
          }),
        });
        assert.equal(blocked.status, 429);
        assert.ok(Number(blocked.headers.get('retry-after')) > 0);
        const auditAfter = await pool.query<{ count: string }>(
          "select count(*) from audit_events where event_type = 'auth.login'",
        );
        assert.equal(auditAfter.rows[0]?.count, auditBefore.rows[0]?.count);
        const buckets = await pool.query<{
          bucket_type: string;
          key_hash: string;
        }>('select bucket_type, key_hash from auth_throttle_buckets');
        const requestSecurityMarker = createHmac(
          'sha256',
          Buffer.from(testThrottleSecret, 'hex'),
        )
          .update('policy\0' + 'auth.login\0request_security\0')
          .digest('hex');
        const ipThrottledMarker = createHmac(
          'sha256',
          Buffer.from(testThrottleSecret, 'hex'),
        )
          .update('policy\0' + 'auth.login\0ip_throttled\0')
          .digest('hex');
        assert.deepEqual(
          buckets.rows
            .map((bucket) => `${bucket.bucket_type}:${bucket.key_hash}`)
            .sort(),
          [
            `ip:${expected}`,
            `ip:${requestSecurityMarker}`,
            `ip:${ipThrottledMarker}`,
          ].sort(),
        );
        assert.notEqual(
          expected,
          createHash('sha256').update('127.0.0.1').digest('hex'),
        );
        assert.ok(
          !JSON.stringify(auditAfter.rows).includes(testThrottleSecret),
        );
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        await pool.query(
          "delete from audit_events where event_type = 'auth.login'",
        );
        await pool.query('delete from auth_throttle_buckets');
      }
    },
  );

  await context.test(
    'login enforces origin, CSRF, sessions, auditing and durable throttling',
    async () => {
      const password = 'a valid test passphrase for login';
      await pool.query(
        'update admin_users set password_hash = $1, credential_version = 7 where id = $2',
        [await hashPassword(password), adminUserId],
      );
      const server = createApp({
        databaseUrl: testDatabaseUrl,
        environment: {
          nodeEnvironment: 'test',
          adminOrigin: 'http://localhost:3001',
          trustProxy: false,
          throttleHmacSecret: testThrottleSecret,
        },
      }).listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const endpoint = `http://127.0.0.1:${address.port}/api/v1/admin/auth/login`;
      const headers = {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:3001',
        'X-CodedDevs-CSRF': '1',
      };
      const login = (email: string, supplied: string) =>
        fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email, password: supplied }),
        });
      try {
        const noOrigin = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CodedDevs-CSRF': '1',
          },
          body: '{}',
        });
        assert.equal(noOrigin.status, 403);
        const badOrigin = await fetch(endpoint, {
          method: 'POST',
          headers: { ...headers, Origin: 'http://attacker.test' },
          body: '{}',
        });
        assert.equal(badOrigin.status, 403);
        const noCsrf = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: headers.Origin,
          },
          body: '{}',
        });
        assert.equal(noCsrf.status, 403);
        const nonJson = await fetch(endpoint, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'text/plain' },
          body: '{}',
        });
        assert.equal(nonJson.status, 415);
        const oversized = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: 'x'.repeat(20_000),
        });
        assert.equal(oversized.status, 413);
        await pool.query('delete from auth_throttle_buckets');
        const invalid = await login('missing@codeddevs.test', 'wrong password');
        const wrong = await login('admin@codeddevs.test', 'wrong password');
        assert.equal(invalid.status, 401);
        assert.equal(wrong.status, 401);
        assert.deepEqual(await invalid.json(), await wrong.json());
        const accountKey = createHmac(
          'sha256',
          Buffer.from(testThrottleSecret, 'hex'),
        )
          .update('account\0admin@codeddevs.test')
          .digest('hex');
        const storedAccount = await pool.query<{ key_hash: string }>(
          "select key_hash from auth_throttle_buckets where bucket_type = 'account' and key_hash = $1",
          [accountKey],
        );
        assert.equal(storedAccount.rowCount, 1);
        assert.notEqual(
          accountKey,
          createHash('sha256').update('admin@codeddevs.test').digest('hex'),
        );

        const success = await login(' ADMIN@CODEDDEVS.TEST ', password);
        assert.equal(success.status, 200);
        const body = await success.text();
        const cookie = success.headers.get('set-cookie');
        assert.ok(cookie);
        assert.match(cookie, /^codeddevs-admin-session=/);
        assert.match(cookie, /HttpOnly/i);
        const raw = decodeURIComponent(cookie.split(';')[0]!.split('=')[1]!);
        assert.match(raw, /^[A-Za-z0-9_-]{43}$/);
        assert.ok(!body.includes(raw));
        const session = await pool.query<{
          token_hash: string;
          credential_version: number;
        }>(
          'select token_hash, credential_version from sessions where admin_user_id = $1',
          [adminUserId],
        );
        assert.equal(session.rowCount, 1);
        assert.equal(
          session.rows[0]?.token_hash,
          createHash('sha256').update(raw).digest('hex'),
        );
        assert.equal(session.rows[0]?.credential_version, 7);
        const audits = await pool.query<{ metadata: unknown }>(
          "select metadata from audit_events where event_type = 'auth.login'",
        );
        assert.ok(audits.rowCount && audits.rowCount >= 3);
        assert.ok(!JSON.stringify(audits.rows).includes(raw));
        assert.ok(!JSON.stringify(audits.rows).includes(password));
        assert.ok(
          !(
            await pool.query('select 1 from sessions where token_hash = $1', [
              raw,
            ])
          ).rowCount,
        );

        await pool.query(
          `create function test_fail_login_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'auth.login' and new.metadata->>'outcome' = 'success' then raise exception 'injected failure'; end if; return new; end $$`,
        );
        await pool.query(
          'create trigger test_fail_login_audit before insert on audit_events for each row execute function test_fail_login_audit()',
        );
        try {
          const failedAudit = await fetch(endpoint, {
            method: 'POST',
            headers: { ...headers, Cookie: cookie.split(';')[0]! },
            body: JSON.stringify({ email: 'admin@codeddevs.test', password }),
          });
          assert.equal(failedAudit.status, 503);
          assert.equal(failedAudit.headers.get('set-cookie'), null);
          assert.equal(
            (
              await pool.query(
                'select id from sessions where admin_user_id = $1',
                [adminUserId],
              )
            ).rowCount,
            1,
          );
          const unchanged = await pool.query<{ revoked_at: Date | null }>(
            'select revoked_at from sessions where token_hash = $1',
            [createHash('sha256').update(raw).digest('hex')],
          );
          assert.equal(unchanged.rows[0]?.revoked_at, null);
        } finally {
          await pool.query(
            'drop trigger test_fail_login_audit on audit_events',
          );
          await pool.query('drop function test_fail_login_audit()');
        }

        const rotated = await fetch(endpoint, {
          method: 'POST',
          headers: { ...headers, Cookie: cookie.split(';')[0]! },
          body: JSON.stringify({ email: 'admin@codeddevs.test', password }),
        });
        assert.equal(rotated.status, 200);
        const replacement = rotated.headers.get('set-cookie');
        assert.ok(replacement);
        assert.notEqual(replacement.split(';')[0]!.split('=')[1], raw);
        const prior = await pool.query<{ revoked_at: Date | null }>(
          'select revoked_at from sessions where token_hash = $1',
          [createHash('sha256').update(raw).digest('hex')],
        );
        assert.ok(prior.rows[0]?.revoked_at);

        const productionServer = createApp({
          databaseUrl: testDatabaseUrl,
          environment: {
            nodeEnvironment: 'production',
            adminOrigin: 'https://admin.example.test',
            trustProxy: false,
            throttleHmacSecret: testThrottleSecret,
          },
        }).listen(0, '127.0.0.1');
        await once(productionServer, 'listening');
        try {
          const productionAddress = productionServer.address();
          assert.ok(productionAddress && typeof productionAddress !== 'string');
          const production = await fetch(
            `http://127.0.0.1:${productionAddress.port}/api/v1/admin/auth/login`,
            {
              method: 'POST',
              headers: { ...headers, Origin: 'https://admin.example.test' },
              body: JSON.stringify({ email: 'admin@codeddevs.test', password }),
            },
          );
          assert.equal(production.status, 200);
          const productionCookie = production.headers.get('set-cookie');
          assert.ok(productionCookie);
          assert.match(productionCookie, /^__Host-codeddevs-admin-session=/);
          assert.match(productionCookie, /; Secure/i);
          assert.match(productionCookie, /; HttpOnly/i);
          assert.match(productionCookie, /; SameSite=Strict/i);
          assert.match(productionCookie, /; Path=\//i);
          assert.doesNotMatch(productionCookie, /; Domain=/i);
          assert.notEqual(productionCookie.split(';')[0]!.split('=')[1], raw);
          const productionMeUrl = `http://127.0.0.1:${productionAddress.port}/api/v1/admin/auth/me`;
          const productionMe = await fetch(productionMeUrl, {
            headers: { Cookie: productionCookie.split(';')[0]! },
          });
          assert.equal(productionMe.status, 200);
          const stale = await fetch(productionMeUrl, {
            headers: { Cookie: '__Host-codeddevs-admin-session=invalid' },
          });
          assert.equal(stale.status, 401);
          const cleared = stale.headers.get('set-cookie');
          assert.ok(cleared);
          assert.match(cleared, /^__Host-codeddevs-admin-session=;/);
          assert.match(cleared, /; Secure/i);
          assert.match(cleared, /; HttpOnly/i);
          assert.match(cleared, /; SameSite=Strict/i);
          assert.doesNotMatch(cleared, /; Domain=/i);
        } finally {
          await new Promise<void>((resolve, reject) =>
            productionServer.close((error) =>
              error ? reject(error) : resolve(),
            ),
          );
        }

        for (let i = 0; i < 5; i++)
          assert.equal(
            (await login('throttle@codeddevs.test', 'wrong password')).status,
            401,
          );
        const blocked = await login(
          'throttle@codeddevs.test',
          'wrong password',
        );
        assert.equal(blocked.status, 429);
        assert.ok(Number(blocked.headers.get('retry-after')) > 0);
        for (let i = 0; i < 13; i++)
          assert.equal(
            (await login(`ip-${i}@codeddevs.test`, 'wrong password')).status,
            401,
          );
        const ipBlocked = await login(
          'another@codeddevs.test',
          'wrong password',
        );
        assert.equal(ipBlocked.status, 429);
        assert.ok(Number(ipBlocked.headers.get('retry-after')) > 0);
        await pool.query('delete from auth_throttle_buckets');
        const secondServer = createApp({
          databaseUrl: testDatabaseUrl,
          environment: {
            nodeEnvironment: 'test',
            adminOrigin: 'http://localhost:3001',
            trustProxy: false,
            throttleHmacSecret: testThrottleSecret,
          },
        }).listen(0, '127.0.0.1');
        await once(secondServer, 'listening');
        try {
          const secondAddress = secondServer.address();
          assert.ok(secondAddress && typeof secondAddress !== 'string');
          const secondEndpoint = `http://127.0.0.1:${secondAddress.port}/api/v1/admin/auth/login`;
          const simultaneous = await Promise.all(
            Array.from({ length: 6 }, (_, index) =>
              fetch(index % 2 ? secondEndpoint : endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  email: 'concurrent@codeddevs.test',
                  password: 'wrong password',
                }),
              }),
            ),
          );
          assert.equal(
            simultaneous.filter((response) => response.status === 401).length,
            5,
          );
          assert.equal(
            simultaneous.filter((response) => response.status === 429).length,
            1,
          );
        } finally {
          await new Promise<void>((resolve, reject) =>
            secondServer.close((error) => (error ? reject(error) : resolve())),
          );
        }
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        await pool.query('delete from sessions where admin_user_id = $1', [
          adminUserId,
        ]);
        await pool.query(
          "delete from audit_events where event_type = 'auth.login'",
        );
        await pool.query('delete from auth_throttle_buckets');
        await pool.query(
          'update admin_users set credential_version = 1 where id = $1',
          [adminUserId],
        );
      }
    },
  );

  await context.test(
    'distributed invalid logins coalesce audit records across identities and sources',
    async () => {
      const password = 'distributed audit test passphrase';
      await pool.query(
        'update admin_users set password_hash = $1 where id = $2',
        [await hashPassword(password), adminUserId],
      );
      await pool.query(
        "delete from audit_events where event_type = 'auth.login'",
      );
      await pool.query('delete from auth_throttle_buckets');
      const server = createApp({
        databaseUrl: testDatabaseUrl,
        environment: {
          nodeEnvironment: 'test',
          adminOrigin: 'http://localhost:3001',
          trustProxy: 1,
          throttleHmacSecret: testThrottleSecret,
        },
      }).listen(0, '127.0.0.1');
      await once(server, 'listening');
      const address = server.address();
      assert.ok(address && typeof address !== 'string');
      const endpoint = `http://127.0.0.1:${address.port}/api/v1/admin/auth/login`;
      try {
        const responses = await Promise.all(
          Array.from({ length: 6 }, (_, index) =>
            fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Origin: 'http://localhost:3001',
                'X-CodedDevs-CSRF': '1',
                'X-Forwarded-For': `198.51.100.${index + 1}`,
              },
              body: JSON.stringify({
                email: `distributed-${index}@codeddevs.test`,
                password: 'wrong password',
              }),
            }),
          ),
        );
        assert.ok(responses.every((response) => response.status === 401));
        const rejected = await pool.query<{ count: string }>(
          "select count(*) from audit_events where event_type = 'auth.login' and metadata->>'outcome' = 'rejected' and metadata->>'reason' = 'invalid_credentials'",
        );
        assert.equal(rejected.rows[0]?.count, '1');
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
        await pool.query(
          "delete from audit_events where event_type = 'auth.login'",
        );
        await pool.query('delete from auth_throttle_buckets');
      }
    },
  );

  await context.test(
    'credential versions default to one and must be positive',
    async () => {
      const admin = await pool.query<{ credential_version: number }>(
        'select credential_version from admin_users where id = $1',
        [adminUserId],
      );
      assert.equal(admin.rows[0]?.credential_version, 1);

      await expectDatabaseError(
        pool.query(
          'update admin_users set credential_version = 0 where id = $1',
          [adminUserId],
        ),
        '23514',
        'admin_users_credential_version_positive',
      );

      const session = await pool.query<{ credential_version: number }>(
        `insert into sessions (admin_user_id, token_hash, expires_at)
       values ($1, 'test-session-hash', now() + interval '1 hour')
       returning credential_version`,
        [adminUserId],
      );
      assert.equal(session.rows[0]?.credential_version, 1);
      await expectDatabaseError(
        pool.query(
          `insert into sessions (admin_user_id, token_hash, expires_at, credential_version)
         values ($1, 'invalid-session-hash', now() + interval '1 hour', -1)`,
          [adminUserId],
        ),
        '23514',
        'sessions_credential_version_positive',
      );
    },
  );

  await context.test(
    'recovery sets enforce one active set under concurrent inserts',
    async () => {
      const attempts = await Promise.allSettled([
        pool.query(
          'insert into recovery_code_sets (admin_user_id) values ($1) returning id',
          [adminUserId],
        ),
        pool.query(
          'insert into recovery_code_sets (admin_user_id) values ($1) returning id',
          [adminUserId],
        ),
      ]);
      assert.equal(
        attempts.filter((result) => result.status === 'fulfilled').length,
        1,
      );
      const rejected = attempts.find((result) => result.status === 'rejected');
      assert.ok(rejected && rejected.status === 'rejected');
      assert.equal(rejected.reason.code, '23505');
      assert.equal(
        rejected.reason.constraint,
        'recovery_code_sets_one_active_per_admin',
      );
      const active = await pool.query<{ id: string }>(
        'select id from recovery_code_sets where admin_user_id = $1 and consumed_at is null',
        [adminUserId],
      );
      assert.equal(active.rowCount, 1);
      const setId = active.rows[0]?.id;
      assert.ok(setId);

      const codeHash = 'a'.repeat(64);
      await pool.query(
        'insert into recovery_codes (set_id, position, code_hash) values ($1, 0, $2)',
        [setId, codeHash],
      );
      await expectDatabaseError(
        pool.query(
          'insert into recovery_codes (set_id, position, code_hash) values ($1, 1, $2)',
          [setId, codeHash],
        ),
        '23505',
        'recovery_codes_code_hash_unique',
      );
      await expectDatabaseError(
        pool.query(
          'insert into recovery_codes (set_id, position, code_hash) values ($1, 0, $2)',
          [setId, 'b'.repeat(64)],
        ),
        '23505',
        'recovery_codes_set_position_unique',
      );
      await expectDatabaseError(
        pool.query(
          'insert into recovery_codes (set_id, position, code_hash) values ($1, 8, $2)',
          [setId, 'c'.repeat(64)],
        ),
        '23514',
        'recovery_codes_position_valid',
      );
      await expectDatabaseError(
        pool.query(
          'insert into recovery_codes (set_id, position, code_hash) values ($1, 1, $2)',
          [setId, 'plaintext'],
        ),
        '23514',
        'recovery_codes_hash_format',
      );
      await expectDatabaseError(
        pool.query(
          'insert into recovery_codes (set_id, position, code_hash) values ($1, 1, $2)',
          ['00000000-0000-0000-0000-000000000000', 'd'.repeat(64)],
        ),
        '23503',
        'recovery_codes_set_id_recovery_code_sets_id_fk',
      );
      await pool.query(
        'update recovery_code_sets set consumed_at = now() where id = $1',
        [setId],
      );
      await pool.query(
        'insert into recovery_code_sets (admin_user_id) values ($1)',
        [adminUserId],
      );
    },
  );

  await context.test(
    'authentication throttle buckets enforce valid durable keys and counts',
    async () => {
      const key = 'e'.repeat(64);
      await pool.query(
        `insert into auth_throttle_buckets (bucket_type, key_hash, failure_count, window_started_at)
      values ('account', $1, 1, now())`,
        [key],
      );
      await Promise.all(
        Array.from({ length: 5 }, () =>
          pool.query(
            `update auth_throttle_buckets set failure_count = failure_count + 1 where bucket_type = 'account' and key_hash = $1`,
            [key],
          ),
        ),
      );
      const bucket = await pool.query<{ failure_count: number }>(
        `select failure_count from auth_throttle_buckets where bucket_type = 'account' and key_hash = $1`,
        [key],
      );
      assert.equal(bucket.rows[0]?.failure_count, 6);
      await expectDatabaseError(
        pool.query(
          `insert into auth_throttle_buckets (bucket_type, key_hash, failure_count, window_started_at) values ('account', $1, 2, now())`,
          [key],
        ),
        '23505',
        'auth_throttle_buckets_type_key_unique',
      );
      await expectDatabaseError(
        pool.query(
          `insert into auth_throttle_buckets (bucket_type, key_hash, failure_count, window_started_at) values ('invalid', $1, 0, now())`,
          [key],
        ),
        '23514',
        'auth_throttle_buckets_type_valid',
      );
      await expectDatabaseError(
        pool.query(
          `insert into auth_throttle_buckets (bucket_type, key_hash, failure_count, window_started_at) values ('ip', $1, -1, now())`,
          [key],
        ),
        '23514',
        'auth_throttle_buckets_failure_count_nonnegative',
      );
      await expectDatabaseError(
        pool.query(
          `insert into auth_throttle_buckets (bucket_type, key_hash, failure_count, window_started_at) values ('ip', 'not-a-hash', 0, now())`,
        ),
        '23514',
        'auth_throttle_buckets_key_hash_format',
      );
    },
  );

  await context.test('the database enforces one Super Admin', async () => {
    await expectDatabaseError(
      pool.query(
        `insert into admin_users (email, password_hash)
         values ('second-admin@codeddevs.test', 'test-password-hash')`,
      ),
      '23505',
      'admin_users_one_super_admin_unique',
    );

    await expectDatabaseError(
      pool.query(
        `insert into admin_users (email, password_hash, is_super_admin)
         values ('not-super-admin@codeddevs.test', 'test-password-hash', false)`,
      ),
      '23514',
      'admin_users_only_super_admin',
    );
  });

  await context.test('article slugs are globally reserved', async () => {
    await pool.query(
      `insert into articles (
         draft_slug,
         published_slug,
         draft_payload,
         published_payload,
         published_at
       ) values ($1, $2, $3::jsonb, $4::jsonb, now())`,
      ['first-draft', 'shared-published-slug', '{}', '{"title":"First"}'],
    );

    await expectDatabaseError(
      pool.query(
        `insert into articles (
           draft_slug,
           published_slug,
           draft_payload,
           published_payload,
           published_at
         ) values ($1, $2, $3::jsonb, $4::jsonb, now())`,
        ['second-draft', 'shared-published-slug', '{}', '{"title":"Second"}'],
      ),
      '23505',
      'articles_published_slug_unique',
    );

    await pool.query(
      `insert into articles (draft_slug, draft_payload)
       values ('shared-draft-slug', '{}'::jsonb)`,
    );

    await expectDatabaseError(
      pool.query(
        `insert into articles (draft_slug, draft_payload)
         values ('shared-draft-slug', '{}'::jsonb)`,
      ),
      '23505',
      'articles_draft_slug_unique',
    );

    await expectDatabaseError(
      pool.query(
        `insert into articles (draft_slug, draft_payload)
         values ('shared-published-slug', '{}'::jsonb)`,
      ),
      '23505',
      'articles_slug_global_unique',
    );

    await expectDatabaseError(
      pool.query(
        `insert into articles (
           draft_slug,
           published_slug,
           draft_payload,
           published_payload,
           published_at
         ) values ($1, $2, '{}'::jsonb, '{}'::jsonb, now())`,
        ['unique-draft-slug', 'shared-draft-slug'],
      ),
      '23505',
      'articles_slug_global_unique',
    );
  });

  await context.test(
    'invalid publication-state combinations fail',
    async () => {
      await expectDatabaseError(
        pool.query(
          `insert into articles (draft_slug, draft_payload, published_payload)
         values ('invalid-article', '{}'::jsonb, '{}'::jsonb)`,
        ),
        '23514',
        'articles_publication_state_consistent',
      );

      await expectDatabaseError(
        pool.query(
          `insert into content_sections (
           section_key,
           position,
           draft_payload,
           published_visible
         ) values ('hero', 0, '{}'::jsonb, true)`,
        ),
        '23514',
        'content_sections_publication_state_consistent',
      );

      await expectDatabaseError(
        pool.query(
          `insert into services (position, draft_payload, published_payload)
         values (0, '{}'::jsonb, '{}'::jsonb)`,
        ),
        '23514',
        'services_publication_state_consistent',
      );

      await expectDatabaseError(
        pool.query(
          `insert into site_settings (published_at)
         values (now())`,
        ),
        '23514',
        'site_settings_publication_state_consistent',
      );
    },
  );

  await context.test(
    'unknown homepage section keys fail at the database boundary',
    async () => {
      await expectDatabaseError(
        pool.query(
          `insert into content_sections (section_key, position, draft_payload)
         values ('testimonials', 0, '{}'::jsonb)`,
        ),
        '23514',
        'content_sections_known_section_key',
      );
    },
  );

  await context.test(
    'draft and published media references prevent asset deletion',
    async () => {
      const serviceResult = await pool.query<{ id: string }>(
        `insert into services (
           position,
           draft_payload,
           published_payload,
           published_at
         ) values (0, '{}'::jsonb, '{}'::jsonb, now())
         returning id`,
      );
      const serviceId = serviceResult.rows[0]?.id;
      assert.ok(serviceId);

      for (const snapshot of ['draft', 'published'] as const) {
        const assetResult = await pool.query<{ id: string }>(
          `insert into media_assets (
             object_key,
             mime_type,
             byte_size,
             created_by_admin_user_id
           ) values ($1, 'image/png', 128, $2)
           returning id`,
          [`test/${snapshot}.png`, adminUserId],
        );
        const assetId = assetResult.rows[0]?.id;
        assert.ok(assetId);

        await pool.query(
          `insert into media_asset_references (
             media_asset_id,
             snapshot,
             field_key,
             service_id
           ) values ($1, $2, 'cover', $3)`,
          [assetId, snapshot, serviceId],
        );

        await expectDatabaseError(
          pool.query('delete from media_assets where id = $1', [assetId]),
          '23503',
          'media_asset_references_media_asset_id_media_assets_id_fk',
        );
      }
    },
  );

  await context.test(
    'database triggers advance updated_at for direct SQL writes',
    async () => {
      const triggerResult = await pool.query<{ trigger_name: string }>(
        `select trigger.tgname as trigger_name
         from pg_trigger as trigger
         join pg_class as table_class on table_class.oid = trigger.tgrelid
         join pg_namespace as table_schema on table_schema.oid = table_class.relnamespace
         where table_schema.nspname = 'public'
           and trigger.tgisinternal = false
           and trigger.tgname like '%_set_updated_at'
         order by trigger.tgname`,
      );

      assert.deepEqual(
        triggerResult.rows.map((row) => row.trigger_name),
        [
          'admin_users_set_updated_at',
          'articles_set_updated_at',
          'content_sections_set_updated_at',
          'inquiries_set_updated_at',
          'media_assets_set_updated_at',
          'products_set_updated_at',
          'projects_set_updated_at',
          'revalidation_jobs_set_updated_at',
          'services_set_updated_at',
          'site_settings_set_updated_at',
          'team_members_set_updated_at',
        ],
      );

      const inserted = await pool.query<{ id: string; updated_at: Date }>(
        `insert into inquiries (name, email, message)
         values ($1, $2, $3)
         returning id, updated_at`,
        [
          'Database Test',
          'database-test@codeddevs.test',
          'Testing updated_at behavior.',
        ],
      );
      const inquiry = inserted.rows[0];
      assert.ok(inquiry);

      await delay(20);

      const updated = await pool.query<{ updated_at: Date }>(
        `update inquiries
         set status = 'resolved',
             updated_at = '2000-01-01T00:00:00.000Z'
         where id = $1
         returning updated_at`,
        [inquiry.id],
      );

      assert.ok(updated.rows[0]?.updated_at);
      assert.ok(updated.rows[0].updated_at > inquiry.updated_at);
      assert.ok(
        updated.rows[0].updated_at > new Date('2000-01-01T00:00:00.000Z'),
      );
    },
  );
});
