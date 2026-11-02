import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import {
  ArticleApiError,
  calculateReadTime,
  createArticle,
  deleteArticle,
  fetchAdminArticleById,
  fetchAdminArticlePreview,
  fetchAdminArticles,
  generateSlug,
  publishArticle,
  unpublishArticle,
  updateArticle,
} from './articles-client.ts';
import type { AdminArticle } from '../types/article.ts';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const adminArticle: AdminArticle = {
  id: 'c0a80101-0000-4000-8000-000000000001',
  draftSlug: 'article-one',
  publishedSlug: null,
  draftPayload: { title: 'Article One', excerpt: 'Summary', body: 'Body' },
  publishedPayload: null,
  publishedAt: null,
  createdAt: '2026-10-30T00:00:00.000Z',
  updatedAt: '2026-10-30T00:00:00.000Z',
  status: 'draft',
};

test('generateSlug and calculateReadTime preserve their existing behavior', () => {
  assert.equal(
    generateSlug('Building Scalable Web Applications in 2026!'),
    'building-scalable-web-applications-in-2026',
  );
  assert.equal(generateSlug('---leading-trailing---'), 'leading-trailing');
  assert.equal(calculateReadTime(''), 1);
  assert.equal(calculateReadTime(Array(450).fill('word').join(' ')), 3);
});

test('article listing forwards filters and returns the exact pagination envelope', async () => {
  let capturedUrl = '';
  globalThis.fetch = async (input) => {
    capturedUrl = input.toString();
    return new Response(
      JSON.stringify({
        items: [adminArticle],
        total: 1,
        page: 2,
        limit: 5,
        totalPages: 1,
      }),
      { status: 200 },
    );
  };
  const result = await fetchAdminArticles({
    search: 'article',
    status: 'published',
    page: 2,
    limit: 5,
  });
  assert.ok(capturedUrl.includes('search=article'));
  assert.ok(capturedUrl.includes('status=published'));
  assert.ok(capturedUrl.includes('page=2'));
  assert.deepEqual(result, {
    items: [adminArticle],
    total: 1,
    page: 2,
    limit: 5,
    totalPages: 1,
  });
});

test('article reads require their canonical envelopes and errors use the error field', async () => {
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ article: adminArticle }), { status: 200 });
  assert.deepEqual(await fetchAdminArticleById(adminArticle.id), adminArticle);

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  await assert.rejects(
    fetchAdminArticles(),
    (error: unknown) =>
      error instanceof ArticleApiError &&
      error.statusCode === 401 &&
      error.message === 'Unauthorized',
  );

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: 'noncanonical' }), { status: 404 });
  await assert.rejects(
    fetchAdminArticleById('missing'),
    (error: unknown) =>
      error instanceof ArticleApiError &&
      error.statusCode === 404 &&
      error.message === 'Failed to fetch article (status 404)',
  );
});

test('preview client returns the public-shaped preview envelope', async () => {
  const preview = {
    id: adminArticle.id,
    slug: 'draft-slug',
    title: 'Draft title',
    summary: 'Draft summary',
    content: 'Draft content',
    publishedAt: null,
  } as const;
  let capturedUrl = '';
  globalThis.fetch = async (input) => {
    capturedUrl = input.toString();
    return new Response(JSON.stringify({ article: preview }), { status: 200 });
  };
  assert.deepEqual(await fetchAdminArticlePreview(adminArticle.id), preview);
  assert.ok(capturedUrl.endsWith(`/articles/${adminArticle.id}/preview`));
});

test('every unsafe article request sends the shared CSRF header and consumes canonical responses', async () => {
  const requests: Array<{
    method: string;
    headers: Headers;
    credentials?: RequestCredentials;
    body?: string;
  }> = [];
  globalThis.fetch = async (_input, init) => {
    const headers = new Headers(init?.headers);
    requests.push({
      method: init?.method ?? 'GET',
      headers,
      ...(init?.credentials ? { credentials: init.credentials } : {}),
      ...(typeof init?.body === 'string' ? { body: init.body } : {}),
    });
    if (init?.method === 'DELETE') return new Response(null, { status: 204 });
    const article =
      init?.method === 'POST' &&
      typeof init.body === 'string' &&
      JSON.parse(init.body).publishImmediately
        ? {
            ...adminArticle,
            publishedSlug: adminArticle.draftSlug,
            publishedPayload: adminArticle.draftPayload,
            publishedAt: '2026-10-31T00:00:00.000Z',
            status: 'published' as const,
          }
        : adminArticle;
    return new Response(JSON.stringify({ article }), { status: 200 });
  };

  await createArticle(
    {
      title: 'Article One',
      slug: 'article-one',
      excerpt: 'Summary',
      body: 'Body',
    },
    true,
  );
  await updateArticle(adminArticle.id, {
    title: 'Article One',
    slug: 'article-one',
    excerpt: 'Summary',
    body: 'Body',
  });
  await publishArticle(adminArticle.id);
  await unpublishArticle(adminArticle.id);
  assert.deepEqual(await deleteArticle(adminArticle.id), {
    success: true,
    id: adminArticle.id,
  });

  assert.deepEqual(
    requests.map(({ method }) => method),
    ['POST', 'PUT', 'POST', 'POST', 'DELETE'],
  );
  for (const request of requests) {
    assert.equal(request.headers.get(AUTH_CSRF_HEADER), AUTH_CSRF_VALUE);
    assert.equal(request.credentials, 'same-origin');
  }
  assert.deepEqual(JSON.parse(requests[0]!.body!), {
    title: 'Article One',
    slug: 'article-one',
    excerpt: 'Summary',
    body: 'Body',
    publishImmediately: true,
  });
});
