export type RevalidationFailureCode =
  | 'configuration_unavailable'
  | 'timeout'
  | 'request_failed'
  | 'invalid_response';

export type RevalidationTargets = { paths: string[]; tags: string[] };
export type RevalidationResult =
  { ok: true } | { ok: false; code: RevalidationFailureCode };

type Database = ReturnType<typeof createDatabase>['db'];
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export async function insertRevalidationJob(
  transaction: Transaction,
  resourceType: 'site' | 'article',
  resourceId: string | null,
  targets: RevalidationTargets,
) {
  const inserted = await transaction.execute(sql`insert into revalidation_jobs
    (resource_type, resource_id, targets)
    values (${resourceType}, ${resourceId}, ${JSON.stringify(targets)}::jsonb)
    returning id`);
  const row = inserted.rows[0] as { id: string } | undefined;
  if (!row) throw new Error('Could not queue content revalidation.');
  return row.id;
}

export async function dispatchContentRevalidation(
  configuration: {
    webInternalOrigin?: string;
    contentRevalidationSecret?: string;
  },
  targets: RevalidationTargets,
  fetcher: typeof fetch = fetch,
): Promise<RevalidationResult> {
  if (
    !configuration.webInternalOrigin ||
    !configuration.contentRevalidationSecret
  ) {
    return { ok: false, code: 'configuration_unavailable' };
  }
  try {
    const result = await fetcher(
      `${configuration.webInternalOrigin}/api/revalidate`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-codeddevs-revalidation-secret':
            configuration.contentRevalidationSecret,
        },
        body: JSON.stringify(targets),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (result.status !== 204) {
      await result.body?.cancel();
      return { ok: false, code: 'invalid_response' };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code:
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
          ? 'timeout'
          : 'request_failed',
    };
  }
}
import { sql } from 'drizzle-orm';
import type { createDatabase } from '../db/client.js';
import { createDatabase as openDatabase } from '../db/client.js';

export async function processRevalidationJob(
  databaseUrl: string | undefined,
  configuration: {
    webInternalOrigin?: string;
    contentRevalidationSecret?: string;
  },
  jobId: string,
) {
  if (!databaseUrl) throw new Error('Database is unavailable.');
  const { db, pool } = openDatabase(databaseUrl);
  try {
    const claimed = await db.execute(sql`update revalidation_jobs
      set status = 'processing', attempts = attempts + 1,
          next_attempt_at = null, completed_at = null, last_error = null
      where id = ${jobId} and attempts < 5 and (
        (status = 'pending' and (next_attempt_at is null or next_attempt_at <= now()))
        or (status = 'failed' and next_attempt_at <= now())
        or (status = 'processing' and updated_at < now() - interval '5 minutes')
      )
      returning id, attempts, targets`);
    const job = claimed.rows[0] as
      | { id: string; attempts: number; targets: RevalidationTargets }
      | undefined;
    if (!job) return { claimed: false } as const;

    let result: RevalidationResult;
    try {
      result = await dispatchContentRevalidation(configuration, job.targets);
    } catch {
      result = { ok: false, code: 'request_failed' };
    }
    if (result.ok) {
      await db.execute(sql`update revalidation_jobs set
        status = 'succeeded', last_error = null, next_attempt_at = null,
        completed_at = now() where id = ${job.id} and status = 'processing'`);
      return { claimed: true, status: 'succeeded' } as const;
    }
    const delayMinutes = [1, 2, 4, 8, 15][job.attempts - 1] ?? 15;
    await db.execute(sql`update revalidation_jobs set
      status = 'failed', last_error = ${result.code},
      next_attempt_at = ${job.attempts < 5 ? sql`now() + (${delayMinutes} * interval '1 minute')` : sql`null`},
      completed_at = null where id = ${job.id} and status = 'processing'`);
    return { claimed: true, status: 'failed', error: result.code } as const;
  } finally {
    await pool.end();
  }
}
