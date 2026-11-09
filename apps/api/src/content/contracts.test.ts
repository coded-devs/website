import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  articlePayloadSchema,
  articleInputSchema,
  assertContentAdministrator,
  contentErrorResponse,
  contentPageQuerySchema,
  contentSlugSchema,
  createContentAudit,
  homepageSectionSchema,
  projectPayloadSchema,
  productPayloadSchema,
  serializeAdminArticle,
  serializePublishedArticle,
  serializePublishedArticleSummary,
  serializePublishedSection,
  servicePayloadSchema,
  settingsPayloadSchema,
  teamPayloadSchema,
} from './contracts.js';
import { contentHrefSchema } from './href.js';

test('content links accept internal and HTTP(S) destinations only', () => {
  for (const href of [
    '/#contact',
    '/insights?tag=design',
    '#contact',
    'https://example.test/path',
  ]) {
    assert.equal(contentHrefSchema.safeParse(href).success, true, href);
  }
  for (const href of [
    'javascript:alert(1)',
    'unsupported:destination',
    '//other.test/path',
    'mailto:hello@example.test',
  ]) {
    assert.equal(contentHrefSchema.safeParse(href).success, false, href);
  }
  assert.equal(
    contentHrefSchema.safeParse('https://user:pass@example.test').success,
    false,
  );
});

test('header, footer, and legal settings reject unsupported URL schemes', () => {
  const base = { companyName: 'CodedDevs', contactEmail: 'hello@example.test' };
  assert.equal(
    settingsPayloadSchema.safeParse({
      ...base,
      navigationAction: { label: 'Open', href: 'unsupported:destination' },
    }).success,
    false,
  );
  assert.equal(
    settingsPayloadSchema.safeParse({
      ...base,
      footerGroups: [
        {
          title: 'Company',
          links: [{ label: 'Home', href: 'javascript:alert(1)' }],
        },
      ],
    }).success,
    false,
  );
  assert.equal(
    settingsPayloadSchema.safeParse({
      ...base,
      legalLinks: [{ label: 'Privacy', href: 'mailto:privacy@example.test' }],
    }).success,
    false,
  );
});

test('content payload schemas accept approved records and reject unknown fields', () => {
  assert.equal(
    servicePayloadSchema.safeParse({
      title: 'Engineering',
      description: 'A service description',
      icon: 'code',
      features: ['Design', 'Delivery'],
    }).success,
    true,
  );
  assert.equal(
    servicePayloadSchema.safeParse({
      title: 'Engineering',
      description: 'A',
      unexpected: true,
    }).success,
    false,
  );
  assert.equal(
    projectPayloadSchema.safeParse({
      title: 'Project',
      summary: 'Summary',
      tags: ['web'],
    }).success,
    true,
  );
  assert.equal(
    settingsPayloadSchema.safeParse({
      companyName: 'CodedDevs',
      contactEmail: 'hello@example.com',
    }).success,
    true,
  );
  assert.equal(
    productPayloadSchema.safeParse({
      name: 'Product',
      tagline: 'Tagline',
      description: 'Description',
      url: 'javascript:alert(1)',
    }).success,
    false,
  );
  assert.equal(
    teamPayloadSchema.safeParse({
      name: 'Ada',
      role: 'Engineer',
      bio: 'Bio',
      avatarUrl: 'https://cdn.example.com/ada.png',
    }).success,
    true,
  );
  assert.equal(
    articlePayloadSchema.safeParse({
      title: 'Article',
      excerpt: 'Excerpt',
      body: 'Body',
      slug: 'Article One',
    }).success,
    false,
  );
  assert.equal(
    articleInputSchema.parse({
      title: 'Article',
      excerpt: 'Excerpt',
      body: 'Body',
      slug: 'article-one',
    }).publishImmediately,
    false,
  );
  assert.equal(
    homepageSectionSchema.safeParse({
      sectionKey: 'hero',
      payload: { heading: 'Hello', body: 'World', unknown: true },
    }).success,
    false,
  );
});

test('published landing page records accept editable media and footer navigation', () => {
  const image = {
    imageUrl: 'https://images.example.test/card.jpg',
    imageAlt: 'People working together',
  };
  assert.equal(
    servicePayloadSchema.safeParse({
      title: 'Engineering',
      description: 'A service description',
      features: ['Discovery'],
      ...image,
    }).success,
    true,
  );
  assert.equal(
    productPayloadSchema.safeParse({
      name: 'Product',
      tagline: 'A useful product',
      description: 'Product description',
      sector: 'Commerce',
      ...image,
    }).success,
    true,
  );
  assert.equal(
    projectPayloadSchema.safeParse({
      title: 'Project',
      summary: 'Project summary',
      tags: ['Commerce'],
      ...image,
    }).success,
    true,
  );
  assert.equal(
    settingsPayloadSchema.safeParse({
      companyName: 'CodedDevs',
      contactEmail: 'hello@example.com',
      navigationAction: { label: 'Say hello', href: '/#contact' },
      footerGroups: [
        { title: 'Company', links: [{ label: 'About', href: '/#about' }] },
      ],
    }).success,
    true,
  );
});

