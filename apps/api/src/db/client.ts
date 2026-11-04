import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import * as schema from './schema.js';

export function createDatabase(
  databaseUrl: string,
  options?: Pick<PoolConfig, 'connectionTimeoutMillis' | 'query_timeout'>,
) {
  const pool = new Pool({ connectionString: databaseUrl, ...options });
  return { db: drizzle(pool, { schema }), pool };
}
