import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import {
  type AuthenticationAuditReason,
  writeAuthenticationAudit,
} from '../security/audit-and-logging.js';
import { LOGIN_POLICY } from './policy.js';
import { throttleKey } from './throttle.js';

type Database = ReturnType<typeof createDatabase>['db'];
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Persists at most one matching rejected-credential audit event per policy
 * window. The marker is deliberately independent of an account or IP, so a
 * distributed attacker cannot turn distinct identifiers into audit rows.
 */
export async function writeCoalescedRejectedAuthenticationAudit(
  transaction: Transaction,
  secret: string,
  eventType: 'auth.login' | 'auth.recovery',
  reason: AuthenticationAuditReason,
  action?: 'regenerate',
): Promise<void> {
  const markerKey = throttleKey(
    secret,
    'policy',
    `${eventType}\0${reason}\0${action ?? ''}`,
  );
  const marker = await transaction.execute<{ id: string }>(
    sql`insert into auth_throttle_buckets (bucket_type, key_hash, window_started_at)
      values ('ip', ${markerKey}, clock_timestamp())
      on conflict (bucket_type, key_hash) do update set window_started_at = excluded.window_started_at
      where auth_throttle_buckets.window_started_at <= clock_timestamp() - ${LOGIN_POLICY.windowSeconds} * interval '1 second'
      returning id`,
  );
  if (marker.rows.length === 0) return;

  if (eventType === 'auth.recovery') {
    await writeAuthenticationAudit(transaction, {
      eventType,
      metadata: action
        ? { outcome: 'rejected', reason, action }
        : { outcome: 'rejected', reason },
    });
    return;
  }

  await writeAuthenticationAudit(transaction, {
    eventType,
    metadata: { outcome: 'rejected', reason },
  });
}
