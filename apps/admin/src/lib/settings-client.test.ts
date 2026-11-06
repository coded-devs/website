import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchAdminSettings,
  updateAdminSettings,
  publishAdminSettings,
  fetchAccountSecurity,
  SettingsApiError,
} from './settings-client.ts';
import type { SiteSettings } from '../types/settings.ts';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';

describe('Settings API Client', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('fetchAdminSettings', () => {
    test('fetches settings successfully', async () => {
      const mockSettings: SiteSettings = {
        companyName: 'CodedDevs',
        contactEmail: 'contact@codeddevs.com',
        contactPhone: '+234 800 123 4567',
        address: 'Lagos, Nigeria',
        twitterUrl: 'https://x.com/codeddevs',
        linkedinUrl: 'https://linkedin.com/company/codeddevs',
        githubUrl: 'https://github.com/onerandomd3v',
        footerNotice: '© 2026 CodedDevs Technology LTD',
        metaTitle: 'CodedDevs | Leading Software Consultancy',
        metaDescription: 'Building resilient modern software.',
        ogImageUrl: 'https://codeddevs.com/og.png',
      };

      globalThis.fetch = async (input: RequestInfo | URL) => {
        assert.ok(input.toString().includes('/api/v1/admin/settings'));
        return new Response(
          JSON.stringify({
            settings: {
              id: true,
              draftPayload: mockSettings,
              publishedPayload: null,
              publishedAt: null,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      };

      const result = await fetchAdminSettings();
      assert.equal(result.companyName, 'CodedDevs');
      assert.equal(result.contactEmail, 'contact@codeddevs.com');
      assert.equal(
        result.metaTitle,
        'CodedDevs | Leading Software Consultancy',
      );
    });

    test('throws SettingsApiError on HTTP error', async () => {
      globalThis.fetch = async () => {
        return new Response(
          JSON.stringify({ error: 'Settings not initialized' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } },
        );
      };

      await assert.rejects(
        async () => {
          await fetchAdminSettings();
        },
        (err: unknown) => {
          assert.ok(err instanceof SettingsApiError);
          assert.equal(err.statusCode, 404);
          assert.equal(err.message, 'Settings not initialized');
          return true;
        },
      );
    });
  });

  describe('updateAdminSettings', () => {
    test('updates settings draft via PUT request', async () => {
      const captured: {
        url?: string;
        method?: string;
        headers?: Headers;
        body?: { settings?: Partial<SiteSettings> };
      } = {};

      globalThis.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        captured.url = input.toString();
        captured.method = init?.method;
        captured.headers = new Headers(init?.headers);
        captured.body = JSON.parse(init?.body as string);
        return new Response(
          JSON.stringify({
            settings: {
              id: true,
              draftPayload: captured.body?.settings,
              publishedPayload: null,
              publishedAt: null,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const partialUpdate: Partial<SiteSettings> = {
        metaTitle: 'New Title',
        metaDescription: 'New Description',
      };

      const result = await updateAdminSettings(partialUpdate);
      assert.equal(captured.method, 'PUT');
      assert.equal(captured.headers?.get(AUTH_CSRF_HEADER), AUTH_CSRF_VALUE);
      assert.ok(captured.url?.includes('/api/v1/admin/settings/draft'));
      assert.equal(captured.body?.settings?.metaTitle, 'New Title');
      assert.equal(result.metaTitle, 'New Title');
    });

    test('throws SettingsApiError on failure', async () => {
      globalThis.fetch = async () => {
        return new Response(JSON.stringify({ error: 'Validation failed' }), {
          status: 422,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await assert.rejects(
        async () => {
          await updateAdminSettings({ companyName: '' });
        },
        (err: unknown) => {
          assert.ok(err instanceof SettingsApiError);
          assert.equal(err.statusCode, 422);
          assert.equal(err.message, 'Validation failed');
          return true;
        },
      );
    });
  });

  describe('publishAdminSettings', () => {
    test('publishes settings live via POST request', async () => {
      const captured: { url?: string; method?: string; headers?: Headers } = {};
      const publishedSettings: SiteSettings = {
        companyName: 'CodedDevs',
        contactEmail: 'contact@codeddevs.com',
      };

      globalThis.fetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ) => {
        captured.url = input.toString();
        captured.method = init?.method;
        captured.headers = new Headers(init?.headers);
        return new Response(
          JSON.stringify({
            settings: {
              id: true,
              draftPayload: publishedSettings,
              publishedPayload: publishedSettings,
              publishedAt: '2026-11-01T00:00:00.000Z',
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const published = await publishAdminSettings();
      assert.equal(captured.method, 'POST');
      assert.equal(captured.headers?.get(AUTH_CSRF_HEADER), AUTH_CSRF_VALUE);
      assert.ok(captured.url?.includes('/api/v1/admin/settings/publish'));
      assert.equal(published.companyName, 'CodedDevs');
    });
  });

  describe('fetchAccountSecurity', () => {
    test('reads the authenticated admin from the current-session endpoint', async () => {
      let capturedUrl = '';
      globalThis.fetch = async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            admin: {
              id: 'admin-1',
              email: 'owner@example.com',
              role: 'SUPER_ADMIN',
            },
            session: { expiresAt: '2026-11-07T12:00:00Z' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      };

      const account = await fetchAccountSecurity();
      assert.equal(capturedUrl, '/api/v1/admin/auth/me');
      assert.deepEqual(account, {
        id: 'admin-1',
        email: 'owner@example.com',
        role: 'SUPER_ADMIN',
      });
    });

    test('returns null when the session is unauthorized', async () => {
      globalThis.fetch = async () => new Response(null, { status: 401 });
      assert.equal(await fetchAccountSecurity(), null);
    });
  });
});
