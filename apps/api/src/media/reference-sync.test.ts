import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MediaReferenceFieldKeyError,
  UnknownLocalMediaUrlError,
  extractMediaReferenceTargets,
} from './reference-sync.js';

const BASE_URL = 'https://cdn.example.test/assets/';
const PNG_URL = `${BASE_URL}media/123e4567-e89b-42d3-a456-426614174000.png`;
const WEBP_URL = `${BASE_URL}media/123e4567-e89b-42d3-a456-426614174001.webp`;

test('extracts local media only from approved content image fields', () => {
  assert.deepEqual(
    extractMediaReferenceTargets(
      {
        title: PNG_URL,
        coverImage: PNG_URL,
        linkedinUrl: WEBP_URL,
        nested: { avatarUrl: WEBP_URL },
      },
      BASE_URL,
    ),
    [
      {
        objectKey: 'media/123e4567-e89b-42d3-a456-426614174000.png',
        fieldKey: 'coverImage',
        position: 0,
      },
      {
        objectKey: 'media/123e4567-e89b-42d3-a456-426614174001.webp',
        fieldKey: 'nested.avatarUrl',
        position: 0,
      },
    ],
  );
});

test('tracks CMS hero and collection card image fields', () => {
  assert.deepEqual(
    extractMediaReferenceTargets(
      {
        images: [{ src: PNG_URL, alt: 'Hero' }],
        focusAreas: [{ image: { src: WEBP_URL, alt: 'Focus' } }],
        imageUrl: PNG_URL,
      },
      BASE_URL,
    ),
    [
      {
        objectKey: 'media/123e4567-e89b-42d3-a456-426614174000.png',
        fieldKey: 'images.src',
        position: 0,
      },
      {
        objectKey: 'media/123e4567-e89b-42d3-a456-426614174001.webp',
        fieldKey: 'focusAreas.image.src',
        position: 0,
      },
      {
        objectKey: 'media/123e4567-e89b-42d3-a456-426614174000.png',
        fieldKey: 'imageUrl',
        position: 0,
      },
    ],
  );
});

test('ignores external URLs and URLs outside the exact origin and base path', () => {
  assert.deepEqual(
    extractMediaReferenceTargets(
      {
        coverImage: 'https://cdn.example.test.evil/assets/media/not-local.png',
        avatarUrl: 'https://cdn.example.test/assets-other/media/not-local.png',
        icon: 'https://other.example.test/assets/media/not-local.png',
      },
      BASE_URL,
    ),
    [],
  );
});

test('assigns repeatable positions to multiple media URLs in one field', () => {
  assert.deepEqual(
    extractMediaReferenceTargets(
      { coverImage: [PNG_URL, WEBP_URL, PNG_URL] },
      BASE_URL,
    ),
    [
      {
        objectKey: 'media/123e4567-e89b-42d3-a456-426614174000.png',
        fieldKey: 'coverImage',
        position: 0,
      },
      {
        objectKey: 'media/123e4567-e89b-42d3-a456-426614174001.webp',
        fieldKey: 'coverImage',
        position: 1,
      },
      {
        objectKey: 'media/123e4567-e89b-42d3-a456-426614174000.png',
        fieldKey: 'coverImage',
        position: 2,
      },
    ],
  );
});

test('rejects malformed local paths, query strings and fragments', () => {
  for (const localUrl of [
    `${BASE_URL}media/not-an-object-key.png`,
    `${PNG_URL}?size=large`,
    `${PNG_URL}?`,
    `${PNG_URL}#preview`,
    `${PNG_URL}#`,
    `https://user@cdn.example.test/assets/media/123e4567-e89b-42d3-a456-426614174000.png`,
    `${BASE_URL}media/%2e%2e/other.png`,
  ]) {
    assert.throws(
      () => extractMediaReferenceTargets({ coverImage: localUrl }, BASE_URL),
      UnknownLocalMediaUrlError,
    );
  }
});

test('rejects image field paths that exceed the database field key limit', () => {
  const payload: Record<string, unknown> = {};
  let current = payload;
  for (let index = 0; index < 10; index += 1) {
    const child: Record<string, unknown> = {};
    current.nested = child;
    current = child;
  }
  current.coverImage = PNG_URL;
  assert.throws(
    () => extractMediaReferenceTargets(payload, BASE_URL),
    MediaReferenceFieldKeyError,
  );
});
