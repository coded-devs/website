import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server.js';
import { middleware } from '../middleware.ts';
import { safeAdminRedirect } from './lib/auth-navigation.ts';

test('actual middleware uses only the configured COD-315 cookie as a navigation hint', () => {
  const name =
    process.env.NODE_ENV === 'production'
      ? '__Host-codeddevs-admin-session'
      : 'codeddevs-admin-session';
  const destination = 'https://admin.example.test/dashboard?view=all';
  const missing = middleware(new NextRequest(destination));
  assert.equal(missing.status, 307);
  assert.equal(
    new URL(missing.headers.get('location')!).searchParams.get('from'),
    '/dashboard?view=all',
  );
  for (const cookie of [`${name}=presence-only`, 'session=legacy']) {
    const result = middleware(
      new NextRequest(destination, { headers: { Cookie: cookie } }),
    );
    assert.equal(
      result.headers.get('x-middleware-next'),
      cookie.startsWith(name) ? '1' : null,
    );
  }
  const login = middleware(
    new NextRequest('https://admin.example.test/login', {
      headers: { Cookie: `${name}=stale` },
    }),
  );
  assert.equal(login.headers.get('x-middleware-next'), '1');
});

test('actual middleware forwards API path/query to the one server-side destination', () => {
  const previous = process.env.API_INTERNAL_ORIGIN;
  try {
    process.env.API_INTERNAL_ORIGIN = 'http://127.0.0.1:4000';
    const response = middleware(
      new NextRequest(
        'https://admin.example.test/api/v1/admin/auth/me?target=https://evil.test',
      ),
    );
    assert.equal(
      response.headers.get('x-middleware-rewrite'),
      'http://127.0.0.1:4000/api/v1/admin/auth/me?target=https://evil.test',
    );
    delete process.env.API_INTERNAL_ORIGIN;
    assert.throws(
      () =>
        middleware(
          new NextRequest('https://admin.example.test/api/v1/admin/auth/me'),
        ),
      /API_INTERNAL_ORIGIN is required/,
    );
  } finally {
    if (previous === undefined) delete process.env.API_INTERNAL_ORIGIN;
    else process.env.API_INTERNAL_ORIGIN = previous;
  }
});

test('login return navigation is local and limited to protected Admin paths', () => {
  for (const value of [
    '//evil.test',
    'https://evil.test',
    '/\\evil.test',
    '/login',
    'javascript:alert(1)',
  ])
    assert.equal(safeAdminRedirect(value), '/dashboard');
  assert.equal(
    safeAdminRedirect('/insights/new?draft=1'),
    '/insights/new?draft=1',
  );
});
