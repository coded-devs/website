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
  assert.notEqual(result.status, 0);
  assert.match(
    `${result.stdout}\n${result.stderr}`,
    /Refusing non-disposable test database/,
  );
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /test-password/);
});
