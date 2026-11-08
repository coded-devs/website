import { getApiBaseUrl } from './articles-api.ts';

export interface PublishedSite {
  sections: {
    sectionKey: string;
    position: number;
    payload: Record<string, unknown>;
  }[];
  services: {
    id: string;
    position: number;
    payload: { title: string; description: string; features?: string[] };
  }[];
  products: {
    id: string;
    position: number;
    payload: {
      name: string;
      tagline: string;
      description: string;
      url?: string;
      badge?: string;
    };
  }[];
  projects: {
    id: string;
    position: number;
    payload: {
      title: string;
      client?: string;
      summary: string;
      outcome?: string;
      tags?: string[];
    };
  }[];
  team: {
    id: string;
    position: number;
    payload: {
      name: string;
      role: string;
      bio?: string;
      avatarUrl?: string;
      linkedinUrl?: string;
    };
  }[];
  settings: {
    companyName: string;
    contactEmail: string;
    contactPhone?: string;
    address?: string;
    twitterUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    footerNotice?: string;
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
  } | null;
}

export async function getPublishedSite(): Promise<PublishedSite> {
  const response = await fetch(
    new URL('/api/v1/public/site', getApiBaseUrl()),
    {
      headers: { Accept: 'application/json' },
      ...(process.env.NODE_ENV === 'development'
        ? { cache: 'no-store' as const }
        : { next: { revalidate: 60, tags: ['site'] } }),
    },
  );
  if (!response.ok)
    throw new Error(`Published site API returned ${response.status}.`);
  const value: unknown = await response.json();
  if (
    !value ||
    typeof value !== 'object' ||
    !Array.isArray((value as PublishedSite).sections)
  ) {
    throw new Error('Published site API returned an invalid response.');
  }
  return value as PublishedSite;
}
