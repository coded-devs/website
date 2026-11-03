import { sql } from 'drizzle-orm';
import { z } from 'zod';
import type { createDatabase } from '../db/client.js';
import { createDatabase as openDatabase } from '../db/client.js';
import {
  MediaReferenceFieldKeyError,
  syncMediaAssetReferences,
  UnknownLocalMediaUrlError,
  UnknownMediaAssetError,
} from '../media/reference-sync.js';
import {
  articleInputSchema,
  articlePayloadSchema,
  articleUpdateInputSchema,
  ContentError,
  serializeAdminArticle,
  serializeArticlePreview,
} from './contracts.js';
import { recordContentAudit } from './admin-service.js';
import {
  insertRevalidationJob,
  processRevalidationJob,
} from './revalidation.js';

type Database = ReturnType<typeof createDatabase>['db'];
type ArticleTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];
type ArticleRow = Parameters<typeof serializeAdminArticle>[0];

const articleColumns = sql`id, draft_slug, published_slug, draft_payload,
  published_payload, published_at, created_at, updated_at`;

function toArticleRow(value: unknown): ArticleRow {
  const row = value as {
    id: string;
    draft_slug: string;
    published_slug: string | null;
    draft_payload: unknown;
    published_payload: unknown | null;
    published_at: Date | string | null;
    created_at: Date | string;
    updated_at: Date | string;
  };
  return {
    id: row.id,
    draftSlug: row.draft_slug,
    publishedSlug: row.published_slug,
    draftPayload: row.draft_payload,
    publishedPayload: row.published_payload,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const listQuerySchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    status: z.enum(['all', 'draft', 'published']).default('all'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  })
  .strict();

function isUniqueConflict(error: unknown) {
  let current = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    if (
      typeof current === 'object' &&
      'code' in current &&
      (current as { code?: unknown }).code === '23505'
    ) {
      return true;
    }
    current =
      typeof current === 'object' && 'cause' in current
        ? (current as { cause?: unknown }).cause
        : undefined;
  }
  return false;
}

