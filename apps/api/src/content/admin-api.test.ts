import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { Pool } from 'pg';
import { createApp } from '../app.js';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';
import { getSessionCookiePolicy } from '../auth/policy.js';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';

const databaseUrl = process.env.ADMIN_CONTENT_TEST_DATABASE_URL;
const databaseName = 'cod316_m3_review_test';
const adminOrigin = 'http://localhost:3001';
const mediaBaseUrl = 'https://cdn.example.test/assets/';
let adminUserId: string | undefined;
const sessionToken = randomBytes(32).toString('base64url');
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

function assertDisposableDatabase(value: string): void {
  const url = new URL(value);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(url.hostname));
  assert.equal(decodeURIComponent(url.pathname.slice(1)), databaseName);
}

before(async () => {
  if (!databaseUrl || !pool) return;
  assertDisposableDatabase(databaseUrl);
  await runMigrations(databaseUrl);
  await pool.query('delete from content_sections');
  await pool.query('delete from services');
  await pool.query('delete from products');
  await pool.query('delete from projects');
  await pool.query('delete from team_members');
  await pool.query('delete from site_settings');
  await pool.query(`insert into content_sections (section_key, position, draft_payload)
    select section_key, position - 1, '{}'::jsonb
    from unnest(array['hero','about','services','products','projects','team','featured_insights','contact']::text[])
      with ordinality as keys(section_key, position)`);
  const existingAdmin = await pool.query<{ id: string }>(
    'select id from admin_users where is_super_admin = true limit 1',
  );
  adminUserId = existingAdmin.rows[0]?.id ?? randomUUID();
  if (!existingAdmin.rows[0]) {
    await pool.query(
      `insert into admin_users (id, email, password_hash)
       values ($1, $2, 'fixture-hash-not-used-for-auth')`,
      [adminUserId, `m3-${adminUserId}@codeddevs.test`],
    );
  }
  await pool.query(
    `insert into sessions (admin_user_id, token_hash, credential_version, expires_at)
     values ($1, $2, 1, now() + interval '1 hour')`,
    [adminUserId, createHash('sha256').update(sessionToken).digest('hex')],
  );
});

after(async () => {
  if (pool) await pool.end();
});

