import { createHmac } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { LOGIN_POLICY } from './policy.js';

type Database = ReturnType<typeof createDatabase>['db'];
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];
type ThrottleKeys = { accountKey: string; ipKey: string };

export function throttleKey(
  secret: string,
  type: 'account' | 'ip' | 'policy',
  value: string,
) {
  return createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(type)
    .update('\0')
    .update(value)
    .digest('hex');
}

export function authenticationThrottleKeys(
  secret: string,
  email: string,
  ip: string,
): ThrottleKeys {
  return {
    accountKey: throttleKey(secret, 'account', email),
    ipKey: throttleKey(secret, 'ip', ip),
  };
}

export async function lockAuthenticationThrottle(
  tx: Transaction,
  keys: ThrottleKeys,
): Promise<number> {
  for (const [type, key] of [
    ['ip', keys.ipKey],
    ['account', keys.accountKey],
  ] as const) {
    await tx.execute(sql`insert into auth_throttle_buckets (bucket_type, key_hash, window_started_at)
      values (${type}, ${key}, clock_timestamp()) on conflict (bucket_type, key_hash) do nothing`);
    await tx.execute(
      sql`select id from auth_throttle_buckets where bucket_type = ${type} and key_hash = ${key} for update`,
    );
    if (type === 'ip') {
      const ipBlocked = await tx.execute<{ retry: number }>(
        sql`select greatest(0, ceil(extract(epoch from blocked_until - clock_timestamp())))::int as retry from auth_throttle_buckets where bucket_type = 'ip' and key_hash = ${keys.ipKey}`,
      );
      const retry = ipBlocked.rows[0]?.retry ?? 0;
      if (retry > 0) return retry;
    }
  }
  const blocked = await tx.execute<{
    retry: number;
  }>(sql`select greatest(0, ceil(extract(epoch from max(blocked_until) - clock_timestamp())))::int as retry
    from auth_throttle_buckets where (bucket_type = 'account' and key_hash = ${keys.accountKey}) or (bucket_type = 'ip' and key_hash = ${keys.ipKey})`);
  return blocked.rows[0]?.retry ?? 0;
}

export async function recordAuthenticationFailure(
  tx: Transaction,
  keys: ThrottleKeys,
): Promise<void> {
  for (const [type, key, threshold] of [
    ['account', keys.accountKey, LOGIN_POLICY.accountFailureThreshold],
    ['ip', keys.ipKey, LOGIN_POLICY.ipFailureThreshold],
  ] as const) {
    await tx.execute(sql`update auth_throttle_buckets set
      failure_count = case when window_started_at <= clock_timestamp() - ${LOGIN_POLICY.windowSeconds} * interval '1 second' then 1 else failure_count + 1 end,
      window_started_at = case when window_started_at <= clock_timestamp() - ${LOGIN_POLICY.windowSeconds} * interval '1 second' then clock_timestamp() else window_started_at end,
      blocked_until = case
        when window_started_at > clock_timestamp() - ${LOGIN_POLICY.windowSeconds} * interval '1 second' and failure_count + 1 >= ${threshold}
        then clock_timestamp() + (case when ${type} = 'ip' then ${LOGIN_POLICY.maximumBlockSeconds} else least(${LOGIN_POLICY.maximumBlockSeconds}, power(2, least(failure_count + 1 - ${threshold}, 10))) end) * interval '1 second'
        else null end
      where bucket_type = ${type} and key_hash = ${key}`);
  }
}

export async function clearAccountThrottle(
  tx: Transaction,
  keys: ThrottleKeys,
): Promise<void> {
  await tx.execute(
    sql`update auth_throttle_buckets set failure_count = 0, blocked_until = null, window_started_at = clock_timestamp() where bucket_type = 'account' and key_hash = ${keys.accountKey}`,
  );
}
