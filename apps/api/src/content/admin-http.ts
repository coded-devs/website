import express, { type ErrorRequestHandler } from 'express';
import { z } from 'zod';
import type { ApiEnvironment } from '../config/env.js';
import { LOGIN_POLICY } from '../auth/policy.js';
import { ContentError, contentErrorResponse } from './contracts.js';

export function createSecuredAdminRouter(
  environment: ApiEnvironment,
  bodylessPath = /\/(?:publish|unpublish|publish-all)$/,
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
    const bodylessOperation =
      request.method === 'DELETE' ||
      (request.method === 'POST' && bodylessPath.test(request.path));
    const hasBody =
      Number(request.get('Content-Length') ?? 0) > 0 ||
      Boolean(request.get('Transfer-Encoding'));
    if (bodylessOperation) {
      if (hasBody) {
        response.status(400).json({ error: 'Invalid request' });
        return;
      }
      next();
      return;
    }
    if (!request.is('application/json')) {
      response.status(415).json({ error: 'Unsupported media type' });
      return;
    }
    express.json({ limit: '1mb', strict: true })(request, response, next);
  });
  return router;
}

export const handleAdminBodyError: ErrorRequestHandler = (
  error,
  _request,
  response,
  next,
) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  const status = error?.type === 'entity.too.large' ? 413 : 400;
  response.status(status).json({ error: 'Invalid request' });
};

export function sendAdminContentFailure(
  response: express.Response,
  error: unknown,
) {
  const contentError =
    error instanceof ContentError
      ? error
      : new ContentError(
          error instanceof z.ZodError ? 'validation' : 'internal',
        );
  const mapped = contentErrorResponse(contentError);
  response.status(mapped.status).json(mapped.body);
}

export async function respondFromAdminService<T>(
  response: express.Response,
  operation: () => Promise<T>,
  success: (value: T) => void,
) {
  try {
    success(await operation());
  } catch (error) {
    sendAdminContentFailure(response, error);
  }
}

export const sendAdminValidationFailure = (response: express.Response) =>
  sendAdminContentFailure(response, new ContentError('validation'));

export const sendAdminNotFound = (response: express.Response) =>
  sendAdminContentFailure(response, new ContentError('not_found'));

export const sendAdminContentConflict = (response: express.Response) =>
  sendAdminContentFailure(response, new ContentError('conflict'));
