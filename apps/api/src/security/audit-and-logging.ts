import { z } from 'zod';
import { createDatabase } from '../db/client.js';
import { auditEvents } from '../db/schema.js';

const auditReasonSchema = z.enum([
  'invalid_credentials',
  'request_security',
  'content_type',
  'invalid_request',
  'body_too_large',
  'invalid_json',
  'ip_throttled',
]);

const auditMetadataSchema = z.discriminatedUnion('eventType', [
  z.object({
    eventType: z.literal('auth.login'),
    metadata: z.discriminatedUnion('outcome', [
      z.object({ outcome: z.literal('success') }).strict(),
      z
        .object({ outcome: z.literal('rejected'), reason: auditReasonSchema })
        .strict(),
    ]),
  }),
  z.object({
    eventType: z.literal('auth.logout'),
    metadata: z.object({ outcome: z.literal('success') }).strict(),
  }),
  z.object({
    eventType: z.literal('auth.recovery'),
    metadata: z.discriminatedUnion('outcome', [
      z
        .object({
          outcome: z.literal('success'),
          action: z.enum(['regenerate', 'operator_reset']).optional(),
        })
        .strict(),
      z
        .object({
          outcome: z.literal('rejected'),
          reason: auditReasonSchema,
          action: z.literal('regenerate').optional(),
        })
        .strict(),
    ]),
  }),
]);

export type AuthenticationAuditReason = z.infer<typeof auditReasonSchema>;
export type AuthenticationAudit = z.infer<typeof auditMetadataSchema> & {
  actorAdminUserId?: string | null;
  targetId?: string | null;
};

export function createAuthenticationAudit(input: AuthenticationAudit) {
  const parsed = auditMetadataSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error('Unapproved authentication audit metadata.');
  }
  return parsed.data;
}

type Database = ReturnType<typeof createDatabase>['db'];
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0];

export async function writeAuthenticationAudit(
  transaction: Transaction,
  input: AuthenticationAudit,
): Promise<void> {
  const audit = createAuthenticationAudit(input);
  await transaction.insert(auditEvents).values({
    actorAdminUserId: input.actorAdminUserId ?? null,
    eventType: audit.eventType,
    targetType: 'admin_user',
    targetId: input.targetId ?? null,
    metadata: audit.metadata,
  });
}

const redacted = '[REDACTED]';
const sensitiveKey =
  /password|recovery.?code|^code$|token|cookie|authorization|hmac|secret/i;

function redact(value: unknown, key?: string): unknown {
  if (key === 'body') return redacted;
  if (key && sensitiveKey.test(key)) return redacted;
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        redact(entryValue, entryKey),
      ]),
    );
  }
  return value;
}

type LogSink = (entry: string, level: 'error' | 'info') => void;

export function createStructuredLogger(
  sink: LogSink = (entry, level) =>
    level === 'error' ? console.error(entry) : console.info(entry),
) {
  const write = (level: 'error' | 'info', event: string, context: unknown) => {
    sink(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event,
        context: redact(context),
      }),
      level,
    );
  };
  return {
    info: (event: string, context: unknown = {}) =>
      write('info', event, context),
    error: (event: string, context: unknown = {}) =>
      write('error', event, context),
  };
}
