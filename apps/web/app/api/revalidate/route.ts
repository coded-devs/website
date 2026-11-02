import { revalidatePath, revalidateTag } from 'next/cache';
import { createRevalidationHandler } from '../../../src/lib/content-revalidation-handler';

export const POST = createRevalidationHandler({
  secret: process.env.CONTENT_REVALIDATION_SECRET,
  revalidatePath,
  revalidateTag,
});
