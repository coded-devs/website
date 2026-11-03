import type { createDatabase } from '../db/client.js';
import { inquiries } from '../db/schema.js';
import type { z } from 'zod';
import type { inquiryInputSchema } from './contracts.js';

type Database = ReturnType<typeof createDatabase>['db'];
export type InquiryInput = z.infer<typeof inquiryInputSchema>;

export function createInquiryRepository(db: Database) {
  return {
    async create(input: InquiryInput): Promise<void> {
      await db.insert(inquiries).values({ ...input });
    },
  };
}
