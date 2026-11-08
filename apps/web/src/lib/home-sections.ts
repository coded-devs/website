import type { PublishedSite } from './published-site';

export const HOME_SECTION_KEYS = [
  'hero',
  'about',
  'products',
  'services',
  'projects',
  'team',
  'featured_insights',
  'contact',
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

/** Returns the homepage sections that can render their published content. */
export function getRenderableHomeSectionKeys(
  site: PublishedSite | null,
  hasArticles = true,
): Set<HomeSectionKey> {
  if (!site) return new Set();

  const renderable = new Set<HomeSectionKey>();
  for (const { sectionKey, payload } of site.sections) {
    if (!HOME_SECTION_KEYS.includes(sectionKey as HomeSectionKey)) continue;
    const key = sectionKey as HomeSectionKey;
    const heading = payload.heading;
    const body = payload.body;
    const hasCopy = typeof heading === 'string' && Boolean(heading);

    if (key === 'hero' && hasCopy && typeof body === 'string' && body) {
      renderable.add(key);
    } else if (key === 'about' && hasCopy && typeof body === 'string' && body) {
      renderable.add(key);
    } else if (
      key === 'contact' &&
      hasCopy &&
      typeof body === 'string' &&
      body &&
      site.settings?.contactEmail
    ) {
      renderable.add(key);
    } else if (key === 'products' && hasCopy && site.products.length > 0) {
      renderable.add(key);
    } else if (key === 'services' && hasCopy && site.services.length > 0) {
      renderable.add(key);
    } else if (key === 'projects' && hasCopy && site.projects.length > 0) {
      renderable.add(key);
    } else if (key === 'team' && hasCopy && site.team.length > 0) {
      renderable.add(key);
    } else if (key === 'featured_insights' && hasCopy && hasArticles) {
      renderable.add(key);
    }
  }
  return renderable;
}
