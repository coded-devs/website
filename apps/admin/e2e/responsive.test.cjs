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
    const sidebar = page.locator('#admin-sidebar');
    await page.waitForFunction(
      () => document.querySelector('#admin-sidebar')?.inert === true,
    );
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('dialog', { name: 'Admin sidebar' }).waitFor();
    await page.getByRole('navigation', { name: 'Admin Navigation' }).waitFor();
    await page.getByRole('link', { name: 'Dashboard' }).waitFor();
    await page
      .getByRole('link', { name: 'Media Library', exact: true })
      .waitFor();

    for (const width of [320, 375, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
        `Admin navigation should not force horizontal scrolling at ${width}px`,
      );
    }
    await page.setViewportSize({ width: 375, height: 240 });
    await page.waitForFunction(
      () => document.querySelector('#admin-sidebar')?.inert === true,
    );
    await page.getByRole('button', { name: 'Open navigation' }).focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await sidebar.evaluate((element) =>
        element.contains(document.activeElement),
      ),
      false,
      'Closed mobile sidebar controls must not enter the tab order',
    );

    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('dialog', { name: 'Admin sidebar' }).waitFor();
    const mobileSidebarLayout = await sidebar.evaluate((element) => ({
      overflowY: getComputedStyle(element).overflowY,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
    }));
    assert.equal(mobileSidebarLayout.overflowY, 'auto');
    assert.ok(
      mobileSidebarLayout.scrollHeight > mobileSidebarLayout.clientHeight,
      'The mobile sidebar should scroll when its content is taller than the viewport',
    );
    await sidebar.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    assert.ok(await sidebar.evaluate((element) => element.scrollTop > 0));

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole('complementary', { name: 'Admin sidebar' }).waitFor();
    assert.equal(
      await page.locator('#admin-sidebar').getAttribute('aria-modal'),
      null,
    );
    assert.equal(
      await page.locator('.admin-menu-toggle').getAttribute('aria-expanded'),
      'false',
      'Resizing to desktop should close mobile navigation state',
    );
    await page.getByRole('button', { name: 'Sign out' }).focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await sidebar.evaluate((element) =>
        element.contains(document.activeElement),
      ),
      false,
      'Desktop navigation should not trap keyboard focus',
    );

    await page.setViewportSize({ width: 375, height: 900 });
    await page.waitForFunction(
      () => document.querySelector('#admin-sidebar')?.inert === true,
    );
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page.getByRole('dialog', { name: 'Admin sidebar' }).waitFor();
    await page
      .getByRole('link', { name: 'Media Library', exact: true })
      .click();
    assert.equal(
      await page.evaluate(() =>
        document.activeElement?.classList.contains('admin-menu-toggle'),
      ),
      true,
      'Selecting a mobile navigation link should return focus to its toggle',
    );
    await page.waitForURL((url) => url.pathname === '/images');
    await page.getByRole('heading', { name: 'Media Library' }).waitFor();
    await context.close();
  } finally {
    await browser.close();
  }
});

test('inquiry details and follow-up status remain usable on a phone', async () => {
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
    let status = 'new';
    const inquiry = () => ({
      id: 'inquiry-1',
      name: 'Amina Yusuf',
      email: 'amina@example.com',
      company: 'Example Studio',
      message: 'I would like to discuss a new website project.',
      status,
      statusUpdatedByAdminUserId: null,
      statusUpdatedAt: null,
      createdAt: '2026-11-16T10:00:00.000Z',
      updatedAt: '2026-11-16T10:00:00.000Z',
    });

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
    await page.route('**/api/v1/admin/inquiries**', async (route) => {
      const { pathname } = new URL(route.request().url());
      if (pathname.endsWith('/status')) {
        status = route.request().postDataJSON().status;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ inquiry: inquiry() }),
        });
      }
      if (pathname.endsWith('/inquiries')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [inquiry()],
            total: 1,
            page: 1,
            limit: 15,
            totalPages: 1,
          }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ inquiry: inquiry() }),
      });
    });

    await page.goto(`${adminUrl}/inquiries`);
    await page.getByRole('heading', { name: 'Contact Inquiries' }).waitFor();
    await page.getByRole('button', { name: 'View' }).click();
    await page.getByRole('dialog', { name: 'Amina Yusuf' }).waitFor();
    await page.getByLabel('Status:').selectOption('in_progress');
    await page
      .getByRole('status')
      .getByText(/Status updated to/)
      .waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      375,
      'The inquiry detail view should not force horizontal page scrolling on a phone',
    );
    await page.getByRole('button', { name: 'Close inquiry details' }).click();
    await page.getByRole('dialog').waitFor({ state: 'detached' });
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
    await page.getByRole('heading', { name: 'Media Library' }).waitFor();
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
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
    await page.getByLabel('Email Address').waitFor();
    await page.getByLabel('Password').waitFor();
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
      await page.goto(`${adminUrl}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForURL((url) => url.pathname === '/images', {
        waitUntil: 'commit',
      });
      await page.getByRole('heading', { name: 'Media Library' }).waitFor();
    }
    await context.close();
  } finally {
    await browser.close();
  }
});