test(
  'content sections reads require a session and return the canonical envelope',
  { skip: !databaseUrl },
  async () => {
    assert.ok(pool && adminUserId);
    await pool.query('delete from services');
    await pool.query('delete from products');
    await pool.query('delete from projects');
    await pool.query('delete from team_members');
    await pool.query('delete from site_settings');
    await pool.query(
      `delete from audit_events where actor_admin_user_id = $1`,
      [adminUserId],
    );
    const environment = parseApiEnvironment({
      NODE_ENV: 'test',
      R2_ACCOUNT_ID: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      R2_ACCESS_KEY_ID: 'test-access-key',
      R2_SECRET_ACCESS_KEY: 'test-secret-key',
      R2_BUCKET: 'test-bucket',
      R2_PUBLIC_BASE_URL: mediaBaseUrl,
    });
    const server = createApp({ databaseUrl, environment }).listen(
      0,
      '127.0.0.1',
    );
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const { name } = getSessionCookiePolicy('test');
    const cookie = `${name}=${sessionToken}`;
    const send = (
      path: string,
      method: string,
      body: unknown,
      options: { origin?: string; csrf?: boolean; contentType?: string } = {},
    ) =>
      fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Cookie: cookie,
          ...(options.origin === undefined || options.origin !== ''
            ? { Origin: options.origin ?? adminOrigin }
            : {}),
          ...(options.csrf === false
            ? {}
            : { [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE }),
          ...(options.contentType === ''
            ? {}
            : { 'Content-Type': options.contentType ?? 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    let serviceMediaKey: string | undefined;
    try {
      const anonymous = await fetch(`${baseUrl}/api/v1/admin/content/sections`);
      assert.equal(anonymous.status, 401);

      const response = await fetch(`${baseUrl}/api/v1/admin/content/sections`, {
        headers: { Cookie: cookie },
      });
      assert.equal(response.status, 200);
      const initialSections = (await response.json()) as {
        sections: Array<{
          sectionKey: string;
          position: number;
          draftPayload: unknown;
        }>;
      };
      assert.deepEqual(
        initialSections.sections.map(({ sectionKey, position }) => [
          sectionKey,
          position,
        ]),
        [
          ['hero', 0],
          ['about', 1],
          ['services', 2],
          ['products', 3],
          ['projects', 4],
          ['team', 5],
          ['featured_insights', 6],
          ['contact', 7],
        ],
      );
      assert.ok(
        initialSections.sections.every(
          ({ draftPayload }) => JSON.stringify(draftPayload) === '{}',
        ),
      );
      assert.equal(response.headers.get('cache-control'), 'no-store');

      const sectionPath = '/api/v1/admin/content/sections/hero/draft';
      assert.equal(
        (
          await send(
            sectionPath,
            'PUT',
            { payload: { heading: 'Hacked' } },
            { origin: 'https://evil.example' },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await send(
            sectionPath,
            'PUT',
            { payload: { heading: 'Hacked' } },
            { csrf: false },
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await send(
            sectionPath,
            'PUT',
            { payload: { heading: 'Hacked' } },
            { contentType: 'text/plain' },
          )
        ).status,
        415,
      );
      assert.equal(
        (
          await send(sectionPath, 'PUT', {
            payload: { heading: 'x'.repeat(1_048_600), body: 'Body' },
          })
        ).status,
        413,
      );
      assert.equal(
        (
          await send(sectionPath, 'PUT', {
            payload: { heading: 'Hacked', private: 'secret' },
          })
        ).status,
        400,
      );
      assert.deepEqual(
        await (
          await fetch(`${baseUrl}/api/v1/admin/content/sections`, {
            headers: { Cookie: cookie },
          })
        ).json(),
        { sections: initialSections.sections },
      );

      const created = await send(sectionPath, 'PUT', {
        payload: { heading: 'Draft Hero', body: 'Draft body' },
      });
      assert.equal(created.status, 200);
      const createdBody = (await created.json()) as {
        section: {
          position: number;
          publishedPosition: number | null;
          publishedPayload: unknown;
          draftPayload: { heading: string };
        };
      };
      assert.equal(createdBody.section.position, 0);
      assert.equal(createdBody.section.publishedPosition, null);
      assert.equal(createdBody.section.publishedPayload, null);
      assert.equal(createdBody.section.draftPayload.heading, 'Draft Hero');

      const published = await send(
        '/api/v1/admin/content/sections/hero/publish',
        'POST',
        undefined,
      );
      assert.equal(published.status, 200);
      const publishedBody = (await published.json()) as {
        section: {
          position: number;
          publishedPosition: number;
          draftPayload: { heading: string };
          publishedPayload: { heading: string };
          publishedVisible: boolean;
          publishedAt: string;
        };
      };
      assert.equal(publishedBody.section.publishedPosition, 0);
      assert.equal(publishedBody.section.publishedVisible, true);
      assert.equal(
        publishedBody.section.publishedPayload.heading,
        'Draft Hero',
      );
      assert.ok(publishedBody.section.publishedAt);

      const draftEdit = await send(sectionPath, 'PUT', {
        payload: { heading: 'Changed Draft', body: 'Changed body' },
      });
      const afterDraftEdit = (await draftEdit.json()) as {
        section: {
          position: number;
          publishedPosition: number;
          draftPayload: { heading: string };
          publishedPayload: { heading: string };
        };
      };
      assert.equal(
        afterDraftEdit.section.draftPayload.heading,
        'Changed Draft',
      );
      assert.equal(
        afterDraftEdit.section.publishedPayload.heading,
        'Draft Hero',
      );
      assert.equal(afterDraftEdit.section.position, 0);
      assert.equal(afterDraftEdit.section.publishedPosition, 0);

      const visibility = await send(
        '/api/v1/admin/content/sections/hero/visibility',
        'PUT',
        { visible: false },
      );
      const visibilityBody = (await visibility.json()) as {
        section: { draftVisible: boolean; publishedVisible: boolean };
      };
      assert.equal(visibility.status, 200);
      assert.equal(visibilityBody.section.draftVisible, false);
      assert.equal(visibilityBody.section.publishedVisible, true);

      const about = await send(
        '/api/v1/admin/content/sections/about/draft',
        'PUT',
        { payload: { heading: 'Draft About', body: 'About body' } },
      );
      assert.equal(about.status, 200);
      const strictPublishAll = await send(
        '/api/v1/admin/content/sections/publish-all',
        'POST',
        undefined,
      );
      assert.equal(strictPublishAll.status, 400);
      for (const [key, payload] of [
        ['services', { heading: 'Services' }],
        ['products', { heading: 'Products' }],
        ['projects', { heading: 'Projects' }],
        ['team', { heading: 'Team' }],
        ['featured_insights', { heading: 'Insights' }],
        ['contact', { heading: 'Contact', body: 'Contact us' }],
      ] as const) {
        const editableSection = await send(
          `/api/v1/admin/content/sections/${key}/draft`,
          'PUT',
          { payload },
        );
        assert.equal(editableSection.status, 200, key);
      }
      const reordered = await send(
        '/api/v1/admin/content/sections/reorder',
        'POST',
        {
          orders: [
            { sectionKey: 'about', position: 0 },
            { sectionKey: 'hero', position: 1 },
            ...[
              'services',
              'products',
              'projects',
              'team',
              'featured_insights',
              'contact',
            ].map((sectionKey, index) => ({ sectionKey, position: index + 2 })),
          ],
        },
      );
      assert.equal(reordered.status, 200);
      const reorderedBody = (await reordered.json()) as {
        sections: Array<{ sectionKey: string; position: number }>;
      };
      assert.deepEqual(
        reorderedBody.sections.map(({ sectionKey, position }) => [
          sectionKey,
          position,
        ]),
        [
          ['about', 0],
          ['hero', 1],
          ['services', 2],
          ['products', 3],
          ['projects', 4],
          ['team', 5],
          ['featured_insights', 6],
          ['contact', 7],
        ],
      );
      const invalidReorder = await send(
        '/api/v1/admin/content/sections/reorder',
        'POST',
        { orders: [{ sectionKey: 'about', position: 0 }] },
      );
      assert.equal(invalidReorder.status, 400);
      const unchangedOrder = (await (
        await fetch(`${baseUrl}/api/v1/admin/content/sections`, {
          headers: { Cookie: cookie },
        })
      ).json()) as {
        sections: Array<{ sectionKey: string; position: number }>;
      };
      assert.deepEqual(
        unchangedOrder.sections.map(({ sectionKey, position }) => [
          sectionKey,
          position,
        ]),
        [
          ['about', 0],
          ['hero', 1],
          ['services', 2],
          ['products', 3],
          ['projects', 4],
          ['team', 5],
          ['featured_insights', 6],
          ['contact', 7],
        ],
      );

      const publishAll = await send(
        '/api/v1/admin/content/sections/publish-all',
        'POST',
        undefined,
      );
      assert.deepEqual(await publishAll.json(), { success: true, count: 8 });
      for (const path of [
        '/api/v1/admin/content/sections/hero/publish',
        '/api/v1/admin/content/sections/hero/unpublish',
        '/api/v1/admin/content/sections/publish-all',
        '/api/v1/admin/settings/publish',
        '/api/v1/admin/settings/unpublish',
      ]) {
        const bodyful = await send(path, 'POST', {});
        assert.equal(bodyful.status, 400, path);
        assert.deepEqual(
          await bodyful.json(),
          { error: 'Invalid request' },
          path,
        );
      }
      const afterPublishAll = (await (
        await fetch(`${baseUrl}/api/v1/admin/content/sections`, {
          headers: { Cookie: cookie },
        })
      ).json()) as {
        sections: Array<{
          sectionKey: string;
          position: number;
          publishedPosition: number | null;
          publishedVisible: boolean;
        }>;
      };
      assert.deepEqual(
        afterPublishAll.sections.map(({ sectionKey, publishedPosition }) => [
          sectionKey,
          publishedPosition,
        ]),
        [
          ['about', 0],
          ['hero', 1],
          ['services', 2],
          ['products', 3],
          ['projects', 4],
          ['team', 5],
          ['featured_insights', 6],
          ['contact', 7],
        ],
      );
      assert.equal(afterPublishAll.sections[1]?.publishedVisible, false);

      const unpublished = await send(
        '/api/v1/admin/content/sections/hero/unpublish',
        'POST',
        undefined,
      );
      const unpublishedBody = (await unpublished.json()) as {
        section: {
          publishedPayload: unknown;
          publishedPosition: number | null;
          publishedVisible: boolean;
          publishedAt: string | null;
        };
      };
      assert.equal(unpublished.status, 200);
      assert.equal(unpublishedBody.section.publishedPayload, null);
      assert.equal(unpublishedBody.section.publishedPosition, null);
      assert.equal(unpublishedBody.section.publishedVisible, false);
      assert.equal(unpublishedBody.section.publishedAt, null);

      const invalidService = await send(
        '/api/v1/admin/content/services',
        'POST',
        {
          payload: { title: 'Invalid' },
        },
      );
      assert.equal(invalidService.status, 400);
      serviceMediaKey = `media/${randomUUID()}.png`;
      await pool.query(
        `insert into media_assets
          (object_key, mime_type, byte_size, created_by_admin_user_id)
         values ($1, 'image/png', 128, $2)`,
        [serviceMediaKey, adminUserId],
      );
      const serviceAResponse = await send(
        '/api/v1/admin/content/services',
        'POST',
        {
          payload: {
            title: 'Service A',
            description: 'Description A',
            icon: `${mediaBaseUrl}${serviceMediaKey}`,
          },
        },
      );
      const serviceBResponse = await send(
        '/api/v1/admin/content/services',
        'POST',
        {
          payload: { title: 'Service B', description: 'Description B' },
          draftVisible: false,
        },
      );
      assert.equal(serviceAResponse.status, 201);
      assert.equal(serviceBResponse.status, 201);
      const serviceA = (await serviceAResponse.json()) as {
        record: {
          id: string;
          position: number;
          publishedPayload: unknown;
          publishedPosition: number | null;
          draftPayload: { title: string };
        };
      };
      const serviceRefs = async (snapshot: 'draft' | 'published') => {
        const references = await pool.query<{
          object_key: string;
          field_key: string;
          position: number;
        }>(
          `select a.object_key, r.field_key, r.position
           from media_asset_references r
           join media_assets a on a.id = r.media_asset_id
           where r.service_id = $1 and r.snapshot = $2
           order by r.field_key, r.position`,
          [serviceA.record.id, snapshot],
        );
        return references.rows;
      };
      assert.deepEqual(await serviceRefs('draft'), [
        { object_key: serviceMediaKey, field_key: 'icon', position: 0 },
      ]);
      assert.deepEqual(await serviceRefs('published'), []);
      const serviceB = (await serviceBResponse.json()) as {
        record: { id: string; position: number; draftVisible: boolean };
      };
      assert.equal(serviceA.record.position, 0);
      assert.equal(serviceA.record.publishedPayload, null);
      assert.equal(serviceA.record.publishedPosition, null);
      assert.equal(serviceB.record.position, 1);
      assert.equal(serviceB.record.draftVisible, false);

      const serviceList = await send(
        '/api/v1/admin/content/services',
        'GET',
        undefined,
      );
      const listedServices = (await serviceList.json()) as {
        items: Array<{ id: string; position: number }>;
      };
      assert.deepEqual(
        listedServices.items.map(({ id, position }) => [id, position]),
        [
          [serviceA.record.id, 0],
          [serviceB.record.id, 1],
        ],
      );

      for (const operation of ['publish', 'unpublish']) {
        const bodyfulPublication = await send(
          `/api/v1/admin/content/services/${serviceA.record.id}/${operation}`,
          'POST',
          {},
        );
        assert.equal(bodyfulPublication.status, 400, operation);
        assert.deepEqual(await bodyfulPublication.json(), {
          error: 'Invalid request',
        });
      }

      const firstServicePublish = await send(
        `/api/v1/admin/content/services/${serviceA.record.id}/publish`,
        'POST',
        undefined,
      );
      const firstServiceLive = (await firstServicePublish.json()) as {
        record: {
          publishedPayload: { title: string };
          publishedPosition: number;
        };
      };
      assert.equal(firstServiceLive.record.publishedPayload.title, 'Service A');
      assert.equal(firstServiceLive.record.publishedPosition, 0);
      assert.deepEqual(await serviceRefs('published'), [
        { object_key: serviceMediaKey, field_key: 'icon', position: 0 },
      ]);
      const draftServiceEdit = await send(
        `/api/v1/admin/content/services/${serviceA.record.id}/draft`,
        'PUT',
        { payload: { title: 'Service A Draft', description: 'Edited draft' } },
      );
      const editedService = (await draftServiceEdit.json()) as {
        record: {
          position: number;
          publishedPosition: number;
          draftPayload: { title: string };
          publishedPayload: { title: string };
        };
      };
      assert.equal(editedService.record.draftPayload.title, 'Service A Draft');
      assert.equal(editedService.record.publishedPayload.title, 'Service A');
      assert.deepEqual(await serviceRefs('draft'), []);
      assert.deepEqual(await serviceRefs('published'), [
        { object_key: serviceMediaKey, field_key: 'icon', position: 0 },
      ]);
      assert.equal(editedService.record.position, 0);
      assert.equal(editedService.record.publishedPosition, 0);

      const serviceVisibility = await send(
        `/api/v1/admin/content/services/${serviceB.record.id}/visibility`,
        'PUT',
        { visible: true },
      );
      const serviceVisibilityBody = (await serviceVisibility.json()) as {
        record: { draftVisible: boolean; publishedVisible: boolean };
      };
      assert.equal(serviceVisibilityBody.record.draftVisible, true);
      assert.equal(serviceVisibilityBody.record.publishedVisible, false);

      const serviceReorder = await send(
        '/api/v1/admin/content/services/reorder',
        'POST',
        {
          orders: [
            { id: serviceB.record.id, position: 0 },
            { id: serviceA.record.id, position: 1 },
          ],
        },
      );
      const serviceReorderBody = (await serviceReorder.json()) as {
        items: Array<{ id: string; position: number }>;
      };
      assert.equal(serviceReorder.status, 200);
      assert.deepEqual(
        serviceReorderBody.items.map(({ id, position }) => [id, position]),
        [
          [serviceB.record.id, 0],
          [serviceA.record.id, 1],
        ],
      );
      const invalidServiceReorder = await send(
        '/api/v1/admin/content/services/reorder',
        'POST',
        { orders: [{ id: serviceA.record.id, position: 0 }] },
      );
      assert.equal(invalidServiceReorder.status, 400);

      const republished = await send(
        `/api/v1/admin/content/services/${serviceA.record.id}/publish`,
        'POST',
        undefined,
      );
      const republishedBody = (await republished.json()) as {
        record: {
          publishedPosition: number;
          publishedPayload: { title: string };
        };
      };
      assert.equal(republishedBody.record.publishedPosition, 1);
      assert.equal(
        republishedBody.record.publishedPayload.title,
        'Service A Draft',
      );
      assert.deepEqual(await serviceRefs('published'), []);
      const unpublishService = await send(
        `/api/v1/admin/content/services/${serviceA.record.id}/unpublish`,
        'POST',
        undefined,
      );
      const unpublishServiceBody = (await unpublishService.json()) as {
        record: { publishedPayload: unknown; publishedPosition: number | null };
      };
      assert.equal(unpublishServiceBody.record.publishedPayload, null);
      assert.equal(unpublishServiceBody.record.publishedPosition, null);
      const bodyfulDelete = await send(
        `/api/v1/admin/content/services/${serviceB.record.id}`,
        'DELETE',
        {},
      );
      assert.equal(bodyfulDelete.status, 400);
      assert.deepEqual(await bodyfulDelete.json(), {
        error: 'Invalid request',
      });
      const deleteService = await send(
        `/api/v1/admin/content/services/${serviceB.record.id}`,
        'DELETE',
        undefined,
        { contentType: '' },
      );
      assert.equal(deleteService.status, 204);

      for (const [collection, payload] of [
        [
          'products',
          {
            name: 'Product',
            tagline: 'Tagline',
            description: 'Product description',
          },
        ],
        ['projects', { title: 'Project', summary: 'Project summary' }],
        ['team_members', { name: 'Member', role: 'Engineer' }],
      ] as const) {
        const createdRecord = await send(
          `/api/v1/admin/content/${collection}`,
          'POST',
          { payload },
        );
        assert.equal(createdRecord.status, 201);
        const collectionList = await send(
          `/api/v1/admin/content/${collection}`,
          'GET',
          undefined,
        );
        const collectionBody = (await collectionList.json()) as {
          items: Array<{ id: string }>;
        };
        assert.equal(collectionBody.items.length, 1);
      }

      const settingsPayload = {
        companyName: 'CodedDevs',
        contactEmail: 'hello@codeddevs.test',
        navigationAction: { label: 'Say hello', href: '/#contact' },
        metaTitle: 'CodedDevs home',
      };
      const incompleteSettings = await send(
        '/api/v1/admin/settings/draft',
        'PUT',
        {
          settings: { companyName: 'Incomplete' },
        },
      );
      assert.equal(incompleteSettings.status, 400);
      assert.deepEqual(await incompleteSettings.json(), {
        error: 'Invalid content request',
        code: 'CONTENT_INVALID_REQUEST',
      });
      assert.equal(
        (await send('/api/v1/admin/settings', 'GET', undefined)).status,
        404,
      );
      const savedSettings = await send('/api/v1/admin/settings/draft', 'PUT', {
        settings: settingsPayload,
      });
      assert.equal(savedSettings.status, 200);
      const settingsBody = (await savedSettings.json()) as {
        settings: {
          id: boolean;
          draftPayload: typeof settingsPayload;
          publishedPayload: unknown;
        };
      };
      assert.equal(settingsBody.settings.id, true);
      assert.equal(settingsBody.settings.draftPayload.companyName, 'CodedDevs');
      assert.equal(settingsBody.settings.publishedPayload, null);
      const removedHeaderAction = await send(
        '/api/v1/admin/settings/draft',
        'PUT',
        { settings: { navigationAction: null } },
      );
      assert.equal(removedHeaderAction.status, 200);
      const removedHeaderActionBody = (await removedHeaderAction.json()) as {
        settings: { draftPayload: Record<string, unknown> };
      };
      assert.equal(
        Object.hasOwn(
          removedHeaderActionBody.settings.draftPayload,
          'navigationAction',
        ),
        false,
      );
      const restoredHeaderAction = await send(
        '/api/v1/admin/settings/draft',
        'PUT',
        { settings: { navigationAction: settingsPayload.navigationAction } },
      );
      assert.equal(restoredHeaderAction.status, 200);
      const invalidPartialSettings = await send(
        '/api/v1/admin/settings/draft',
        'PUT',
        {
          settings: { contactEmail: '' },
        },
      );
      assert.equal(invalidPartialSettings.status, 400);
      const settingsAfterInvalidPartial = (await (
        await send('/api/v1/admin/settings', 'GET', undefined)
      ).json()) as {
        settings: { draftPayload: typeof settingsPayload };
      };
      assert.deepEqual(
        settingsAfterInvalidPartial.settings.draftPayload,
        settingsPayload,
      );
      const settingsRead = await send(
        '/api/v1/admin/settings',
        'GET',
        undefined,
      );
      const settingsReadBody = (await settingsRead.json()) as {
        settings: { draftPayload: typeof settingsPayload };
      };
      assert.equal(
        settingsReadBody.settings.draftPayload.contactEmail,
        'hello@codeddevs.test',
      );
      const deniedSettings = await send(
        '/api/v1/admin/settings/draft',
        'PUT',
        {
          settings: { companyName: 'Rejected update' },
        },
        { origin: 'https://evil.example' },
      );
      assert.equal(deniedSettings.status, 403);
      const missingCsrfSettings = await send(
        '/api/v1/admin/settings/draft',
        'PUT',
        {
          settings: { companyName: 'Rejected update' },
        },
        { csrf: false },
      );
      assert.equal(missingCsrfSettings.status, 403);
      const settingsAfterDenied = (await (
        await send('/api/v1/admin/settings', 'GET', undefined)
      ).json()) as { settings: { draftPayload: typeof settingsPayload } };
      assert.equal(
        settingsAfterDenied.settings.draftPayload.companyName,
        'CodedDevs',
      );
      const settingsPublish = await send(
        '/api/v1/admin/settings/publish',
        'POST',
        undefined,
      );
      const settingsPublishBody = (await settingsPublish.json()) as {
        settings: {
          publishedPayload: typeof settingsPayload;
          publishedAt: string;
        };
      };
      assert.equal(
        settingsPublishBody.settings.publishedPayload.metaTitle,
        'CodedDevs home',
      );
      assert.ok(settingsPublishBody.settings.publishedAt);
      const settingsUnpublish = await send(
        '/api/v1/admin/settings/unpublish',
        'POST',
        undefined,
      );
      const settingsUnpublishBody = (await settingsUnpublish.json()) as {
        settings: { publishedPayload: unknown; publishedAt: string | null };
      };
      assert.equal(settingsUnpublishBody.settings.publishedPayload, null);
      assert.equal(settingsUnpublishBody.settings.publishedAt, null);

      await pool.query(`create function cod316_fail_content_audit() returns trigger
        language plpgsql as $$ begin
          if new.event_type = 'content.save_draft' then
            raise exception 'injected content audit failure';
          end if;
          return new;
        end $$`);
      await pool.query(`create trigger cod316_fail_content_audit_trigger
        before insert on audit_events for each row execute function cod316_fail_content_audit()`);
      try {
        const auditFailure = await send('/api/v1/admin/settings/draft', 'PUT', {
          settings: { metaTitle: 'Must roll back' },
        });
        assert.equal(auditFailure.status, 503);
        assert.deepEqual(await auditFailure.json(), {
          error: 'Service unavailable',
          code: 'CONTENT_UNAVAILABLE',
        });
        const afterAuditFailure = (await (
          await send('/api/v1/admin/settings', 'GET', undefined)
        ).json()) as { settings: { draftPayload: typeof settingsPayload } };
        assert.equal(
          afterAuditFailure.settings.draftPayload.metaTitle,
          'CodedDevs home',
        );
      } finally {
        await pool.query(
          'drop trigger cod316_fail_content_audit_trigger on audit_events',
        );
        await pool.query('drop function cod316_fail_content_audit()');
      }

      const auditRows = await pool.query<{
        event_type: string;
        target_type: string;
        metadata: unknown;
      }>(
        `select event_type, target_type, metadata from audit_events where actor_admin_user_id = $1`,
        [adminUserId],
      );
      assert.ok(auditRows.rows.length > 0);
      assert.equal(
        JSON.stringify(auditRows.rows).includes('Service A Draft'),
        false,
      );
      assert.equal(
        JSON.stringify(auditRows.rows).includes('hello@codeddevs.test'),
        false,
      );
    } finally {
      server.close();
      await once(server, 'close');
      if (serviceMediaKey) {
        await pool.query(
          `delete from media_asset_references
           where media_asset_id in (
             select id from media_assets where object_key = $1
           )`,
          [serviceMediaKey],
        );
        await pool.query('delete from media_assets where object_key = $1', [
          serviceMediaKey,
        ]);
      }
    }
  },
);
