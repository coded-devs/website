import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import type { ReactNode } from 'react';
import './tokens.css';
import './globals.css';
import { SiteFooter } from '../src/components/site-footer';
import { SiteHeader } from '../src/components/site-header';
import { PLACEHOLDER_SITE_CONTENT } from '../src/content/placeholder-site';

// Poppins is self-hosted by next/font at build time: no runtime request to a
// font CDN. Only the weights docs/brand.md approves.
const poppins = Poppins({
  weight: ['400', '500', '600'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'CodedDevs',
  icons: {
    icon: [
      { url: '/assets/logos/codeddevs-favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/logos/codeddevs-favicon.ico', sizes: '16x16 32x32' },
    ],
    apple: '/assets/logos/codeddevs-apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // Placeholder until GET /api/v1/public/site is integrated.
  const site = PLACEHOLDER_SITE_CONTENT;
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader navigation={site.navigation} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter
          companyName={site.companyName}
          footerGroups={site.footerGroups}
          contact={site.contact}
          social={site.social}
          legalLinks={site.legalLinks}
          footerNotice={site.footerNotice}
        />
      </body>
    </html>
  );
}
