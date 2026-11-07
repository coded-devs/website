import type { MediaAsset, MediaUploadResponse } from '../types/media';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';

const csrfHeaders = { [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE };

async function mediaApiError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as {
    error?: unknown;
  } | null;
  return new MediaApiError(
    typeof body?.error === 'string'
      ? body.error
      : `${fallback} (status ${response.status})`,
    response.status,
  );
}

export class MediaApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'MediaApiError';
    this.statusCode = statusCode;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function fetchMediaAssets(params?: {
  search?: string;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  page?: number;
  limit?: number;
}): Promise<MediaAsset[]> {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.mimeType) query.set('mimeType', params.mimeType);
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));

  const qs = query.toString();
  const url = `/api/v1/admin/media${qs ? `?${qs}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw await mediaApiError(response, 'Failed to fetch media assets');
  }

  const data = (await response.json()) as { assets?: unknown };
  if (!Array.isArray(data?.assets)) {
    throw new MediaApiError('Invalid media list response');
  }
  return data.assets as MediaAsset[];
}

export async function uploadMediaAsset(
  file: File,
  altText?: string,
): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);
  if (altText) {
    formData.append('altText', altText);
  }

  const response = await fetch('/api/v1/admin/media/upload', {
    method: 'POST',
    headers: csrfHeaders,
    credentials: 'same-origin',
    body: formData,
  });

  if (!response.ok) {
    throw await mediaApiError(response, 'Failed to upload media asset');
  }

  const data: MediaUploadResponse = await response.json();
  return data.asset;
}

export async function updateMediaAssetAltText(
  id: string,
  altText: string,
): Promise<MediaAsset> {
  const response = await fetch(
    `/api/v1/admin/media/${encodeURIComponent(id)}/alt-text`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...csrfHeaders,
      },
      credentials: 'same-origin',
      body: JSON.stringify({ altText }),
    },
  );

  if (!response.ok) {
    throw await mediaApiError(response, 'Failed to update alt text');
  }

  const data = (await response.json()) as { asset: MediaAsset };
  return data.asset;
}

export async function deleteMediaAsset(
  id: string,
  referencesCount = 0,
): Promise<{ success: boolean; id: string }> {
  // Safeguard: Check if asset is referenced by content sections or articles
  if (referencesCount > 0) {
    throw new MediaApiError(
      'Cannot delete media asset because it is currently referenced by published or draft content. Please unlink or replace it first.',
      409,
    );
  }

  const response = await fetch(
    `/api/v1/admin/media/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { Accept: 'application/json', ...csrfHeaders },
      credentials: 'same-origin',
    },
  );

  if (!response.ok) {
    throw await mediaApiError(response, 'Failed to delete media asset');
  }

  return { success: true, id };
}
