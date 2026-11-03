import express from 'express';
import { createDatabase } from '../db/client.js';
import {
  INQUIRY_JSON_BODY_LIMIT_BYTES,
  inquiryErrorResponse,
  inquiryInputSchema,
  serializePublicInquirySuccess,
} from './contracts.js';
import { createInquiryRepository } from './repository.js';

export function createPublicInquiryRouter(
  databaseUrl: string | undefined,
  throttleSecret?: string,
) {
  const router = express.Router();
  const parseJson = express.json({
    limit: INQUIRY_JSON_BODY_LIMIT_BYTES,
    type: 'application/json',
  });

  router.post('/inquiries', parseJson, async (request, response) => {
    response.set('Cache-Control', 'no-store');
    if (!databaseUrl || !throttleSecret || !request.ip) {
      const error = inquiryErrorResponse('unavailable');
      response.status(error.status).json(error.body);
      return;
    }

    const parsed = inquiryInputSchema.safeParse(request.body);
    const { db, pool } = createDatabase(databaseUrl);
    const repository = createInquiryRepository(db, throttleSecret);
    if (!parsed.success) {
      try {
        const result = await repository.recordInvalidAttempt(request.ip);
        if (!result.accepted) {
          response.set('Retry-After', String(result.retryAfter));
          const limited = inquiryErrorResponse('rate_limited');
          response.status(limited.status).json(limited.body);
        } else {
          const invalid = inquiryErrorResponse('invalid');
          response.status(invalid.status).json(invalid.body);
        }
      } catch {
        const unavailable = inquiryErrorResponse('unavailable');
        response.status(unavailable.status).json(unavailable.body);
      } finally {
        await pool.end();
      }
      return;
    }

    try {
      const result = await repository.create(parsed.data, request.ip);
      if (!result.accepted) {
        response.set('Retry-After', String(result.retryAfter));
        const limited = inquiryErrorResponse('rate_limited');
        response.status(limited.status).json(limited.body);
      } else {
        response.status(201).json(serializePublicInquirySuccess());
      }
    } catch {
      const error = inquiryErrorResponse('unavailable');
      response.status(error.status).json(error.body);
    } finally {
      await pool.end();
    }
  });

  router.use(
    '/inquiries',
    async (
      _error: unknown,
      request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      void next;
      response.set('Cache-Control', 'no-store');
      if (!databaseUrl || !throttleSecret || !request.ip) {
        const unavailable = inquiryErrorResponse('unavailable');
        response.status(unavailable.status).json(unavailable.body);
        return;
      }
      const { db, pool } = createDatabase(databaseUrl);
      try {
        const result = await createInquiryRepository(
          db,
          throttleSecret,
        ).recordInvalidAttempt(request.ip);
        if (!result.accepted) {
          response.set('Retry-After', String(result.retryAfter));
          const limited = inquiryErrorResponse('rate_limited');
          response.status(limited.status).json(limited.body);
        } else {
          const invalid = inquiryErrorResponse('invalid');
          response.status(invalid.status).json(invalid.body);
        }
      } catch {
        const unavailable = inquiryErrorResponse('unavailable');
        response.status(unavailable.status).json(unavailable.body);
      } finally {
        await pool.end();
      }
    },
  );
  return router;
}
