import assert from 'node:assert/strict';
import { test } from 'node:test';
import { POST } from '../../app/api/inquiries/route.ts';

const validBody = JSON.stringify({
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  message: 'Please contact me about a software project.',
});
const mutableEnv = process.env as Record<string, string | undefined>;

test('inquiry proxy replaces forged X-Forwarded-For with validated Cloudflare IP', async () => {
  const previousFetch = globalThis.fetch;
  const previousApiUrl = process.env.API_URL;
  const previousNodeEnv = mutableEnv.NODE_ENV;
  let forwardedRequest: Request | undefined;
  process.env.API_URL = 'http://api.internal:4000';
  mutableEnv.NODE_ENV = 'production';
  globalThis.fetch = async (input, init) => {
    forwardedRequest = new Request(input, init);
    return Response.json({ received: true }, { status: 201 });
  };

  try {
    const response = await POST(
      new Request('https://codeddevs.org/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '198.51.100.99, 203.0.113.88',
          'CF-Connecting-IP': '203.0.113.17',
        },
        body: validBody,
      }),
    );

    assert.equal(response.status, 201);
    assert.equal(
      new URL(forwardedRequest!.url).pathname,
      '/api/v1/public/inquiries',
    );
    assert.equal(
      forwardedRequest!.headers.get('x-forwarded-for'),
      '203.0.113.17',
    );
    assert.equal(await forwardedRequest!.text(), validBody);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = previousApiUrl;
    if (previousNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = previousNodeEnv;
  }
});

test('inquiry proxy omits forwarded IP when Cloudflare identity is missing or invalid', async () => {
  const previousFetch = globalThis.fetch;
  const previousApiUrl = process.env.API_URL;
  const previousNodeEnv = mutableEnv.NODE_ENV;
  process.env.API_URL = 'http://api.internal:4000';
  mutableEnv.NODE_ENV = 'production';
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    throw new Error(
      'Production must not call the API without a trusted client IP',
    );
  };

  try {
    for (const cloudflareIp of [
      undefined,
      '203.0.113.999',
      '203.0.113.4, 10.0.0.1',
    ]) {
      const headers = new Headers({
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.99',
      });
      if (cloudflareIp) headers.set('CF-Connecting-IP', cloudflareIp);
      const response = await POST(
        new Request('https://codeddevs.org/api/inquiries', {
          method: 'POST',
          headers,
          body: validBody,
        }),
      );
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), {
        error: 'Service unavailable',
        code: 'INQUIRY_UNAVAILABLE',
      });
    }

    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = previousApiUrl;
    if (previousNodeEnv === undefined) delete mutableEnv.NODE_ENV;
    else mutableEnv.NODE_ENV = previousNodeEnv;
  }
});

test('Cloudflare client IP parser accepts valid IPv4 and IPv6 literals only', async () => {
  const { getTrustedClientIp } = await import('./trusted-client-ip.ts');
  assert.equal(
    getTrustedClientIp(new Headers({ 'CF-Connecting-IP': '203.0.113.17' })),
    '203.0.113.17',
  );
  assert.equal(
    getTrustedClientIp(new Headers({ 'CF-Connecting-IP': '2001:db8::7' })),
    '2001:db8::7',
  );
  for (const value of [
    'example.test',
    '203.0.113.999',
    '203.0.113.007',
    '::1, 10.0.0.1',
  ])
    assert.equal(
      getTrustedClientIp(new Headers({ 'CF-Connecting-IP': value })),
      undefined,
    );
});
