import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { R2MediaStorage } from './r2-adapter.js';

const KEY = 'media/123e4567-e89b-42d3-a456-426614174000.png';
const CONFIG = {
  accountId: 'account-id',
  accessKeyId: 'private-access-key',
  secretAccessKey: 'private-secret',
  bucket: 'media-bucket',
  publicBaseUrl: 'https://cdn.example.test/assets/',
};

function makeStorage(responses: unknown[] = []) {
  const commands: unknown[] = [];
  const client = {
    async send(command: unknown) {
      commands.push(command);
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return response;
    },
  };
  return { storage: new R2MediaStorage(CONFIG, client as never), commands };
}

test('uploads to the configured bucket with content type and create-only semantics, no public ACL', async () => {
  const { storage, commands } = makeStorage([{}]);
  const bytes = Buffer.from('image bytes');
  await storage.putObject({ key: KEY, bytes, mimeType: 'image/png' });
  assert.equal(commands.length, 1);
  const command = commands[0] as PutObjectCommand;
  assert.equal(command.input.Bucket, CONFIG.bucket);
  assert.equal(command.input.Key, KEY);
  assert.equal(command.input.Body, bytes);
  assert.equal(command.input.ContentType, 'image/png');
  assert.equal(command.input.IfNoneMatch, '*');
  assert.equal(command.input.ACL, undefined);
});

test('reads bytes and treats a missing object as absent', async () => {
  const payload = Buffer.from([1, 2, 3]);
  const { storage, commands } = makeStorage([
    { Body: { transformToByteArray: async () => payload } },
    Object.assign(new Error('not found'), { name: 'NoSuchKey' }),
  ]);
  assert.deepEqual(await storage.getObject(KEY), payload);
  assert.equal(await storage.getObject(KEY), null);
  assert.ok(commands[0] instanceof GetObjectCommand);
  assert.equal((commands[0] as GetObjectCommand).input.Key, KEY);
});

test('deletes from the configured bucket', async () => {
  const { storage, commands } = makeStorage([{}]);
  await storage.deleteObject(KEY);
  assert.ok(commands[0] instanceof DeleteObjectCommand);
  assert.equal(
    (commands[0] as DeleteObjectCommand).input.Bucket,
    CONFIG.bucket,
  );
  assert.equal((commands[0] as DeleteObjectCommand).input.Key, KEY);
});

test('resolves public URLs below the configured base path without exposing credentials', () => {
  const { storage } = makeStorage();
  const url = storage.resolveUrl(KEY);
  assert.equal(
    url,
    'https://cdn.example.test/assets/media/123e4567-e89b-42d3-a456-426614174000.png',
  );
  assert.doesNotMatch(url, /private-access-key|private-secret/);
});

test('rejects unsafe or non-opaque keys before making storage requests', async () => {
  const { storage, commands } = makeStorage();
  for (const key of [
    '../secret',
    'media/%2e%2e/file.png',
    'https://evil.test/image.png',
  ]) {
    assert.throws(() => storage.resolveUrl(key), /Invalid media object key/);
    await assert.rejects(storage.deleteObject(key), /Invalid media object key/);
  }
  assert.equal(commands.length, 0);
});

test('rejects public bases that could carry credentials or non-web schemes', () => {
  assert.throws(
    () =>
      new R2MediaStorage({
        ...CONFIG,
        publicBaseUrl: 'https://user:pass@example.test',
      }),
    /Invalid R2 public base URL/,
  );
  assert.throws(
    () =>
      new R2MediaStorage({ ...CONFIG, publicBaseUrl: 'javascript:alert(1)' }),
    /Invalid R2 public base URL/,
  );
});
