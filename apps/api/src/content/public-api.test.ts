import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { Pool } from 'pg';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';
import { createApp } from '../app.js';

async function withApi(
  databaseUrl: string | undefined,
  run: (baseUrl: string) => Promise<void>,
) {
  const server = createApp({
    databaseUrl,
    environment: parseApiEnvironment({ NODE_ENV: 'test' }),
  }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, 'close');
  }
}

test('public content endpoints fail safely with cache headers when the database is unavailable', async () => {
  await withApi(undefined, async (baseUrl) => {
    for (const path of [
      '/api/v1/public/site',
      '/api/v1/public/articles?page=1&limit=10',
      '/api/v1/public/articles/valid-slug',
    ]) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 503, path);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const body = await response.json();
      assert.equal(JSON.stringify(body).includes('stack'), false);
      assert.equal(JSON.stringify(body).includes('databaseUrl'), false);
    }
  });
});

const publicDatabaseUrl = process.env.PUBLIC_CONTENT_TEST_DATABASE_URL;
const publicDatabaseName = 'cod316_public_content_test';

function assertDisposablePublicDatabase(value: string): void {
  const url = new URL(value);
  assert.ok(
    ['127.0.0.1', '::1', 'localhost'].includes(url.hostname),
    'database must be bound to loopback',
  );
  assert.equal(
    decodeURIComponent(url.pathname.slice(1)),
    publicDatabaseName,
    'database name must identify the disposable public-content test database',
  );
}

