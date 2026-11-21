export interface SettingsLink {
  label: string;
  href: string;
}

export interface SiteSettings {
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  navigationAction?: SettingsLink;
  footerGroups?: { title: string; links: SettingsLink[] }[];
  legalLinks?: SettingsLink[];
  footerNotice?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
}

export interface SiteSettingsRecord {
  draftPayload: SiteSettings;
  publishedPayload: SiteSettings | null;
  publishedAt: string | null;
}

export type { AdminUser as AccountSecurity } from '@codeddevs/auth-contract';
