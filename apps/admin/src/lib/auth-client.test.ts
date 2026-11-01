import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { login, logout, getCurrentUser, AuthError } from './auth-client.ts';

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const admin = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'admin@example.test',
  role: 'SUPER_ADMIN',
};
const session = { expiresAt: '2030-01-01T00:00:00.000Z' };

test('login sends CSRF and hydrates the API principal after accepting expiresAt', async () => {
  const paths: string[] = [];
  globalThis.fetch = async (url, options) => {
    paths.push(String(url));
    assert.equal(options?.credentials, 'same-origin');
    if (options?.method === 'POST') {
      assert.equal(new Headers(options.headers).get('X-CodedDevs-CSRF'), '1');
      assert.equal(
        new Headers(options.headers).get('Content-Type'),
        'application/json',
      );
      return Response.json(session);
    }
    return Response.json({ admin, session });
  };
  assert.deepEqual(
    await login({ email: admin.email, password: 'test-only passphrase' }),
    admin,
  );
  assert.deepEqual(paths, [
    '/api/v1/admin/auth/login',
    '/api/v1/admin/auth/me',
  ]);
});

test('me hydrates only the canonical admin/session shape', async () => {
  globalThis.fetch = async () => Response.json({ admin, session });
  assert.deepEqual(await getCurrentUser(), admin);
  globalThis.fetch = async () => Response.json({ user: admin });
  await assert.rejects(getCurrentUser, AuthError);
});

test('me returns null only for unauthorized, not service or network failure', async () => {
  globalThis.fetch = async () =>
    Response.json({ error: 'Unauthorized' }, { status: 401 });
  assert.equal(await getCurrentUser(), null);
  globalThis.fetch = async () =>
    Response.json({ error: 'Service unavailable' }, { status: 503 });
  await assert.rejects(getCurrentUser, AuthError);
  globalThis.fetch = async () => {
    throw new Error('private diagnostic');
  };
  await assert.rejects(getCurrentUser, /Unable to contact/);
});

test('logout requires CSRF and propagates failure instead of pretending success', async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options?.method, 'POST');
    assert.equal(options?.credentials, 'same-origin');
    assert.equal(new Headers(options?.headers).get('X-CodedDevs-CSRF'), '1');
    return new Response(null, { status: 204 });
  };
  await logout();
  globalThis.fetch = async () =>
    Response.json({ error: 'Service unavailable' }, { status: 503 });
  await assert.rejects(logout, AuthError);
  globalThis.fetch = async () => {
    throw new Error('private diagnostic');
  };
  await assert.rejects(logout, /Unable to contact/);
});
