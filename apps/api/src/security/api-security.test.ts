import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { createApp } from '../app.js';
import type { ApiEnvironment } from '../config/env.js';
import {
  createAuthenticationAudit,
  createStructuredLogger,
} from './audit-and-logging.js';
import { applyHttpSecurity, safeErrorHandler } from './http.js';

const testEnvironment: ApiEnvironment = {
  nodeEnvironment: 'test' as const,
  adminOrigin: 'http://localhost:3001',
  trustProxy: false as const,
  throttleHmacSecret: 'a'.repeat(64),
};

async function startApp(environment = testEnvironment) {
  const server = createApp({ environment }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      ),
  };
}

test('API sends production-appropriate security headers and safe correlated errors', async () => {
  const app = await startApp({
    ...testEnvironment,
    nodeEnvironment: 'production',
    adminOrigin: 'https://admin.example.test',
  });
  try {
    const health = await fetch(`${app.base}/api/v1/health`);
    assert.equal(health.status, 200);
    assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(health.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(health.headers.get('x-frame-options'), 'DENY');
    assert.equal(
      health.headers.get('cross-origin-opener-policy'),
      'same-origin',
    );
    assert.equal(
      health.headers.get('strict-transport-security'),
      'max-age=31536000; includeSubDomains',
    );

    const malformed = await fetch(`${app.base}/unknown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not JSON',
    });
    assert.equal(malformed.status, 400);
    assert.deepEqual(await malformed.json(), { error: 'Invalid request' });
    assert.match(
      malformed.headers.get('x-request-id') ?? '',
      /^[0-9a-f-]{36}$/,
    );

    const missing = await fetch(`${app.base}/unknown`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { error: 'Not found' });
    assert.match(missing.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/);
  } finally {
    await app.close();
  }
});

test('structured logging redacts sensitive authentication values', () => {
  const events: string[] = [];
  const logger = createStructuredLogger((event) => events.push(event));
  const secret = 'do-not-log-this-secret';

  logger.error('request.failed', {
    password: secret,
    code: secret,
    recoveryCode: secret,
    sessionToken: secret,
    tokenHash: secret,
    cookie: secret,
    authorization: secret,
    AUTH_THROTTLE_HMAC_SECRET: secret,
    body: { nested: { newPassword: secret } },
  });

  assert.equal(events.length, 1);
  assert.ok(events[0]);
  assert.doesNotMatch(events[0], new RegExp(secret));
  assert.match(events[0], /\[REDACTED\]/);
});

test('the safe error handler never returns internal failure details', async () => {
  const app = express();
  const logs: string[] = [];
  const originalInfo = console.info;
  const originalError = console.error;
  console.info = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.error = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  app.use(applyHttpSecurity(true));
  app.get('/failure/:secret', () => {
    throw new Error('database password do-not-return');
  });
  app.use(safeErrorHandler);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/failure/secret-path-value`,
    );
    assert.equal(response.status, 500);
    const body = await response.text();
    assert.equal(body, '{"error":"Internal server error"}');
    assert.doesNotMatch(body, /database|password|do-not-return/);
    assert.match(response.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/);
    assert.ok(logs.some((entry) => entry.includes('/failure/:secret')));
    assert.doesNotMatch(logs.join('\n'), /secret-path-value/);
  } finally {
    console.info = originalInfo;
    console.error = originalError;
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test('authentication audits accept only bounded approved metadata', () => {
  assert.deepEqual(
    createAuthenticationAudit({
      eventType: 'auth.login',
      metadata: { outcome: 'rejected', reason: 'invalid_credentials' },
    }),
    {
      eventType: 'auth.login',
      metadata: { outcome: 'rejected', reason: 'invalid_credentials' },
    },
  );
  assert.throws(
    () =>
      createAuthenticationAudit({
        eventType: 'auth.login',
        metadata: {
          outcome: 'rejected',
          reason: 'invalid_credentials',
          password: 'must not persist',
        },
      } as unknown as Parameters<typeof createAuthenticationAudit>[0]),
    /Unapproved authentication audit metadata/,
  );
  assert.throws(
    () =>
      createAuthenticationAudit({
        eventType: 'auth.recovery',
        metadata: { outcome: 'rejected', reason: 'free-form-user-agent' },
      } as unknown as Parameters<typeof createAuthenticationAudit>[0]),
    /Unapproved authentication audit metadata/,
  );
});
