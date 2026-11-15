import {
  PLACEHOLDER_ARTICLE_BODY,
  PLACEHOLDER_ARTICLES,
} from '../content/placeholder-articles.ts';
import type {
  PaginatedArticlesResponse,
  PublishedArticleSummary,
} from '../types/article.ts';
import type { ArticleCardData } from '../types/home.ts';
import {
  fetchPublishedArticleBySlug,
  fetchPublishedArticles,
} from './articles-api.ts';
import { getPublishedSite } from './published-site.ts';
import { shouldUseHistoricalHomeFallback } from './home-sections.ts';

export interface ArticleDetailData extends ArticleCardData {
  body: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

async function historicalContentFallbackIsActive(): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') return true;
  const site = await getPublishedSite(AbortSignal.timeout(2500)).catch(
    () => null,
  );
  return shouldUseHistoricalHomeFallback(site);
}

function historicalInsightsPage(page: number, pageSize: number) {
  const totalPages = Math.max(
    1,
    Math.ceil(PLACEHOLDER_ARTICLES.length / pageSize),
  );
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: PLACEHOLDER_ARTICLES.slice(start, start + pageSize),
    page: currentPage,
    totalPages,
    placeholder: true,
  };
}

function historicalArticle(slug: string): ArticleDetailData | null {
  const article = PLACEHOLDER_ARTICLES.find((item) => item.slug === slug);
  if (!article) return null;
  return {
    ...article,
    body: PLACEHOLDER_ARTICLE_BODY,
    tags: article.tag ? [article.tag] : [],
  };
}

export function toCardData(article: PublishedArticleSummary): ArticleCardData {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.summary,
    tag: article.tags?.[0],
    publishedAt: article.publishedAt,
    cover: article.coverImage?.url
      ? { src: article.coverImage.url, alt: article.coverImage.altText ?? '' }
      : undefined,
  };
}

export async function getInsightsPage(page: number, pageSize = 7) {
  const safePageSize = Math.max(1, pageSize);
  let result: PaginatedArticlesResponse;
  try {
    result = await fetchPublishedArticles({ page, limit: safePageSize });
  } catch (error) {
    if (await historicalContentFallbackIsActive()) {
      return historicalInsightsPage(page, safePageSize);
    }
    throw error;
  }

  if (result.items.length > 0) {
    return {
      items: result.items.map(toCardData),
      page: result.page,
      totalPages: result.totalPages,
      placeholder: false,
    };
  }

  if (await historicalContentFallbackIsActive()) {
    return historicalInsightsPage(page, safePageSize);
  }

  return {
    items: result.items.map(toCardData),
    page: result.page,
    totalPages: result.totalPages,
    placeholder: false,
  };
}

export async function getArticle(
  slug: string,
): Promise<ArticleDetailData | null> {
  let fallbackActive = false;
  try {
    const article = await fetchPublishedArticleBySlug(slug);
    if (article) {
      return {
        ...toCardData(article),
        body: article.content || article.summary,
        tags: article.tags ?? [],
        metaTitle: article.seoTitle,
        metaDescription: article.seoDescription,
        canonicalUrl: article.canonicalUrl,
      };
    }
  } catch (error) {
    fallbackActive = await historicalContentFallbackIsActive();
    if (!fallbackActive) throw error;
  }
  if (!fallbackActive) {
    fallbackActive = await historicalContentFallbackIsActive();
  }
  return fallbackActive ? historicalArticle(slug) : null;
}

export async function getRelatedArticles(
  slug: string,
  count = 3,
): Promise<ArticleCardData[]> {
  try {
    const { items } = await getInsightsPage(1);
    return items.filter((a) => a.slug !== slug).slice(0, count);
  } catch (error) {
    console.error('Error fetching related articles:', error);
    return [];
  }
}