test('article slug and pagination schemas enforce canonical bounds and defaults', () => {
  assert.equal(contentSlugSchema.parse('hello-world'), 'hello-world');
  assert.equal(contentSlugSchema.safeParse('Hello-world').success, false);
  assert.equal(contentSlugSchema.safeParse('a'.repeat(161)).success, false);
  assert.deepEqual(contentPageQuerySchema.parse({}), { page: 1, limit: 10 });
  assert.deepEqual(contentPageQuerySchema.parse({ page: '2', limit: '50' }), {
    page: 2,
    limit: 50,
  });
  for (const query of [
    { page: '0' },
    { page: 'x' },
    { limit: '51' },
    { limit: '0' },
  ]) {
    assert.equal(contentPageQuerySchema.safeParse(query).success, false);
  }
});

test('content errors map to stable HTTP response shapes', () => {
  assert.deepEqual(contentErrorResponse({ kind: 'not_found' }), {
    status: 404,
    body: { error: 'Content not found', code: 'CONTENT_NOT_FOUND' },
  });
  assert.deepEqual(contentErrorResponse({ kind: 'validation' }), {
    status: 400,
    body: { error: 'Invalid content request', code: 'CONTENT_INVALID_REQUEST' },
  });
  assert.deepEqual(contentErrorResponse({ kind: 'forbidden' }), {
    status: 403,
    body: { error: 'Forbidden', code: 'CONTENT_FORBIDDEN' },
  });
});

test('content authorization seam accepts only the authenticated super-admin principal', () => {
  assert.doesNotThrow(() =>
    assertContentAdministrator({
      admin: {
        id: '11111111-1111-4111-8111-111111111111',
        email: 'admin@example.com',
        role: 'SUPER_ADMIN',
      },
      session: { expiresAt: '2027-01-01T00:00:00.000Z' },
    }),
  );
  assert.throws(() => assertContentAdministrator(undefined), {
    name: 'ContentError',
  });
});

test('public serializers project only published fields and strict admin serializer has explicit fields', () => {
  const row = {
    id: 'article-1',
    draftSlug: 'draft-only',
    publishedSlug: 'live-article',
    draftPayload: { title: 'Secret draft', excerpt: 'Secret', body: 'private' },
    publishedPayload: {
      title: 'Live title',
      excerpt: 'Summary',
      body: 'Public body',
    },
    publishedAt: '2026-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const publicArticle = serializePublishedArticle(row);
  assert.deepEqual(publicArticle, {
    id: 'article-1',
    slug: 'live-article',
    title: 'Live title',
    summary: 'Summary',
    content: 'Public body',
    publishedAt: '2026-01-01T00:00:00.000Z',
  });
  assert.equal(JSON.stringify(publicArticle).includes('draft'), false);
  const publicSummary = serializePublishedArticleSummary(row);
  assert.equal(publicSummary?.slug, 'live-article');
  assert.equal('content' in (publicSummary ?? {}), false);
  const adminArticle = serializeAdminArticle(row);
  assert.equal(adminArticle.draftSlug, 'draft-only');
  assert.equal('unexpected' in adminArticle, false);
  const sectionSource = {
    sectionKey: 'hero',
    position: 0,
    draftPayload: { heading: 'Private' },
    publishedPayload: { heading: 'Public', body: 'Welcome' },
    draftVisible: false,
    publishedVisible: true,
  } as const;
  const section = serializePublishedSection(sectionSource);
  assert.deepEqual(section, {
    sectionKey: 'hero',
    position: 0,
    payload: { heading: 'Public', body: 'Welcome' },
  });
  assert.equal(JSON.stringify(section).includes('draft'), false);
});

test('content audit metadata is bounded and cannot contain payload data', () => {
  assert.deepEqual(
    createContentAudit({
      eventType: 'content.save_draft',
      targetType: 'article',
      targetId: '11111111-1111-4111-8111-111111111111',
      metadata: { operation: 'update' },
    }),
    {
      eventType: 'content.save_draft',
      targetType: 'article',
      targetId: '11111111-1111-4111-8111-111111111111',
      metadata: { operation: 'update' },
    },
  );
  assert.throws(() =>
    createContentAudit({
      eventType: 'content.publish',
      targetType: 'article',
      targetId: '11111111-1111-4111-8111-111111111111',
      metadata: { payload: 'must never be audited' },
    }),
  );
});
