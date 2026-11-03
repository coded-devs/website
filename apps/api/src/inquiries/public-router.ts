import express from 'express';
import { createDatabase } from '../db/client.js';
import {
  INQUIRY_JSON_BODY_LIMIT_BYTES,
  inquiryErrorResponse,
  inquiryInputSchema,
  serializePublicInquirySuccess,
} from './contracts.js';
import { createInquiryRepository } from './repository.js';

export function createPublicInquiryRouter(databaseUrl: string | undefined) {
  const router = express.Router();
  const parseJson = express.json({
    limit: INQUIRY_JSON_BODY_LIMIT_BYTES,
    type: 'application/json',
  });

  router.post('/inquiries', parseJson, async (request, response) => {
    response.set('Cache-Control', 'no-store');
    if (!databaseUrl) {
      const error = inquiryErrorResponse('unavailable');
      response.status(error.status).json(error.body);
      return;
    }

    const parsed = inquiryInputSchema.safeParse(request.body);
    if (!parsed.success) {
      const error = inquiryErrorResponse('invalid');
      response.status(error.status).json(error.body);
      return;
    }

    const { db, pool } = createDatabase(databaseUrl);
    try {
      await createInquiryRepository(db).create(parsed.data);
      response.status(201).json(serializePublicInquirySuccess());
    } catch {
      const error = inquiryErrorResponse('unavailable');
      response.status(error.status).json(error.body);
    } finally {
      await pool.end();
    }
  });

  router.use('/inquiries', (_error: unknown, _request: express.Request, response: express.Response, next: express.NextFunction) => {
    void next;
    response.set('Cache-Control', 'no-store');
    const mapped = inquiryErrorResponse('invalid');
    response.status(mapped.status).json(mapped.body);
  });
  return router;
}
