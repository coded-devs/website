/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');

test('published article content fits phone, tablet, and desktop with long URLs', async () => {
  const slug = `quality-test-${randomUUID()}`;
  const article = {
    id: 'quality-test-article',
    slug,
    title: 'Engineering Reliable Software',
    summary: 'A published article.',
    publishedAt: '2026-11-01T10:00:00.000Z',
    content: `Reference: https://example.com/${'a'.repeat(1000)}`,
  };
  const api = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.url === `/api/v1/public/articles/${article.slug}`) {
      response.end(JSON.stringify({ article }));
      return;
    }
    response.statusCode = 404;
    response.end('{}');
  });
  await new Promise((resolve) => api.listen(4000, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 375, height: 900 },
    });
    await page.goto(`http://localhost:3000/insights/${slug}`);
    await page.getByRole('heading', { name: article.title }).waitFor();
    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
        `Published article text should not scroll horizontally at ${width}px`,
      );
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => api.close(resolve));
  }
});

test('Insights reading link stays legible beside a long byline on mobile', async () => {
  const slug = `quality-list-${randomUUID()}`;
  const article = {
    id: slug,
    slug,
    title: 'Engineering Reliable Software',
    summary: 'A published article.',
    publishedAt: '2026-11-01T10:00:00.000Z',
    author: {
      name: 'Alexandria Technical Communications Team',
      role: 'Principal Systems Engineering and Research Lead',
    },
  };
  const api = http.createServer((request, response) => {
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify({
        items: [article],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }),
    );
  });
  await new Promise((resolve) => api.listen(4000, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage({
      viewport: { width: 375, height: 900 },
    });
    await page.goto('http://localhost:3000/insights');
    await page.getByText(/Alexandria Technical Communications Team/).waitFor();
    const readLink = page.getByRole('link', { name: 'Read article' });
    await readLink.waitFor();
    assert.ok(
      (await readLink.boundingBox()).width >= 90,
      'Reading link should not be squeezed into a narrow column',
    );
  } finally {
    await browser?.close();
    await new Promise((resolve) => api.close(resolve));
  }
});
