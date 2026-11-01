import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { hashPassword } from './password.js';
import { PASSWORD_POLICY } from './policy.js';
import { replaceRecoveryKit } from './recovery-kit.js';

async function readConfirmedPassword(): Promise<string> {
  if (process.stdin.isTTY)
    throw new Error('Protected standard input is required.');
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk as Uint8Array);
    length += bytes.length;
    if (length > PASSWORD_POLICY.maximumUtf8Bytes + 11)
      throw new Error('Input too long.');
    chunks.push(bytes);
  }
  const input = new TextDecoder('utf-8', { fatal: true }).decode(
    Buffer.concat(chunks),
  );
  const newline = input.indexOf('\n');
  if (newline < 0 || input.slice(0, newline).replace(/\r$/, '') !== 'RECOVER')
    throw new Error('Confirmation required.');
  return input.slice(newline + 1).replace(/\r?\n$/, '');
}

async function main(): Promise<void> {
  if (process.argv.length !== 2) throw new Error('Arguments are not accepted.');
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('Database configuration required.');
  const passwordHash = await hashPassword(await readConfirmedPassword());
  const { db, pool } = createDatabase(databaseUrl);
  try {
    const codes = await db.transaction(async (tx) => {
      const admins = await tx.execute<{ id: string }>(
        sql`select id from admin_users where is_super_admin = true for update`,
      );
      const admin = admins.rows[0];
      if (!admin) throw new Error('Administrator not found.');
      await tx.execute(
        sql`update admin_users set password_hash = ${passwordHash}, credential_version = credential_version + 1 where id = ${admin.id}`,
      );
      await tx.execute(
        sql`update sessions set revoked_at = clock_timestamp() where admin_user_id = ${admin.id} and revoked_at is null`,
      );
      return replaceRecoveryKit(tx, admin.id, 'operator_reset');
    });
    process.stdout.write(`${codes.join('\n')}\n`);
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  console.error(
    'Operator recovery failed. Verify input and database configuration.',
  );
  process.exitCode = 1;
});
