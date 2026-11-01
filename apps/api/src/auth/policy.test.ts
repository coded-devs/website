import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SESSION_POLICY, getSessionCookiePolicy } from './policy.js';

test('sessions use a 30-minute idle timeout and 8-hour absolute timeout', () => {
  assert.deepEqual(SESSION_POLICY, {
    idleTimeoutMilliseconds: 30 * 60 * 1_000,
    absoluteTimeoutMilliseconds: 8 * 60 * 60 * 1_000,
    lastUsedUpdateIntervalMilliseconds: 5 * 60 * 1_000,
  });
});

test('production session cookies use the approved host-only security policy', () => {
  assert.deepEqual(getSessionCookiePolicy('production'), {
    name: '__Host-codeddevs-admin-session',
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1_000,
  });
});

test('development session cookies remain HttpOnly without claiming the secure host prefix', () => {
  assert.deepEqual(getSessionCookiePolicy('development'), {
    name: 'codeddevs-admin-session',
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
    path: '/',
    maxAge: 8 * 60 * 60 * 1_000,
  });
});
