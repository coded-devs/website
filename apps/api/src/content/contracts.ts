import { z } from 'zod';
import type { SessionPrincipal } from '../auth/session.js';
import {
  homepageSectionSchema,
  homepageSectionKeySchema,
  type HomepageSectionKey,
} from './homepage-sections.js';

export { homepageSectionSchema, homepageSectionKeySchema };

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional();
const httpUrlOrEmpty = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .refine(
      (value) =>
        value === '' ||
        (/^https?:\/\//i.test(value) && z.url().safeParse(value).success),
    );
const tagList = (maximum: number) =>
  z.array(z.string().trim().min(1).max(maximum)).max(20).optional();

export const servicePayloadSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().min(1).max(5_000),
    icon: optionalText(80),
    features: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
    imageUrl: httpUrlOrEmpty(2_048).optional(),
    imageAlt: optionalText(500),
  })
  .strict();

export const productPayloadSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    tagline: z.string().trim().min(1).max(300),
    description: z.string().trim().min(1).max(5_000),
    url: httpUrlOrEmpty(2_048).optional(),
    badge: optionalText(80),
    sector: optionalText(120),
    imageUrl: httpUrlOrEmpty(2_048).optional(),
    imageAlt: optionalText(500),
  })
  .strict();

export const projectPayloadSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    client: optionalText(200),
    summary: z.string().trim().min(1).max(2_000),
    outcome: optionalText(2_000),
    tags: tagList(80),
    imageUrl: httpUrlOrEmpty(2_048).optional(),
    imageAlt: optionalText(500),
  })
  .strict();

export const teamPayloadSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    role: z.string().trim().min(1).max(160),
    bio: optionalText(5_000),
    avatarUrl: httpUrlOrEmpty(2_048).optional(),
    linkedinUrl: httpUrlOrEmpty(2_048).optional(),
    twitterUrl: httpUrlOrEmpty(2_048).optional(),
  })
  .strict();

export const settingsPayloadSchema = z
  .object({
    companyName: z.string().trim().min(1).max(200),
    contactEmail: z.string().trim().email().max(320),
    contactPhone: optionalText(50),
    address: optionalText(500),
    twitterUrl: httpUrlOrEmpty(2_048).optional(),
    linkedinUrl: httpUrlOrEmpty(2_048).optional(),
    githubUrl: httpUrlOrEmpty(2_048).optional(),
    navigationAction: z
      .object({
        label: z.string().trim().min(1).max(80),
        href: z.string().trim().min(1).max(2_048),
      })
      .strict()
      .optional(),
    footerGroups: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(100),
            links: z
              .array(
                z
                  .object({
                    label: z.string().trim().min(1).max(100),
                    href: z.string().trim().min(1).max(2_048),
                  })
                  .strict(),
              )
              .max(12),
          })
          .strict(),
      )
      .max(8)
      .optional(),
    legalLinks: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(100),
            href: z.string().trim().min(1).max(2_048),
          })
          .strict(),
      )
      .max(8)
      .optional(),
    ogImageUrl: httpUrlOrEmpty(2_048).optional(),
    footerNotice: optionalText(500),
    metaTitle: optionalText(160),
    metaDescription: optionalText(500),
  })
  .strict();

export const articlePayloadSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    excerpt: z.string().trim().min(1).max(1_000),
    body: z.string().trim().min(1).max(200_000),
    coverImage: httpUrlOrEmpty(2_048).optional(),
    coverImageAlt: optionalText(500),
    tags: tagList(80),
    readTimeMinutes: z.number().int().min(1).max(120).optional(),
    metaTitle: optionalText(160),
    metaDescription: optionalText(500),
  })
  .strict();

export const articleInputSchema = articlePayloadSchema
  .extend({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(160)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    publishImmediately: z.boolean().default(false),
  })
  .strict();

export const articleUpdateInputSchema = articleInputSchema
  .omit({ publishImmediately: true })
  .strict();

export const contentPayloadSchemas = {
  services: servicePayloadSchema,
  products: productPayloadSchema,
  projects: projectPayloadSchema,
  team: teamPayloadSchema,
  settings: settingsPayloadSchema,
  articles: articlePayloadSchema,
} as const;

export const contentPageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

export const contentSlugSchema = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export type ContentErrorKind =
  'validation' | 'not_found' | 'conflict' | 'forbidden' | 'internal';
const contentErrorMap = {
  validation: {
    status: 400,
    body: { error: 'Invalid content request', code: 'CONTENT_INVALID_REQUEST' },
  },
  not_found: {
    status: 404,
    body: { error: 'Content not found', code: 'CONTENT_NOT_FOUND' },
  },
  conflict: {
    status: 409,
    body: { error: 'Content conflict', code: 'CONTENT_CONFLICT' },
  },
  forbidden: {
    status: 403,
    body: { error: 'Forbidden', code: 'CONTENT_FORBIDDEN' },
  },
  internal: {
    status: 503,
    body: { error: 'Service unavailable', code: 'CONTENT_UNAVAILABLE' },
  },
} as const;