export function createArticleService(
  databaseUrl: string | undefined,
  revalidationConfiguration: {
    webInternalOrigin?: string;
    contentRevalidationSecret?: string;
    publicMediaBaseUrl?: string;
  } = {},
) {
  const syncReferences = async (
    transaction: ArticleTransaction,
    snapshot: 'draft' | 'published',
    articleId: string,
    payload: unknown,
  ) => {
    if (!revalidationConfiguration.publicMediaBaseUrl) return Promise.resolve();
    try {
      await syncMediaAssetReferences(transaction, {
        payload,
        publicMediaBaseUrl: revalidationConfiguration.publicMediaBaseUrl,
        owner: { kind: 'article', id: articleId },
        snapshot,
      });
    } catch (error) {
      if (
        error instanceof UnknownLocalMediaUrlError ||
        error instanceof UnknownMediaAssetError ||
        error instanceof MediaReferenceFieldKeyError
      ) {
        throw new ContentError('validation');
      }
      throw error;
    }
  };

  const useDatabase = async <T>(
    operation: (database: Database) => Promise<T>,
  ) => {
    if (!databaseUrl) throw new ContentError('internal');
    const { db, pool } = openDatabase(databaseUrl);
    try {
      return await operation(db);
    } catch (error) {
      if (isUniqueConflict(error)) throw new ContentError('conflict');
      throw error;
    } finally {
      await pool.end();
    }
  };

  const readById = async (database: Database, id: string) => {
    const selected = await database.execute(sql`select ${articleColumns}
      from articles where id = ${id} limit 1`);
    const row = selected.rows[0];
    if (!row) throw new ContentError('not_found');
    return toArticleRow(row);
  };

  const articleTargets = (...slugs: Array<string | null>) => {
    const uniqueSlugs = [
      ...new Set(slugs.filter((slug): slug is string => !!slug)),
    ];
    return {
      paths: ['/insights', ...uniqueSlugs.map((slug) => `/insights/${slug}`)],
      tags: [
        'articles',
        'insights',
        ...uniqueSlugs.map((slug) => `article-${slug}`),
      ],
    };
  };

  const finishPublication = async <T>(
    operation: (
      database: Database,
    ) => Promise<{ value: T; jobId: string | null }>,
  ) => {
    const { value, jobId } = await useDatabase(operation);
    if (jobId) {
      try {
        await processRevalidationJob(
          databaseUrl,
          revalidationConfiguration,
          jobId,
        );
      } catch {
        // The committed article remains published if cache revalidation fails.
      }
    }
    return value;
  };

  return {
    async list(input: unknown) {
      const { search, status, page, limit } = listQuerySchema.parse(input);
      return useDatabase(async (database) => {
        const statusCondition =
          status === 'all'
            ? sql`true`
            : status === 'draft'
              ? sql`published_at is null`
              : sql`published_at is not null`;
        const searchCondition = search
          ? sql`and (
              draft_slug ilike ${`%${search}%`}
              or coalesce(draft_payload->>'title', '') ilike ${`%${search}%`}
              or coalesce(draft_payload->>'excerpt', '') ilike ${`%${search}%`}
              or coalesce(published_slug, '') ilike ${`%${search}%`}
              or coalesce(published_payload->>'title', '') ilike ${`%${search}%`}
              or coalesce(published_payload->>'excerpt', '') ilike ${`%${search}%`}
            )`
          : sql``;
        const [rows, totals] = await Promise.all([
          database.execute(sql`select ${articleColumns} from articles
            where ${statusCondition} ${searchCondition}
            order by updated_at desc, id desc
            limit ${limit} offset ${(page - 1) * limit}`),
          database.execute(sql`select count(*)::int as total from articles
            where ${statusCondition} ${searchCondition}`),
        ]);
        const total = Number(
          (totals.rows[0] as { total: number | string } | undefined)?.total ??
            0,
        );
        return {
          items: rows.rows.map((row) =>
            serializeAdminArticle(toArticleRow(row)),
          ),
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        };
      });
    },

    async get(id: string) {
      return useDatabase(async (database) =>
        serializeAdminArticle(await readById(database, id)),
      );
    },

    async preview(id: string) {
      return useDatabase(async (database) =>
        serializeArticlePreview(await readById(database, id)),
      );
    },

    async create(input: unknown, actor: string) {
      const parsed = articleInputSchema.parse(input);
      const { slug, publishImmediately, ...rawPayload } = parsed;
      const payload = articlePayloadSchema.parse(rawPayload);
      return finishPublication(async (database) =>
        database.transaction(async (transaction) => {
          const inserted = await transaction.execute(sql`insert into articles
            (draft_slug, draft_payload, published_slug, published_payload, published_at)
            values (
              ${slug}, ${JSON.stringify(payload)}::jsonb,
              ${publishImmediately ? slug : null},
              ${publishImmediately ? JSON.stringify(payload) : null}::jsonb,
              ${publishImmediately ? sql`clock_timestamp()` : sql`null`}
            ) returning ${articleColumns}`);
          const row = inserted.rows[0];
          if (!row) throw new ContentError('internal');
          const articleId = String((row as { id: string }).id);
          await syncReferences(transaction, 'draft', articleId, payload);
          if (publishImmediately) {
            await syncReferences(transaction, 'published', articleId, payload);
          }
          await recordContentAudit(
            transaction,
            actor,
            'content.save_draft',
            'article',
            String((row as { id: string }).id),
            'create',
          );
          if (publishImmediately) {
            await recordContentAudit(
              transaction,
              actor,
              'content.publish',
              'article',
              String((row as { id: string }).id),
              'update',
            );
          }
          const jobId = publishImmediately
            ? await insertRevalidationJob(
                transaction,
                'article',
                String((row as { id: string }).id),
                articleTargets(slug),
              )
            : null;
          return { value: serializeAdminArticle(toArticleRow(row)), jobId };
        }),
      );
    },

    async update(id: string, input: unknown, actor: string) {
      const parsed = articleUpdateInputSchema.parse(input);
      const { slug, ...rawPayload } = parsed;
      const payload = articlePayloadSchema.parse(rawPayload);
      return useDatabase(async (database) =>
        database.transaction(async (transaction) => {
          const existing = await transaction.execute(sql`select id from articles
            where id = ${id} for update`);
          if (!existing.rows[0]) throw new ContentError('not_found');
          const updated = await transaction.execute(sql`update articles
            set draft_slug = ${slug}, draft_payload = ${JSON.stringify(payload)}::jsonb
            where id = ${id} returning ${articleColumns}`);
          const row = updated.rows[0];
          if (!row) throw new ContentError('not_found');
          await syncReferences(transaction, 'draft', id, payload);
          await recordContentAudit(
            transaction,
            actor,
            'content.save_draft',
            'article',
            id,
            'update',
          );
          return serializeAdminArticle(toArticleRow(row));
        }),
      );
    },

    async publish(id: string, actor: string) {
      return finishPublication(async (database) =>
        database.transaction(async (transaction) => {
          const selected =
            await transaction.execute(sql`select ${articleColumns}
            from articles where id = ${id} for update`);
          const existing = selected.rows[0];
          if (!existing) throw new ContentError('not_found');
          const current = toArticleRow(existing);
          const payload = articlePayloadSchema.parse(current.draftPayload);
          await syncReferences(transaction, 'published', id, payload);
          const updated = await transaction.execute(sql`update articles
            set published_slug = ${current.draftSlug},
                published_payload = ${JSON.stringify(payload)}::jsonb,
                published_at = clock_timestamp()
            where id = ${id} returning ${articleColumns}`);
          const row = updated.rows[0];
          if (!row) throw new ContentError('not_found');
          await recordContentAudit(
            transaction,
            actor,
            'content.publish',
            'article',
            id,
            'update',
          );
          const jobId = await insertRevalidationJob(
            transaction,
            'article',
            id,
            articleTargets(current.publishedSlug, current.draftSlug),
          );
          return { value: serializeAdminArticle(toArticleRow(row)), jobId };
        }),
      );
    },

    async unpublish(id: string, actor: string) {
      return finishPublication(async (database) =>
        database.transaction(async (transaction) => {
          const selected =
            await transaction.execute(sql`select ${articleColumns} from articles
            where id = ${id} for update`);
          const existing = selected.rows[0];
          if (!existing) throw new ContentError('not_found');
          const oldSlug = toArticleRow(existing).publishedSlug;
          await syncReferences(transaction, 'published', id, null);
          const updated = await transaction.execute(sql`update articles
            set published_slug = null, published_payload = null, published_at = null
            where id = ${id} returning ${articleColumns}`);
          const row = updated.rows[0];
          if (!row) throw new ContentError('not_found');
          await recordContentAudit(
            transaction,
            actor,
            'content.unpublish',
            'article',
            id,
            'update',
          );
          const jobId = oldSlug
            ? await insertRevalidationJob(
                transaction,
                'article',
                id,
                articleTargets(oldSlug),
              )
            : null;
          return { value: serializeAdminArticle(toArticleRow(row)), jobId };
        }),
      );
    },

    async delete(id: string, actor: string) {
      return finishPublication(async (database) =>
        database.transaction(async (transaction) => {
          const selected =
            await transaction.execute(sql`select ${articleColumns} from articles
            where id = ${id} for update`);
          const existing = selected.rows[0];
          if (!existing) throw new ContentError('not_found');
          const oldSlug = toArticleRow(existing).publishedSlug;
          await syncReferences(transaction, 'draft', id, null);
          await syncReferences(transaction, 'published', id, null);
          await transaction.execute(sql`delete from articles where id = ${id}`);
          await recordContentAudit(
            transaction,
            actor,
            'content.delete',
            'article',
            id,
            'delete',
          );
          const jobId = oldSlug
            ? await insertRevalidationJob(
                transaction,
                'article',
                id,
                articleTargets(oldSlug),
              )
            : null;
          return { value: undefined, jobId };
        }),
      );
    },
  };
}
