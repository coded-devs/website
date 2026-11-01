export function getApiOrigin(value) {
  if (!value) throw new Error('API_INTERNAL_ORIGIN is required');

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('API_INTERNAL_ORIGIN must be an HTTP or HTTPS origin');
  }

  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('API_INTERNAL_ORIGIN must be an HTTP or HTTPS origin');
  }

  return url.origin;
}
