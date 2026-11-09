export type HomepageSectionKey =
  | 'hero'
  | 'about'
  | 'services'
  | 'products'
  | 'projects'
  | 'team'
  | 'featured_insights'
  | 'contact';

export interface CallToAction {
  label: string;
  href: string;
}

export interface HeroPayload {
  eyebrow?: string;
  heading: string;
  body: string;
  primaryCallToAction?: CallToAction;
  secondaryCallToAction?: CallToAction;
  images?: ContentImage[];
  focusAreasHeading?: string;
  focusAreasIntroduction?: string;
  focusAreas?: {
    name: string;
    description: string;
    image: ContentImage;
  }[];
}

export interface ContentImage {
  src: string;
  alt: string;
}

export interface AboutPayload {
  heading: string;
  body: string;
  statement?: string;
  mission?: string;
  missionImage?: ContentImage;
  vision?: string;
  values?: { title: string; description: string }[];
  image?: ContentImage;
  community?: ContentImage[];
}

export interface SectionWithIntroPayload {
  heading: string;
  introduction?: string;
}

export interface ContactSectionPayload {
  heading: string;
  body: string;
}

export type SectionPayloadMap = {
  hero: HeroPayload;
  about: AboutPayload;
  services: SectionWithIntroPayload;
  products: SectionWithIntroPayload;
  projects: SectionWithIntroPayload;
  team: SectionWithIntroPayload;
  featured_insights: SectionWithIntroPayload;
  contact: ContactSectionPayload;
};

export interface ContentSection<T = Record<string, unknown>> {
  id: string;
  sectionKey: HomepageSectionKey;
  position: number;
  publishedPosition: number | null;
  draftPayload: T;
  publishedPayload: T | null;
  draftVisible: boolean;
  publishedVisible: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ContentRecord<T = Record<string, unknown>> {
  id: string;
  position: number;
  publishedPosition: number | null;
  draftPayload: T;
  publishedPayload: T | null;
  draftVisible: boolean;
  publishedVisible: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ServiceItemPayload {
  title: string;
  description: string;
  icon?: string;
  features?: string[];
  imageUrl?: string;
  imageAlt?: string;
}

export interface ProductItemPayload {
  name: string;
  tagline: string;
  description: string;
  url?: string;
  badge?: string;
  sector?: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface ProjectItemPayload {
  title: string;
  client?: string;
  summary: string;
  outcome?: string;
  tags?: string[];
  imageUrl?: string;
  imageAlt?: string;
}

export interface TeamMemberPayload {
  name: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface SiteSettingsPayload {
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  navigationAction?: CallToAction;
  footerGroups?: { title: string; links: CallToAction[] }[];
  legalLinks?: CallToAction[];
  footerNotice?: string;
  ogImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export type SiteSettingsDraftInput = Omit<
  SiteSettingsPayload,
  'navigationAction'
> & { navigationAction?: CallToAction | null };

export interface SiteSettingsRecord {
  id: boolean;
  draftPayload: SiteSettingsPayload;
  publishedPayload: SiteSettingsPayload | null;
  publishedAt: string | null;
  updatedAt: string;
}
