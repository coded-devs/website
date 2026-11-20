import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { getArticle, getInsightsPage } from './insights-content.ts';

const env = process.env as Record<string, string | undefined>;
const originalNodeEnv = env.NODE_ENV;
const originalApiUrl = env.API_URL;
const originalFetch = globalThis.fetch;

const emptySite = { sections: [] };
const publishedSite = {
  sections: [
    { sectionKey: 'hero', position: 0, payload: { heading: 'Published' } },
  ],
};

const liveSummary = {
  id: 'published-article-id',
  slug: 'published-article',
  title: 'Published article title',
  summary: 'Published article summary.',
  publishedAt: '2026-11-15T10:00:00.000Z',
  tags: ['Engineering'],
};

function configureProductionApi(options: {
  site?: unknown;
  siteError?: Error;
  articles?: unknown;
  articlesError?: Error;
  article?: unknown;
  articleStatus?: number;
  articleError?: Error;
}) {
  env.NODE_ENV = 'production';
  env.API_URL = 'https://api.example.test';
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.endsWith('/api/v1/public/site')) {
      if (options.siteError) throw options.siteError;
      return new Response(JSON.stringify(options.site ?? emptySite), {
        status: 200,
      });
    }
    if (url.includes('/api/v1/public/articles/')) {
      if (options.articleError) throw options.articleError;
      return new Response(
        JSON.stringify(options.article ?? { article: null }),
        {
          status: options.articleStatus ?? 404,
        },
      );
    }
    if (url.includes('/api/v1/public/articles')) {
      if (options.articlesError) throw options.articlesError;
      return new Response(
        JSON.stringify(
          options.articles ?? {
            items: [],
            total: 0,
            page: 1,
            pageSize: 7,
            totalPages: 0,
          },
        ),
        { status: 200 },
      );
    }
    throw new Error(`Unexpected API request: ${url}`);
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalNodeEnv === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = originalNodeEnv;
  if (originalApiUrl === undefined) delete env.API_URL;
  else env.API_URL = originalApiUrl;
});

test('production shows no sample Insights content when the published API is empty', async () => {
  configureProductionApi({ site: emptySite });

  const listing = await getInsightsPage(1);
  assert.deepEqual(listing.items, []);
  assert.equal(listing.totalPages, 0);
  assert.equal(await getArticle('historical-sample-article'), null);
});

test('published API articles take precedence over historical sample content', async () => {
  configureProductionApi({
    site: emptySite,
    articles: {
      items: [liveSummary],
      total: 1,
      page: 1,
      pageSize: 7,
      totalPages: 1,
    },
    article: {
      article: { ...liveSummary, content: 'Published article body.' },
    },
    articleStatus: 200,
  });

  const listing = await getInsightsPage(1);
  assert.equal(listing.items[0]?.title, liveSummary.title);

  const article = await getArticle(liveSummary.slug);
  assert.equal(article?.title, liveSummary.title);
  assert.equal(article?.body, 'Published article body.');
});

test('out-of-range listing pages stay empty when published articles exist', async () => {
  configureProductionApi({
    site: emptySite,
    articles: {
      items: [],
      total: 1,
      page: 2,
      pageSize: 7,
      totalPages: 1,
    },
  });

  const listing = await getInsightsPage(2);
  assert.deepEqual(listing.items, []);
  assert.equal(listing.totalPages, 1);
});

test('unknown article details stay unavailable when other published articles exist', async () => {
  configureProductionApi({
    site: emptySite,
    articles: {
      items: [liveSummary],
      total: 1,
      page: 1,
      pageSize: 1,
      totalPages: 1,
    },
  });

  assert.equal(await getArticle('historical-sample-article'), null);
});

test('production does not show historical articles when published homepage content exists', async () => {
  configureProductionApi({ site: publishedSite });

  const listing = await getInsightsPage(1);
  assert.deepEqual(listing.items, []);
  assert.equal(await getArticle('historical-sample-article'), null);
});

test('Insights API failures are surfaced instead of replaced by sample content', async () => {
  configureProductionApi({
    siteError: new Error('API unavailable'),
    articlesError: new Error('API unavailable'),
    articleError: new Error('API unavailable'),
  });

  await assert.rejects(getInsightsPage(1), /API unavailable/);
  await assert.rejects(
    getArticle('historical-sample-article'),
    /API unavailable/,
  );
});
