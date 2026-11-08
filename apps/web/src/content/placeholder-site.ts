import type { SiteShellContent } from '../types/site';

/**
 * PLACEHOLDER CONTENT. NOT REAL CMS DATA.
 *
 * Shaped like SiteShellContent so the shell can render before the
 * GET /api/v1/public/site integration exists. Replace this with the API
 * response when that work lands. Contact details, social URLs and legal
 * pages below are placeholders and must not ship to production.
 */
export const PLACEHOLDER_SITE_CONTENT: SiteShellContent = {
  companyName: 'CodedDevs Technology Ltd',
  navigation: {
    items: [
      { label: 'About', href: '/#about' },
      { label: 'Services', href: '/#services' },
      { label: 'Products', href: '/#products' },
      { label: 'Insights', href: '/insights' },
    ],
    action: { label: 'Say hello', href: '/#contact' },
  },
  footerGroups: [
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/#about' },
        { label: 'Services', href: '/#services' },
        { label: 'Projects', href: '/#projects' },
        { label: 'Team', href: '/#team' },
      ],
    },
    {
      title: 'Products',
      links: [
        { label: 'All products', href: '/#products' },
        { label: 'Example product', href: 'https://example.com' },
      ],
    },
    {
      title: 'Insights',
      links: [
        { label: 'All insights', href: '/insights' },
        { label: 'Latest insights', href: '/#insights' },
      ],
    },
  ],
  contact: {
    email: 'hello@example.com',
    phone: '+000 0000 0000',
    address: 'Lagos, Nigeria',
  },
  social: {
    twitterUrl: 'https://x.com/',
    linkedinUrl: 'https://www.linkedin.com/',
    githubUrl: 'https://github.com/',
  },
  legalLinks: [
    { label: 'Privacy policy', href: '/privacy' },
    { label: 'Terms of use', href: '/terms' },
  ],
};
