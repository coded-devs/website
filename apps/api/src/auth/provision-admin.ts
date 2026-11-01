import 'dotenv/config';
import { z } from 'zod';
import { PASSWORD_POLICY } from './policy.js';
import { hashPassword } from './password.js';
import { generateRecoveryCodes, hashRecoveryCode } from './recovery-codes.js';
import { provisionAdministrator } from './provision-repository.js';

async function readPassword(): Promise<string> {
  if (process.stdin.isTTY)
    throw new Error(
      'Password must be supplied through protected standard input.',
    );
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of process.stdin) {
    const bytes = Buffer.from(chunk as Uint8Array);
    length += bytes.length;
    if (length > PASSWORD_POLICY.maximumUtf8Bytes + 2)
      throw new Error('Password input is too long.');
    chunks.push(bytes);
  }
  const value = new TextDecoder('utf-8', { fatal: true }).decode(
    Buffer.concat(chunks),
  );
  return value.replace(/\r?\n$/, '');
}

async function main(): Promise<void> {
  if (process.argv.length !== 3)
    throw new Error('Provide exactly one email argument.');
  const email = z
    .string()
    .trim()
    .email()
    .max(320)
    .parse(process.argv[2])
    .toLowerCase();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const password = await readPassword();
  const passwordHash = await hashPassword(password);
  const codes = generateRecoveryCodes();
  await provisionAdministrator(
    databaseUrl,
    email,
    passwordHash,
    codes.map(hashRecoveryCode),
  );
  process.stdout.write(`${codes.join('\n')}\n`);
}

main().catch(() => {
  console.error(
    'Provisioning failed. Check configuration, input, and whether an administrator already exists.',
  );
  process.exitCode = 1;
});
