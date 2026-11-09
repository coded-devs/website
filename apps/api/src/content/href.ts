import { z } from 'zod';

function isSupportedContentHref(value: string): boolean {
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return (
        (url.protocol === 'https:' || url.protocol === 'http:') &&
        Boolean(url.hostname) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }
  if (value.startsWith('#')) return /^#[\w-]+$/.test(value);
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return false;
  }
  try {
    return (
      new URL(value, 'https://codeddevs.invalid').origin ===
      'https://codeddevs.invalid'
    );
  } catch {
    return false;
  }
}

export const contentHrefSchema = z
  .string()
  .trim()
  .min(1)
  .max(2_048)
  .refine(
    isSupportedContentHref,
    'Use an internal path, anchor, or HTTP(S) URL.',
  );
