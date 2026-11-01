import type { RequestHandler } from 'express';
import type { ApiEnvironment } from '../config/env.js';
import { getSessionCookiePolicy } from './policy.js';
import { authenticateSession } from './session.js';

export function requireSuperAdminSession(
  databaseUrl: string | undefined,
  environment: ApiEnvironment,
): RequestHandler {
  return async (request, response, next) => {
    response.set('Cache-Control', 'no-store');
    const { name, httpOnly, secure, sameSite, path } = getSessionCookiePolicy(
      environment.nodeEnvironment,
    );
    const cookieOptions = { httpOnly, secure, sameSite, path };
    const matching = (request.get('Cookie') ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter((part) => part.startsWith(`${name}=`));
    const token =
      matching.length === 1 ? matching[0]?.slice(name.length + 1) : undefined;
    if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
      response
        .clearCookie(name, cookieOptions)
        .status(401)
        .json({ error: 'Unauthorized' });
      return;
    }
    if (!databaseUrl) {
      response.status(503).json({ error: 'Service unavailable' });
      return;
    }
    try {
      const principal = await authenticateSession(databaseUrl, token);
      if (!principal) {
        response
          .clearCookie(name, cookieOptions)
          .status(401)
          .json({ error: 'Unauthorized' });
        return;
      }
      response.locals.principal = principal;
      next();
    } catch {
      response.status(503).json({ error: 'Service unavailable' });
    }
  };
}
