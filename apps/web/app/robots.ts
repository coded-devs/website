import type { MetadataRoute } from 'next';
import { getPublicSiteUrl } from '../src/lib/site-url';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();
  return {
    rules: { userAgent: '*', allow: '/' },
    ...(siteUrl
      ? { sitemap: new URL('/sitemap.xml', siteUrl).toString() }
      : {}),
  };
}
