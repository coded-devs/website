import express from 'express';
import type { ApiEnvironment } from '../config/env.js';
import { createDatabase } from '../db/client.js';
import {
  createSecuredAdminRouter,
  handleAdminBodyError,
} from '../content/admin-http.js';
import {
  inquiryAdminQuerySchema,
  inquiryErrorResponse,
  inquiryIdSchema,
  inquiryStatusUpdateSchema,
  serializeInquiryDetail,
  serializeInquiryListItem,
} from './contracts.js';
import {
  createInquiryAdminRepository,
  InquiryAdminError,
} from './admin-repository.js';

function sendInquiryFailure(
  response: express.Response,
  kind: 'invalid' | 'not_found' | 'invalid_transition' | 'unavailable',
) {
  const error = inquiryErrorResponse(kind);
  response.status(error.status).json(error.body);
}

async function withRepository<T>(
  databaseUrl: string | undefined,
  run: (
    repository: ReturnType<typeof createInquiryAdminRepository>,
  ) => Promise<T>,
): Promise<T> {
  if (!databaseUrl) throw new Error('unavailable');
  const { db, pool } = createDatabase(databaseUrl);
  try {
    return await run(createInquiryAdminRepository(db));
  } finally {
    await pool.end();
  }
}

function actorId(response: express.Response) {
  return (response.locals.principal as { admin: { id: string } }).admin.id;
}

export function createAdminInquiryRouter(
  databaseUrl: string | undefined,
  environment: ApiEnvironment,
) {
  const router = createSecuredAdminRouter(environment);

  router.get('/', async (request, response) => {
    const query = inquiryAdminQuerySchema.safeParse(request.query);
    if (!query.success) {
      sendInquiryFailure(response, 'invalid');
      return;
    }
    try {
      const result = await withRepository(databaseUrl, (repository) =>
        repository.list(query.data),
      );
      response.json({
        ...result,
        items: result.items.map(serializeInquiryListItem),
      });
    } catch {
      sendInquiryFailure(response, 'unavailable');
    }
  });

  router.get('/:id', async (request, response) => {
    const id = inquiryIdSchema.safeParse(request.params.id);
    if (!id.success) {
      sendInquiryFailure(response, 'invalid');
      return;
    }
    try {
      const inquiry = await withRepository(databaseUrl, (repository) =>
        repository.get(id.data),
      );
      if (!inquiry) {
        sendInquiryFailure(response, 'not_found');
        return;
      }
      response.json({ inquiry: serializeInquiryDetail(inquiry) });
    } catch {
      sendInquiryFailure(response, 'unavailable');
    }
  });

  router.put('/:id/status', async (request, response) => {
    const id = inquiryIdSchema.safeParse(request.params.id);
    const body = inquiryStatusUpdateSchema.safeParse(request.body);
    if (!id.success || !body.success) {
      sendInquiryFailure(response, 'invalid');
      return;
    }
    try {
      const inquiry = await withRepository(databaseUrl, (repository) =>
        repository.updateStatus(id.data, body.data.status, actorId(response)),
      );
      response.json({ inquiry: serializeInquiryDetail(inquiry) });
    } catch (error) {
      if (error instanceof InquiryAdminError) {
        sendInquiryFailure(response, error.kind);
      } else {
        sendInquiryFailure(response, 'unavailable');
      }
    }
  });

  router.use(handleAdminBodyError);
  return router;
}
