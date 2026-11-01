import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express';
import { z } from 'zod';
import type { ApiEnvironment } from '../config/env.js';
import {
  PASSWORD_POLICY,
  LOGIN_POLICY,
  getSessionCookiePolicy,
} from './policy.js';
import { attemptLogin, auditRejectedLogin } from './login.js';
import type { AuthenticationAuditReason } from '../security/audit-and-logging.js';

const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .transform((email) => email.toLowerCase()),
    password: z
      .string()
      .max(PASSWORD_POLICY.maximumLength)
      .refine(
        (value) =>
          Buffer.byteLength(value, 'utf8') <= PASSWORD_POLICY.maximumUtf8Bytes,
      ),
  })
  .strict();

export function createLoginRouter(
  databaseUrl: string | undefined,
  environment: ApiEnvironment,
) {
  const router = express.Router();
  const reject = async (
    request: express.Request,
    response: express.Response,
    status: number,
    reason: AuthenticationAuditReason,
  ) => {
    if (!databaseUrl || !environment.throttleHmacSecret || !request.ip)
      return response.status(503).json({ error: 'Service unavailable' });
    try {
      const retry = await auditRejectedLogin(
        databaseUrl,
        environment.throttleHmacSecret,
        request.ip,
        reason,
      );
      if (retry > 0)
        return response
          .set('Retry-After', String(retry))
          .status(429)
          .json({ error: 'Too many attempts' });
      return response
        .status(status)
        .json({ error: status === 403 ? 'Forbidden' : 'Invalid request' });
    } catch {
      return response.status(503).json({ error: 'Service unavailable' });
    }
  };
  const checkRequest: RequestHandler = async (request, response, next) => {
    response.set('Cache-Control', 'no-store');
    if (
      request.get('Origin') !== environment.adminOrigin ||
      request.get(LOGIN_POLICY.csrfHeader) !== LOGIN_POLICY.csrfValue
    ) {
      await reject(request, response, 403, 'request_security');
      return;
    }
    if (!request.is('application/json')) {
      await reject(request, response, 415, 'content_type');
      return;
    }
    next();
  };
  router.post(
    '/login',
    checkRequest,
    express.json({ limit: LOGIN_POLICY.bodyLimit }),
    async (request, response) => {
      const input = loginSchema.safeParse(request.body);
      if (!input.success) {
        await reject(request, response, 400, 'invalid_request');
        return;
      }
      if (!databaseUrl || !environment.throttleHmacSecret || !request.ip) {
        response.status(503).json({ error: 'Service unavailable' });
        return;
      }
      try {
        const { name, ...options } = getSessionCookiePolicy(
          environment.nodeEnvironment,
        );
        const matchingCookies = (request.get('Cookie') ?? '')
          .split(';')
          .map((part) => part.trim())
          .filter((part) => part.startsWith(`${name}=`));
        const priorToken =
          matchingCookies.length === 1
            ? matchingCookies[0]?.slice(name.length + 1)
            : undefined;
        const previousToken =
          priorToken && /^[A-Za-z0-9_-]{43}$/.test(priorToken)
            ? priorToken
            : undefined;
        const result = await attemptLogin(
          databaseUrl,
          environment.throttleHmacSecret,
          input.data.email,
          input.data.password,
          request.ip,
          previousToken,
        );
        if (result.status === 'invalid') {
          response.status(401).json({ error: 'Invalid email or password' });
          return;
        }
        if (result.status === 'throttled') {
          response
            .set('Retry-After', String(result.retry))
            .status(429)
            .json({ error: 'Too many attempts' });
          return;
        }
        response
          .cookie(name, result.token, options)
          .status(200)
          .json({ expiresAt: result.expiresAt.toISOString() });
      } catch {
        response.status(503).json({ error: 'Service unavailable' });
      }
    },
  );
  const handleBodyError: ErrorRequestHandler = async (
    error,
    request,
    response,
    next,
  ) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    const status = error?.type === 'entity.too.large' ? 413 : 400;
    await reject(
      request,
      response,
      status,
      status === 413 ? 'body_too_large' : 'invalid_json',
    );
  };
  router.use(handleBodyError);
  return router;
}
