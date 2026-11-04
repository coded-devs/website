import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parseApiEnvironment, parseApiRuntimeConfiguration } from './env.js';

test('API runtime validates port and production database configuration', () => {
  assert.deepEqual(parseApiRuntimeConfiguration({ NODE_ENV: 'development' }), {
    port: 4000,
    databaseUrl: undefined,
    environment: parseApiEnvironment({ NODE_ENV: 'development' }),
  });

  for (const port of ['65536', '-1', '1.5', 'not-a-port']) {
    assert.throws(() =>
      parseApiRuntimeConfiguration({ NODE_ENV: 'development', PORT: port }),
    );
  }

  const production = {
    NODE_ENV: 'production',
    ADMIN_ORIGIN: 'https://admin.example.test',
    API_TRUST_PROXY_HOPS: '1',
    WEB_INTERNAL_ORIGIN: 'https://web.example.test',
    CONTENT_REVALIDATION_SECRET: 'a'.repeat(64),
    AUTH_THROTTLE_HMAC_SECRET: 'b'.repeat(64),
    ...testR2,
  };
  assert.equal(
    parseApiRuntimeConfiguration({ NODE_ENV: 'test', PORT: '0' }).port,
    0,
  );
  assert.throws(() =>
    parseApiRuntimeConfiguration({ ...production, PORT: '0' }),
  );
  assert.throws(() => parseApiRuntimeConfiguration(production), /DATABASE_URL/);
  const invalid = 'postgresql://secret-user:secret-password@';
  assert.throws(
    () =>
      parseApiRuntimeConfiguration({ ...production, DATABASE_URL: invalid }),
    (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.doesNotMatch(error.message, /secret-user|secret-password/);
      return true;
    },
  );
  const valid = 'postgresql://user:password@localhost:5432/codeddevs';
  const config = parseApiRuntimeConfiguration({
    ...production,
    DATABASE_URL: valid,
    PORT: '4100',
  });
  assert.equal(config.port, 4100);
  assert.equal(config.databaseUrl, valid);
});

const testR2 = {
  R2_ACCOUNT_ID: 'a'.repeat(32),
  R2_ACCESS_KEY_ID: 'test-access-key',
  R2_SECRET_ACCESS_KEY: 'test-secret-key',
  R2_BUCKET: 'codeddevs-test-media',
  R2_PUBLIC_BASE_URL: 'https://media.example.test',
};

test('R2 configuration is complete and rejects unsafe public URLs', () => {
  assert.throws(() =>
    parseApiEnvironment({ R2_ACCOUNT_ID: testR2.R2_ACCOUNT_ID }),
  );
  const environment = parseApiEnvironment(testR2);
  assert.equal(environment.r2PublicBaseUrl, 'https://media.example.test');
  assert.equal(environment.r2?.bucket, testR2.R2_BUCKET);
  for (const publicUrl of [
    'https://user@media.example.test',
    'https://media.example.test?token=secret',
    'https://media.example.test#fragment',
    'ftp://media.example.test',
  ]) {
    assert.throws(() =>
      parseApiEnvironment({ ...testR2, R2_PUBLIC_BASE_URL: publicUrl }),
    );
  }
});

