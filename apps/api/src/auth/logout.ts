import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { writeAuthenticationAudit } from '../security/audit-and-logging.js';
import { SESSION_POLICY } from './policy.js';

export async function revokeSession(
  databaseUrl: string,
  token: string,
): Promise<void> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const { db, pool } = createDatabase(databaseUrl);
  try {
    await db.transaction(async (tx) => {
      // Match login and session authentication lock ordering.
      const admins = await tx.execute<{
        id: string;
        credential_version: number;
      }>(
        sql`select id, credential_version from admin_users where is_super_admin = true for share`,
      );
      const admin = admins.rows[0];
      if (!admin) return;
      const revoked = await tx.execute<{
        id: string;
      }>(sql`update sessions set revoked_at = clock_timestamp()
        where admin_user_id = ${admin.id} and token_hash = ${tokenHash}
          and credential_version = ${admin.credential_version} and revoked_at is null
          and expires_at > clock_timestamp()
          and coalesce(last_used_at, created_at) > clock_timestamp() - ${SESSION_POLICY.idleTimeoutMilliseconds} * interval '1 millisecond'
        returning id`);
      if (!revoked.rows[0]) return;
      await writeAuthenticationAudit(tx, {
        actorAdminUserId: admin.id,
        eventType: 'auth.logout',
        targetId: admin.id,
        metadata: { outcome: 'success' },
      });
    });
  } finally {
    await pool.end();
  }
}
