import { createHmac } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { createDatabase } from '../db/client.js';
import { inquiryThrottleBuckets, inquiries } from '../db/schema.js';
import type { z } from 'zod';
import type { inquiryInputSchema } from './contracts.js';
import {
  INQUIRY_EMAIL_RATE_LIMIT,
  INQUIRY_IP_RATE_LIMIT,
} from './contracts.js';

type Database = ReturnType<typeof createDatabase>['db'];
export type InquiryInput = z.infer<typeof inquiryInputSchema>;
type BucketKind = 'ip' | 'email';
type Bucket = typeof inquiryThrottleBuckets.$inferSelect;

export type InquirySubmissionResult =
  { accepted: true } | { accepted: false; retryAfter: number };

function hashIdentifier(secret: string, kind: BucketKind, identifier: string) {
  return createHmac('sha256', Buffer.from(secret, 'hex'))
    .update(`codeddevs:public-inquiry:${kind}:v1\0${identifier}`)
    .digest('hex');
}

function limits(kind: BucketKind) {
  return kind === 'ip' ? INQUIRY_IP_RATE_LIMIT : INQUIRY_EMAIL_RATE_LIMIT;
}

async function lockBucket(
  transaction: Parameters<Parameters<Database['transaction']>[0]>[0],
  kind: BucketKind,
  keyHash: string,
  now: Date,
): Promise<Bucket> {
  const policy = limits(kind);
  const expiresAt = new Date(now.getTime() + policy.windowSeconds * 1_000);
  await transaction
    .insert(inquiryThrottleBuckets)
    .values({ kind, keyHash, requestCount: 0, windowStartedAt: now, expiresAt })
    .onConflictDoNothing({
      target: [inquiryThrottleBuckets.kind, inquiryThrottleBuckets.keyHash],
    });
  const [bucket] = await transaction
    .select()
    .from(inquiryThrottleBuckets)
    .where(
      and(
        eq(inquiryThrottleBuckets.kind, kind),
        eq(inquiryThrottleBuckets.keyHash, keyHash),
      ),
    )
    .for('update');
  if (!bucket) throw new Error('Inquiry throttle bucket lock failed');
  if (bucket.expiresAt.getTime() <= now.getTime()) {
    const [reset] = await transaction
      .update(inquiryThrottleBuckets)
      .set({ requestCount: 0, windowStartedAt: now, expiresAt, updatedAt: now })
      .where(eq(inquiryThrottleBuckets.id, bucket.id))
      .returning();
    if (!reset) throw new Error('Inquiry throttle bucket reset failed');
    return reset;
  }
  return bucket;
}

function secondsUntilExpiry(bucket: Bucket, now: Date) {
  return Math.max(
    1,
    Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1_000),
  );
}

async function incrementIp(
  transaction: Parameters<Parameters<Database['transaction']>[0]>[0],
  keyHash: string,
  now: Date,
) {
  const bucket = await lockBucket(transaction, 'ip', keyHash, now);
  const count = bucket.requestCount + 1;
  await transaction
    .update(inquiryThrottleBuckets)
    .set({ requestCount: count, updatedAt: now })
    .where(eq(inquiryThrottleBuckets.id, bucket.id));
  return count > INQUIRY_IP_RATE_LIMIT.attempts
    ? { retryAfter: secondsUntilExpiry(bucket, now) }
    : undefined;
}

export function createInquiryRepository(db: Database, throttleSecret: string) {
  return {
    async recordInvalidAttempt(ip: string): Promise<InquirySubmissionResult> {
      const ipHash = hashIdentifier(throttleSecret, 'ip', ip);
      return db.transaction(async (transaction) => {
        const now = new Date();
        const limited = await incrementIp(transaction, ipHash, now);
        return limited ? { accepted: false, ...limited } : { accepted: true };
      });
    },

    async create(
      input: InquiryInput,
      ip: string,
    ): Promise<InquirySubmissionResult> {
      const ipHash = hashIdentifier(throttleSecret, 'ip', ip);
      const emailHash = hashIdentifier(throttleSecret, 'email', input.email);
      return db.transaction(async (transaction) => {
        const now = new Date();
        // Every submission locks IP before email, avoiding cross-request lock-order inversions.
        const ipLimited = await incrementIp(transaction, ipHash, now);
        if (ipLimited) return { accepted: false, ...ipLimited };

        const emailBucket = await lockBucket(
          transaction,
          'email',
          emailHash,
          now,
        );
        if (emailBucket.requestCount >= INQUIRY_EMAIL_RATE_LIMIT.attempts) {
          return {
            accepted: false,
            retryAfter: secondsUntilExpiry(emailBucket, now),
          };
        }
        await transaction
          .update(inquiryThrottleBuckets)
          .set({ requestCount: emailBucket.requestCount + 1, updatedAt: now })
          .where(eq(inquiryThrottleBuckets.id, emailBucket.id));
        await transaction.insert(inquiries).values({ ...input });
        return { accepted: true };
      });
    },
  };
}
