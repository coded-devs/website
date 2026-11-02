import express from 'express';
import { ZodError } from 'zod';
import { createDatabase } from '../db/client.js';
import {
  contentErrorResponse,
  ContentError,
  contentPageQuerySchema,
  contentSlugSchema,
} from './contracts.js';
import { createDrizzleContentRepository } from './repository.js';

const publicCache = 'public, max-age=0, must-revalidate';

export function createPublicRouter(databaseUrl: string | undefined) {
  const router = express.Router();

  const respond =
    (
      handler: (
        repository: ReturnType<typeof createDrizzleContentRepository>,
        request: express.Request,
      ) => Promise<unknown>,
    ) =>
    async (request: express.Request, response: express.Response) => {
      response.set('Cache-Control', 'no-store');
      if (!databaseUrl) {
        response
          .status(503)
          .json({ error: 'Service unavailable', code: 'SERVICE_UNAVAILABLE' });
        return;
      }
      const { db, pool } = createDatabase(databaseUrl);
      try {
        const result = await handler(
          createDrizzleContentRepository(db),
          request,
        );
        response.set('Cache-Control', publicCache).json(result);
      } catch (error) {
        if (error instanceof ZodError) {
          response.status(400).json({
            error: 'Invalid content request',
            code: 'CONTENT_INVALID_REQUEST',
          });
        } else if (error instanceof ContentError) {
          const mapped = contentErrorResponse(error);
          response.status(mapped.status).json(mapped.body);
        } else {
          response.status(503).json({
            error: 'Service unavailable',
            code: 'SERVICE_UNAVAILABLE',
          });
        }
      } finally {
        await pool.end();
      }
    };

  router.get(
    '/site',
    respond((repository) => repository.getPublishedSite()),
  );
  router.get(
    '/articles',
    respond(async (repository, request) => {
      const query = contentPageQuerySchema.parse(request.query);
      return repository.listPublishedArticles(query);
    }),
  );
  router.get(
    '/articles/:slug',
    respond(async (repository, request) => {
      const parsedSlug = contentSlugSchema.safeParse(request.params.slug);
      if (!parsedSlug.success) throw new ContentError('not_found');
      const article = await repository.getPublishedArticle(parsedSlug.data);
      if (!article) throw new ContentError('not_found');
      return { article };
    }),
  );
  return router;
}
