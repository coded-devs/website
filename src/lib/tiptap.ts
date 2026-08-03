/**
 * Link hardening shared by the admin editor and the public post renderer.
 *
 * Once a post is saved, the hrefs inside its TipTap JSON are stored data. The
 * renderer is the real security boundary — hardening only the editor would
 * leave content written before the fix (or inserted any other way) able to run
 * a `javascript:` URL when a visitor clicks it. Both call sites use this.
 */
export const ALLOWED_LINK_PROTOCOLS = ["http", "https", "mailto"];

export function isAllowedLinkHref(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:");
}
