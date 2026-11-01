import { createDatabase } from '../db/client.js';
import { adminUsers, recoveryCodes, recoveryCodeSets } from '../db/schema.js';

export async function provisionAdministrator(
  databaseUrl: string,
  email: string,
  passwordHash: string,
  codeHashes: string[],
): Promise<void> {
  const { db, pool } = createDatabase(databaseUrl);
  try {
    await db.transaction(async (transaction) => {
      const [admin] = await transaction
        .insert(adminUsers)
        .values({ email, passwordHash, credentialVersion: 1 })
        .returning({ id: adminUsers.id });
      if (!admin) throw new Error('Administrator insert failed.');
      const [set] = await transaction
        .insert(recoveryCodeSets)
        .values({ adminUserId: admin.id })
        .returning({ id: recoveryCodeSets.id });
      if (!set) throw new Error('Recovery set insert failed.');
      await transaction.insert(recoveryCodes).values(
        codeHashes.map((codeHash, position) => ({
          setId: set.id,
          position,
          codeHash,
        })),
      );
    });
  } finally {
    await pool.end();
  }
}
