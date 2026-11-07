import type {
  PublishedArticleSummary,
  PaginatedArticlesResponse,
  PublishedArticleDetail,
} from '../types/article';

export function getApiBaseUrl(): string {
  const configuredApiUrl = process.env.API_URL;
  const isProduction = process.env.NODE_ENV === 'production';
  if (configuredApiUrl === undefined) {
    if (isProduction) {
      throw new Error('API_URL must be configured in production.');
    }
    return 'http://localhost:4000';
  }

  const trimmedApiUrl = configuredApiUrl.trim();
  if (!trimmedApiUrl && isProduction) {
    throw new Error('API_URL must be configured in production.');
  }

  let apiUrl: URL;
  try {
    apiUrl = new URL(trimmedApiUrl);
  } catch {
    throw new Error('API_URL must be an exact HTTP(S) origin.');
  }

  if (
    !['http:', 'https:'].includes(apiUrl.protocol) ||
    apiUrl.username ||
    apiUrl.password ||
    apiUrl.pathname !== '/' ||
    apiUrl.search ||
    apiUrl.hash ||
    trimmedApiUrl.includes('?') ||
    trimmedApiUrl.includes('#')
  ) {
    throw new Error('API_URL must be an exact HTTP(S) origin.');
  }

  return apiUrl.origin;
}

function isArticleSummary(value: unknown): value is PublishedArticleSummary {
  if (!value || typeof value !== 'object') return false;
  const article = value as Partial<PublishedArticleSummary>;
  return (
    typeof article.id === 'string' &&
    typeof article.slug === 'string' &&
    typeof article.title === 'string' &&
    typeof article.summary === 'string' &&
    typeof article.publishedAt === 'string'
  );
}

export async function fetchPublishedArticles(options?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedArticlesResponse> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const baseUrl = getApiBaseUrl();
  const url = new URL('/api/v1/public/articles', baseUrl);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 60,
        tags: ['articles', 'insights'],
      },
    });

    if (!response.ok)
      throw new Error(`Articles API returned ${response.status}.`);

    const data: unknown = await response.json();
    if (
      !data ||
      typeof data !== 'object' ||
      !Array.isArray((data as Partial<PaginatedArticlesResponse>).items) ||
      !(data as Partial<PaginatedArticlesResponse>).items!.every(
        isArticleSummary,
      ) ||
      !Number.isFinite((data as Partial<PaginatedArticlesResponse>).total) ||
      !Number.isFinite((data as Partial<PaginatedArticlesResponse>).page) ||
      !Number.isFinite((data as Partial<PaginatedArticlesResponse>).pageSize) ||
      !Number.isFinite((data as Partial<PaginatedArticlesResponse>).totalPages)
    ) {
      throw new Error('Articles API returned an invalid articles response.');
    }
    return data as PaginatedArticlesResponse;
  } catch (error) {
    console.error('Error fetching published articles:', error);
    throw error;
  }
}

export async function fetchPublishedArticleBySlug(
  slug: string,
): Promise<PublishedArticleDetail | null> {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  const baseUrl = getApiBaseUrl();
  const url = new URL(
    `/api/v1/public/articles/${encodeURIComponent(slug)}`,
    baseUrl,
  );

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      next: {
        revalidate: 60,
        tags: [`article-${slug}`, 'insights'],
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok)
      throw new Error(`Articles API returned ${response.status}.`);

    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') {
      throw new Error('Articles API returned an invalid article response.');
    }
    const responseData = data as {
      article?: unknown;
    } & Partial<PublishedArticleDetail>;
    const article =
      responseData.article ??
      (responseData.slug && responseData.title ? responseData : null);
    if (
      !isArticleSummary(article) ||
      typeof (article as PublishedArticleDetail).content !== 'string'
    ) {
      throw new Error('Articles API returned an invalid article response.');
    }
    return article as PublishedArticleDetail;
  } catch (error) {
    console.error(`Error fetching article for slug "${slug}":`, error);
    throw error;
  }
}
