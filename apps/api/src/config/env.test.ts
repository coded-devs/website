import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseApiEnvironment } from './env.js';

test('production requires a valid HMAC secret without revealing invalid input', () => {
  const base = {
    NODE_ENV: 'production',
    ADMIN_ORIGIN: 'https://admin.example.test',
    API_TRUST_PROXY_HOPS: '1',
  };
  assert.throws(() => parseApiEnvironment(base));
  const invalid = 'invalid-test-value';
  assert.throws(
    () => parseApiEnvironment({ ...base, AUTH_THROTTLE_HMAC_SECRET: invalid }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.ok(!error.message.includes(invalid));
      return true;
    },
  );
  const secret = randomBytes(32).toString('hex');
  assert.equal(
    parseApiEnvironment({ ...base, AUTH_THROTTLE_HMAC_SECRET: secret })
      .throttleHmacSecret,
    secret,
  );
});

test('production API startup fails before listening without the HMAC secret', () => {
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: 'production',
    ADMIN_ORIGIN: 'https://admin.example.test',
    API_TRUST_PROXY_HOPS: '1',
  };
  delete environment.AUTH_THROTTLE_HMAC_SECRET;
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', 'src/index.ts'],
    { cwd: process.cwd(), env: environment, encoding: 'utf8', timeout: 30_000 },
  );
  assert.notEqual(result.status, 0);
  assert.equal(result.error, undefined);
  assert.doesNotMatch(`${result.stdout}\n${result.stderr}`, /api\.listening/);
});

test('development uses safe local origin and proxy defaults', () => {
  assert.deepEqual(parseApiEnvironment({ NODE_ENV: 'development' }), {
    nodeEnvironment: 'development',
    adminOrigin: 'http://localhost:3001',
    trustProxy: false,
  });
});

test('production requires an HTTPS Admin origin and an explicit proxy hop count', () => {
  const testSecret = randomBytes(32).toString('hex');
  assert.deepEqual(
    parseApiEnvironment({
      NODE_ENV: 'production',
      ADMIN_ORIGIN: 'https://admin.codeddevs.com/',
      API_TRUST_PROXY_HOPS: '1',
      AUTH_THROTTLE_HMAC_SECRET: testSecret,
    }),
    {
      nodeEnvironment: 'production',
      adminOrigin: 'https://admin.codeddevs.com',
      trustProxy: 1,
      throttleHmacSecret: testSecret,
    },
  );

  assert.throws(() =>
    parseApiEnvironment({
      NODE_ENV: 'production',
      API_TRUST_PROXY_HOPS: '1',
    }),
  );
  assert.throws(() =>
    parseApiEnvironment({
      NODE_ENV: 'production',
      ADMIN_ORIGIN: 'http://admin.codeddevs.com',
      API_TRUST_PROXY_HOPS: '1',
    }),
  );
  assert.throws(() =>
    parseApiEnvironment({
      NODE_ENV: 'production',
      ADMIN_ORIGIN: 'https://admin.codeddevs.com',
    }),
  );
});

test('Admin origins must be exact origins without credentials, paths, queries, or fragments', () => {
  for (const adminOrigin of [
    'https://user@admin.codeddevs.com',
    'https://admin.codeddevs.com/cms',
    'https://admin.codeddevs.com?source=test',
    'https://admin.codeddevs.com#session',
  ]) {
    assert.throws(() =>
      parseApiEnvironment({
        NODE_ENV: 'production',
        ADMIN_ORIGIN: adminOrigin,
        API_TRUST_PROXY_HOPS: '1',
      }),
    );
  }
});

test('proxy hop configuration rejects blind trust and invalid counts', () => {
  for (const proxyHops of ['true', '-1', '1.5', '11']) {
    assert.throws(() =>
      parseApiEnvironment({
        NODE_ENV: 'development',
        API_TRUST_PROXY_HOPS: proxyHops,
      }),
    );
  }

  assert.throws(() =>
    parseApiEnvironment({
      NODE_ENV: 'production',
      ADMIN_ORIGIN: 'https://admin.codeddevs.com',
      API_TRUST_PROXY_HOPS: '0',
    }),
  );
});
