import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { getPublicSiteUrl } from './site-url.ts';

describe('getPublicSiteUrl', () => {
  const env = process.env as Record<string, string | undefined>;
  const originalSiteUrl = process.env.SITE_URL;
  const originalNodeEnv = env.NODE_ENV;

  afterEach(() => {
    if (originalSiteUrl === undefined) delete process.env.SITE_URL;
    else process.env.SITE_URL = originalSiteUrl;
    if (originalNodeEnv === undefined) delete env.NODE_ENV;
    else env.NODE_ENV = originalNodeEnv;
  });

  it('uses localhost only outside production when no origin is configured', () => {
    env.NODE_ENV = 'test';
    delete process.env.SITE_URL;
    assert.equal(getPublicSiteUrl()?.origin, 'http://localhost:3000');
  });

  it('does not invent a canonical host in production', () => {
    env.NODE_ENV = 'production';
    delete process.env.SITE_URL;
    assert.equal(getPublicSiteUrl(), undefined);
  });

  it('accepts only an exact HTTP(S) origin', () => {
    env.NODE_ENV = 'production';
    process.env.SITE_URL = 'https://www.example.test';
    assert.equal(getPublicSiteUrl()?.origin, 'https://www.example.test');
    process.env.SITE_URL = 'https://www.example.test/path';
    assert.throws(getPublicSiteUrl, /exact HTTP\(S\) origin/);
  });
});
