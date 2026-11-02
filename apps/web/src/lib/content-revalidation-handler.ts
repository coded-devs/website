import { timingSafeEqual } from 'node:crypto';

const MAX_BODY_BYTES = 16 * 1024;
const MAX_SLUG_LENGTH = 160;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type RevalidationPayload = { paths: string[]; tags: string[] };

function isCanonicalSlug(value: string) {
  return value.length <= MAX_SLUG_LENGTH && slugPattern.test(value);
}

function response(status: number) {
  return new Response(null, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= 10 &&
    value.every((item) => typeof item === 'string') &&
    new Set(value).size === value.length
  );
}

function isPayload(value: unknown): value is RevalidationPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== 2 ||
    !Object.hasOwn(record, 'paths') ||
    !Object.hasOwn(record, 'tags') ||
    !isStringArray(record.paths) ||
    !isStringArray(record.tags)
  ) {
    return false;
  }
  return (
    record.paths.every(
      (path) =>
        path === '/' ||
        path === '/insights' ||
        (path.startsWith('/insights/') &&
          isCanonicalSlug(path.slice('/insights/'.length))),
    ) &&
    record.tags.every(
      (tag) =>
        ['site', 'home', 'articles', 'insights'].includes(tag) ||
        (tag.startsWith('article-') &&
          isCanonicalSlug(tag.slice('article-'.length))),
    )
  );
}

async function readBoundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError('body too large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export function createRevalidationHandler(dependencies: {
  secret: string | undefined;
  revalidatePath(path: string): void;
  revalidateTag(tag: string): void;
}) {
  return async function handleRevalidation(request: Request) {
    if (
      !dependencies.secret ||
      !/^[0-9a-fA-F]{64}$/.test(dependencies.secret)
    ) {
      return response(500);
    }
    const supplied =
      request.headers.get('x-codeddevs-revalidation-secret') ?? '';
    if (!/^[0-9a-fA-F]{64}$/.test(supplied)) return response(401);
    const expectedBytes = Buffer.from(dependencies.secret, 'hex');
    const suppliedBytes = Buffer.from(supplied, 'hex');
    if (!timingSafeEqual(expectedBytes, suppliedBytes)) return response(401);
    if (
      !/^application\/json(?:\s*;|\s*$)/i.test(
        request.headers.get('content-type') ?? '',
      )
    ) {
      return response(415);
    }
    const length = request.headers.get('content-length');
    if (length && /^\d+$/.test(length) && Number(length) > MAX_BODY_BYTES) {
      return response(413);
    }
    let payload: unknown;
    try {
      payload = JSON.parse(
        new TextDecoder().decode(await readBoundedBody(request)),
      );
    } catch (error) {
      return response(error instanceof RangeError ? 413 : 400);
    }
    if (!isPayload(payload)) return response(400);
    try {
      for (const path of payload.paths) dependencies.revalidatePath(path);
      for (const tag of payload.tags) dependencies.revalidateTag(tag);
      return response(204);
    } catch {
      return response(500);
    }
  };
}
