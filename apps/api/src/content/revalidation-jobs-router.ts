import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import type { ApiEnvironment } from '../config/env.js';
import { createSecuredAdminRouter } from './admin-http.js';
import { processRevalidationJob } from './revalidation.js';

const querySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['pending', 'processing', 'succeeded', 'failed']).optional(),
  })
  .strict();
const idSchema = z.string().uuid();

function serializeJob(row: Record<string, unknown>) {
  return {
    id: row.id,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    status: row.status,
    attempts: row.attempts,
    targets: row.targets,
    lastError: row.last_error,
    nextAttemptAt: row.next_attempt_at
      ? new Date(String(row.next_attempt_at)).toISOString()
      : null,
    completedAt: row.completed_at
      ? new Date(String(row.completed_at)).toISOString()
      : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export function createRevalidationJobsRouter(
  databaseUrl: string | undefined,
  environment: ApiEnvironment,
) {
  const router = createSecuredAdminRouter(environment, /\/retry$/);
  router.get('/', async (request, response) => {
    response.set('Cache-Control', 'no-store');
    const parsed = querySchema.safeParse(request.query);
    if (!parsed.success) {
      response.status(400).json({ error: 'Invalid request' });
      return;
    }
    if (!databaseUrl) {
      response.status(500).json({ error: 'Internal server error' });
      return;
    }
    const { db, pool } = createDatabase(databaseUrl);
    try {
      const condition = parsed.data.status
        ? sql`status = ${parsed.data.status}`
        : sql`true`;
      const [rows, totals] = await Promise.all([
        db.execute(sql`select id, resource_type, resource_id,
          status, attempts, targets, last_error, next_attempt_at, completed_at,
          created_at, updated_at from revalidation_jobs where ${condition}
          order by created_at desc, id desc limit ${parsed.data.limit}
          offset ${(parsed.data.page - 1) * parsed.data.limit}`),
        db.execute(sql`select count(*)::int as total
          from revalidation_jobs where ${condition}`),
      ]);
      const total = Number(
        (totals.rows[0] as { total?: number | string } | undefined)?.total ?? 0,
      );
      response.json({
        items: rows.rows.map((row) =>
          serializeJob(row as Record<string, unknown>),
        ),
        total,
        page: parsed.data.page,
        limit: parsed.data.limit,
        totalPages: Math.ceil(total / parsed.data.limit),
      });
    } catch {
      response.status(500).json({ error: 'Internal server error' });
    } finally {
      await pool.end();
    }
  });

  router.post('/:id/retry', async (request, response) => {
    response.set('Cache-Control', 'no-store');
    const id = idSchema.safeParse(request.params.id);
    if (!id.success) {
      response.status(404).json({ error: 'Not found' });
      return;
    }
    try {
      const result = await processRevalidationJob(
        databaseUrl,
        environment,
        id.data,
      );
      if (!result.claimed) {
        response.status(409).json({ error: 'Job is not currently retryable' });
        return;
      }
      response.json({ success: true, status: result.status });
    } catch {
      response.status(500).json({ error: 'Internal server error' });
    }
  });
  return router;
}
