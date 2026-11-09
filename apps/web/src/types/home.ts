/**
 * Home page content. Mirrors docs/handoff/content-model.md: existing API
 * fields plus the proposed ones (focusAreas, mission, vision, values,
 * statement, images) that the design needs.
 */
import type { SiteLink } from './site';

export interface MediaImage {
  src: string;
  alt: string;
}

export interface FocusArea {
  name: string;
  description: string;
  image: MediaImage;
}

export interface HeroContent {
  eyebrow?: string;
  heading: string;
  body: string;
  primaryCallToAction?: SiteLink;
  secondaryCallToAction?: SiteLink;
  /** Community photo collage beside the heading (proposed field). */
  images: MediaImage[];
  focusAreas: FocusArea[];
}

export interface AboutContent {
  heading: string;
  /** Story paragraphs. The first renders as lead text. */
  body: string[];
  /** Large scroll-revealed statement. */
  statement?: string;
  mission?: string;
  vision?: string;
  /** Photo paired with the mission statement (proposed field). */
  missionImage?: MediaImage;
  values?: { title: string; description: string }[];
  image?: MediaImage;
  /** Photos for the scrolling community strip (proposed field). */
  community?: MediaImage[];
}

export interface ProductItem {
  name: string;
  tagline: string;
  description: string;
  url?: string;
  badge?: string;
  sector?: string;
  image?: MediaImage;
}

export interface ServiceItem {
  title: string;
  description: string;
  features: string[];
  /** Photo for the service card (proposed field). */
  image?: MediaImage;
}

export interface ProjectItem {
  title: string;
  client?: string;
  summary: string;
  outcome?: string;
  tags: string[];
  image?: MediaImage;
}

export interface TeamMember {
  name: string;
  role: string;
  avatar?: MediaImage;
  linkedinUrl?: string;
}

export interface ArticleCardData {
  slug: string;
  title: string;
  excerpt: string;
  tag?: string;
  publishedAt: string;
  readTimeMinutes?: number;
  cover?: MediaImage;
}

export interface SectionCopy {
  heading: string;
  introduction?: string;
}

export interface HomeContent {
  hero: HeroContent;
  about: AboutContent;
  products: SectionCopy & { items: ProductItem[] };
  services: SectionCopy & { items: ServiceItem[] };
  projects: SectionCopy & { items: ProjectItem[] };
  team: SectionCopy & { items: TeamMember[] };
  insights: SectionCopy & { items: ArticleCardData[] };
  contact: { heading: string; body: string; email: string };
}
