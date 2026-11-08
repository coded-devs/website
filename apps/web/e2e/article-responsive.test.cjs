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
    await page.locator('h1').getByText(article.title).waitFor();
    for (const width of [320, 375, 768, 1440]) {
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

test('Insights article link stays legible on mobile', async () => {
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
    // The article card is one link: its title, stretched over the card.
    const readLink = page.getByRole('link', { name: article.title });
    await readLink.waitFor();
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(
        (await readLink.boundingBox()).width >= 90,
        'Article link should not be squeezed into a narrow column',
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
        `Insights listing should not scroll horizontally at ${width}px`,
      );
    }
  } finally {
    await browser?.close();
    await new Promise((resolve) => api.close(resolve));
  }
});

test('mobile navigation closes when the menu backdrop is clicked', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: 320, height: 900 },
    });
    await page.goto('http://localhost:3000/');

    const menuButton = page.getByRole('button', { name: 'Menu' });
    await menuButton.click();
    assert.equal(await menuButton.getAttribute('aria-expanded'), 'true');
    await page
      .locator('nav[aria-label="Main"]')
      .last()
      .getByRole('link', { name: 'About', exact: true })
      .waitFor();

    // Click an unoccupied part of the full-screen menu sheet, away from links.
    await page.mouse.click(300, 700);
    await page.waitForFunction(
      () =>
        document
          .querySelector('button[aria-label="Menu"]')
          ?.getAttribute('aria-expanded') === 'false',
    );
    assert.equal(
      await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label'),
      ),
      'Menu',
      'Closing the menu should restore focus to its toggle',
    );
  } finally {
    await browser.close();
  }
});
