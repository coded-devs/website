import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getPublishedSite } from './published-site.ts';

describe('getPublishedSite', () => {
  const originalFetch = globalThis.fetch;
  const originalApiUrl = process.env.API_URL;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = originalApiUrl;
  });

  it('returns only the published site API response', async () => {
    process.env.API_URL = 'https://api.example.test';
    const expected = {
      sections: [],
      services: [],
      products: [],
      projects: [],
      team: [],
      settings: null,
    };
    globalThis.fetch = async (input) => {
      assert.equal(
        String(input),
        'https://api.example.test/api/v1/public/site',
      );
      return new Response(JSON.stringify(expected), { status: 200 });
    };
    assert.deepEqual(await getPublishedSite(), expected);
  });

  it('fails closed when the public content API is unavailable', async () => {
    process.env.API_URL = 'https://api.example.test';
    globalThis.fetch = async () => new Response('', { status: 503 });
    await assert.rejects(getPublishedSite(), /returned 503/);
  });
});
