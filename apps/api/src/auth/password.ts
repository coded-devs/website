import { argon2id, hash } from 'argon2';
import { newPasswordSchema } from './contracts.js';

export async function hashPassword(password: string): Promise<string> {
  const validated = newPasswordSchema.parse(password);
  return hash(validated, {
    type: argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });
}
