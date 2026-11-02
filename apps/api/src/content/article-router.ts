import express from 'express';
import { z } from 'zod';
import type { ApiEnvironment } from '../config/env.js';
import {
  articleInputSchema,
  articleUpdateInputSchema,
  ContentError,
} from './contracts.js';
import {
  createSecuredAdminRouter,
  handleAdminBodyError,
  respondFromAdminService,
  sendAdminContentFailure,
} from './admin-http.js';
import { createArticleService } from './article-service.js';

const articleIdSchema = z.string().uuid();

function getActorId(response: express.Response) {
  return (response.locals.principal as { admin: { id: string } }).admin.id;
}

function getId(value: unknown) {
  const id = articleIdSchema.safeParse(value);
  if (!id.success) throw new ContentError('not_found');
  return id.data;
}

export function createArticleRouter(
  databaseUrl: string | undefined,
  environment: ApiEnvironment,
) {
  const router = createSecuredAdminRouter(
    environment,
    /\/(?:publish|unpublish)$/,
  );
  const service = createArticleService(databaseUrl, environment);

  router.get('/', async (request, response) =>
    respondFromAdminService(
      response,
      () => service.list(request.query),
      (page) => response.json(page),
    ),
  );

  router.get('/:id/preview', async (request, response) => {
    let id: string;
    try {
      id = getId(request.params.id);
    } catch (error) {
      sendAdminContentFailure(response, error);
      return;
    }
    return respondFromAdminService(
      response,
      () => service.preview(id),
      (article) => response.json({ article }),
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
    return respondFromAdminService(
      response,
      () => service.get(id),
      (article) => response.json({ article }),
    );
  });

  router.post('/', async (request, response) => {
    const input = articleInputSchema.safeParse(request.body);
    if (!input.success) {
      sendAdminContentFailure(response, new ContentError('validation'));
      return;
    }
    return respondFromAdminService(
      response,
      () => service.create(input.data, getActorId(response)),
      (article) => response.status(201).json({ article }),
    );
  });

  router.put('/:id', async (request, response) => {
    const input = articleUpdateInputSchema.safeParse(request.body);
    if (!input.success) {
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
    return respondFromAdminService(
      response,
      () => service.update(id, input.data, getActorId(response)),
      (article) => response.json({ article }),
    );
  });

  router.post('/:id/publish', async (request, response) => {
    let id: string;
    try {
      id = getId(request.params.id);
    } catch (error) {
      sendAdminContentFailure(response, error);
      return;
    }
    return respondFromAdminService(
      response,
      () => service.publish(id, getActorId(response)),
      (article) => response.json({ article }),
    );
  });

  router.post('/:id/unpublish', async (request, response) => {
    let id: string;
    try {
      id = getId(request.params.id);
    } catch (error) {
      sendAdminContentFailure(response, error);
      return;
    }
    return respondFromAdminService(
      response,
      () => service.unpublish(id, getActorId(response)),
      (article) => response.json({ article }),
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
    return respondFromAdminService(
      response,
      () => service.delete(id, getActorId(response)),
      () => response.status(204).end(),
    );
  });

  router.use(handleAdminBodyError);
  return router;
}
