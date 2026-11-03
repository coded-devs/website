import { and, eq, inArray } from 'drizzle-orm';
import type { createDatabase } from '../db/client.js';
import { mediaAssetReferences, mediaAssets } from '../db/schema.js';

type Database = ReturnType<typeof createDatabase>['db'];
type DatabaseTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];

type MediaReferenceSnapshot = 'draft' | 'published';
type MediaReferenceOwner =
  | { kind: 'contentSection'; id: string }
  | { kind: 'service'; id: string }
  | { kind: 'product'; id: string }
  | { kind: 'project'; id: string }
  | { kind: 'teamMember'; id: string }
  | { kind: 'article'; id: string }
  | { kind: 'siteSettings'; id: true };

export type MediaReferenceTarget = {
  objectKey: string;
  fieldKey: string;
  position: number;
};

export class UnknownLocalMediaUrlError extends Error {
  readonly code = 'UNKNOWN_LOCAL_MEDIA_URL';

  constructor(readonly url: string) {
    super('Content contains a local media URL that is not a valid asset URL');
    this.name = 'UnknownLocalMediaUrlError';
  }
}

export class UnknownMediaAssetError extends Error {
  readonly code = 'UNKNOWN_MEDIA_ASSET';

  constructor(readonly objectKeys: readonly string[]) {
    super('Content references a media asset that does not exist');
    this.name = 'UnknownMediaAssetError';
  }
}

export class MediaReferenceFieldKeyError extends Error {
  readonly code = 'MEDIA_REFERENCE_FIELD_KEY_TOO_LONG';

  constructor(readonly fieldKey: string) {
    super('Media reference field key exceeds 64 characters');
    this.name = 'MediaReferenceFieldKeyError';
  }
}

const MEDIA_URL_FIELDS = new Set([
  'icon',
  'avatarUrl',
  'coverImage',
  'ogImageUrl',
]);
const OBJECT_KEY_PATTERN =
  /^media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp)$/;

type BaseUrl = {
  origin: string;
  pathname: string;
};

function parseBaseUrl(value: string): BaseUrl {
  let base: URL;
  try {
    base = new URL(value);
  } catch {
    throw new TypeError('Public media base URL must be an absolute URL');
  }
  if (
    (base.protocol !== 'https:' && base.protocol !== 'http:') ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  ) {
    throw new TypeError(
      'Public media base URL must not contain credentials, query, or fragment',
    );
  }
  return {
    origin: base.origin,
    pathname: base.pathname.replace(/\/+$/, ''),
  };
}

function getLocalObjectKey(value: string, base: BaseUrl): string | undefined {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return undefined;
  }

  if (url.origin !== base.origin) return undefined;
  const isUnderBase =
    base.pathname === '' ||
    url.pathname === base.pathname ||
    url.pathname.startsWith(`${base.pathname}/`);
  if (!isUnderBase) return undefined;
  if (
    url.username ||
    url.password ||
    value.includes('?') ||
    value.includes('#')
  ) {
    throw new UnknownLocalMediaUrlError(value);
  }

  const relativePath = url.pathname
    .slice(base.pathname.length)
    .replace(/^\//, '');
  if (!OBJECT_KEY_PATTERN.test(relativePath)) {
    throw new UnknownLocalMediaUrlError(value);
  }
  return relativePath;
}

function visitMediaValue(
  value: unknown,
  fieldKey: string,
  base: BaseUrl,
  positions: Map<string, number>,
  output: MediaReferenceTarget[],
): void {
  if (typeof value === 'string') {
    const objectKey = getLocalObjectKey(value, base);
    if (!objectKey) return;
    if (fieldKey.length > 64) throw new MediaReferenceFieldKeyError(fieldKey);
    const position = positions.get(fieldKey) ?? 0;
    positions.set(fieldKey, position + 1);
    output.push({ objectKey, fieldKey, position });
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      visitMediaValue(item, fieldKey, base, positions, output);
    }
    return;
  }

  if (value && typeof value === 'object' && 'url' in value) {
    visitMediaValue(
      (value as { url: unknown }).url,
      fieldKey,
      base,
      positions,
      output,
    );
  }
}

