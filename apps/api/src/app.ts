import express from 'express';
import { createLoginRouter } from './auth/login-router.js';
import { createLogoutRouter } from './auth/logout-router.js';
import { createRecoveryRouter } from './auth/recovery-router.js';
import { createRegenerateKitRouter } from './auth/regenerate-kit-router.js';
import { requireSuperAdminSession } from './auth/session-middleware.js';
import { parseApiEnvironment, type ApiEnvironment } from './config/env.js';
import {
  applyHttpSecurity,
  safeErrorHandler,
  sendNotFound,
} from './security/http.js';

export function createApp(options?: {
  databaseUrl?: string;
  environment: ApiEnvironment;
}) {
  const app = express();
  const environment = options?.environment ?? parseApiEnvironment({});
  app.disable('x-powered-by');
  app.set('trust proxy', environment.trustProxy);
  app.use(applyHttpSecurity(environment.nodeEnvironment === 'production'));
  app.use(
    '/api/v1/admin/auth',
    createLoginRouter(options?.databaseUrl, environment),
  );
  app.use(
    '/api/v1/admin/auth',
    createLogoutRouter(options?.databaseUrl, environment),
  );
  app.use(
    '/api/v1/admin/auth',
    createRecoveryRouter(options?.databaseUrl, environment),
  );
  app.use(
    '/api/v1/admin',
    requireSuperAdminSession(options?.databaseUrl, environment),
  );
  app.use(
    '/api/v1/admin/auth',
    createRegenerateKitRouter(options?.databaseUrl, environment),
  );
  app.get('/api/v1/admin/auth/me', (_request, response) =>
    response.json(response.locals.principal),
  );
  app.use(express.json({ limit: '1mb' }));
  app.get('/api/v1/health', (_request, response) =>
    response.json({ status: 'ok' }),
  );
  app.use(sendNotFound);
  app.use(safeErrorHandler);
  return app;
}
