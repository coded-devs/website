/**
 * Props for the public site shell (header and footer).
 *
 * These mirror the published site settings from GET /api/v1/public/site
 * (companyName, contactEmail, contactPhone, address, twitterUrl, linkedinUrl,
 * githubUrl, footerNotice). Navigation, footer groups and legal links have no
 * CMS fields yet (docs/design.md open decisions 1 and 5), so their shape here
 * is the proposed contract.
 */

export interface SiteLink {
  label: string;
  /**
   * Internal path ('/insights'), Home section anchor ('/#about') or an
   * absolute http(s) URL for external destinations.
   */
  href: string;
}

export interface SiteNavigation {
  items: SiteLink[];
  action?: SiteLink;
}

export interface FooterLinkGroup {
  title: string;
  links: SiteLink[];
}

export interface SiteContact {
  email: string;
  phone?: string;
  address?: string;
}

export interface SiteSocialLinks {
  twitterUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export interface SiteShellContent {
  companyName: string;
  navigation: SiteNavigation;
  footerGroups: FooterLinkGroup[];
  contact: SiteContact;
  social: SiteSocialLinks;
  legalLinks: SiteLink[];
  footerNotice?: string;
}
