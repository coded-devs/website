import type { Metadata } from 'next';
import { Fragment, type ReactNode } from 'react';
import { About } from '../src/components/home/about';
import { Contact } from '../src/components/home/contact';
import { FocusAreas } from '../src/components/home/focus-areas';
import { Hero } from '../src/components/home/hero';
import { Insights } from '../src/components/home/insights';
import { Principles } from '../src/components/home/principles';
import { Products } from '../src/components/home/products';
import { Projects } from '../src/components/home/projects';
import { Services } from '../src/components/home/services';
import { Team } from '../src/components/home/team';
import { Container } from '../src/components/container';
import { fetchPublishedArticles } from '../src/lib/articles-api';
import { toCardData } from '../src/lib/insights-content';
import { getPublishedSite } from '../src/lib/published-site';
import {
  getRenderableHomeSectionKeys,
  type HomeSectionKey,
} from '../src/lib/home-sections';
import { getPublicSiteUrl } from '../src/lib/site-url';
import type { AboutContent, FocusArea, MediaImage } from '../src/types/home';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { settings } = await getPublishedSite();
    return {
      title: settings?.metaTitle || settings?.companyName || 'CodedDevs',
      description: settings?.metaDescription,
      alternates: getPublicSiteUrl() ? { canonical: '/' } : undefined,
      openGraph: {
        title: settings?.metaTitle || settings?.companyName || 'CodedDevs',
        description: settings?.metaDescription,
        images: settings?.ogImageUrl ? [settings.ogImageUrl] : undefined,
        type: 'website',
      },
    };
  } catch {
    return { title: 'CodedDevs' };
  }
}

export default async function Home() {
  const site = await getPublishedSite();
  const articles = await fetchPublishedArticles({ page: 1, limit: 6 }).catch(
    () => null,
  );
  const renderableKeys = getRenderableHomeSectionKeys(
    site,
    Boolean(articles?.items.length),
  );
  const sections = new Map(
    site.sections.map(({ sectionKey, payload }) => [sectionKey, payload]),
  );
  const copy = (key: string) =>
    sections.get(key) as
      | {
          heading?: string;
          body?: string;
          introduction?: string;
          primaryCallToAction?: { label: string; href: string };
          secondaryCallToAction?: { label: string; href: string };
          images?: MediaImage[];
          focusAreasHeading?: string;
          focusAreasIntroduction?: string;
          focusAreas?: FocusArea[];
          statement?: string;
          mission?: string;
          missionImage?: MediaImage;
          vision?: string;
          values?: { title: string; description: string }[];
          image?: MediaImage;
          community?: MediaImage[];
        }
      | undefined;
  const renderSection = (key: string): ReactNode => {
    const content = copy(key);
    if (!content) return null;

    switch (key) {
      case 'hero':
        return (
          <>
            <Hero
              content={{
                heading: content.heading!,
                body: content.body!,
                primaryCallToAction: content.primaryCallToAction,
                secondaryCallToAction: content.secondaryCallToAction,
                images: content.images ?? [],
                focusAreas: content.focusAreas ?? [],
              }}
            />
            <FocusAreas
              items={content.focusAreas ?? []}
              heading={content.focusAreasHeading}
              introduction={content.focusAreasIntroduction}
            />
          </>
        );
      case 'about':
        return (
          <>
            <About
              content={
                {
                  heading: content.heading!,
                  body: content.body!.split(/\n\s*\n/).filter(Boolean),
                  statement: content.statement,
                  mission: content.mission,
                  missionImage: content.missionImage,
                  vision: content.vision,
                  values: content.values ?? [],
                  image: content.image,
                  community: content.community ?? [],
                } satisfies AboutContent
              }
            />
            <Principles
              content={
                {
                  heading: content.heading!,
                  body: content.body!.split(/\n\s*\n/).filter(Boolean),
                  statement: content.statement,
                  mission: content.mission,
                  missionImage: content.missionImage,
                  vision: content.vision,
                  values: content.values ?? [],
                  image: content.image,
                  community: content.community ?? [],
                } satisfies AboutContent
              }
            />
          </>
        );
      case 'products':
        return (
          <Products
            content={{
              heading: content.heading!,
              introduction: content.introduction,
              items: site.products.map(({ payload }) => ({
                name: payload.name,
                tagline: payload.tagline,
                description: payload.description,
                url: payload.url,
                badge: payload.badge,
                sector: payload.sector,
                image: payload.imageUrl
                  ? { src: payload.imageUrl, alt: payload.imageAlt ?? '' }
                  : undefined,
              })),
            }}
          />
        );
      case 'services':
        return (
          <Services
            content={{
              heading: content.heading!,
              introduction: content.introduction,
              items: site.services.map(({ payload }) => ({
                title: payload.title,
                description: payload.description,
                features: payload.features ?? [],
                image: payload.imageUrl
                  ? { src: payload.imageUrl, alt: payload.imageAlt ?? '' }
                  : undefined,
              })),
            }}
          />
        );
      case 'projects':
        return (
          <Projects
            content={{
              heading: content.heading!,
              introduction: content.introduction,
              items: site.projects.map(({ payload }) => ({
                title: payload.title,
                client: payload.client,
                summary: payload.summary,
                outcome: payload.outcome,
                tags: payload.tags ?? [],
                image: payload.imageUrl
                  ? { src: payload.imageUrl, alt: payload.imageAlt ?? '' }
                  : undefined,
              })),
            }}
          />
        );
      case 'team':
        return (
          <Team
            content={{
              heading: content.heading!,
              introduction: content.introduction,
              items: site.team.map(({ payload }) => ({
                name: payload.name,
                role: payload.role,
                linkedinUrl: payload.linkedinUrl,
                avatar: payload.avatarUrl
                  ? {
                      src: payload.avatarUrl,
                      alt: `${payload.name}, ${payload.role}`,
                    }
                  : undefined,
              })),
            }}
          />
        );
      case 'featured_insights':
        return articles?.items.length ? (
          <Insights
            content={{
              heading: content.heading!,
              introduction: content.introduction,
              items: articles.items.map(toCardData),
            }}
          />
        ) : null;
      case 'contact':
        return (
          <Contact
            content={{
              heading: content.heading!,
              body: content.body!,
              email: site.settings!.contactEmail,
            }}
          />
        );
      default:
        return null;
    }
  };
  const orderedSections = [...site.sections]
    .sort((left, right) => left.position - right.position)
    .filter(({ sectionKey }) =>
      renderableKeys.has(sectionKey as HomeSectionKey),
    )
    .filter(
      ({ sectionKey }, index, entries) =>
        entries.findIndex((entry) => entry.sectionKey === sectionKey) === index,
    );
  const hasHero = renderableKeys.has('hero');

  return (
    <>
      {!hasHero && (
        <Container>
          <h1>CodedDevs</h1>
        </Container>
      )}
      {orderedSections.map(({ sectionKey }) => (
        <Fragment key={sectionKey}>{renderSection(sectionKey)}</Fragment>
      ))}
    </>
  );
}
