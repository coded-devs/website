import { asc, count, desc, eq, isNotNull, and } from 'drizzle-orm';
import type { createDatabase } from '../db/client.js';
import {
  articles,
  contentSections,
  products,
  projects,
  services,
  siteSettings,
  teamMembers,
} from '../db/schema.js';
import {
  contentPageQuerySchema,
  contentSlugSchema,
  homepageSectionKeySchema,
  projectPayloadSchema,
  productPayloadSchema,
  serializePublishedArticle,
  serializePublishedArticleSummary,
  serializePublishedSection,
  servicePayloadSchema,
  settingsPayloadSchema,
  teamPayloadSchema,
} from './contracts.js';

type Database = ReturnType<typeof createDatabase>['db'];

export type ContentPage = { page: number; limit: number };

export interface PublishedContentRepository {
  getPublishedSite(): Promise<{
    sections: Array<NonNullable<ReturnType<typeof serializePublishedSection>>>;
    services: Array<{
      id: string;
      position: number;
      payload: ReturnType<typeof servicePayloadSchema.parse>;
    }>;
    products: Array<{
      id: string;
      position: number;
      payload: ReturnType<typeof productPayloadSchema.parse>;
    }>;
    projects: Array<{
      id: string;
      position: number;
      payload: ReturnType<typeof projectPayloadSchema.parse>;
    }>;
    team: Array<{
      id: string;
      position: number;
      payload: ReturnType<typeof teamPayloadSchema.parse>;
    }>;
    settings: ReturnType<typeof settingsPayloadSchema.parse> | null;
  }>;
  listPublishedArticles(page: ContentPage): Promise<{
    items: Array<Record<string, unknown>>;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  getPublishedArticle(slug: string): Promise<Record<string, unknown> | null>;
}

function publishedRows<T>(
  rows: T[],
  fields: (row: T) => {
    id: string;
    publishedPosition: number | null;
    publishedPayload: unknown;
  },
) {
  return rows.flatMap((row) => {
    const selected = fields(row);
    return selected.publishedPayload === null
      ? []
      : [
          {
            id: selected.id,
            position: selected.publishedPosition!,
            payload: selected.publishedPayload,
          },
        ];
  });
}

export function createDrizzleContentRepository(
  db: Database,
): PublishedContentRepository {
  return {
    async getPublishedSite() {
      const [
        sectionRows,
        serviceRows,
        productRows,
        projectRows,
        teamRows,
        settingRows,
      ] = await Promise.all([
        db
          .select()
          .from(contentSections)
          .where(
            and(
              eq(contentSections.publishedVisible, true),
              isNotNull(contentSections.publishedPayload),
            ),
          )
          .orderBy(
            asc(contentSections.publishedPosition),
            asc(contentSections.id),
          ),
        db
          .select()
          .from(services)
          .where(
            and(
              eq(services.publishedVisible, true),
              isNotNull(services.publishedPayload),
            ),
          )
          .orderBy(asc(services.publishedPosition), asc(services.id)),
        db
          .select()
          .from(products)
          .where(
            and(
              eq(products.publishedVisible, true),
              isNotNull(products.publishedPayload),
            ),
          )
          .orderBy(asc(products.publishedPosition), asc(products.id)),
        db
          .select()
          .from(projects)
          .where(
            and(
              eq(projects.publishedVisible, true),
              isNotNull(projects.publishedPayload),
            ),
          )
          .orderBy(asc(projects.publishedPosition), asc(projects.id)),
        db
          .select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.publishedVisible, true),
              isNotNull(teamMembers.publishedPayload),
            ),
          )
          .orderBy(asc(teamMembers.publishedPosition), asc(teamMembers.id)),
        db
          .select()
          .from(siteSettings)
          .where(
            and(
              eq(siteSettings.id, true),
              isNotNull(siteSettings.publishedPayload),
            ),
          )
          .limit(1),
      ]);

      const sections = sectionRows.flatMap((row) => {
        const sectionKey = homepageSectionKeySchema.safeParse(row.sectionKey);
        if (!sectionKey.success) return [];
        const section = serializePublishedSection({
          ...row,
          sectionKey: sectionKey.data,
          position: row.publishedPosition!,
        });
        return section ? [section] : [];
      });
      const servicesList = publishedRows(serviceRows, (row) => row).map(
        (item) => ({
          ...item,
          payload: servicePayloadSchema.parse(item.payload),
        }),
      );
      const productsList = publishedRows(productRows, (row) => row).map(
        (item) => ({
          ...item,
          payload: productPayloadSchema.parse(item.payload),
        }),
      );
      const projectsList = publishedRows(projectRows, (row) => row).map(
        (item) => ({
          ...item,
          payload: projectPayloadSchema.parse(item.payload),
        }),
      );
      const teamList = publishedRows(teamRows, (row) => row).map((item) => ({
        ...item,
        payload: teamPayloadSchema.parse(item.payload),
      }));
      const publishedSettings = settingRows[0]?.publishedPayload;
      return {
        sections,
        services: servicesList,
        products: productsList,
        projects: projectsList,
        team: teamList,
        settings:
          publishedSettings === null || publishedSettings === undefined
            ? null
            : settingsPayloadSchema.parse(publishedSettings),
      };
    },

    async listPublishedArticles(input) {
      const { page, limit } = contentPageQuerySchema.parse(input);
      const wherePublished = and(
        isNotNull(articles.publishedAt),
        isNotNull(articles.publishedPayload),
        isNotNull(articles.publishedSlug),
      );
      const [rows, totals] = await Promise.all([
        db
          .select()
          .from(articles)
          .where(wherePublished)
          .orderBy(desc(articles.publishedAt), desc(articles.id))
          .limit(limit)
          .offset((page - 1) * limit),
        db.select({ total: count() }).from(articles).where(wherePublished),
      ]);
      const total = totals[0]?.total ?? 0;
      const items = rows.flatMap((row) => {
        const summary = serializePublishedArticleSummary(row);
        return summary ? [summary] : [];
      });
      return {
        items,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      };
    },

    async getPublishedArticle(slug) {
      const parsedSlug = contentSlugSchema.parse(slug);
      const rows = await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.publishedSlug, parsedSlug),
            isNotNull(articles.publishedPayload),
            isNotNull(articles.publishedAt),
          ),
        )
        .limit(1);
      const row = rows[0];
      return row ? serializePublishedArticle(row) : null;
    },
  };
}
