/**
 * Link helpers for the site shell. Home is one landing page, so section links
 * are stored as '/#section'. On Home they render as in-page anchors ('#about');
 * on every other page they resolve back to Home ('/#about').
 */

const EXTERNAL_HREF = /^https?:\/\//i;

export function isExternalHref(href: string): boolean {
  return EXTERNAL_HREF.test(href);
}

function sectionHash(href: string): string | null {
  if (href.startsWith('/#')) return href.slice(1);
  if (href.startsWith('#')) return href;
  return null;
}

export function resolveNavHref(href: string, pathname: string): string {
  if (isExternalHref(href)) return href;
  const hash = sectionHash(href);
  if (hash === null) return href;
  return pathname === '/' ? hash : `/${hash}`;
}

/**
 * True when the link points at the current page or one of its children.
 * Section anchors and external links are never the current page.
 */
export function isCurrentPath(href: string, pathname: string): boolean {
  if (isExternalHref(href) || sectionHash(href) !== null) return false;
  if (href === '/') return pathname === '/';
  const base = href.replace(/\/+$/, '');
  return pathname === base || pathname.startsWith(`${base}/`);
}
