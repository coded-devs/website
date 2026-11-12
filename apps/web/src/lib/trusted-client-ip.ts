/**
 * Cloudflare replaces this header on requests that reach the origin through
 * its edge. Never use X-Forwarded-For here: visitors can supply that header.
 */
export function getTrustedClientIp(headers: Headers): string | undefined {
  const value = headers.get('cf-connecting-ip');
  if (!value || value.length > 45 || value !== value.trim()) return undefined;

  if (value.includes(':')) {
    try {
      const hostname = new URL(`http://[${value}]/`).hostname;
      return hostname.startsWith('[') && hostname.endsWith(']')
        ? value
        : undefined;
    } catch {
      return undefined;
    }
  }

  const octets = value.split('.');
  return octets.length === 4 &&
    octets.every(
      (octet) => /^(0|[1-9]\d{0,2})$/.test(octet) && Number(octet) <= 255,
    )
    ? value
    : undefined;
}
