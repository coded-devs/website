import type { Metadata } from 'next';
import { Contact } from '../src/components/home/contact';
import { Hero } from '../src/components/home/hero';
import { Insights } from '../src/components/home/insights';
import { Products } from '../src/components/home/products';
import { Projects } from '../src/components/home/projects';
import { Services } from '../src/components/home/services';
import { Team } from '../src/components/home/team';
import { Container } from '../src/components/container';
import { fetchPublishedArticles } from '../src/lib/articles-api';
import { toCardData } from '../src/lib/insights-content';
import { getPublishedSite } from '../src/lib/published-site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { settings } = await getPublishedSite();
    return {
      title: settings?.metaTitle || settings?.companyName || 'CodedDevs',
      description: settings?.metaDescription,
      alternates: { canonical: '/' },
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
  const section = (key: string) =>
    site.sections.find((entry) => entry.sectionKey === key)?.payload;
  const hero = section('hero') as
    | {
        eyebrow?: string;
        heading?: string;
        body?: string;
        primaryCallToAction?: { label: string; href: string };
      }
    | undefined;
  const about = section('about') as
    { heading?: string; body?: string } | undefined;
  const contact = section('contact') as
    { heading?: string; body?: string } | undefined;
  const copy = (key: string) =>
    section(key) as { heading?: string; introduction?: string } | undefined;
  const articles = await fetchPublishedArticles({ page: 1, limit: 6 }).catch(
    () => null,
  );

  return (
    <>
      {hero?.heading && hero.body ? (
        <Hero
          content={{
            heading: hero.heading,
            body: hero.body,
            primaryCallToAction: hero.primaryCallToAction,
            images: [],
            focusAreas: [],
          }}
        />
      ) : null}
      {about?.heading && about.body ? (
        <Container>
          <section id="about" aria-labelledby="about-title">
            <h2 id="about-title">{about.heading}</h2>
            <p>{about.body}</p>
          </section>
        </Container>
      ) : null}
      {site.products.length > 0 && copy('products')?.heading ? (
        <Products
          content={{
            heading: copy('products')!.heading!,
            introduction: copy('products')!.introduction,
            items: site.products.map(({ payload }) => ({
              name: payload.name,
              tagline: payload.tagline,
              description: payload.description,
              url: payload.url,
              badge: payload.badge,
            })),
          }}
        />
      ) : null}
      {site.services.length > 0 && copy('services')?.heading ? (
        <Services
          content={{
            heading: copy('services')!.heading!,
            introduction: copy('services')!.introduction,
            items: site.services.map(({ payload }) => ({
              title: payload.title,
              description: payload.description,
              features: payload.features ?? [],
            })),
          }}
        />
      ) : null}
      {site.projects.length > 0 && copy('projects')?.heading ? (
        <Projects
          content={{
            heading: copy('projects')!.heading!,
            introduction: copy('projects')!.introduction,
            items: site.projects.map(({ payload }) => ({
              title: payload.title,
              client: payload.client,
              summary: payload.summary,
              outcome: payload.outcome,
              tags: payload.tags ?? [],
            })),
          }}
        />
      ) : null}
      {site.team.length > 0 && copy('team')?.heading ? (
        <Team
          content={{
            heading: copy('team')!.heading!,
            introduction: copy('team')!.introduction,
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
      ) : null}
      {copy('featured_insights')?.heading && articles?.items.length ? (
        <Insights
          content={{
            heading: copy('featured_insights')!.heading!,
            introduction: copy('featured_insights')!.introduction,
            items: articles.items.map(toCardData),
          }}
        />
      ) : null}
      {contact?.heading && contact.body && site.settings?.contactEmail ? (
        <Contact
          content={{
            heading: contact.heading,
            body: contact.body,
            email: site.settings.contactEmail,
          }}
        />
      ) : null}
    </>
  );
}
