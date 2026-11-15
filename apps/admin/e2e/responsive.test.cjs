/* eslint @typescript-eslint/no-require-imports: off */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const adminUrl = process.env.ADMIN_E2E_URL ?? 'http://localhost:3001';

test('authenticated Admin navigation fits phone, tablet, and desktop viewports', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 375, height: 900 },
    });
    await context.addCookies([
      {
        name: 'codeddevs-admin-session',
        value: 'test-only-cookie',
        url: adminUrl,
      },
    ]);
    const page = await context.newPage();
    await page.route('**/api/v1/admin/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          admin: {
            id: 'test-admin',
            email: 'owner@example.com',
            role: 'SUPER_ADMIN',
          },
          session: { expiresAt: '2030-01-01T00:00:00.000Z' },
        }),
      }),
    );
    await page.goto(`${adminUrl}/dashboard`);
    await page.getByRole('navigation', { name: 'Admin Navigation' }).waitFor();

    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
        `Admin navigation should not force horizontal scrolling at ${width}px`,
      );
    }
    await context.close();
  } finally {
    await browser.close();
  }
});

test('the Admin image library is read-only', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'codeddevs-admin-session',
        value: 'test-only-cookie',
        url: adminUrl,
      },
    ]);
    const page = await context.newPage();
    await page.route('**/api/v1/admin/**', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === '/api/v1/admin/auth/me') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            admin: {
              id: 'test-admin',
              email: 'owner@example.com',
              role: 'SUPER_ADMIN',
            },
            session: { expiresAt: '2030-01-01T00:00:00.000Z' },
          }),
        });
      }
      if (pathname === '/api/v1/admin/media') {
        const requestedPage = Number(
          new URL(route.request().url()).searchParams.get('page') ?? '1',
        );
        const firstAssetNumber = (requestedPage - 1) * 100 + 1;
        const assetCount = requestedPage === 1 ? 100 : 1;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            assets: Array.from({ length: assetCount }, (_, index) => {
              const number = firstAssetNumber + index;
              return {
                id: `asset-${number}`,
                objectKey: `media/image-${number}.webp`,
                url: `https://cdn.example.test/image-${number}.webp`,
                mimeType: 'image/webp',
                byteSize: 1000,
                width: 400,
                height: 180,
                altText: `Image ${number}`,
                referencesCount: 0,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              };
            }),
          }),
        });
      }
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'CMS content is read-only.' }),
      });
    });
    await page.route('https://cdn.example.test/**', (route) =>
      route.fulfill({ status: 200, body: '' }),
    );

    await page.goto(`${adminUrl}/images`);
    await page.getByRole('heading', { name: 'Images' }).waitFor();
    await page.getByRole('navigation', { name: 'Admin Navigation' }).waitFor();
    await page
      .getByText(/All website content and media are currently read-only/)
      .waitFor();
    await page.getByText('media/image-100.webp').waitFor();
    await page.getByRole('button', { name: 'Load more images' }).click();
    await page.getByText('media/image-101.webp').waitFor();
    assert.equal(await page.locator('input[type="file"]').count(), 0);
    assert.equal(
      await page.getByRole('button', { name: /replace|upload|edit/i }).count(),
      0,
    );
    assert.equal(
      await page.getByRole('link', { name: /replace|upload|edit/i }).count(),
      0,
    );
    await context.close();
  } finally {
    await browser.close();
  }
});

test('the image library redirects unauthenticated visitors to login', async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${adminUrl}/images`);
    await page.waitForURL((url) => url.pathname === '/login');
  } finally {
    await browser.close();
  }
});

test('retired CMS editing routes lead signed-in admins to read-only images', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    await context.addCookies([
      {
        name: 'codeddevs-admin-session',
        value: 'test-only-cookie',
        url: adminUrl,
      },
    ]);
    const page = await context.newPage();
    await page.route('**/api/v1/admin/**', (route) => {
      const pathname = new URL(route.request().url()).pathname;
      if (pathname === '/api/v1/admin/auth/me') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            admin: {
              id: 'test-admin',
              email: 'owner@example.com',
              role: 'SUPER_ADMIN',
            },
            session: { expiresAt: '2030-01-01T00:00:00.000Z' },
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ assets: [] }),
      });
    });

    for (const path of [
      '/website-content',
      '/insights',
      '/insights/new',
      '/settings',
    ]) {
      await page.goto(`${adminUrl}${path}`);
      await page.waitForURL((url) => url.pathname === '/images');
      await page.getByRole('heading', { name: 'Images' }).waitFor();
    }
    await context.close();
  } finally {
    await browser.close();
  }
});