/** Extracts only configured image URL fields from the known content payloads. */
export function extractMediaReferenceTargets(
  payload: unknown,
  publicMediaBaseUrl: string,
): MediaReferenceTarget[] {
  const base = parseBaseUrl(publicMediaBaseUrl);
  const positions = new Map<string, number>();
  const output: MediaReferenceTarget[] = [];

  function visit(value: unknown, fieldPath: string): void {
    if (Array.isArray(value)) {
      for (const item of value) visit(item, fieldPath);
      return;
    }
    if (!value || typeof value !== 'object') return;

    for (const [key, child] of Object.entries(value)) {
      const childPath = fieldPath ? `${fieldPath}.${key}` : key;
      if (MEDIA_URL_FIELDS.has(key)) {
        visitMediaValue(child, childPath, base, positions, output);
      } else {
        visit(child, childPath);
      }
    }
  }

  visit(payload, '');
  return output;
}

function getOwnerCondition(owner: MediaReferenceOwner) {
  switch (owner.kind) {
    case 'contentSection':
      return eq(mediaAssetReferences.contentSectionId, owner.id);
    case 'service':
      return eq(mediaAssetReferences.serviceId, owner.id);
    case 'product':
      return eq(mediaAssetReferences.productId, owner.id);
    case 'project':
      return eq(mediaAssetReferences.projectId, owner.id);
    case 'teamMember':
      return eq(mediaAssetReferences.teamMemberId, owner.id);
    case 'article':
      return eq(mediaAssetReferences.articleId, owner.id);
    case 'siteSettings':
      return eq(mediaAssetReferences.siteSettingsId, owner.id);
  }
}

function getOwnerValues(owner: MediaReferenceOwner) {
  return {
    contentSectionId: owner.kind === 'contentSection' ? owner.id : null,
    serviceId: owner.kind === 'service' ? owner.id : null,
    productId: owner.kind === 'product' ? owner.id : null,
    projectId: owner.kind === 'project' ? owner.id : null,
    teamMemberId: owner.kind === 'teamMember' ? owner.id : null,
    articleId: owner.kind === 'article' ? owner.id : null,
    siteSettingsId: owner.kind === 'siteSettings' ? owner.id : null,
  };
}

export async function syncMediaAssetReferences(
  transaction: DatabaseTransaction,
  input: {
    payload: unknown;
    publicMediaBaseUrl: string;
    owner: MediaReferenceOwner;
    snapshot: MediaReferenceSnapshot;
  },
): Promise<void> {
  const targets = extractMediaReferenceTargets(
    input.payload,
    input.publicMediaBaseUrl,
  );
  const objectKeys = [...new Set(targets.map((target) => target.objectKey))];
  const assets = objectKeys.length
    ? await transaction
        .select({ id: mediaAssets.id, objectKey: mediaAssets.objectKey })
        .from(mediaAssets)
        .where(
          and(
            inArray(mediaAssets.objectKey, objectKeys),
            eq(mediaAssets.lifecycleStatus, 'ready'),
          ),
        )
    : [];
  const assetIdByKey = new Map(
    assets.map((asset) => [asset.objectKey, asset.id]),
  );
  const unknownKeys = objectKeys.filter((key) => !assetIdByKey.has(key));
  if (unknownKeys.length) throw new UnknownMediaAssetError(unknownKeys);

  const ownerCondition = getOwnerCondition(input.owner);
  await transaction
    .delete(mediaAssetReferences)
    .where(
      and(ownerCondition, eq(mediaAssetReferences.snapshot, input.snapshot)),
    );

  if (targets.length) {
    const ownerValues = getOwnerValues(input.owner);
    await transaction.insert(mediaAssetReferences).values(
      targets.map((target) => ({
        ...ownerValues,
        snapshot: input.snapshot,
        fieldKey: target.fieldKey,
        position: target.position,
        mediaAssetId: assetIdByKey.get(target.objectKey)!,
      })),
    );
  }
}
