import { createHash, randomBytes } from 'node:crypto';
import { verify } from 'argon2';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { sessions } from '../db/schema.js';
import {
  type AuthenticationAuditReason,
  writeAuthenticationAudit,
} from '../security/audit-and-logging.js';
import { LOGIN_POLICY, SESSION_POLICY } from './policy.js';
import { writeCoalescedRejectedAuthenticationAudit } from './rejected-audit.js';
import {
  authenticationThrottleKeys,
  clearAccountThrottle,
  lockAuthenticationThrottle,
  recordAuthenticationFailure,
  throttleKey,
} from './throttle.js';

// Public dummy verifier, not an account credential. It matches the current Argon2id cost.
const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,p=1,t=2$g4JQH9nlotbL4gNVtgWmFg$a0eQ7CW1pKVSh1lXJnd55C6f+BLdnRppNp2ziA4eRoY';
const digest = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export async function auditRejectedLogin(
  databaseUrl: string,
  secret: string,
  ip: string,
  reason: AuthenticationAuditReason,
  eventType: 'auth.login' | 'auth.recovery' = 'auth.login',
): Promise<number> {
  const { db, pool } = createDatabase(databaseUrl);
  const ipKey = throttleKey(secret, 'ip', ip);
  try {
    return await db.transaction(async (tx) => {
      await tx.execute(sql`insert into auth_throttle_buckets (bucket_type, key_hash, window_started_at)
        values ('ip', ${ipKey}, clock_timestamp()) on conflict (bucket_type, key_hash) do nothing`);
      const bucket = await tx.execute<{
        retry: number;
      }>(sql`select greatest(0, ceil(extract(epoch from blocked_until - clock_timestamp())))::int as retry
        from auth_throttle_buckets where bucket_type = 'ip' and key_hash = ${ipKey} for update`);
      const retry = bucket.rows[0]?.retry ?? 0;
      if (retry > 0) return retry;
      const updated = await tx.execute<{
        failure_count: number;
      }>(sql`update auth_throttle_buckets set
        failure_count = case when window_started_at <= clock_timestamp() - ${LOGIN_POLICY.windowSeconds} * interval '1 second' then 1 else failure_count + 1 end,
        window_started_at = case when window_started_at <= clock_timestamp() - ${LOGIN_POLICY.windowSeconds} * interval '1 second' then clock_timestamp() else window_started_at end,
        blocked_until = case when window_started_at > clock_timestamp() - ${LOGIN_POLICY.windowSeconds} * interval '1 second' and failure_count + 1 >= ${LOGIN_POLICY.ipFailureThreshold}
          then clock_timestamp() + ${LOGIN_POLICY.maximumBlockSeconds} * interval '1 second' else null end
        where bucket_type = 'ip' and key_hash = ${ipKey} returning failure_count`);
      const count = updated.rows[0]?.failure_count;
      await writeCoalescedRejectedAuthenticationAudit(
        tx,
        secret,
        eventType,
        count === LOGIN_POLICY.ipFailureThreshold ? 'ip_throttled' : reason,
      );
      return 0;
    });
  } finally {
    await pool.end();
  }
}

export async function attemptLogin(
  databaseUrl: string,
  secret: string,
  email: string,
  password: string,
  ip: string,
  previousToken?: string,
) {
  const { db, pool } = createDatabase(databaseUrl);
  const keys = authenticationThrottleKeys(secret, email, ip);
  try {
    return await db.transaction(async (tx) => {
      const retry = await lockAuthenticationThrottle(tx, keys);
      if (retry > 0) {
        return { status: 'throttled' as const, retry };
      }
      const result = await tx.execute<{
        id: string;
        password_hash: string;
        credential_version: number;
      }>(
        sql`select id, password_hash, credential_version from admin_users where email = ${email} and is_super_admin = true for update`,
      );
      const admin = result.rows[0];
      const valid = await verify(
        admin?.password_hash ?? DUMMY_PASSWORD_HASH,
        password,
      );
      if (!admin || !valid) {
        await recordAuthenticationFailure(tx, keys);
        await writeCoalescedRejectedAuthenticationAudit(
          tx,
          secret,
          'auth.login',
          'invalid_credentials',
        );
        return { status: 'invalid' as const };
      }
      if (previousToken) {
        await tx.execute(
          sql`update sessions set revoked_at = clock_timestamp() where admin_user_id = ${admin.id} and token_hash = ${digest(previousToken)} and revoked_at is null`,
        );
      }
      const token = randomBytes(32).toString('base64url');
      const tokenHash = digest(token);
      const session = await tx
        .insert(sessions)
        .values({
          adminUserId: admin.id,
          credentialVersion: admin.credential_version,
          tokenHash,
          expiresAt: sql`clock_timestamp() + ${SESSION_POLICY.absoluteTimeoutMilliseconds} * interval '1 millisecond'`,
        })
        .returning({ expiresAt: sessions.expiresAt });
      await clearAccountThrottle(tx, keys);
      await writeAuthenticationAudit(tx, {
        actorAdminUserId: admin.id,
        eventType: 'auth.login',
        targetId: admin.id,
        metadata: { outcome: 'success' },
      });
      return {
        status: 'success' as const,
        token,
        expiresAt: session[0]!.expiresAt,
      };
    });
  } finally {
    await pool.end();
  }
}
