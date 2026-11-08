import type { MetadataRoute } from 'next';
import { fetchPublishedArticles } from '../src/lib/articles-api';
import { getPublicSiteUrl } from '../src/lib/site-url';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl();
  if (!siteUrl) return [];

  const routes: MetadataRoute.Sitemap = [
    {
      url: new URL('/', siteUrl).toString(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: new URL('/insights', siteUrl).toString(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  try {
    const firstPage = await fetchPublishedArticles({ page: 1, limit: 50 });
    for (const article of firstPage.items) {
      routes.push({
        url: new URL(
          `/insights/${encodeURIComponent(article.slug)}`,
          siteUrl,
        ).toString(),
        lastModified: article.publishedAt,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
    for (let page = 2; page <= firstPage.totalPages; page += 1) {
      const result = await fetchPublishedArticles({ page, limit: 50 });
      for (const article of result.items) {
        routes.push({
          url: new URL(
            `/insights/${encodeURIComponent(article.slug)}`,
            siteUrl,
          ).toString(),
          lastModified: article.publishedAt,
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      }
    }
  } catch (error) {
    console.error('Could not add published articles to sitemap:', error);
  }
  return routes;
}
