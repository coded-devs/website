import express from 'express';
import { z } from 'zod';
import type { ApiEnvironment } from '../config/env.js';
import { LOGIN_POLICY } from '../auth/policy.js';
import { ContentError } from '../content/contracts.js';
import { sendAdminContentFailure } from '../content/admin-http.js';
import { createDatabase } from '../db/client.js';
import { MediaUploadError, readMediaUpload } from './multipart.js';
import { createDrizzleMediaRepository } from './repository.js';
import { createMediaService, type MediaService } from './service.js';
import type { MediaStorage } from './storage.js';

const mediaIdSchema = z.string().uuid();
const listQuerySchema = z
  .object({
    search: z.string().trim().max(200).optional(),
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();
const altTextSchema = z
  .object({ altText: z.string().trim().max(500) })
  .strict();

function getActorId(response: express.Response): string {
  return (response.locals.principal as { admin: { id: string } }).admin.id;
}

function getId(value: unknown): string {
  const result = mediaIdSchema.safeParse(value);
  if (!result.success) throw new ContentError('not_found');
  return result.data;
}

function sendMediaUploadFailure(
  response: express.Response,
  error: MediaUploadError,
): void {
  if (error.code === 'invalid_content_type') {
    response.status(415).json({ error: 'Unsupported media type' });
  } else if (error.code === 'file_too_large') {
    response.status(413).json({ error: 'Media upload is too large' });
  } else {
    sendAdminContentFailure(response, new ContentError('validation'));
  }
}

export function createMediaRouter(
  databaseUrl: string | undefined,
  environment: ApiEnvironment,
  storage: MediaStorage,
  serviceOverride?: MediaService,
) {
  const router = express.Router();
  router.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  router.use((request, response, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      next();
      return;
    }
    if (
      request.get('Origin') !== environment.adminOrigin ||
      request.get(LOGIN_POLICY.csrfHeader) !== LOGIN_POLICY.csrfValue
    ) {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }
    if (request.method === 'DELETE') {
      const hasBody =
        Number(request.get('Content-Length') ?? 0) > 0 ||
        Boolean(request.get('Transfer-Encoding'));
      if (hasBody) {
        response.status(400).json({ error: 'Invalid request' });
        return;
      }
    }
    next();
  });

  const invoke = async <T>(
    operation: (service: MediaService) => Promise<T>,
  ) => {
    if (serviceOverride) return operation(serviceOverride);
    if (!databaseUrl) throw new ContentError('internal');
    const { db, pool } = createDatabase(databaseUrl);
    try {
      return await operation(
        createMediaService(createDrizzleMediaRepository(db), storage),
      );
    } finally {
      await pool.end();
    }
  };

  const respond = async <T>(
    response: express.Response,
    operation: (service: MediaService) => Promise<T>,
    success: (value: T) => void,
  ) => {
    try {
      success(await invoke(operation));
    } catch (error) {
      sendAdminContentFailure(
        response,
        error instanceof ContentError ? error : new ContentError('internal'),
      );
    }
  };

  const readUpload = async (request: express.Request) => {
    try {
      return await readMediaUpload(request);
    } catch (error) {
      if (error instanceof MediaUploadError) throw error;
      throw new MediaUploadError('malformed_multipart');
    }
  };

  router.get('/', async (request, response) => {
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      sendAdminContentFailure(response, new ContentError('validation'));
      return;
    }
    const { page, limit, ...filters } = parsed.data;
    await respond(
      response,
      (service) =>
        service.list({
          ...(filters.search ? { query: filters.search } : {}),
          ...(filters.mimeType ? { mimeType: filters.mimeType } : {}),
          limit,
          offset: (page - 1) * limit,
        }),
      (result) => response.json(result),
    );
  });

  router.get('/:id', async (request, response) => {
    let id: string;
    try {
      id = getId(request.params.id);
    } catch (error) {
      sendAdminContentFailure(response, error);
      return;
    }
    await respond(
      response,
      (service) => service.get(id),
      (asset) => response.json({ asset }),
    );
  });

  router.post('/upload', async (request, response) => {
    let upload;
    try {
      upload = await readUpload(request);
    } catch (error) {
      sendMediaUploadFailure(
        response,
        error instanceof MediaUploadError
          ? error
          : new MediaUploadError('malformed_multipart'),
      );
      return;
    }
    await respond(
      response,
      (service) =>
        service.upload({ ...upload, actorAdminUserId: getActorId(response) }),
      (asset) => response.status(201).json({ asset }),
    );
  });

  router.put(
    '/:id/alt-text',
    (request, response, next) => {
      if (!request.is('application/json')) {
        response.status(415).json({ error: 'Unsupported media type' });
        return;
      }
      express.json({ limit: '16kb', strict: true })(request, response, next);
    },
    async (request, response) => {
      const body = altTextSchema.safeParse(request.body);
      if (!body.success) {
        sendAdminContentFailure(response, new ContentError('validation'));
        return;
      }
      let id: string;
      try {
        id = getId(request.params.id);
      } catch (error) {
        sendAdminContentFailure(response, error);
        return;
      }
      const altText = body.data.altText || null;
      await respond(
        response,
        (service) => service.updateAltText(id, altText),
        (asset) => response.json({ asset }),
      );
    },
  );

  router.post('/:id/replace', async (request, response) => {
    let id: string;
    try {
      id = getId(request.params.id);
    } catch (error) {
      sendAdminContentFailure(response, error);
      return;
    }
    let upload;
    try {
      upload = await readUpload(request);
    } catch (error) {
      sendMediaUploadFailure(
        response,
        error instanceof MediaUploadError
          ? error
          : new MediaUploadError('malformed_multipart'),
      );
      return;
    }
    await respond(
      response,
      (service) =>
        service.replace(id, {
          ...upload,
          actorAdminUserId: getActorId(response),
        }),
      (asset) => response.status(201).json({ asset }),
    );
  });

  router.delete('/:id', async (request, response) => {
    let id: string;
    try {
      id = getId(request.params.id);
    } catch (error) {
      sendAdminContentFailure(response, error);
      return;
    }
    await respond(
      response,
      (service) => service.delete(id, getActorId(response)),
      () => response.status(204).end(),
    );
  });

  router.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      next: express.NextFunction,
    ) => {
      if (response.headersSent) {
        next(error);
        return;
      }
      const status =
        (error as { type?: string })?.type === 'entity.too.large' ? 413 : 400;
      response.status(status).json({ error: 'Invalid request' });
    },
  );

  return router;
}
