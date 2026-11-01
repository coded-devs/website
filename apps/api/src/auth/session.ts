import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { SESSION_POLICY } from './policy.js';

export type SessionPrincipal = {
  admin: { id: string; email: string; role: 'SUPER_ADMIN' };
  session: { expiresAt: string };
};

export async function authenticateSession(
  databaseUrl: string,
  token: string,
): Promise<SessionPrincipal | null> {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const { db, pool } = createDatabase(databaseUrl);
  try {
    return await db.transaction(async (tx) => {
      // Credential changes and login rotation lock the administrator first.
      const admins = await tx.execute<{
        id: string;
        email: string;
        credential_version: number;
      }>(
        sql`select id, email, credential_version from admin_users where is_super_admin = true for share`,
      );
      const admin = admins.rows[0];
      if (!admin) return null;
      const result = await tx.execute<{
        id: string;
        expires_at: string | Date;
      }>(sql`select id, expires_at from sessions
        where admin_user_id = ${admin.id} and token_hash = ${tokenHash}
          and credential_version = ${admin.credential_version} and revoked_at is null
          and expires_at > clock_timestamp()
          and coalesce(last_used_at, created_at) > clock_timestamp() - ${SESSION_POLICY.idleTimeoutMilliseconds} * interval '1 millisecond'
        for update`);
      const session = result.rows[0];
      if (!session) return null;
      // This narrowly scoped write is the approved exception to the general
      // safe-method rule: it keeps the server-enforced idle timeout accurate
      // without extending the absolute expiry.
      await tx.execute(sql`update sessions set last_used_at = clock_timestamp()
        where id = ${session.id}
          and (last_used_at is null or last_used_at <= clock_timestamp() - ${SESSION_POLICY.lastUsedUpdateIntervalMilliseconds} * interval '1 millisecond')`);
      const expiresAt =
        typeof session.expires_at === 'string'
          ? new Date(session.expires_at)
          : session.expires_at;
      return {
        admin: {
          id: admin.id,
          email: admin.email,
          role: 'SUPER_ADMIN' as const,
        },
        session: { expiresAt: expiresAt.toISOString() },
      };
    });
  } finally {
    await pool.end();
  }
}
