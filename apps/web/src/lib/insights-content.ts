import {
  PLACEHOLDER_ARTICLE_BODY,
  PLACEHOLDER_ARTICLES,
} from '../content/placeholder-articles';
import type { PublishedArticleSummary } from '../types/article';
import type { ArticleCardData } from '../types/home';
import {
  fetchPublishedArticleBySlug,
  fetchPublishedArticles,
} from './articles-api';

export interface ArticleDetailData extends ArticleCardData {
  body: string;
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
}

// Development only: with no API running, show labelled placeholder articles
// so the layouts can be reviewed. Production never falls back.
const placeholdersEnabled = () => process.env.NODE_ENV === 'development';

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
  const result = await fetchPublishedArticles({ page, limit: pageSize });
  if (result.items.length === 0 && placeholdersEnabled()) {
    return {
      items: PLACEHOLDER_ARTICLES,
      page: Math.min(page, 3),
      totalPages: 3,
      placeholder: true,
    };
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
  if (placeholdersEnabled()) {
    const placeholder = PLACEHOLDER_ARTICLES.find((a) => a.slug === slug);
    if (placeholder) {
      return {
        ...placeholder,
        body: PLACEHOLDER_ARTICLE_BODY,
        tags: placeholder.tag ? [placeholder.tag] : [],
      };
    }
  }
  return null;
}

export async function getRelatedArticles(
  slug: string,
  count = 3,
): Promise<ArticleCardData[]> {
  const { items } = await getInsightsPage(1);
  return items.filter((a) => a.slug !== slug).slice(0, count);
}
