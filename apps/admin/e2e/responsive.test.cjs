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

test('article editor fits a 375px viewport', async () => {
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
    await page.goto(`${adminUrl}/insights/new`);
    await page.getByLabel('Article Title').waitFor();
    assert.ok(
      (await page.getByLabel('Article Title').boundingBox()).width >= 250,
      'Article title must remain usable on a phone',
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      375,
      'Article editor should not force horizontal page scrolling',
    );
    await context.close();
  } finally {
    await browser.close();
  }
});

test('article preview dialog contains keyboard focus and restores it on close', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
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
    await page.goto(`${adminUrl}/insights/new`);

    const opener = page.getByRole('button', { name: /Preview/ });
    await opener.waitFor();
    await opener.focus();
    await opener.click();

    const dialog = page.getByRole('dialog', { name: 'Article Live Preview' });
    const closeButton = dialog.getByRole('button', {
      name: 'Close preview',
      exact: true,
    });
    await closeButton.waitFor();
    assert.equal(
      await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label'),
      ),
      'Close preview',
      'Opening the dialog should move focus inside it',
    );

    await dialog
      .getByRole('button', { name: 'Close Preview', exact: true })
      .focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label'),
      ),
      'Close preview',
      'Tab from the last dialog control should wrap to its first control',
    );

    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    assert.equal(
      await page.evaluate(() => document.activeElement?.textContent?.trim()),
      '👁️ Preview',
      'Closing with Escape should restore focus to the opener',
    );
    await context.close();
  } finally {
    await browser.close();
  }
});

test('article editor guidance is readable against its white card', async () => {
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
    await page.goto(`${adminUrl}/insights/new`);
    const guidance = page.getByText(/Saving as Draft keeps changes private/);
    await guidance.waitFor();
    const color = await guidance.evaluate(
      (element) => getComputedStyle(element).color,
    );
    const channels = color.match(/\d+/g).slice(0, 3).map(Number);
    const luminance = channels
      .map((channel) => channel / 255)
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      )
      .reduce(
        (total, channel, index) =>
          total + channel * [0.2126, 0.7152, 0.0722][index],
        0,
      );
    assert.ok(
      1.05 / (luminance + 0.05) >= 4.5,
      'Guidance text must meet normal-text contrast',
    );
    await context.close();
  } finally {
    await browser.close();
  }
});

test('Admin CMS error states fit mobile, tablet, and desktop viewports', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 320, height: 900 },
    });
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
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
        }),
      });
    });
    for (const path of [
      '/website-content',
      '/insights',
      '/inquiries',
      '/settings',
    ]) {
      await page.goto(`${adminUrl}${path}`);
      await page
        .getByRole('navigation', { name: 'Admin Navigation' })
        .waitFor();
      await page
        .getByText('Service temporarily unavailable', { exact: true })
        .waitFor();
      if (path === '/settings') {
        await page
          .getByRole('button', { name: 'Retry loading settings' })
          .waitFor();
        assert.equal(
          await page.getByRole('button', { name: 'Save Draft' }).count(),
          0,
        );
        assert.equal(
          await page.getByRole('button', { name: 'Publish Live' }).count(),
          0,
        );
      }

      for (const width of [320, 375, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const overflowingElements = await page.evaluate(() =>
          Array.from(document.querySelectorAll('body *'))
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                tag: element.tagName,
                text: element.textContent?.trim().slice(0, 40),
                right: Math.round(rect.right),
                scrollWidth: element.scrollWidth,
                clientWidth: element.clientWidth,
              };
            })
            .filter(
              (element) =>
                element.right > window.innerWidth + 1 ||
                element.scrollWidth > element.clientWidth + 1,
            )
            .slice(0, 5),
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth),
          width,
          `${path} should not force horizontal scrolling at ${width}px: ${JSON.stringify(overflowingElements)}`,
        );
      }
    }

    await page.getByRole('button', { name: /Media Library/ }).click();
    await page
      .getByText('Service temporarily unavailable', { exact: true })
      .waitFor();
    for (const width of [320, 375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth),
        width,
        `Settings media error state should fit ${width}px`,
      );
    }
    await context.close();
  } finally {
    await browser.close();
  }
});

test('uninitialized settings remain editable at 320px', async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      viewport: { width: 320, height: 900 },
    });
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
      if (pathname === '/api/v1/admin/settings') {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Content not found',
            code: 'CONTENT_NOT_FOUND',
          }),
        });
      }
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
        }),
      });
    });
    await page.goto(`${adminUrl}/settings`);
    await page.getByRole('button', { name: 'Save Draft' }).first().waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth),
      320,
      'Initial settings form should fit a 320px viewport',
    );
    assert.equal(
      await page
        .getByRole('button', { name: 'Retry loading settings' })
        .count(),
      0,
    );
    await context.close();
  } finally {
    await browser.close();
  }
});

test('media operation failures are announced in the Media Library tab', async () => {
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
    const asset = {
      id: 'media-error-test',
      objectKey: 'media-error-test.png',
      url: 'https://example.test/media-error-test.png',
      mimeType: 'image/png',
      byteSize: 128,
      altText: 'Existing description',
      referencesCount: 0,
      createdAt: '2026-11-01T00:00:00.000Z',
      updatedAt: '2026-11-01T00:00:00.000Z',
    };
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
      if (pathname === '/api/v1/admin/settings') {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Settings are not initialized.' }),
        });
      }
      if (pathname === '/api/v1/admin/media') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ assets: [asset] }),
        });
      }
      const operationError = pathname.endsWith('/upload')
        ? 'Upload failed for this test.'
        : pathname.endsWith('/alt-text')
          ? 'Alt text update failed for this test.'
          : 'Delete failed for this test.';
      return route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: operationError }),
      });
    });

    await page.goto(`${adminUrl}/settings`);
    await page.getByRole('button', { name: /Media Library/ }).click();
    await page.getByText(asset.objectKey, { exact: true }).waitFor();

    await page.locator('#fileInput').setInputFiles({
      name: 'upload.png',
      mimeType: 'image/png',
      buffer: Buffer.from('test image'),
    });
    await page.getByRole('button', { name: 'Upload Asset' }).click();
    await page
      .getByRole('alert')
      .getByText('Upload failed for this test.', { exact: true })
      .waitFor();

    await page.getByRole('button', { name: 'Edit Alt' }).click();
    await page.getByRole('button', { name: 'Save Alt Text' }).click();
    await page
      .getByRole('alert')
      .getByText('Alt text update failed for this test.', { exact: true })
      .waitFor();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page.getByRole('button', { name: 'Permanently Delete' }).click();
    await page
      .getByRole('alert')
      .getByText('Delete failed for this test.', { exact: true })
      .waitFor();
  } finally {
    await browser.close();
  }
});
