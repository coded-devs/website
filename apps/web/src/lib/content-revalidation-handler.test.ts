import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRevalidationHandler } from './content-revalidation-handler.ts';

const secret = 'a'.repeat(64);
const validPayload = {
  paths: ['/insights', '/insights/hello-world'],
  tags: ['articles', 'article-hello-world'],
};

function makeRequest(
  payload: unknown,
  key = secret,
  contentType = 'application/json',
) {
  return new Request('http://localhost/api/revalidate', {
    method: 'POST',
    headers: {
      'content-type': contentType,
      'x-codeddevs-revalidation-secret': key,
    },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
}

test('revalidation handler authorizes requests and revalidates approved paths and tags', async () => {
  const calls: string[] = [];
  const handler = createRevalidationHandler({
    secret,
    revalidatePath: (path) => calls.push(`path:${path}`),
    revalidateTag: (tag) => calls.push(`tag:${tag}`),
  });
  const result = await handler(makeRequest(validPayload));
  assert.equal(result.status, 204);
  assert.deepEqual(calls, [
    'path:/insights',
    'path:/insights/hello-world',
    'tag:articles',
    'tag:article-hello-world',
  ]);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});

test('revalidation handler rejects incorrect secrets without invoking cache APIs', async () => {
  let called = false;
  const handler = createRevalidationHandler({
    secret,
    revalidatePath: () => {
      called = true;
    },
    revalidateTag: () => {
      called = true;
    },
  });
  assert.equal(
    (await handler(makeRequest(validPayload, 'b'.repeat(64)))).status,
    401,
  );
  assert.equal(called, false);
});

test('revalidation handler fails safely when no shared secret is configured', async () => {
  const handler = createRevalidationHandler({
    secret: undefined,
    revalidatePath() {},
    revalidateTag() {},
  });
  assert.equal((await handler(makeRequest(validPayload))).status, 500);
});

test('revalidation handler rejects malformed, unsafe, duplicate, and extra targets', async () => {
  const handler = createRevalidationHandler({
    secret,
    revalidatePath() {},
    revalidateTag() {},
  });
  for (const payload of [
    { paths: ['/admin'], tags: ['site'] },
    { paths: ['/insights/Bad-Slug'], tags: ['site'] },
    { paths: [`/insights/${'a'.repeat(161)}`], tags: ['site'] },
    { paths: ['/'], tags: [`article-${'a'.repeat(161)}`] },
    { paths: ['/'], tags: ['article-../x'] },
    { ...validPayload, extra: true },
    { paths: ['/', '/'], tags: ['site'] },
  ]) {
    assert.equal((await handler(makeRequest(payload))).status, 400);
  }
});

test('revalidation handler bounds body size and enforces JSON content type', async () => {
  const handler = createRevalidationHandler({
    secret,
    revalidatePath() {},
    revalidateTag() {},
  });
  assert.equal(
    (await handler(makeRequest(validPayload, secret, 'text/plain'))).status,
    415,
  );
  assert.equal(
    (await handler(makeRequest(' '.repeat(16 * 1024 + 1)))).status,
    413,
  );
});
