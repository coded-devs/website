import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createDatabase } from '../db/client.js';
import { articles, services } from '../db/schema.js';
import { runMigrations } from '../db/migrator.js';
import { createDrizzleContentRepository } from './repository.js';

const databaseUrl = process.env.CONTENT_TEST_DATABASE_URL;
const testDatabaseName = 'cod316_content_repo_m1_test';

function assertDisposableLoopbackDatabase(value: string): void {
  const url = new URL(value);
  assert.ok(
    ['127.0.0.1', '::1', 'localhost'].includes(url.hostname),
    'database must be bound to loopback',
  );
  assert.equal(
    decodeURIComponent(url.pathname.slice(1)),
    testDatabaseName,
    'database name must identify the disposable COD-316 test database',
  );
}

test(
  'PostgreSQL16 repository returns deterministic published reads without draft data',
  { skip: !databaseUrl },
  async () => {
    assertDisposableLoopbackDatabase(databaseUrl!);
    await runMigrations(databaseUrl!);
    const { db, pool } = createDatabase(databaseUrl!);
    const articleId = randomUUID();
    const tieArticleIds = [
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    ];
    const serviceId = randomUUID();
    const position = 2_000_000;
    try {
      const version = await pool.query<{ server_version: string }>(
        'show server_version',
      );
      assert.match(version.rows[0]?.server_version ?? '', /^16\./);
      await db.insert(services).values({
        id: serviceId,
        position,
        publishedPosition: position,
        draftVisible: true,
        publishedVisible: true,
        draftPayload: {
          title: 'Private draft service',
          description: 'Draft only',
        },
        publishedPayload: {
          title: 'Live service',
          description: 'Public description',
        },
        publishedAt: new Date('2026-01-02T00:00:00.000Z'),
      });
      await db.insert(articles).values({
        id: articleId,
        draftSlug: `draft-${articleId}`,
        publishedSlug: `live-${articleId}`,
        draftPayload: {
          title: 'Private draft article',
          excerpt: 'Secret',
          body: 'Secret',
        },
        publishedPayload: {
          title: 'Live article',
          excerpt: 'Public summary',
          body: 'Public body',
        },
        publishedAt: new Date('2026-01-03T00:00:00.000Z'),
      });
      await db.insert(articles).values(
        tieArticleIds.map((id, index) => ({
          id,
          draftSlug: `draft-tie-${index}`,
          publishedSlug: `live-tie-${index}`,
          draftPayload: {
            title: 'Private tie draft',
            excerpt: 'Secret',
            body: 'Secret',
          },
          publishedPayload: {
            title: `Tie article ${index}`,
            excerpt: 'Public summary',
            body: 'Public body',
          },
          publishedAt: new Date('2026-02-01T00:00:00.000Z'),
        })),
      );

      const repository = createDrizzleContentRepository(db);
      const site = await repository.getPublishedSite();
      assert.ok(
        site.services.some(
          (service) =>
            service.id === serviceId &&
            service.payload.title === 'Live service',
        ),
      );
      assert.equal(JSON.stringify(site).includes('Private draft'), false);
      const page = await repository.listPublishedArticles({
        page: 1,
        limit: 2,
      });
      assert.equal(page.page, 1);
      assert.equal(page.pageSize, 2);
      assert.deepEqual(
        page.items.map((item) => item.id),
        [...tieArticleIds].reverse(),
        'articles with equal published_at are ordered by id descending',
      );
      const found = await repository.getPublishedArticle(`live-${articleId}`);
      assert.equal(found?.title, 'Live article');
      assert.equal(
        await repository.getPublishedArticle(`draft-${articleId}`),
        null,
      );
      assert.equal(JSON.stringify(found).includes('draft'), false);
    } finally {
      await db
        .delete(articles)
        .where(
          (await import('drizzle-orm')).inArray(articles.id, tieArticleIds),
        );
      await db
        .delete(articles)
        .where((await import('drizzle-orm')).eq(articles.id, articleId));
      await db
        .delete(services)
        .where((await import('drizzle-orm')).eq(services.id, serviceId));
      await pool.end();
    }
  },
);
