import type { PublishedArticleSummary } from '../types/article.ts';
import type { ArticleCardData } from '../types/home.ts';
import {
  fetchPublishedArticleBySlug,
  fetchPublishedArticles,
} from './articles-api.ts';

export interface ArticleDetailData extends ArticleCardData {
  body: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

export function toCardData(article: PublishedArticleSummary): ArticleCardData {
  return {
    slug: article.slug,
    title: article.title,
    excerpt: article.summary,
    tag: article.tags?.[0],
    publishedAt: article.publishedAt,
    readTimeMinutes: article.readTimeMinutes,
    isSpotlight: article.isSpotlight,
    cover: article.coverImage?.url
      ? { src: article.coverImage.url, alt: article.coverImage.altText ?? '' }
      : undefined,
  };
}

export async function getInsightsPage(page: number, pageSize = 7) {
  const safePageSize = Math.max(1, pageSize);
  const result = await fetchPublishedArticles({ page, limit: safePageSize });
  return {
    items: result.items.map(toCardData),
    page: result.page,
    totalPages: result.totalPages,
  };
}

export async function getArticle(
  slug: string,
): Promise<ArticleDetailData | null> {
  const article = await fetchPublishedArticleBySlug(slug);
  if (!article) return null;
  return {
    ...toCardData(article),
    body: article.content || article.summary,
    tags: article.tags ?? [],
    metaTitle: article.seoTitle,
    metaDescription: article.seoDescription,
    canonicalUrl: article.canonicalUrl,
  };
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
