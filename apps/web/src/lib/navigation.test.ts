import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isCurrentPath, isExternalHref, resolveNavHref } from './navigation.ts';

describe('resolveNavHref', () => {
  it('renders Home section links as in-page anchors on Home', () => {
    assert.equal(resolveNavHref('/#about', '/'), '#about');
    assert.equal(resolveNavHref('#about', '/'), '#about');
  });

  it('resolves section links back to Home from other pages', () => {
    assert.equal(resolveNavHref('/#about', '/insights'), '/#about');
    assert.equal(
      resolveNavHref('#contact', '/insights/some-slug'),
      '/#contact',
    );
  });

  it('leaves page paths and external URLs unchanged', () => {
    assert.equal(resolveNavHref('/insights', '/'), '/insights');
    assert.equal(
      resolveNavHref('https://example.com/a#b', '/'),
      'https://example.com/a#b',
    );
  });
});

describe('isCurrentPath', () => {
  it('marks a page and its children as current', () => {
    assert.equal(isCurrentPath('/insights', '/insights'), true);
    assert.equal(isCurrentPath('/insights', '/insights/a-post'), true);
    assert.equal(isCurrentPath('/insights/', '/insights'), true);
  });

  it('does not match siblings that share a prefix', () => {
    assert.equal(isCurrentPath('/insights', '/insightsabc'), false);
  });

  it('never marks section anchors or external links as current', () => {
    assert.equal(isCurrentPath('/#about', '/'), false);
    assert.equal(isCurrentPath('https://example.com', '/'), false);
  });

  it('matches Home only on Home', () => {
    assert.equal(isCurrentPath('/', '/'), true);
    assert.equal(isCurrentPath('/', '/insights'), false);
  });
});

describe('isExternalHref', () => {
  it('detects absolute http and https URLs only', () => {
    assert.equal(isExternalHref('https://x.com/'), true);
    assert.equal(isExternalHref('HTTP://example.com'), true);
    assert.equal(isExternalHref('/insights'), false);
    assert.equal(isExternalHref('mailto:hello@example.com'), false);
  });
});
