export interface SiteSettings {
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
}

export type { AdminUser as AccountSecurity } from '@codeddevs/auth-contract';
