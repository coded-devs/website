import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express';
import { z } from 'zod';
import type { ApiEnvironment } from '../config/env.js';
import { auditRejectedLogin } from './login.js';
import {
  getSessionCookiePolicy,
  LOGIN_POLICY,
  PASSWORD_POLICY,
} from './policy.js';
import { regenerateKit } from './regenerate-kit.js';
import type { SessionPrincipal } from './session.js';
import type { AuthenticationAuditReason } from '../security/audit-and-logging.js';

const inputSchema = z
  .object({
    currentPassword: z
      .string()
      .max(PASSWORD_POLICY.maximumLength)
      .refine(
        (value) =>
          Buffer.byteLength(value, 'utf8') <= PASSWORD_POLICY.maximumUtf8Bytes,
      ),
  })
  .strict();

export function createRegenerateKitRouter(
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
        'auth.recovery',
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
  const check: RequestHandler = async (request, response, next) => {
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
    '/recovery/codes',
    check,
    express.json({ limit: LOGIN_POLICY.bodyLimit }),
    async (request, response) => {
      const input = inputSchema.safeParse(request.body);
      if (!input.success) {
        await reject(request, response, 400, 'invalid_request');
        return;
      }
      if (!databaseUrl || !environment.throttleHmacSecret || !request.ip) {
        response.status(503).json({ error: 'Service unavailable' });
        return;
      }
      const { name, httpOnly, secure, sameSite, path } = getSessionCookiePolicy(
        environment.nodeEnvironment,
      );
      const matching = (request.get('Cookie') ?? '')
        .split(';')
        .map((part) => part.trim())
        .filter((part) => part.startsWith(`${name}=`));
      const token =
        matching.length === 1 ? matching[0]?.slice(name.length + 1) : undefined;
      if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
        response
          .clearCookie(name, { httpOnly, secure, sameSite, path })
          .status(401)
          .json({ error: 'Unauthorized' });
        return;
      }
      const principal = response.locals.principal as SessionPrincipal;
      try {
        const result = await regenerateKit(
          databaseUrl,
          environment.throttleHmacSecret,
          principal.admin.id,
          principal.admin.email,
          token,
          input.data.currentPassword,
          request.ip,
        );
        if (result.status === 'invalid_session') {
          response
            .clearCookie(name, { httpOnly, secure, sameSite, path })
            .status(401)
            .json({ error: 'Unauthorized' });
          return;
        }
        if (result.status === 'invalid_credentials') {
          response.status(401).json({ error: 'Invalid credentials' });
          return;
        }
        if (result.status === 'throttled') {
          response
            .set('Retry-After', String(result.retry))
            .status(429)
            .json({ error: 'Too many attempts' });
          return;
        }
        response.status(200).json({ recoveryCodes: result.codes });
      } catch {
        response.status(503).json({ error: 'Service unavailable' });
      }
    },
  );
  const bodyError: ErrorRequestHandler = async (
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
  router.use(bodyError);
  return router;
}
