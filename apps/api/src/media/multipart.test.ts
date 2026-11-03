import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import {
  MAX_MEDIA_UPLOAD_BYTES,
  MediaUploadError,
  readMediaUpload,
} from './multipart.js';

const BOUNDARY = 'codex-media-boundary';

function multipart(parts: Buffer[], end = true): Buffer {
  return Buffer.concat([
    ...parts.flatMap((part) => [
      Buffer.from(`--${BOUNDARY}\r\n`),
      part,
      Buffer.from('\r\n'),
    ]),
    ...(end ? [Buffer.from(`--${BOUNDARY}--\r\n`)] : []),
  ]);
}

function request(
  body: Buffer,
  contentType = `multipart/form-data; boundary=${BOUNDARY}`,
) {
  const stream = Readable.from([body]);
  Object.assign(stream, { headers: { 'content-type': contentType } });
  return stream as unknown as Parameters<typeof readMediaUpload>[0];
}

function filePart(name: string, bytes: Buffer, mimeType = 'image/png') {
  return Buffer.concat([
    Buffer.from(
      `Content-Disposition: form-data; name="${name}"; filename="upload.bin"\r\nContent-Type: ${mimeType}\r\n\r\n`,
    ),
    bytes,
  ]);
}

function textPart(name: string, value: string) {
  return Buffer.from(
    `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}`,
  );
}

function upload(parts: Buffer[]) {
  return request(multipart(parts));
}

test('reads one file and optional alt text from the existing Admin form contract', async () => {
  const bytes = Buffer.from([0, 1, 2, 255]);
  const result = await readMediaUpload(
    upload([filePart('file', bytes), textPart('altText', 'A sample image')]),
  );
  assert.deepEqual(result, {
    bytes,
    declaredMimeType: 'image/png',
    altText: 'A sample image',
  });
});

test('reads a file without alt text', async () => {
  const bytes = Buffer.from('image');
  const result = await readMediaUpload(
    upload([filePart('file', bytes, 'image/jpeg')]),
  );
  assert.deepEqual(result, { bytes, declaredMimeType: 'image/jpeg' });
});

test('rejects file payloads larger than 10 MiB while streaming', async () => {
  const body = Buffer.alloc(MAX_MEDIA_UPLOAD_BYTES + 2, 65);
  const requestWithOversizeFile = Readable.from([
    Buffer.from(
      `--${BOUNDARY}\r\nContent-Disposition: form-data; name="file"; filename="large.png"\r\nContent-Type: image/png\r\n\r\n`,
    ),
    body,
    Buffer.from(`\r\n--${BOUNDARY}--\r\n`),
  ]);
  Object.assign(requestWithOversizeFile, {
    headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
  });
  await assert.rejects(
    readMediaUpload(
      requestWithOversizeFile as unknown as Parameters<
        typeof readMediaUpload
      >[0],
    ),
    (error: unknown) =>
      error instanceof MediaUploadError && error.code === 'file_too_large',
  );
});

test('rejects truncated multipart bodies', async () => {
  await assert.rejects(
    readMediaUpload(
      request(multipart([filePart('file', Buffer.from('image'))], false)),
    ),
    (error: unknown) =>
      error instanceof MediaUploadError && error.code === 'malformed_multipart',
  );
});

test('rejects non-multipart requests and malformed boundary headers', async () => {
  await assert.rejects(
    readMediaUpload(request(Buffer.from('body'), 'application/json')),
    (error: unknown) =>
      error instanceof MediaUploadError &&
      error.code === 'invalid_content_type',
  );
  await assert.rejects(
    readMediaUpload(request(Buffer.from('body'), 'multipart/form-data')),
    (error: unknown) =>
      error instanceof MediaUploadError && error.code === 'malformed_multipart',
  );
});

test('rejects extra files, unexpected fields, and repeated alt text', async () => {
  for (const parts of [
    [filePart('other', Buffer.from('image'))],
    [
      filePart('file', Buffer.from('image')),
      filePart('file', Buffer.from('another')),
    ],
    [filePart('file', Buffer.from('image')), textPart('unexpected', 'value')],
    [
      filePart('file', Buffer.from('image')),
      textPart('altText', 'one'),
      textPart('altText', 'two'),
    ],
  ]) {
    await assert.rejects(
      readMediaUpload(upload(parts)),
      (error: unknown) =>
        error instanceof MediaUploadError && error.code === 'invalid_fields',
    );
  }
});

test('rejects a request stream error without leaking request content', async () => {
  const failingRequest = new Readable({ read() {} });
  Object.assign(failingRequest, {
    headers: { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` },
  });
  const pending = readMediaUpload(
    failingRequest as unknown as Parameters<typeof readMediaUpload>[0],
  );
  failingRequest.destroy(new Error('private request payload detail'));
  await assert.rejects(
    pending,
    (error: unknown) =>
      error instanceof MediaUploadError && error.code === 'request_error',
  );
});
