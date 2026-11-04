import type { RequestHandler } from 'express';
import { createDatabase } from '../db/client.js';
import { inquiryThrottleBuckets } from '../db/schema.js';

async function probeDatabase(databaseUrl: string): Promise<boolean> {
  const database = createDatabase(databaseUrl, {
    connectionTimeoutMillis: 2_000,
    query_timeout: 2_000,
  });
  try {
    await database.db
      .select({ id: inquiryThrottleBuckets.id })
      .from(inquiryThrottleBuckets)
      .limit(0);
    return true;
  } finally {
    await database.pool.end().catch(() => undefined);
  }
}

export function createReadinessHandler(
  databaseUrl: string | undefined,
  probe: (url: string) => Promise<boolean> = probeDatabase,
): RequestHandler {
  let inFlight: Promise<boolean> | undefined;
  return async (_request, response) => {
    response.set('Cache-Control', 'no-store');
    if (!databaseUrl) {
      response.status(503).json({ status: 'unavailable' });
      return;
    }

    inFlight ??= Promise.resolve()
      .then(() => probe(databaseUrl))
      .catch(() => false)
      .finally(() => {
        inFlight = undefined;
      });
    const ready = await inFlight;

    response.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'unavailable',
    });
  };
}
