import express, { type RequestHandler } from 'express';
import { z } from 'zod';
import type { ApiEnvironment } from '../config/env.js';
import {
  ContentError,
  homepageSectionKeySchema,
  productPayloadSchema,
  projectPayloadSchema,
  servicePayloadSchema,
  settingsPayloadSchema,
  teamPayloadSchema,
} from './contracts.js';
import {
  createAdminService,
  type AdminCollection,
  type AdminService,
} from './admin-service.js';
import { homepageSectionPayloadSchemas } from './homepage-sections.js';
import {
  createSecuredAdminRouter,
  handleAdminBodyError as handleBodyError,
  respondFromAdminService as respondFromService,
  sendAdminContentFailure as sendContentFailure,
} from './admin-http.js';

const sectionDraftRequestSchema = z.object({ payload: z.unknown() }).strict();
const sectionVisibilityRequestSchema = z
  .object({ visible: z.boolean() })
  .strict();
const sectionOrderRequestSchema = z
  .object({
    orders: z
      .array(
        z
          .object({
            sectionKey: homepageSectionKeySchema,
            position: z.number().int().min(0).max(7),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();
const collectionNames = [
  'services',
  'products',
  'projects',
  'team_members',
] as const;
const collectionPayloadSchemas = {
  services: servicePayloadSchema,
  products: productPayloadSchema,
  projects: projectPayloadSchema,
  team_members: teamPayloadSchema,
} as const;
const collectionCreateRequestSchema = z
  .object({ payload: z.unknown(), draftVisible: z.boolean().optional() })
  .strict();
const recordDraftRequestSchema = z.object({ payload: z.unknown() }).strict();
const recordVisibilityRequestSchema = z
  .object({ visible: z.boolean() })
  .strict();
const recordOrderRequestSchema = z
  .object({
    orders: z
      .array(
        z
          .object({ id: z.string().uuid(), position: z.number().int().min(0) })
          .strict(),
      )
      .max(10_000),
  })
  .strict();
const settingsDraftRequestSchema = z
  .object({ settings: settingsPayloadSchema.partial() })
  .strict();

function getCollection(value: string): AdminCollection | null {
  return collectionNames.find((name) => name === value) ?? null;
}

function actorId(response: express.Response): string {
  return (response.locals.principal as { admin: { id: string } }).admin.id;
}

function sectionRouter(service: AdminService, router: express.Router) {
  router.get('/sections', async (_request, response) =>
    respondFromService(
      response,
      () => service.listSections(),
      (sections) => response.json({ sections }),
    ),
  );

  router.put('/sections/:key/draft', async (request, response) => {
    const key = homepageSectionKeySchema.safeParse(request.params.key);
    const body = sectionDraftRequestSchema.safeParse(request.body);
    if (!key.success || !body.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    const payload = homepageSectionPayloadSchemas[key.data].safeParse(
      body.data.payload,
    );
    if (!payload.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    return respondFromService(
      response,
      () => service.saveSectionDraft(key.data, payload.data, actorId(response)),
      (section) => response.json({ section }),
    );
  });

  router.put('/sections/:key/visibility', async (request, response) => {
    const key = homepageSectionKeySchema.safeParse(request.params.key);
    const body = sectionVisibilityRequestSchema.safeParse(request.body);
    if (!key.success || !body.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    return respondFromService(
      response,
      () =>
        service.setSectionVisibility(
          key.data,
          body.data.visible,
          actorId(response),
        ),
      (section) => response.json({ section }),
    );
  });

  router.post('/sections/reorder', async (request, response) => {
    const body = sectionOrderRequestSchema.safeParse(request.body);
    if (!body.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    return respondFromService(
      response,
      () => service.reorderSections(body.data.orders, actorId(response)),
      (sections) => response.json({ sections }),
    );
  });

  router.post('/sections/publish-all', async (_request, response) =>
    respondFromService(
      response,
      () => service.publishAllSections(actorId(response)),
      (count) => response.json({ success: true, count }),
    ),
  );

  const publication =
    (publish: boolean): RequestHandler =>
    async (request, response) => {
      const key = homepageSectionKeySchema.safeParse(request.params.key);
      if (!key.success) {
        sendContentFailure(response, new ContentError('not_found'));
        return;
      }
      return respondFromService(
        response,
        () =>
          service.changeSectionPublication(
            key.data,
            publish,
            actorId(response),
          ),
        (section) => response.json({ section }),
      );
    };
  router.post('/sections/:key/publish', publication(true));
  router.post('/sections/:key/unpublish', publication(false));
}

function collectionRouter(service: AdminService, router: express.Router) {
  router.get('/:collection', async (request, response) => {
    const collection = getCollection(String(request.params.collection ?? ''));
    if (!collection) {
      sendContentFailure(response, new ContentError('not_found'));
      return;
    }
    return respondFromService(
      response,
      () => service.listCollection(collection),
      (items) => response.json({ items }),
    );
  });

  router.post('/:collection/reorder', async (request, response) => {
    const collection = getCollection(String(request.params.collection ?? ''));
    const body = recordOrderRequestSchema.safeParse(request.body);
    if (!collection) {
      sendContentFailure(response, new ContentError('not_found'));
      return;
    }
    if (!body.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    return respondFromService(
      response,
      () =>
        service.reorderCollection(
          collection,
          body.data.orders,
          actorId(response),
        ),
      (items) => response.json({ items }),
    );
  });

  router.post('/:collection', async (request, response) => {
    const collection = getCollection(String(request.params.collection ?? ''));
    const body = collectionCreateRequestSchema.safeParse(request.body);
    if (!collection) {
      sendContentFailure(response, new ContentError('not_found'));
      return;
    }
    if (!body.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    const payload = collectionPayloadSchemas[collection].safeParse(
      body.data.payload,
    );
    if (!payload.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    return respondFromService(
      response,
      () =>
        service.createCollectionRecord(
          collection,
          payload.data,
          body.data.draftVisible ?? true,
          actorId(response),
        ),
      (record) => response.status(201).json({ record }),
    );
  });

  router.put('/:collection/:id/draft', async (request, response) => {
    const collection = getCollection(String(request.params.collection ?? ''));
    const id = z.string().uuid().safeParse(request.params.id);
    const body = recordDraftRequestSchema.safeParse(request.body);
    if (!collection || !id.success) {
      sendContentFailure(response, new ContentError('not_found'));
      return;
    }
    if (!body.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    const payload = collectionPayloadSchemas[collection].safeParse(
      body.data.payload,
    );
    if (!payload.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    return respondFromService(
      response,
      () =>
        service.saveCollectionDraft(
          collection,
          id.data,
          payload.data,
          actorId(response),
        ),
      (record) => response.json({ record }),
    );
  });

  router.put('/:collection/:id/visibility', async (request, response) => {
    const collection = getCollection(String(request.params.collection ?? ''));
    const id = z.string().uuid().safeParse(request.params.id);
    const body = recordVisibilityRequestSchema.safeParse(request.body);
    if (!collection || !id.success) {
      sendContentFailure(response, new ContentError('not_found'));
      return;
    }
    if (!body.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    return respondFromService(
      response,
      () =>
        service.setCollectionVisibility(
          collection,
          id.data,
          body.data.visible,
          actorId(response),
        ),
      (record) => response.json({ record }),
    );
  });

  const publication =
    (publish: boolean): RequestHandler =>
    async (request, response) => {
      const collection = getCollection(String(request.params.collection ?? ''));
      const id = z.string().uuid().safeParse(request.params.id);
      if (!collection || !id.success) {
        sendContentFailure(response, new ContentError('not_found'));
        return;
      }
      return respondFromService(
        response,
        () =>
          service.changeCollectionPublication(
            collection,
            id.data,
            publish,
            actorId(response),
          ),
        (record) => response.json({ record }),
      );
    };
  router.post('/:collection/:id/publish', publication(true));
  router.post('/:collection/:id/unpublish', publication(false));

  router.delete('/:collection/:id', async (request, response) => {
    const collection = getCollection(String(request.params.collection ?? ''));
    const id = z.string().uuid().safeParse(request.params.id);
    if (!collection || !id.success) {
      sendContentFailure(response, new ContentError('not_found'));
      return;
    }
    return respondFromService(
      response,
      () =>
        service.deleteCollectionRecord(collection, id.data, actorId(response)),
      () => response.status(204).end(),
    );
  });
}

export function createAdminContentRouter(
  databaseUrl: string | undefined,
  environment: ApiEnvironment,
) {
  const router = createSecuredAdminRouter(environment);
  const service = createAdminService(databaseUrl, {
    webInternalOrigin: environment.webInternalOrigin,
    contentRevalidationSecret: environment.contentRevalidationSecret,
    publicMediaBaseUrl: environment.r2PublicBaseUrl,
  });
  sectionRouter(service, router);
  collectionRouter(service, router);
  router.use(handleBodyError);
  return router;
}

export function createAdminSettingsRouter(
  databaseUrl: string | undefined,
  environment: ApiEnvironment,
) {
  const router = createSecuredAdminRouter(environment);
  const service = createAdminService(databaseUrl, {
    webInternalOrigin: environment.webInternalOrigin,
    contentRevalidationSecret: environment.contentRevalidationSecret,
    publicMediaBaseUrl: environment.r2PublicBaseUrl,
  });
  router.get('/', async (_request, response) =>
    respondFromService(
      response,
      () => service.readSettings(),
      (settings) => response.json({ settings }),
    ),
  );
  router.put('/draft', async (request, response) => {
    const body = settingsDraftRequestSchema.safeParse(request.body);
    if (!body.success) {
      sendContentFailure(response, new ContentError('validation'));
      return;
    }
    return respondFromService(
      response,
      () => service.saveSettingsDraft(body.data.settings, actorId(response)),
      (settings) => response.json({ settings }),
    );
  });
  const publication =
    (publish: boolean): RequestHandler =>
    async (_request, response) =>
      respondFromService(
        response,
        () => service.changeSettingsPublication(publish, actorId(response)),
        (settings) => response.json({ settings }),
      );
  router.post('/publish', publication(true));
  router.post('/unpublish', publication(false));
  router.use(handleBodyError);
  return router;
}