export class ContentError extends Error {
  constructor(readonly kind: ContentErrorKind) {
    super(contentErrorMap[kind].body.error);
    this.name = 'ContentError';
  }
}

export function contentErrorResponse(error: { kind: ContentErrorKind }) {
  return contentErrorMap[error.kind];
}

export function assertContentAdministrator(
  principal: SessionPrincipal | undefined,
): void {
  if (principal?.admin.role !== 'SUPER_ADMIN')
    throw new ContentError('forbidden');
}

type ArticleRow = {
  id: string;
  draftSlug: string;
  publishedSlug: string | null;
  draftPayload: unknown;
  publishedPayload: unknown | null;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

const iso = (value: Date | string | null) =>
  value instanceof Date ? value.toISOString() : value;

export function serializeAdminArticle(row: ArticleRow) {
  const draftPayload = articlePayloadSchema.parse(row.draftPayload);
  const publishedPayload =
    row.publishedPayload === null
      ? null
      : articlePayloadSchema.parse(row.publishedPayload);
  return {
    id: row.id,
    draftSlug: row.draftSlug,
    publishedSlug: row.publishedSlug,
    draftPayload,
    publishedPayload,
    publishedAt: iso(row.publishedAt),
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
    status:
      row.publishedAt && row.publishedPayload
        ? ('published' as const)
        : ('draft' as const),
  };
}

export function serializePublishedArticle(row: ArticleRow) {
  if (!row.publishedPayload || !row.publishedAt || !row.publishedSlug)
    return null;
  const payload = articlePayloadSchema.parse(row.publishedPayload);
  return {
    id: row.id,
    slug: row.publishedSlug,
    title: payload.title,
    summary: payload.excerpt,
    content: payload.body,
    publishedAt: iso(row.publishedAt),
    ...(payload.coverImage
      ? {
          coverImage: {
            url: payload.coverImage,
            ...(payload.coverImageAlt
              ? { altText: payload.coverImageAlt }
              : {}),
          },
        }
      : {}),
    ...(payload.tags ? { tags: payload.tags } : {}),
    ...(payload.metaTitle ? { seoTitle: payload.metaTitle } : {}),
    ...(payload.metaDescription
      ? { seoDescription: payload.metaDescription }
      : {}),
  };
}

export function serializeArticlePreview(row: ArticleRow) {
  const payload = articlePayloadSchema.parse(row.draftPayload);
  return {
    id: row.id,
    slug: row.draftSlug,
    title: payload.title,
    summary: payload.excerpt,
    content: payload.body,
    publishedAt: null,
    ...(payload.coverImage
      ? {
          coverImage: {
            url: payload.coverImage,
            ...(payload.coverImageAlt
              ? { altText: payload.coverImageAlt }
              : {}),
          },
        }
      : {}),
    ...(payload.tags ? { tags: payload.tags } : {}),
    ...(payload.metaTitle ? { seoTitle: payload.metaTitle } : {}),
    ...(payload.metaDescription
      ? { seoDescription: payload.metaDescription }
      : {}),
  };
}

export function serializePublishedArticleSummary(row: ArticleRow) {
  const article = serializePublishedArticle(row);
  if (!article) return null;
  const summary: Record<string, unknown> = { ...article };
  delete summary.content;
  return summary;
}

export function serializePublishedSection(row: {
  sectionKey: HomepageSectionKey;
  position: number;
  publishedPayload: unknown;
  publishedVisible: boolean;
}) {
  if (!row.publishedVisible) return null;
  const section = homepageSectionSchema.parse({
    sectionKey: row.sectionKey,
    payload: row.publishedPayload,
  });
  return {
    sectionKey: section.sectionKey,
    position: row.position,
    payload: section.payload,
  };
}

const contentAuditSchema = z
  .object({
    eventType: z.enum([
      'content.save_draft',
      'content.publish',
      'content.unpublish',
      'content.delete',
    ]),
    targetType: z.enum([
      'content_section',
      'service',
      'product',
      'project',
      'team_member',
      'article',
      'site_settings',
    ]),
    targetId: z.string().uuid().nullable().optional(),
    metadata: z
      .object({
        operation: z
          .enum([
            'create',
            'update',
            'reorder',
            'visibility',
            'delete',
            'publish_all',
            'retry',
          ])
          .optional(),
      })
      .strict(),
  })
  .strict();

export function createContentAudit(input: unknown) {
  return contentAuditSchema.parse(input);
}
