export function getPublicSiteUrl(): URL | undefined {
  const configured = process.env.SITE_URL?.trim();
  if (!configured) {
    return process.env.NODE_ENV === 'production'
      ? undefined
      : new URL('http://localhost:3000');
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error('SITE_URL must be an exact HTTP(S) origin.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('SITE_URL must be an exact HTTP(S) origin.');
  }
  return new URL(url.origin);
}
