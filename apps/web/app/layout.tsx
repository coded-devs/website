import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import type { ReactNode } from 'react';
import './tokens.css';
import './globals.css';
import { SiteFooter } from '../src/components/site-footer';
import { SiteHeader } from '../src/components/site-header';
import { getPublishedSite } from '../src/lib/published-site';
import {
  getRenderableHomeSectionKeys,
  shouldUseHistoricalHomeFallback,
} from '../src/lib/home-sections';
import { getPublicSiteUrl } from '../src/lib/site-url';
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
  metadataBase: getPublicSiteUrl(),
  openGraph: {
    type: 'website',
    siteName: 'CodedDevs',
    locale: 'en_NG',
  },
  twitter: { card: 'summary_large_image' },
  icons: {
    icon: [
      { url: '/assets/logos/codeddevs-favicon.svg', type: 'image/svg+xml' },
      { url: '/assets/logos/codeddevs-favicon.ico', sizes: '16x16 32x32' },
    ],
    apple: '/assets/logos/codeddevs-apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Shared layout data must never hold every route open indefinitely when the
  // CMS API is unavailable. Page-specific data requests remain independent.
  const site = await getPublishedSite(AbortSignal.timeout(2500)).catch(
    () => null,
  );
  const historicalPreview = shouldUseHistoricalHomeFallback(site);
  const renderableSections = getRenderableHomeSectionKeys(site);
  const settings = site?.settings;
  const shell = historicalPreview ? PLACEHOLDER_SITE_CONTENT : null;
  const navigation = shell?.navigation ?? {
    items: [
      ...(renderableSections.has('about')
        ? [{ label: 'About', href: '/#about' }]
        : []),
      ...(renderableSections.has('services')
        ? [{ label: 'Services', href: '/#services' }]
        : []),
      ...(renderableSections.has('products')
        ? [{ label: 'Products', href: '/#products' }]
        : []),
      { label: 'Insights', href: '/insights' },
    ],
    action: settings?.navigationAction,
  };
  return (
    // suppressHydrationWarning: the inline script adds the "js" class before
    // hydration so reveal animations never hide content when JS is off.
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader navigation={navigation} />
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <SiteFooter
          companyName={
            shell?.companyName ?? settings?.companyName ?? 'CodedDevs'
          }
          footerGroups={shell?.footerGroups ?? settings?.footerGroups ?? []}
          contact={
            {
              email: settings?.contactEmail || shell?.contact?.email || '',
              phone: settings?.contactPhone ?? shell?.contact?.phone,
              address: settings?.address ?? shell?.contact?.address,
            }
          }
          social={
            {
              twitterUrl: settings?.twitterUrl,
              linkedinUrl: settings?.linkedinUrl,
              githubUrl: settings?.githubUrl,
              facebookUrl: settings?.facebookUrl,
              instagramUrl: settings?.instagramUrl,
            }
          }
          legalLinks={shell?.legalLinks ?? settings?.legalLinks ?? []}
          footerNotice={shell?.footerNotice ?? settings?.footerNotice}
        />
      </body>
    </html>
  );
}
