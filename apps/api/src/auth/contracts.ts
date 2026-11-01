import { z } from 'zod';
import { PASSWORD_POLICY } from './policy.js';

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_POLICY.minimumLength)
  .max(PASSWORD_POLICY.maximumLength)
  .refine(
    (password) =>
      Buffer.byteLength(password, 'utf8') <= PASSWORD_POLICY.maximumUtf8Bytes,
    { message: 'Password exceeds the maximum UTF-8 byte length.' },
  );

export type NewPassword = z.infer<typeof newPasswordSchema>;
