import express from 'express';
import type { ApiEnvironment } from '../config/env.js';
import { getSessionCookiePolicy, LOGIN_POLICY } from './policy.js';
import { revokeSession } from './logout.js';

export function createLogoutRouter(
  databaseUrl: string | undefined,
  environment: ApiEnvironment,
) {
  const router = express.Router();
  router.post('/logout', async (request, response) => {
    response.set('Cache-Control', 'no-store');
    if (
      request.get('Origin') !== environment.adminOrigin ||
      request.get(LOGIN_POLICY.csrfHeader) !== LOGIN_POLICY.csrfValue
    ) {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }
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
      response.clearCookie(name, cookieOptions).status(204).end();
      return;
    }
    if (!databaseUrl) {
      response.status(503).json({ error: 'Service unavailable' });
      return;
    }
    try {
      await revokeSession(databaseUrl, token);
      response.clearCookie(name, cookieOptions).status(204).end();
    } catch {
      response.status(503).json({ error: 'Service unavailable' });
    }
  });
  return router;
}
