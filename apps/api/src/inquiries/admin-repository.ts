import { and, desc, eq, sql } from 'drizzle-orm';
import type { createDatabase } from '../db/client.js';
import { auditEvents, inquiries } from '../db/schema.js';
import type {
  inquiryAdminQuerySchema,
  inquiryStatusSchema,
} from './contracts.js';
import { inquiryStatusTransitions } from './contracts.js';
import type { z } from 'zod';

type Database = ReturnType<typeof createDatabase>['db'];
type AdminQuery = z.infer<typeof inquiryAdminQuerySchema>;
type Status = z.infer<typeof inquiryStatusSchema>;

export class InquiryAdminError extends Error {
  constructor(readonly kind: 'not_found' | 'invalid_transition') {
    super(kind);
  }
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function searchCondition(value: string | undefined) {
  if (!value) return undefined;
  const pattern = `%${escapeLike(value)}%`;
  return sql`(
    ${inquiries.name} ilike ${pattern} escape '\\'
    or ${inquiries.email} ilike ${pattern} escape '\\'
    or coalesce(${inquiries.company}, '') ilike ${pattern} escape '\\'
  )`;
}

export function createInquiryAdminRepository(db: Database) {
  return {
    async list(query: AdminQuery) {
      const clauses = [
        query.status ? eq(inquiries.status, query.status) : undefined,
        searchCondition(query.search),
      ].filter((condition) => condition !== undefined);
      const where = clauses.length ? and(...clauses) : undefined;
      const [count] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(inquiries)
        .where(where);
      const items = await db
        .select()
        .from(inquiries)
        .where(where)
        .orderBy(desc(inquiries.createdAt), desc(inquiries.id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit);
      return {
        items,
        total: count?.total ?? 0,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil((count?.total ?? 0) / query.limit),
      };
    },

    async get(id: string) {
      const [inquiry] = await db
        .select()
        .from(inquiries)
        .where(eq(inquiries.id, id))
        .limit(1);
      return inquiry;
    },

    async updateStatus(id: string, status: Status, actorAdminUserId: string) {
      return db.transaction(async (transaction) => {
        const [current] = await transaction
          .select()
          .from(inquiries)
          .where(eq(inquiries.id, id))
          .for('update')
          .limit(1);
        if (!current) throw new InquiryAdminError('not_found');
        if (
          !(
            inquiryStatusTransitions[current.status] as readonly Status[]
          ).includes(status)
        ) {
          throw new InquiryAdminError('invalid_transition');
        }
        const now = new Date();
        const [updated] = await transaction
          .update(inquiries)
          .set({
            status,
            statusUpdatedByAdminUserId: actorAdminUserId,
            statusUpdatedAt: now,
            updatedAt: now,
          })
          .where(eq(inquiries.id, id))
          .returning();
        if (!updated) throw new InquiryAdminError('not_found');
        await transaction.insert(auditEvents).values({
          actorAdminUserId,
          eventType: 'inquiry.update',
          targetType: 'inquiry',
          targetId: id,
          metadata: { fromStatus: current.status, toStatus: status },
        });
        return updated;
      });
    },
  };
}