test('production requires a valid HMAC secret without revealing invalid input', () => {
  const base = {
    NODE_ENV: 'production',
    ADMIN_ORIGIN: 'https://admin.example.test',
    API_TRUST_PROXY_HOPS: '1',
    WEB_INTERNAL_ORIGIN: 'https://web.example.test',
    CONTENT_REVALIDATION_SECRET: randomBytes(32).toString('hex'),
    ...testR2,
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
    WEB_INTERNAL_ORIGIN: 'https://web.example.test',
    CONTENT_REVALIDATION_SECRET: randomBytes(32).toString('hex'),
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
  const revalidationSecret = randomBytes(32).toString('hex');
  assert.deepEqual(
    parseApiEnvironment({
      NODE_ENV: 'production',
      ADMIN_ORIGIN: 'https://admin.codeddevs.com/',
      API_TRUST_PROXY_HOPS: '1',
      AUTH_THROTTLE_HMAC_SECRET: testSecret,
      WEB_INTERNAL_ORIGIN: 'https://web.codeddevs.com',
      CONTENT_REVALIDATION_SECRET: revalidationSecret,
      ...testR2,
    }),
    {
      nodeEnvironment: 'production',
      adminOrigin: 'https://admin.codeddevs.com',
      trustProxy: 1,
      throttleHmacSecret: testSecret,
      webInternalOrigin: 'https://web.codeddevs.com',
      contentRevalidationSecret: revalidationSecret,
      r2PublicBaseUrl: testR2.R2_PUBLIC_BASE_URL,
      r2: {
        accountId: testR2.R2_ACCOUNT_ID,
        accessKeyId: testR2.R2_ACCESS_KEY_ID,
        secretAccessKey: testR2.R2_SECRET_ACCESS_KEY,
        bucket: testR2.R2_BUCKET,
        publicBaseUrl: testR2.R2_PUBLIC_BASE_URL,
      },
    },
  );

  assert.throws(() =>
    parseApiEnvironment({
      NODE_ENV: 'production',
      API_TRUST_PROXY_HOPS: '1',
      WEB_INTERNAL_ORIGIN: 'https://web.codeddevs.com',
      CONTENT_REVALIDATION_SECRET: randomBytes(32).toString('hex'),
    }),
  );
  assert.throws(() =>
    parseApiEnvironment({
      NODE_ENV: 'production',
      ADMIN_ORIGIN: 'http://admin.codeddevs.com',
      API_TRUST_PROXY_HOPS: '1',
      WEB_INTERNAL_ORIGIN: 'https://web.codeddevs.com',
      CONTENT_REVALIDATION_SECRET: randomBytes(32).toString('hex'),
    }),
  );
  assert.throws(() =>
    parseApiEnvironment({
      NODE_ENV: 'production',
      ADMIN_ORIGIN: 'https://admin.codeddevs.com',
      WEB_INTERNAL_ORIGIN: 'https://web.codeddevs.com',
      CONTENT_REVALIDATION_SECRET: randomBytes(32).toString('hex'),
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
        WEB_INTERNAL_ORIGIN: 'https://web.codeddevs.com',
        CONTENT_REVALIDATION_SECRET: randomBytes(32).toString('hex'),
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
      WEB_INTERNAL_ORIGIN: 'https://web.codeddevs.com',
      CONTENT_REVALIDATION_SECRET: randomBytes(32).toString('hex'),
    }),
  );
});

test('production requires the exact web origin and a 64-hex revalidation secret', () => {
  const base = {
    NODE_ENV: 'production',
    ADMIN_ORIGIN: 'https://admin.codeddevs.com',
    API_TRUST_PROXY_HOPS: '1',
    AUTH_THROTTLE_HMAC_SECRET: randomBytes(32).toString('hex'),
  };
  assert.throws(() => parseApiEnvironment(base));
  assert.throws(() =>
    parseApiEnvironment({
      ...base,
      WEB_INTERNAL_ORIGIN: 'https://web.codeddevs.com/path',
      CONTENT_REVALIDATION_SECRET: 'x'.repeat(64),
    }),
  );
  const environment = parseApiEnvironment({
    ...base,
    WEB_INTERNAL_ORIGIN: 'https://web.codeddevs.com/',
    CONTENT_REVALIDATION_SECRET: 'a'.repeat(64),
    ...testR2,
  });
  assert.equal(environment.webInternalOrigin, 'https://web.codeddevs.com');
  assert.equal(environment.contentRevalidationSecret, 'a'.repeat(64));
});

test('development keeps revalidation configuration optional and rejects non-origin values', () => {
  assert.deepEqual(parseApiEnvironment({ NODE_ENV: 'development' }), {
    nodeEnvironment: 'development',
    adminOrigin: 'http://localhost:3001',
    trustProxy: false,
  });
  for (const origin of [
    'ftp://web.example.test',
    'https://user@web.example.test',
    'https://web.example.test/path',
    'https://web.example.test?x=1',
    'https://web.example.test#fragment',
  ]) {
    assert.throws(() =>
      parseApiEnvironment({ NODE_ENV: 'test', WEB_INTERNAL_ORIGIN: origin }),
    );
  }
  assert.throws(() =>
    parseApiEnvironment({
      NODE_ENV: 'test',
      CONTENT_REVALIDATION_SECRET: 'not-a-secret',
    }),
  );
  assert.throws(() =>
    parseApiEnvironment({
      NODE_ENV: 'production',
      ADMIN_ORIGIN: 'https://admin.example.test',
      API_TRUST_PROXY_HOPS: '1',
      AUTH_THROTTLE_HMAC_SECRET: randomBytes(32).toString('hex'),
      WEB_INTERNAL_ORIGIN: 'http://web.example.test',
      CONTENT_REVALIDATION_SECRET: randomBytes(32).toString('hex'),
    }),
  );
});
