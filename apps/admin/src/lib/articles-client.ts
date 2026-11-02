import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import type {
  AdminArticle,
  AdminArticleInput,
  ArticlePreview,
  ArticleStatus,
  PaginatedAdminArticles,
} from '../types/article';

export class ArticleApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ArticleApiError';
    this.statusCode = statusCode;
  }
}

const csrfHeaders = { [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE };

async function requireOk(response: Response, action: string) {
  if (response.ok) return;
  const errorBody = (await response.json().catch(() => null)) as {
    error?: unknown;
  } | null;
  const message =
    typeof errorBody?.error === 'string'
      ? errorBody.error
      : `${action} (status ${response.status})`;
  throw new ArticleApiError(message, response.status);
}

function articleEnvelope(value: unknown): { article: AdminArticle } {
  return value as { article: AdminArticle };
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160);
}

export function calculateReadTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

export async function fetchAdminArticles(options?: {
  search?: string;
  status?: ArticleStatus | 'all';
  page?: number;
  limit?: number;
}): Promise<PaginatedAdminArticles> {
  const params = new URLSearchParams();
  if (options?.search !== undefined) params.set('search', options.search);
  if (options?.status !== undefined) params.set('status', options.status);
  if (options?.page !== undefined) params.set('page', String(options.page));
  if (options?.limit !== undefined) params.set('limit', String(options.limit));
  const queryString = params.toString();
  const url = `/api/v1/admin/articles${queryString ? `?${queryString}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });
  await requireOk(response, 'Failed to fetch articles');
  return (await response.json()) as PaginatedAdminArticles;
}

export async function fetchAdminArticleById(id: string): Promise<AdminArticle> {
  if (!id) throw new ArticleApiError('Article ID is required', 400);
  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );
  await requireOk(response, 'Failed to fetch article');
  const result = articleEnvelope(await response.json());
  return result.article;
}

export async function fetchAdminArticlePreview(
  id: string,
): Promise<ArticlePreview> {
  if (!id) throw new ArticleApiError('Article ID is required', 400);
  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}/preview`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );
  await requireOk(response, 'Failed to fetch article preview');
  return ((await response.json()) as { article: ArticlePreview }).article;
}

export async function createArticle(
  input: AdminArticleInput,
  publishImmediately = false,
): Promise<AdminArticle> {
  const response = await fetch('/api/v1/admin/articles', {
    method: 'POST',
    headers: {
      ...csrfHeaders,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({ ...input, publishImmediately }),
  });
  await requireOk(response, 'Failed to create article');
  const result = articleEnvelope(await response.json());
  return result.article;
}

export async function updateArticle(
  id: string,
  input: AdminArticleInput,
): Promise<AdminArticle> {
  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: {
        ...csrfHeaders,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(input),
    },
  );
  await requireOk(response, 'Failed to update article');
  const result = articleEnvelope(await response.json());
  return result.article;
}

async function changeArticlePublication(
  id: string,
  action: 'publish' | 'unpublish',
): Promise<AdminArticle> {
  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}/${action}`,
    {
      method: 'POST',
      headers: { ...csrfHeaders, Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );
  await requireOk(response, `Failed to ${action} article`);
  const result = articleEnvelope(await response.json());
  return result.article;
}

export const publishArticle = (id: string) =>
  changeArticlePublication(id, 'publish');

export const unpublishArticle = (id: string) =>
  changeArticlePublication(id, 'unpublish');

export async function deleteArticle(
  id: string,
): Promise<{ success: boolean; id: string }> {
  const response = await fetch(
    `/api/v1/admin/articles/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
      headers: { ...csrfHeaders, Accept: 'application/json' },
      credentials: 'same-origin',
    },
  );
  await requireOk(response, 'Failed to delete article');
  return { success: true, id };
}
