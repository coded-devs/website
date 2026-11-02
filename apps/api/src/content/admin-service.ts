import { sql } from 'drizzle-orm';
import type { createDatabase } from '../db/client.js';
import { createDatabase as openDatabase } from '../db/client.js';
import { auditEvents } from '../db/schema.js';
import {
  ContentError,
  createContentAudit,
  homepageSectionKeySchema,
  productPayloadSchema,
  projectPayloadSchema,
  servicePayloadSchema,
  settingsPayloadSchema,
  teamPayloadSchema,
} from './contracts.js';
import { homepageSectionPayloadSchemas } from './homepage-sections.js';
import {
  insertRevalidationJob,
  processRevalidationJob,
} from './revalidation.js';

type Database = ReturnType<typeof createDatabase>['db'];
type AdminTransaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export type AdminContentRow = {
  id: string;
  section_key?: string;
  position: number;
  published_position: number | null;
  draft_payload: unknown;
  published_payload: unknown | null;
  draft_visible: boolean;
  published_visible: boolean;
  published_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export function serializeContentRow(row: AdminContentRow) {
  return {
    id: row.id,
    ...(row.section_key ? { sectionKey: row.section_key } : {}),
    position: row.position,
    publishedPosition: row.published_position,
    draftPayload: row.draft_payload,
    publishedPayload: row.published_payload,
    draftVisible: row.draft_visible,
    publishedVisible: row.published_visible,
    publishedAt: row.published_at
      ? new Date(row.published_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function recordContentAudit(
  transaction: AdminTransaction,
  actorAdminUserId: string,
  eventType:
    | 'content.save_draft'
    | 'content.publish'
    | 'content.unpublish'
    | 'content.delete',
  targetType:
    | 'content_section'
    | 'service'
    | 'product'
    | 'project'
    | 'team_member'
    | 'article'
    | 'site_settings',
  targetId: string | null,
  operation:
    'create' | 'update' | 'reorder' | 'visibility' | 'delete' | 'publish_all',
) {
  const audit = createContentAudit({
    eventType,
    targetType,
    targetId,
    metadata: { operation },
  });
  await transaction.insert(auditEvents).values({
    actorAdminUserId,
    eventType: audit.eventType,
    targetType: audit.targetType,
    targetId: audit.targetId ?? null,
    metadata: audit.metadata,
  });
}

export async function executePositionReorder(
  transaction: AdminTransaction,
  tableName: string,
  rows: AdminContentRow[],
  orders: Array<{ id: string; position: number }>,
  actorAdminUserId: string,
  targetType:
    'content_section' | 'service' | 'product' | 'project' | 'team_member',
  includesSectionKey = false,
) {
  const maximum = await transaction.execute(
    sql`select coalesce(max(position), -1) as max_position from ${sql.raw(tableName)}`,
  );
  const maxPosition = Number(
    (maximum.rows[0] as { max_position: number | string }).max_position,
  );
  for (const [index, row] of rows.entries()) {
    await transaction.execute(sql`update ${sql.raw(tableName)}
      set position = ${maxPosition + rows.length + index + 1}
      where id = ${row.id}`);
  }
  for (const order of orders) {
    await transaction.execute(sql`update ${sql.raw(tableName)}
      set position = ${order.position} where id = ${order.id}`);
  }
  for (const row of rows) {
    await recordContentAudit(
      transaction,
      actorAdminUserId,
      'content.save_draft',
      targetType,
      row.id,
      'reorder',
    );
  }
  const sectionKeyColumn = includesSectionKey ? sql`section_key,` : sql``;
  const updated =
    await transaction.execute(sql`select id, ${sectionKeyColumn} position,
    published_position, draft_payload, published_payload, draft_visible,
    published_visible, published_at, created_at, updated_at
    from ${sql.raw(tableName)} order by position asc, id asc`);
  return updated.rows.map((row) => serializeContentRow(row as AdminContentRow));
}

export function serializeSettingsRow(row: {
  id: boolean;
  draft_payload: unknown;
  published_payload: unknown | null;
  published_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
}) {
  return {
    id: row.id,
    draftPayload: row.draft_payload,
    publishedPayload: row.published_payload,
    publishedAt: row.published_at
      ? new Date(row.published_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const contentColumns = sql`id, position, published_position, draft_payload,
  published_payload, draft_visible, published_visible, published_at,
  created_at, updated_at`;
const sectionColumns = sql`id, section_key, position, published_position,
  draft_payload, published_payload, draft_visible, published_visible,
  published_at, created_at, updated_at`;
const collectionConfig = {
  services: {
    table: 'services',
    targetType: 'service',
    payloadSchema: servicePayloadSchema,
  },
  products: {
    table: 'products',
    targetType: 'product',
    payloadSchema: productPayloadSchema,
  },
  projects: {
    table: 'projects',
    targetType: 'project',
    payloadSchema: projectPayloadSchema,
  },
  team_members: {
    table: 'team_members',
    targetType: 'team_member',
    payloadSchema: teamPayloadSchema,
  },
} as const;
type CollectionName = keyof typeof collectionConfig;
type Actor = string;

function validateOrderSet<T extends { id: string; position: number }>(
  current: AdminContentRow[],
  orders: T[],
) {
  if (
    new Set(orders.map((order) => order.id)).size !== orders.length ||
    new Set(orders.map((order) => order.position)).size !== orders.length ||
    orders.some((order, index) => order.position !== index)
  ) {
    throw new ContentError('validation');
  }
  const expected = current.map((row) => row.id).sort();
  const received = orders.map((order) => order.id).sort();
  if (
    expected.length !== received.length ||
    expected.some((id, index) => id !== received[index])
  ) {
    throw new ContentError('validation');
  }
}

export function createAdminService(
  databaseUrl: string | undefined,
  revalidationConfiguration: {
    webInternalOrigin?: string;
    contentRevalidationSecret?: string;
  } = {},
) {
  const siteTargets = { paths: ['/'], tags: ['site', 'home'] };
  const useDatabase = async <T>(
    operation: (database: Database) => Promise<T>,
  ) => {
    if (!databaseUrl) throw new ContentError('internal');
    const { db, pool } = openDatabase(databaseUrl);
    try {
      return await operation(db);
    } finally {
      await pool.end();
    }
  };

  const finishPublication = async <T>(
    operation: (
      database: Database,
    ) => Promise<{ value: T; jobId: string | null }>,
  ) => {
    const { value, jobId } = await useDatabase(operation);
    if (!jobId) return value;
    try {
      await processRevalidationJob(
        databaseUrl,
        revalidationConfiguration,
        jobId,
      );
    } catch {
      // Publication is committed; a failed dispatch must not undo it.
    }
    return value;
  };

  return {
    async listSections() {
      return useDatabase(async (database) => {
        const result = await database.execute(sql`select ${sectionColumns}
          from content_sections order by position asc`);
        return result.rows.map((row) =>
          serializeContentRow(row as AdminContentRow),
        );
      });
    },

    async saveSectionDraft(key: string, payload: unknown, actor: Actor) {
      return useDatabase(async (database) =>
        database.transaction(async (transaction) => {
          await transaction.execute(
            sql`select pg_advisory_xact_lock(hashtextextended('codeddevs:content:sections', 0))`,
          );
          const existing =
            await transaction.execute(sql`select ${sectionColumns}
          from content_sections where section_key = ${key} for update`);
          const result = existing.rows[0]
            ? await transaction.execute(sql`update content_sections
              set draft_payload = ${JSON.stringify(payload)}::jsonb
              where section_key = ${key} returning ${sectionColumns}`)
            : await transaction.execute(sql`insert into content_sections
              (section_key, position, draft_payload)
              values (${key}, (select coalesce(max(position), -1) + 1 from content_sections), ${JSON.stringify(payload)}::jsonb)
              returning ${sectionColumns}`);
          const row = result.rows[0] as AdminContentRow | undefined;
          if (!row) throw new ContentError('internal');
          await recordContentAudit(
            transaction,
            actor,
            'content.save_draft',
            'content_section',
            row.id,
            existing.rows[0] ? 'update' : 'create',
          );
          return serializeContentRow(row);
        }),
      );
    },

    async setSectionVisibility(key: string, visible: boolean, actor: Actor) {
      return useDatabase(async (database) =>
        database.transaction(async (transaction) => {
          const result = await transaction.execute(sql`update content_sections
          set draft_visible = ${visible} where section_key = ${key}
          returning ${sectionColumns}`);
          const row = result.rows[0] as AdminContentRow | undefined;
          if (!row) throw new ContentError('not_found');
          await recordContentAudit(
            transaction,
            actor,
            'content.save_draft',
            'content_section',
            row.id,
            'visibility',
          );
          return serializeContentRow(row);
        }),
      );
    },

    async reorderSections(
      orders: Array<{ sectionKey: string; position: number }>,
      actor: Actor,
    ) {
      return useDatabase(async (database) =>
        database.transaction(async (transaction) => {
          await transaction.execute(
            sql`select pg_advisory_xact_lock(hashtextextended('codeddevs:content:sections', 0))`,
          );
          const selected =
            await transaction.execute(sql`select ${sectionColumns}
          from content_sections order by position asc for update`);
          const current = selected.rows as unknown as AdminContentRow[];
          const ids = new Map(current.map((row) => [row.section_key, row.id]));
          const mapped = orders.map(({ sectionKey, position }) => {
            const id = ids.get(sectionKey);
            if (!id) throw new ContentError('validation');
            return { id, position };
          });
          validateOrderSet(current, mapped);
          return executePositionReorder(
            transaction,
            'content_sections',
            current,
            mapped,
            actor,
            'content_section',
            true,
          );
        }),
      );
    },

    async publishAllSections(actor: Actor) {
      return finishPublication(async (database) =>
        database.transaction(async (transaction) => {
          await transaction.execute(
            sql`select pg_advisory_xact_lock(hashtextextended('codeddevs:content:sections', 0))`,
          );
          const selected =
            await transaction.execute(sql`select ${sectionColumns}
          from content_sections order by position asc for update`);
          const rows = selected.rows as unknown as AdminContentRow[];
          const parsed = rows.map((row) => {
            const key = homepageSectionKeySchema.parse(row.section_key);
            return {
              row,
              payload: homepageSectionPayloadSchemas[key].parse(
                row.draft_payload,
              ),
            };
          });
          for (const { row, payload } of parsed) {
            await transaction.execute(sql`update content_sections set
            published_payload = ${JSON.stringify(payload)}::jsonb,
            published_visible = draft_visible, published_position = position,
            published_at = clock_timestamp() where id = ${row.id}`);
            await recordContentAudit(
              transaction,
              actor,
              'content.publish',
              'content_section',
              row.id,
              'publish_all',
            );
          }
          const jobId = await insertRevalidationJob(
            transaction,
            'site',
            null,
            siteTargets,
          );
          return { value: parsed.length, jobId };
        }),
      );
    },

    async changeSectionPublication(
      key: string,
      publish: boolean,
      actor: Actor,
    ) {
      return finishPublication(async (database) =>
        database.transaction(async (transaction) => {
          const selected =
            await transaction.execute(sql`select ${sectionColumns}
          from content_sections where section_key = ${key} for update`);
          const row = selected.rows[0] as AdminContentRow | undefined;
          if (!row) throw new ContentError('not_found');
          const payload = publish
            ? homepageSectionPayloadSchemas[
                key as keyof typeof homepageSectionPayloadSchemas
              ].parse(row.draft_payload)
            : null;
          const updated =
            await transaction.execute(sql`update content_sections set
          published_payload = ${payload === null ? null : JSON.stringify(payload)}::jsonb,
          published_visible = ${publish ? row.draft_visible : false},
          published_position = ${publish ? row.position : null},
          published_at = ${publish ? sql`clock_timestamp()` : null}
          where id = ${row.id} returning ${sectionColumns}`);
          const changed = updated.rows[0] as AdminContentRow;
          await recordContentAudit(
            transaction,
            actor,
            publish ? 'content.publish' : 'content.unpublish',
            'content_section',
            changed.id,
            'update',
          );
          const jobId = await insertRevalidationJob(
            transaction,
            'site',
            changed.id,
            siteTargets,
          );
          return { value: serializeContentRow(changed), jobId };
        }),
      );
    },

    async listCollection(collection: CollectionName) {
      const config = collectionConfig[collection];
      return useDatabase(async (database) => {
        const result = await database.execute(
          sql`select ${contentColumns} from ${sql.raw(config.table)} order by position asc, id asc`,
        );
        return result.rows.map((row) =>
          serializeContentRow(row as AdminContentRow),
        );
      });
    },

    async reorderCollection(
      collection: CollectionName,
      orders: Array<{ id: string; position: number }>,
      actor: Actor,
    ) {
      const config = collectionConfig[collection];
      return useDatabase(async (database) =>
        database.transaction(async (transaction) => {
          await transaction.execute(
            sql`select pg_advisory_xact_lock(hashtextextended(${`codeddevs:content:${collection}`}, 0))`,
          );
          const selected = await transaction.execute(
            sql`select ${contentColumns} from ${sql.raw(config.table)} order by position asc, id asc for update`,
          );
          const current = selected.rows as unknown as AdminContentRow[];
          validateOrderSet(current, orders);
          return executePositionReorder(
            transaction,
            config.table,
            current,
            orders,
            actor,
            config.targetType,
          );
        }),
      );
    },

    async createCollectionRecord(
      collection: CollectionName,
      payload: unknown,
      visible: boolean,
      actor: Actor,
    ) {
      const config = collectionConfig[collection];
      return useDatabase(async (database) =>
        database.transaction(async (transaction) => {
          await transaction.execute(
            sql`select pg_advisory_xact_lock(hashtextextended(${`codeddevs:content:${collection}`}, 0))`,
          );
          const result =
            await transaction.execute(sql`insert into ${sql.raw(config.table)}
          (position, draft_payload, draft_visible)
          values ((select coalesce(max(position), -1) + 1 from ${sql.raw(config.table)}), ${JSON.stringify(payload)}::jsonb, ${visible})
          returning ${contentColumns}`);
          const row = result.rows[0] as AdminContentRow | undefined;
          if (!row) throw new ContentError('internal');
          await recordContentAudit(
            transaction,
            actor,
            'content.save_draft',
            config.targetType,
            row.id,
            'create',
          );
          return serializeContentRow(row);
        }),
      );
    },

    async saveCollectionDraft(
      collection: CollectionName,
      id: string,
      payload: unknown,
      actor: Actor,
    ) {
      const config = collectionConfig[collection];
      return useDatabase(async (database) =>
        database.transaction(async (transaction) => {
          const selected = await transaction.execute(
            sql`select id from ${sql.raw(config.table)} where id = ${id} for update`,
          );
          if (!selected.rows[0]) throw new ContentError('not_found');
          const result = await transaction.execute(
            sql`update ${sql.raw(config.table)} set draft_payload = ${JSON.stringify(payload)}::jsonb where id = ${id} returning ${contentColumns}`,
          );
          const row = result.rows[0] as AdminContentRow;
          await recordContentAudit(
            transaction,
            actor,
            'content.save_draft',
            config.targetType,
            row.id,
            'update',
          );
          return serializeContentRow(row);
        }),
      );
    },

    async setCollectionVisibility(
      collection: CollectionName,
      id: string,
      visible: boolean,
      actor: Actor,
    ) {
      const config = collectionConfig[collection];
      return useDatabase(async (database) =>
        database.transaction(async (transaction) => {
          const result = await transaction.execute(
            sql`update ${sql.raw(config.table)} set draft_visible = ${visible} where id = ${id} returning ${contentColumns}`,
          );
          const row = result.rows[0] as AdminContentRow | undefined;
          if (!row) throw new ContentError('not_found');
          await recordContentAudit(
            transaction,
            actor,
            'content.save_draft',
            config.targetType,
            row.id,
            'visibility',
          );
          return serializeContentRow(row);
        }),
      );
    },

    async changeCollectionPublication(
      collection: CollectionName,
      id: string,
      publish: boolean,
      actor: Actor,
    ) {
      const config = collectionConfig[collection];
      return finishPublication(async (database) =>
        database.transaction(async (transaction) => {
          const selected = await transaction.execute(
            sql`select ${contentColumns} from ${sql.raw(config.table)} where id = ${id} for update`,
          );
          const row = selected.rows[0] as AdminContentRow | undefined;
          if (!row) throw new ContentError('not_found');
          const payload = publish
            ? config.payloadSchema.parse(row.draft_payload)
            : null;
          const updated =
            await transaction.execute(sql`update ${sql.raw(config.table)} set
          published_payload = ${payload === null ? null : JSON.stringify(payload)}::jsonb,
          published_visible = ${publish ? row.draft_visible : false},
          published_position = ${publish ? row.position : null},
          published_at = ${publish ? sql`clock_timestamp()` : null}
          where id = ${id} returning ${contentColumns}`);
          const changed = updated.rows[0] as AdminContentRow;
          await recordContentAudit(
            transaction,
            actor,
            publish ? 'content.publish' : 'content.unpublish',
            config.targetType,
            changed.id,
            'update',
          );
          const jobId = await insertRevalidationJob(
            transaction,
            'site',
            changed.id,
            siteTargets,
          );
          return { value: serializeContentRow(changed), jobId };
        }),
      );
    },

    async deleteCollectionRecord(
      collection: CollectionName,
      id: string,
      actor: Actor,
    ) {
      const config = collectionConfig[collection];
      return finishPublication(async (database) =>
        database.transaction(async (transaction) => {
          const selected = await transaction.execute(
            sql`select id, published_payload from ${sql.raw(config.table)} where id = ${id} for update`,
          );
          const row = selected.rows[0] as
            { id: string; published_payload: unknown | null } | undefined;
          if (!row) throw new ContentError('not_found');
          await transaction.execute(
            sql`delete from ${sql.raw(config.table)} where id = ${id}`,
          );
          await recordContentAudit(
            transaction,
            actor,
            'content.delete',
            config.targetType,
            id,
            'delete',
          );
          const jobId =
            row.published_payload === null
              ? null
              : await insertRevalidationJob(
                  transaction,
                  'site',
                  id,
                  siteTargets,
                );
          return { value: undefined, jobId };
        }),
      );
    },

    async readSettings() {
      return useDatabase(async (database) => {
        const result = await database.execute(sql`select id, draft_payload,
          published_payload, published_at, created_at, updated_at
          from site_settings where id = true limit 1`);
        const row = result.rows[0] as
          Parameters<typeof serializeSettingsRow>[0] | undefined;
        if (!row) throw new ContentError('not_found');
        return serializeSettingsRow(row);
      });
    },

    async saveSettingsDraft(settings: Record<string, unknown>, actor: Actor) {
      return useDatabase(async (database) =>
        database.transaction(async (transaction) => {
          await transaction.execute(
            sql`select pg_advisory_xact_lock(hashtextextended('codeddevs:settings', 0))`,
          );
          const existing =
            await transaction.execute(sql`select id, draft_payload,
          published_payload, published_at, created_at, updated_at from site_settings where id = true for update`);
          const oldRow = existing.rows[0] as
            Parameters<typeof serializeSettingsRow>[0] | undefined;
          const merged = {
            ...(oldRow?.draft_payload &&
            typeof oldRow.draft_payload === 'object'
              ? (oldRow.draft_payload as Record<string, unknown>)
              : {}),
            ...settings,
          };
          const validated = settingsPayloadSchema.parse(merged);
          const saved =
            await transaction.execute(sql`insert into site_settings (id, draft_payload)
          values (true, ${JSON.stringify(validated)}::jsonb)
          on conflict (id) do update set draft_payload = excluded.draft_payload
          returning id, draft_payload, published_payload, published_at, created_at, updated_at`);
          const row = saved.rows[0] as Parameters<
            typeof serializeSettingsRow
          >[0];
          await recordContentAudit(
            transaction,
            actor,
            'content.save_draft',
            'site_settings',
            null,
            oldRow ? 'update' : 'create',
          );
          return serializeSettingsRow(row);
        }),
      );
    },

    async changeSettingsPublication(publish: boolean, actor: Actor) {
      return finishPublication(async (database) =>
        database.transaction(async (transaction) => {
          const selected =
            await transaction.execute(sql`select id, draft_payload,
          published_payload, published_at, created_at, updated_at from site_settings where id = true for update`);
          const row = selected.rows[0] as
            Parameters<typeof serializeSettingsRow>[0] | undefined;
          if (!row) throw new ContentError('not_found');
          const payload = publish
            ? settingsPayloadSchema.parse(row.draft_payload)
            : null;
          const updated = await transaction.execute(sql`update site_settings set
          published_payload = ${payload === null ? null : JSON.stringify(payload)}::jsonb,
          published_at = ${publish ? sql`clock_timestamp()` : null} where id = true
          returning id, draft_payload, published_payload, published_at, created_at, updated_at`);
          const changed = updated.rows[0] as Parameters<
            typeof serializeSettingsRow
          >[0];
          await recordContentAudit(
            transaction,
            actor,
            publish ? 'content.publish' : 'content.unpublish',
            'site_settings',
            null,
            'update',
          );
          const jobId = await insertRevalidationJob(
            transaction,
            'site',
            null,
            siteTargets,
          );
          return { value: serializeSettingsRow(changed), jobId };
        }),
      );
    },
  };
}

export type AdminService = ReturnType<typeof createAdminService>;
export type AdminCollection = CollectionName;
