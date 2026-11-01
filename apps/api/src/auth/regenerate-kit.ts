import { createHash } from 'node:crypto';
import { verify } from 'argon2';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { SESSION_POLICY } from './policy.js';
import { writeCoalescedRejectedAuthenticationAudit } from './rejected-audit.js';
import { replaceRecoveryKit } from './recovery-kit.js';
import {
  authenticationThrottleKeys,
  clearAccountThrottle,
  lockAuthenticationThrottle,
  recordAuthenticationFailure,
} from './throttle.js';

export async function regenerateKit(
  databaseUrl: string,
  secret: string,
  adminId: string,
  email: string,
  token: string,
  password: string,
  ip: string,
) {
  const { db, pool } = createDatabase(databaseUrl);
  const keys = authenticationThrottleKeys(secret, email, ip);
  const tokenHash = createHash('sha256').update(token).digest('hex');
  try {
    return await db.transaction(async (tx) => {
      const retry = await lockAuthenticationThrottle(tx, keys);
      if (retry > 0) return { status: 'throttled' as const, retry };
      const admins = await tx.execute<{
        id: string;
        password_hash: string;
        credential_version: number;
      }>(
        sql`select id, password_hash, credential_version from admin_users where id = ${adminId} and is_super_admin = true for update`,
      );
      const admin = admins.rows[0];
      if (!admin) return { status: 'invalid_session' as const };
      const active = await tx.execute<{ id: string }>(
        sql`select id from sessions where admin_user_id = ${admin.id} and token_hash = ${tokenHash} and credential_version = ${admin.credential_version} and revoked_at is null and expires_at > clock_timestamp() and coalesce(last_used_at, created_at) > clock_timestamp() - ${SESSION_POLICY.idleTimeoutMilliseconds} * interval '1 millisecond' for update`,
      );
      if (!active.rows[0]) return { status: 'invalid_session' as const };
      if (!(await verify(admin.password_hash, password))) {
        await recordAuthenticationFailure(tx, keys);
        await writeCoalescedRejectedAuthenticationAudit(
          tx,
          secret,
          'auth.recovery',
          'invalid_credentials',
          'regenerate',
        );
        return { status: 'invalid_credentials' as const };
      }
      // Recheck expiry after the password verification, before changing the kit.
      const stillActive = await tx.execute<{ id: string }>(
        sql`select id from sessions where id = ${active.rows[0].id} and expires_at > clock_timestamp() and coalesce(last_used_at, created_at) > clock_timestamp() - ${SESSION_POLICY.idleTimeoutMilliseconds} * interval '1 millisecond'`,
      );
      if (!stillActive.rows[0]) return { status: 'invalid_session' as const };
      const codes = await replaceRecoveryKit(tx, admin.id, 'regenerate');
      await clearAccountThrottle(tx, keys);
      return { status: 'success' as const, codes };
    });
  } finally {
    await pool.end();
  }
}
