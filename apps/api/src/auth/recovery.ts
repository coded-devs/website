import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { writeAuthenticationAudit } from '../security/audit-and-logging.js';
import { hashPassword } from './password.js';
import { writeCoalescedRejectedAuthenticationAudit } from './rejected-audit.js';
import { hashRecoveryCode } from './recovery-codes.js';
import {
  authenticationThrottleKeys,
  clearAccountThrottle,
  lockAuthenticationThrottle,
  recordAuthenticationFailure,
} from './throttle.js';

export async function recoverAccount(
  databaseUrl: string,
  secret: string,
  email: string,
  code: string,
  newPassword: string,
  ip: string,
) {
  const { db, pool } = createDatabase(databaseUrl);
  const keys = authenticationThrottleKeys(secret, email, ip);
  const codeHash = hashRecoveryCode(code);
  try {
    return await db.transaction(async (tx) => {
      const retry = await lockAuthenticationThrottle(tx, keys);
      if (retry > 0) return { status: 'throttled' as const, retry };
      // Match login's administrator-before-session lock order.
      const admins = await tx.execute<{ id: string }>(
        sql`select id from admin_users where email = ${email} and is_super_admin = true for update`,
      );
      const admin = admins.rows[0];
      const matching = admin
        ? await tx.execute<{
            id: string;
          }>(sql`select sets.id from recovery_code_sets as sets
        join recovery_codes as codes on codes.set_id = sets.id
        where sets.admin_user_id = ${admin.id} and sets.consumed_at is null and codes.code_hash = ${codeHash}
        for update of sets`)
        : undefined;
      const set = matching?.rows[0];
      if (!admin || !set) {
        await recordAuthenticationFailure(tx, keys);
        await writeCoalescedRejectedAuthenticationAudit(
          tx,
          secret,
          'auth.recovery',
          'invalid_credentials',
        );
        return { status: 'invalid' as const };
      }
      const passwordHash = await hashPassword(newPassword);
      await tx.execute(
        sql`update admin_users set password_hash = ${passwordHash}, credential_version = credential_version + 1 where id = ${admin.id}`,
      );
      await tx.execute(
        sql`update sessions set revoked_at = clock_timestamp() where admin_user_id = ${admin.id} and revoked_at is null`,
      );
      await tx.execute(
        sql`update recovery_code_sets set consumed_at = clock_timestamp() where id = ${set.id} and consumed_at is null`,
      );
      await clearAccountThrottle(tx, keys);
      await writeAuthenticationAudit(tx, {
        actorAdminUserId: admin.id,
        eventType: 'auth.recovery',
        targetId: admin.id,
        metadata: { outcome: 'success' },
      });
      return { status: 'success' as const };
    });
  } finally {
    await pool.end();
  }
}
