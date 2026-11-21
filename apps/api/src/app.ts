import express from 'express';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { createDatabase } from './db/client.js';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { createLoginRouter } from './auth/login-router.js';
import { createLogoutRouter } from './auth/logout-router.js';
import { createRecoveryRouter } from './auth/recovery-router.js';
import { createRegenerateKitRouter } from './auth/regenerate-kit-router.js';
import { createPublicRouter } from './content/public-router.js';
import { createPublicInquiryRouter } from './inquiries/public-router.js';
import { createAdminInquiryRouter } from './inquiries/admin-router.js';
import { createArticleRouter } from './content/article-router.js';
import { createRevalidationJobsRouter } from './content/revalidation-jobs-router.js';
import {
  createAdminContentRouter,
  createAdminSettingsRouter,
} from './content/admin-router.js';
import { requireSuperAdminSession } from './auth/session-middleware.js';
import { createMediaRouter } from './media/router.js';
import { R2MediaStorage } from './media/r2-adapter.js';
import { parseApiEnvironment, type ApiEnvironment } from './config/env.js';
import {
  applyHttpSecurity,
  safeErrorHandler,
  sendNotFound,
} from './security/http.js';
import { createReadinessHandler } from './security/readiness.js';

export function createApp(options?: {
  databaseUrl?: string;
  environment: ApiEnvironment;
}) {
  const app = express();
  const environment = options?.environment ?? parseApiEnvironment({});
  app.disable('x-powered-by');
  app.set('trust proxy', environment.trustProxy);
  app.use(applyHttpSecurity(environment.nodeEnvironment === 'production'));
  app.use('/api/v1/public', createPublicRouter(options?.databaseUrl));
  app.use(
    '/api/v1/public',
    createPublicInquiryRouter(
      options?.databaseUrl,
      environment.throttleHmacSecret,
    ),
  );
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
    '/api/v1/admin/inquiries',
    createAdminInquiryRouter(options?.databaseUrl, environment),
  );
  app.use(
    '/api/v1/admin/revalidation-jobs',
    createRevalidationJobsRouter(options?.databaseUrl, environment),
  );
  app.use(
    '/api/v1/admin/content',
    createAdminContentRouter(options?.databaseUrl, environment),
  );
  app.use(
    '/api/v1/admin/articles',
    createArticleRouter(options?.databaseUrl, environment),
  );
  app.use(
    '/api/v1/admin/media',
    environment.r2
      ? createMediaRouter(
          options?.databaseUrl,
          environment,
          new R2MediaStorage(environment.r2),
        )
      : (_request, response) =>
          response.status(503).json({ error: 'Service unavailable' }),
  );
  app.use(
    '/api/v1/admin/settings',
    createAdminSettingsRouter(options?.databaseUrl, environment),
  );
  app.use(
    '/api/v1/admin/auth',
    createRegenerateKitRouter(options?.databaseUrl, environment),
  );
  app.patch('/api/v1/admin/auth/me', (request, response, next) => {
    if (request.get('Origin') !== environment.adminOrigin || request.get(AUTH_CSRF_HEADER) !== AUTH_CSRF_VALUE) {
      response.status(403).json({ error: 'Forbidden' });
      return;
    }
    express.json({ limit: '1kb', strict: true })(request, response, next);
  }, async (request, response) => {
    const body = z.object({ firstName: z.string().trim().max(100), lastName: z.string().trim().max(100), avatarUrl: z.string().url().max(2048).nullable().optional() }).strict().safeParse(request.body);
    if (!body.success) { response.status(400).json({ error: 'Invalid profile details' }); return; }
    if (!options?.databaseUrl) { response.status(503).json({ error: 'Service unavailable' }); return; }
    const { db, pool } = createDatabase(options.databaseUrl);
    try {
      const result = await db.execute(sql`update admin_users set first_name = ${body.data.firstName}, last_name = ${body.data.lastName}, avatar_url = ${body.data.avatarUrl === undefined ? sql`avatar_url` : body.data.avatarUrl}, updated_at = now() where id = ${(response.locals.principal as { admin: { id: string } }).admin.id} returning id, email, first_name, last_name, avatar_url`);
      const admin = result.rows[0] as { id: string; email: string; first_name: string; last_name: string; avatar_url: string | null } | undefined;
      if (!admin) { response.status(401).json({ error: 'Unauthorized' }); return; }
      response.json({ admin: { id: admin.id, email: admin.email, firstName: admin.first_name, lastName: admin.last_name, avatarUrl: admin.avatar_url, role: 'SUPER_ADMIN' } });
    } catch {
      response.status(503).json({ error: 'Service unavailable' });
    } finally { await pool.end(); }
  });
  app.get('/api/v1/admin/auth/me', (_request, response) =>
    response.json(response.locals.principal),
  );
  app.use(express.json({ limit: '1mb' }));
  app.get('/api/v1/health', (_request, response) =>
    response.json({ status: 'ok' }),
  );
  app.get('/api/v1/ready', createReadinessHandler(options?.databaseUrl));
  app.use(sendNotFound);
  app.use(safeErrorHandler);
  return app;
}
