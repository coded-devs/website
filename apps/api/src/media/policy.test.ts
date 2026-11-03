import assert from 'node:assert/strict';
import sharp from 'sharp';
import { test } from 'node:test';
import {
  MEDIA_UPLOAD_POLICY,
  createMediaObjectKey,
  validateMediaUpload,
} from './policy.js';

const sourceImage = {
  create: {
    width: 3,
    height: 2,
    channels: 3 as const,
    background: { r: 40, g: 120, b: 200 },
  },
};
const PNG = await sharp(sourceImage).png().toBuffer();
const JPEG = await sharp(sourceImage).jpeg().toBuffer();
const WEBP = await sharp(sourceImage).webp().toBuffer();

test('media policy decodes supported images and reports canonical metadata and dimensions', async () => {
  assert.deepEqual(await validateMediaUpload(PNG, 'image/png'), {
    ok: true,
    byteSize: PNG.byteLength,
    mimeType: 'image/png',
    extension: 'png',
    width: 3,
    height: 2,
  });
  assert.equal((await validateMediaUpload(JPEG, 'image/jpeg')).ok, true);
  assert.equal((await validateMediaUpload(WEBP, 'image/webp')).ok, true);
});

test('media policy rejects content whose signature disagrees with the declared MIME type', async () => {
  assert.deepEqual(await validateMediaUpload(PNG, 'image/jpeg'), {
    ok: false,
    reason: 'content_type_mismatch',
  });
});

test('media policy rejects unsupported, empty and oversized data', async () => {
  assert.deepEqual(
    await validateMediaUpload(Buffer.from('not an image'), 'image/png'),
    {
      ok: false,
      reason: 'unsupported_content',
    },
  );
  assert.deepEqual(await validateMediaUpload(PNG, 'application/pdf'), {
    ok: false,
    reason: 'unsupported_type',
  });
  assert.deepEqual(await validateMediaUpload(Buffer.alloc(0), 'image/png'), {
    ok: false,
    reason: 'empty_file',
  });
  assert.deepEqual(
    await validateMediaUpload(
      Buffer.alloc(MEDIA_UPLOAD_POLICY.maximumBytes + 1),
      'image/png',
    ),
    { ok: false, reason: 'file_too_large' },
  );
});

test('media policy rejects truncated and malformed image payloads', async () => {
  assert.deepEqual(
    await validateMediaUpload(PNG.subarray(0, PNG.length - 12), 'image/png'),
    { ok: false, reason: 'malformed_content' },
  );
  const malformedPng = Buffer.concat([
    PNG.subarray(0, 8),
    Buffer.from('not png data'),
  ]);
  assert.deepEqual(await validateMediaUpload(malformedPng, 'image/png'), {
    ok: false,
    reason: 'malformed_content',
  });
});

test('media policy enforces dimension and pixel limits', async () => {
  const tooWide = await sharp({
    create: {
      width: MEDIA_UPLOAD_POLICY.maximumDimension + 1,
      height: 1,
      channels: 3,
      background: { r: 1, g: 2, b: 3 },
    },
  })
    .png()
    .toBuffer();
  assert.deepEqual(await validateMediaUpload(tooWide, 'image/png'), {
    ok: false,
    reason: 'dimensions_too_large',
  });
});

test('object keys are opaque, unique-shaped, and use the detected extension', () => {
  const first = createMediaObjectKey('png');
  const second = createMediaObjectKey('png');
  assert.match(first, /^media\/[0-9a-f-]{36}\.png$/);
  assert.notEqual(first, second);
  assert.doesNotMatch(first, /\.\.|\\|%/);
});
