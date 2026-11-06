import type { SiteSettings } from '../types/settings';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { getCurrentUser } from './auth-client.ts';

const csrfHeaders = { [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE };

export class SettingsApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'SettingsApiError';
    this.statusCode = statusCode;
  }
}

export async function fetchAdminSettings(): Promise<SiteSettings> {
  const response = await fetch('/api/v1/admin/settings', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new SettingsApiError(
      errorBody.error || `Failed to fetch settings (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.settings.draftPayload;
}

export async function updateAdminSettings(
  settings: Partial<SiteSettings>,
): Promise<SiteSettings> {
  const response = await fetch('/api/v1/admin/settings/draft', {
    method: 'PUT',
    headers: {
      ...csrfHeaders,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ settings }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new SettingsApiError(
      errorBody.error ||
        `Failed to update settings draft (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.settings.draftPayload;
}

export async function publishAdminSettings(): Promise<SiteSettings> {
  const response = await fetch('/api/v1/admin/settings/publish', {
    method: 'POST',
    headers: { ...csrfHeaders, Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new SettingsApiError(
      errorBody.error ||
        `Failed to publish settings (status ${response.status})`,
      response.status,
    );
  }

  const data = await response.json();
  return data.settings.publishedPayload;
}

export async function fetchAccountSecurity() {
  return getCurrentUser();
}
