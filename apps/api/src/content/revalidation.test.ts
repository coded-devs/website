import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { dispatchContentRevalidation } from './revalidation.js';

test('dispatch sends the authenticated JSON payload and accepts only 204', async () => {
  const secret = 'a'.repeat(64);
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/api/revalidate');
    assert.equal(request.headers['content-type'], 'application/json');
    assert.equal(request.headers['x-codeddevs-revalidation-secret'], secret);
    assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString()), {
      paths: ['/'],
      tags: ['site', 'home'],
    });
    response.writeHead(204).end();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    assert.deepEqual(
      await dispatchContentRevalidation(
        {
          webInternalOrigin: `http://127.0.0.1:${address.port}`,
          contentRevalidationSecret: secret,
        },
        { paths: ['/'], tags: ['site', 'home'] },
      ),
      { ok: true },
    );
  } finally {
    server.close();
  }
});

test('dispatch classifies missing configuration and unexpected responses without leaking details', async () => {
  assert.deepEqual(
    await dispatchContentRevalidation({}, { paths: ['/'], tags: ['site'] }),
    { ok: false, code: 'configuration_unavailable' },
  );
  const server = createServer((_request, response) => {
    response.writeHead(503).end('private response content');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    assert.deepEqual(
      await dispatchContentRevalidation(
        {
          webInternalOrigin: `http://127.0.0.1:${address.port}`,
          contentRevalidationSecret: 'b'.repeat(64),
        },
        { paths: ['/'], tags: ['site'] },
      ),
      { ok: false, code: 'invalid_response' },
    );
  } finally {
    server.close();
  }
});
