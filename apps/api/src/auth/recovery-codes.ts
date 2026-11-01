import { createHash, randomBytes } from 'node:crypto';

const RECOVERY_CODE_COUNT = 8;
const RECOVERY_CODE_BYTES = 32;

export function generateRecoveryCodes(): string[] {
  const codes = new Set<string>();
  while (codes.size < RECOVERY_CODE_COUNT) {
    codes.add(randomBytes(RECOVERY_CODE_BYTES).toString('base64url'));
  }
  return [...codes];
}

export function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(code, 'utf8').digest('hex');
}