test(
  'public routes return only published projections and stable publication ordering',
  { skip: !publicDatabaseUrl },
  async () => {
    assertDisposablePublicDatabase(publicDatabaseUrl!);
    await runMigrations(publicDatabaseUrl!);
    const pool = new Pool({ connectionString: publicDatabaseUrl });
    const sectionId = randomUUID();
    const serviceA = randomUUID();
    const serviceB = randomUUID();
    const hiddenService = randomUUID();
    const draftService = randomUUID();
    const productId = randomUUID();
    const projectId = randomUUID();
    const teamId = randomUUID();
    const articleIds = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
      '33333333-3333-4333-8333-333333333333',
      randomUUID(),
    ];
    const [olderArticle, lowerTieId, higherTieId, draftArticle] = articleIds;
    try {
      const version = await pool.query<{ server_version: string }>(
        'show server_version',
      );
      assert.match(version.rows[0]?.server_version ?? '', /^16\./);

      await pool.query('delete from articles');
      await pool.query('delete from content_sections');
      await pool.query('delete from services');
      await pool.query('delete from products');
      await pool.query('delete from projects');
      await pool.query('delete from team_members');
      await pool.query('delete from site_settings');
      await pool.query('delete from revalidation_jobs');

      await pool.query(
        `insert into content_sections
          (id, section_key, position, published_position, draft_payload, published_payload, draft_visible, published_visible, published_at)
         values ($1, 'hero', 20, 0, $2::jsonb, $3::jsonb, true, true, now())`,
        [
          sectionId,
          JSON.stringify({ heading: 'PRIVATE SECTION', body: 'DRAFT COPY' }),
          JSON.stringify({ heading: 'Public headline', body: 'Welcome' }),
        ],
      );
      const serviceInsert = `insert into services
        (id, position, published_position, draft_payload, published_payload, draft_visible, published_visible, published_at)
        values ($1, $2, $3, $4::jsonb, $5::jsonb, true, $6, case when $5::jsonb is null then null else now() end)`;
      await pool.query(serviceInsert, [
        serviceA,
        20,
        0,
        JSON.stringify({ title: 'PRIVATE SERVICE A', description: 'Draft A' }),
        JSON.stringify({ title: 'Service A', description: 'Public A' }),
        true,
      ]);
      await pool.query(serviceInsert, [
        serviceB,
        10,
        1,
        JSON.stringify({ title: 'PRIVATE SERVICE B', description: 'Draft B' }),
        JSON.stringify({ title: 'Service B', description: 'Public B' }),
        true,
      ]);
      await pool.query(serviceInsert, [
        hiddenService,
        30,
        2,
        JSON.stringify({
          title: 'PRIVATE HIDDEN SERVICE',
          description: 'Hidden draft',
        }),
        JSON.stringify({ title: 'Hidden service', description: 'Not visible' }),
        false,
      ]);
      await pool.query(serviceInsert, [
        draftService,
        40,
        null,
        JSON.stringify({
          title: 'PRIVATE DRAFT SERVICE',
          description: 'Not published',
        }),
        null,
        false,
      ]);
      await pool.query(
        `insert into products (id, position, published_position, draft_payload, published_payload, published_visible, published_at)
         values ($1, 0, 0, $2::jsonb, $3::jsonb, true, now())`,
        [
          productId,
          JSON.stringify({
            name: 'PRIVATE PRODUCT',
            tagline: 'Draft',
            description: 'Draft',
          }),
          JSON.stringify({
            name: 'Product',
            tagline: 'Build well',
            description: 'Public product',
          }),
        ],
      );
      await pool.query(
        `insert into projects (id, position, published_position, draft_payload, published_payload, published_visible, published_at)
         values ($1, 0, 0, $2::jsonb, $3::jsonb, true, now())`,
        [
          projectId,
          JSON.stringify({ title: 'PRIVATE PROJECT', summary: 'Draft' }),
          JSON.stringify({ title: 'Project', summary: 'Public project' }),
        ],
      );
      await pool.query(
        `insert into team_members (id, position, published_position, draft_payload, published_payload, published_visible, published_at)
         values ($1, 0, 0, $2::jsonb, $3::jsonb, true, now())`,
        [
          teamId,
          JSON.stringify({ name: 'PRIVATE TEAM', role: 'Draft' }),
          JSON.stringify({ name: 'Public teammate', role: 'Engineer' }),
        ],
      );
      await pool.query(
        `insert into site_settings (id, draft_payload, published_payload, published_at)
         values (true, $1::jsonb, $2::jsonb, now())`,
        [
          JSON.stringify({
            companyName: 'PRIVATE SETTINGS',
            contactEmail: 'private@example.com',
          }),
          JSON.stringify({
            companyName: 'CodedDevs',
            contactEmail: 'hello@example.com',
          }),
        ],
      );
      const publishedAt = '2026-03-01T00:00:00.000Z';
      const publishedArticles = [
        {
          id: olderArticle,
          draftSlug: 'draft-older',
          slug: 'older-live',
          title: 'Older article',
          publishedAt: '2026-02-01T00:00:00.000Z',
        },
        {
          id: lowerTieId,
          draftSlug: 'draft-lower',
          slug: 'lower-tie-live',
          title: 'Lower UUID article',
          publishedAt,
        },
        {
          id: higherTieId,
          draftSlug: 'draft-higher',
          slug: 'higher-tie-live',
          title: 'Higher UUID article',
          publishedAt,
        },
      ];
      for (const article of publishedArticles) {
        await pool.query(
          `insert into articles (id, draft_slug, published_slug, draft_payload, published_payload, published_at)
           values ($1, $2, $3, $4::jsonb, $5::jsonb, $6)`,
          [
            article.id,
            article.draftSlug,
            article.slug,
            JSON.stringify({
              title: `PRIVATE ${article.title}`,
              excerpt: 'Draft',
              body: 'Draft body',
            }),
            JSON.stringify({
              title: article.title,
              excerpt: `Summary ${article.title}`,
              body: `Body ${article.title}`,
            }),
            article.publishedAt,
          ],
        );
      }
      await pool.query(
        `insert into articles (id, draft_slug, draft_payload)
         values ($1, 'only-a-draft', $2::jsonb)`,
        [
          draftArticle,
          JSON.stringify({
            title: 'PRIVATE DRAFT ARTICLE',
            excerpt: 'Secret',
            body: 'Secret',
          }),
        ],
      );

      await withApi(publicDatabaseUrl!, async (baseUrl) => {
        const siteResponse = await fetch(`${baseUrl}/api/v1/public/site`);
        assert.equal(siteResponse.status, 200);
        assert.equal(
          siteResponse.headers.get('cache-control'),
          'public, max-age=0, must-revalidate',
        );
        const site = (await siteResponse.json()) as {
          products: unknown[];
          projects: unknown[];
          sections: Array<{ position: number }>;
          services: Array<{ id: string }>;
          settings: unknown;
          team: unknown[];
        };
        assert.deepEqual(Object.keys(site).sort(), [
          'products',
          'projects',
          'sections',
          'services',
          'settings',
          'team',
        ]);
        assert.deepEqual(
          site.services.map((item: { id: string }) => item.id),
          [serviceA, serviceB],
        );
        assert.equal(site.sections[0]?.position, 0);
        const firstPageResponse = await fetch(
          `${baseUrl}/api/v1/public/articles?page=1&limit=2`,
        );
        const secondPageResponse = await fetch(
          `${baseUrl}/api/v1/public/articles?page=2&limit=2`,
        );
        assert.equal(firstPageResponse.status, 200);
        assert.equal(
          firstPageResponse.headers.get('cache-control'),
          siteResponse.headers.get('cache-control'),
        );
        const firstPage = (await firstPageResponse.json()) as {
          items: Array<{ id: string }>;
          total: number;
          page: number;
          pageSize: number;
          totalPages: number;
        };
        const secondPage = (await secondPageResponse.json()) as {
          items: Array<{ id: string }>;
        };
        assert.deepEqual(
          firstPage.items.map((item: { id: string }) => item.id),
          [higherTieId, lowerTieId],
        );
        assert.deepEqual(
          secondPage.items.map((item: { id: string }) => item.id),
          [olderArticle],
        );
        assert.deepEqual(
          [
            firstPage.total,
            firstPage.page,
            firstPage.pageSize,
            firstPage.totalPages,
          ],
          [3, 1, 2, 2],
        );
        for (const invalidPath of [
          '/api/v1/public/articles?page=1&limit=51',
          '/api/v1/public/articles?page=0',
          '/api/v1/public/articles?unexpected=1',
        ]) {
          const invalid = await fetch(`${baseUrl}${invalidPath}`);
          assert.equal(invalid.status, 400);
          assert.equal(invalid.headers.get('cache-control'), 'no-store');
        }

        const detailResponse = await fetch(
          `${baseUrl}/api/v1/public/articles/higher-tie-live`,
        );
        assert.equal(detailResponse.status, 200);
        assert.match(
          detailResponse.headers.get('cache-control') ?? '',
          /public/,
        );
        const detail = (await detailResponse.json()) as {
          article: { slug: string; content: string };
        };
        assert.equal(detail.article.slug, 'higher-tie-live');
        assert.equal(detail.article.content, 'Body Higher UUID article');
        for (const slug of ['missing-live', 'only-a-draft', 'Bad Slug']) {
          const missing = await fetch(
            `${baseUrl}/api/v1/public/articles/${encodeURIComponent(slug)}`,
          );
          assert.equal(missing.status, 404);
          assert.equal(missing.headers.get('cache-control'), 'no-store');
          assert.deepEqual(await missing.json(), {
            error: 'Content not found',
            code: 'CONTENT_NOT_FOUND',
          });
        }

        await pool.query(
          `update services set position = 1, draft_payload = $2::jsonb where id = $1`,
          [
            serviceB,
            JSON.stringify({
              title: 'PRIVATE SERVICE B EDITED',
              description: 'Edited draft',
            }),
          ],
        );
        await pool.query(
          `update articles set draft_slug = 'renamed-draft', draft_payload = $2::jsonb where id = $1`,
          [
            higherTieId,
            JSON.stringify({
              title: 'PRIVATE EDITED ARTICLE',
              excerpt: 'Draft edit',
              body: 'Draft edit',
            }),
          ],
        );
        const afterDraftEdits = (await (
          await fetch(`${baseUrl}/api/v1/public/site`)
        ).json()) as { services: Array<{ id: string }> };
        assert.deepEqual(afterDraftEdits.services, site.services);
        const afterArticleEdits = (await (
          await fetch(`${baseUrl}/api/v1/public/articles?page=1&limit=2`)
        ).json()) as { items: Array<{ id: string }> };
        assert.deepEqual(
          afterArticleEdits.items.map((item: { id: string }) => item.id),
          [higherTieId, lowerTieId],
        );
        assert.equal(
          JSON.stringify([site, firstPage, detail]).includes('PRIVATE'),
          false,
        );

        await pool.query(
          `update articles set published_slug = null, published_payload = null, published_at = null where id = $1`,
          [higherTieId],
        );
        const unpublished = await fetch(
          `${baseUrl}/api/v1/public/articles/higher-tie-live`,
        );
        assert.equal(unpublished.status, 404);
        assert.equal(unpublished.headers.get('cache-control'), 'no-store');
        const afterUnpublish = (await (
          await fetch(`${baseUrl}/api/v1/public/articles?page=1&limit=10`)
        ).json()) as { items: Array<{ id: string }> };
        assert.equal(
          afterUnpublish.items.some(
            (item: { id: string }) => item.id === higherTieId,
          ),
          false,
        );
      });

      const defaultTargets = await pool.query<{ targets: unknown }>(
        `insert into revalidation_jobs (resource_type) values ('site') returning targets`,
      );
      assert.deepEqual(defaultTargets.rows[0]?.targets, {
        paths: [],
        tags: [],
      });
      for (const invalidTargets of [
        {},
        { tags: [] },
        { paths: [] },
        { paths: [], tags: [], extra: [] },
        { paths: {}, tags: [] },
        { paths: [], tags: {} },
      ]) {
        await assert.rejects(
          pool.query(
            `insert into revalidation_jobs (resource_type, targets) values ('site', $1::jsonb)`,
            [JSON.stringify(invalidTargets)],
          ),
          /revalidation_jobs_targets_shape/,
        );
      }
    } finally {
      await pool.end();
    }
  },
);
