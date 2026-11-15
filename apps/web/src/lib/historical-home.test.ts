import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PublishedSite } from './published-site.ts';
import { shouldUseHistoricalHomeFallback } from './home-sections.ts';

const emptySite: PublishedSite = {
  sections: [],
  services: [],
  products: [],
  projects: [],
  team: [],
  settings: null,
};

test('uses the historical homepage when the API is unavailable or has no sections', () => {
  assert.equal(shouldUseHistoricalHomeFallback(null), true);
  assert.equal(shouldUseHistoricalHomeFallback(emptySite), true);
});

test('keeps published homepage content ahead of the historical fallback', () => {
  assert.equal(
    shouldUseHistoricalHomeFallback({
      ...emptySite,
      sections: [
        {
          sectionKey: 'hero',
          position: 0,
          payload: { heading: 'Published content' },
        },
      ],
    }),
    false,
  );
});
