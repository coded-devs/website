import { randomUUID } from 'node:crypto';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { createStructuredLogger } from './audit-and-logging.js';

const logger = createStructuredLogger();

export const applyHttpSecurity: (production: boolean) => RequestHandler =
  (production) => (_request, response, next) => {
    response.set({
      'Content-Security-Policy':
        "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Request-Id': randomUUID(),
    });
    if (production)
      response.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    next();
  };

export const sendNotFound: RequestHandler = (_request, response) => {
  response.status(404).json({ error: 'Not found' });
};

type ParserError = Error & { type?: string; status?: number };

export const safeErrorHandler: ErrorRequestHandler = (
  error: ParserError,
  request,
  response,
  next,
) => {
  void next;
  if (response.headersSent) return;
  const malformedRequest =
    error.type === 'entity.parse.failed' || error.type === 'entity.too.large';
  const status = malformedRequest ? (error.status === 413 ? 413 : 400) : 500;
  const publicError = malformedRequest
    ? 'Invalid request'
    : 'Internal server error';
  logger.error('http.request_failed', {
    requestId: response.getHeader('X-Request-Id'),
    method: request.method,
    path: request.route?.path ?? 'unmatched',
    status,
    failure: malformedRequest ? 'invalid_request' : 'internal_error',
  });
  response.status(status).json({ error: publicError });
};

export function logApiStartup(port: number) {
  logger.info('api.listening', { port });
}
