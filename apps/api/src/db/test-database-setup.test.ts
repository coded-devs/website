import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

test('test database setup refuses a non-disposable PostgreSQL target', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/create-test-databases.mjs'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        TEST_DATABASE_URL:
          'postgresql://test-user:test-password@database.example.test/production',
      },
      encoding: 'utf8',
      timeout: 10_000,
    },
  );
  assert.notEqual(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Refusing non-disposable test database/,
  );
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /test-password/);
});

test('schema suite refuses a remote test-named database before connecting', () => {
  const childEnvironment = { ...process.env };
  delete childEnvironment.NODE_TEST_CONTEXT;
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--test', 'src/db/schema.test.ts'],
    {
      cwd: process.cwd(),
      env: {
        ...childEnvironment,
        TEST_DATABASE_URL:
          'postgresql://schema-user:schema-password@database.example.test/staging_test',
      },
      encoding: 'utf8',
      timeout: 10_000,
    },
  );
  const output = `${result.stdout}\n${result.stderr}`;
  assert.notEqual(result.status, 0, output);
  assert.match(output, /Refusing non-disposable test database/);
  assert.doesNotMatch(output, /schema-password/);
  assert.doesNotMatch(output, /ECONNREFUSED|ENOTFOUND|timeout/i);
});
