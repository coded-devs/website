import assert from 'node:assert/strict';
import { describe, it, afterEach } from 'node:test';
import {
  fetchPublishedArticles,
  fetchPublishedArticleBySlug,
  getApiBaseUrl,
} from './articles-api.ts';

describe('Articles API Client', () => {
  const originalFetch = globalThis.fetch;
  const env = process.env as Record<string, string | undefined>;
  const originalApiUrl = process.env.API_URL;
  const originalPublicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  const originalNodeEnv = env.NODE_ENV;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.API_URL;
    else process.env.API_URL = originalApiUrl;
    if (originalPublicApiUrl === undefined)
      delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalPublicApiUrl;
    if (originalNodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = originalNodeEnv;
  });

  describe('fetchPublishedArticles', () => {
    it('returns published articles and pagination details on 200', async () => {
      const mockArticles = [
        {
          id: 'art-1',
          slug: 'announcing-codeddevs-platform',
          title: 'Announcing the CodedDevs Platform',
          summary: 'An overview of what we are building at CodedDevs.',
          publishedAt: '2026-10-30T09:00:00Z',
          author: { name: 'Engineering Team', role: 'CodedDevs' },
          tags: ['engineering', 'product'],
        },
      ];

      globalThis.fetch = async (url) => {
        const urlString = String(url);
        assert.ok(urlString.includes('/api/v1/public/articles'));
        return new Response(
          JSON.stringify({
            items: mockArticles,
            total: 1,
            page: 1,
            pageSize: 10,
            totalPages: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const result = await fetchPublishedArticles({ page: 1, limit: 10 });
      assert.equal(result.items.length, 1);
      assert.equal(result.items[0].slug, 'announcing-codeddevs-platform');
      assert.equal(result.total, 1);
    });

    it('throws when the backend fails instead of treating an outage as empty content', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
        });

      await assert.rejects(fetchPublishedArticles(), /500/);
    });

    it('throws on network errors instead of treating an outage as empty content', async () => {
      globalThis.fetch = async () => {
        throw new Error('Connection refused');
      };

      await assert.rejects(fetchPublishedArticles(), /Connection refused/);
    });

    it('throws when the server returns an invalid articles response', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ items: 'not-an-array' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      await assert.rejects(fetchPublishedArticles(), /invalid/i);
    });
  });

  describe('fetchPublishedArticleBySlug', () => {
    it('returns published article detail when found', async () => {
      const mockArticle = {
        id: 'art-2',
        slug: 'building-modern-scalable-web',
        title: 'Building Modern Scalable Web Applications',
        summary: 'Architectural lessons from building our public CMS and site.',
        content: 'Full article body content here...',
        publishedAt: '2026-10-28T12:00:00Z',
        author: { name: 'Aliyu Mohammed', role: 'Frontend Engineer' },
      };

      globalThis.fetch = async (url) => {
        const urlString = String(url);
        assert.ok(
          urlString.includes(
            '/api/v1/public/articles/building-modern-scalable-web',
          ),
        );
        return new Response(JSON.stringify({ article: mockArticle }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      const article = await fetchPublishedArticleBySlug(
        'building-modern-scalable-web',
      );
      assert.ok(article);
      assert.equal(article.title, 'Building Modern Scalable Web Applications');
      assert.equal(article.slug, 'building-modern-scalable-web');
    });

    it('returns null when article is not found or unpublished (404)', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: 'Article not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });

      const article = await fetchPublishedArticleBySlug(
        'unpublished-draft-slug',
      );
      assert.equal(article, null);
    });

    it('returns null for empty or invalid slug without making a network request', async () => {
      let fetchCalled = false;
      globalThis.fetch = async () => {
        fetchCalled = true;
        return new Response('{}');
      };

      const article = await fetchPublishedArticleBySlug('');
      assert.equal(article, null);
      assert.equal(fetchCalled, false);
    });

    it('throws on network failure so callers can show an outage state', async () => {
      globalThis.fetch = async () => {
        throw new Error('DNS failure');
      };

      await assert.rejects(
        fetchPublishedArticleBySlug('any-slug'),
        /DNS failure/,
      );
    });

    it('throws on server errors while preserving 404 as not found', async () => {
      globalThis.fetch = async () => new Response('{}', { status: 503 });

      await assert.rejects(fetchPublishedArticleBySlug('any-slug'), /503/);
    });

    it('throws when a successful response contains no valid article', async () => {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ article: { title: 'Missing slug' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      await assert.rejects(fetchPublishedArticleBySlug('any-slug'), /invalid/i);
    });
  });

  describe('getApiBaseUrl', () => {
    it('requires the server-only API_URL in production', () => {
      env.NODE_ENV = 'production';
      delete process.env.API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'https://public.example.test';

      assert.throws(() => getApiBaseUrl(), /API_URL/);
    });

    it('uses localhost by default outside production', () => {
      env.NODE_ENV = 'test';
      delete process.env.API_URL;
      process.env.NEXT_PUBLIC_API_URL = 'https://public.example.test';

      assert.equal(getApiBaseUrl(), 'http://localhost:4000');
    });

    it('normalizes a configured HTTP origin to its origin', () => {
      env.NODE_ENV = 'test';
      process.env.API_URL = 'https://api.example.test/';

      assert.equal(getApiBaseUrl(), 'https://api.example.test');
    });

    it('rejects configured API URLs that are not exact HTTP origins', () => {
      env.NODE_ENV = 'test';
      for (const value of [
        'https://user:pass@api.example.test',
        'https://api.example.test/v1',
        'https://api.example.test?debug=1',
        'https://api.example.test?',
        'https://api.example.test#fragment',
        'https://api.example.test#',
        'ftp://api.example.test',
      ]) {
        process.env.API_URL = value;
        assert.throws(() => getApiBaseUrl(), /API_URL.*origin/i, value);
      }
    });

    it('treats blank API_URL as missing in production and rejects it elsewhere', () => {
      env.NODE_ENV = 'production';
      process.env.API_URL = '   ';
      assert.throws(() => getApiBaseUrl(), /API_URL.*production/i);

      env.NODE_ENV = 'test';
      assert.throws(() => getApiBaseUrl(), /API_URL.*origin/i);
    });

    it('uses the normalized origin for both list and detail requests', async () => {
      env.NODE_ENV = 'test';
      process.env.API_URL = 'https://api.example.test/';
      const requestedUrls: string[] = [];
      globalThis.fetch = async (input) => {
        requestedUrls.push(String(input));
        if (String(input).includes('?')) {
          return new Response(
            JSON.stringify({
              items: [],
              total: 0,
              page: 1,
              pageSize: 10,
              totalPages: 0,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response('{}', { status: 404 });
      };

      await fetchPublishedArticles();
      await fetchPublishedArticleBySlug('not-found');

      assert.equal(
        requestedUrls[0],
        'https://api.example.test/api/v1/public/articles?page=1&limit=10',
      );
      assert.equal(
        requestedUrls[1],
        'https://api.example.test/api/v1/public/articles/not-found',
      );
    });
  });
});
