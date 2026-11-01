import { sql } from 'drizzle-orm';
import { createDatabase } from '../db/client.js';
import { recoveryCodes, recoveryCodeSets } from '../db/schema.js';
import { writeAuthenticationAudit } from '../security/audit-and-logging.js';
import { generateRecoveryCodes, hashRecoveryCode } from './recovery-codes.js';

type Database = ReturnType<typeof createDatabase>['db'];
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export async function replaceRecoveryKit(
  tx: Transaction,
  adminId: string,
  action: 'regenerate' | 'operator_reset',
): Promise<string[]> {
  const codes = generateRecoveryCodes();
  await tx.execute(
    sql`update recovery_code_sets set consumed_at = clock_timestamp() where admin_user_id = ${adminId} and consumed_at is null`,
  );
  const [set] = await tx
    .insert(recoveryCodeSets)
    .values({ adminUserId: adminId })
    .returning({ id: recoveryCodeSets.id });
  if (!set) throw new Error('Recovery set creation failed.');
  await tx.insert(recoveryCodes).values(
    codes.map((code, position) => ({
      setId: set.id,
      position,
      codeHash: hashRecoveryCode(code),
    })),
  );
  await writeAuthenticationAudit(tx, {
    actorAdminUserId: action === 'regenerate' ? adminId : null,
    eventType: 'auth.recovery',
    targetId: adminId,
    metadata: { outcome: 'success', action },
  });
  return codes;
}
