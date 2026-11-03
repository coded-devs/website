import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import { Pool } from 'pg';
import { AUTH_CSRF_HEADER, AUTH_CSRF_VALUE } from '@codeddevs/auth-contract';
import { getSessionCookiePolicy } from '../auth/policy.js';
import { createApp } from '../app.js';
import { parseApiEnvironment } from '../config/env.js';
import { runMigrations } from '../db/migrator.js';

const databaseUrl = process.env.ARTICLES_M4_TEST_DATABASE_URL;
const databaseName = 'cod316_articles_m4_test';
const adminOrigin = 'http://localhost:3001';
const mediaBaseUrl = 'https://cdn.example.test/assets/';
const sessionToken = randomBytes(32).toString('base64url');
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
let adminUserId: string;

type ArticleRecord = {
  id: string;
  status: 'draft' | 'published';
  publishedSlug: string | null;
  draftPayload: { title: string; excerpt: string; body: string };
  publishedPayload: { title: string; excerpt: string; body: string } | null;
};
type AdminArticleResponse = { article: ArticleRecord };
type PublicArticleResponse = {
  article: {
    slug: string;
    title: string;
    summary: string;
    content: string;
    publishedAt: string;
  };
};
type ArticleListResponse = {
  items: ArticleRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function assertDisposableDatabase(value: string) {
  const url = new URL(value);
  assert.ok(['127.0.0.1', '::1', 'localhost'].includes(url.hostname));
  assert.equal(decodeURIComponent(url.pathname.slice(1)), databaseName);
}

before(async () => {
  if (!databaseUrl || !pool) return;
  assertDisposableDatabase(databaseUrl);
  await runMigrations(databaseUrl);
  const existingAdmin = await pool.query<{ id: string }>(
    'select id from admin_users where is_super_admin = true limit 1',
  );
  adminUserId = existingAdmin.rows[0]?.id ?? randomUUID();
  if (!existingAdmin.rows[0]) {
    await pool.query(
      `insert into admin_users (id, email, password_hash)
       values ($1, $2, 'fixture-hash-not-used-for-auth')`,
      [adminUserId, `cod316-m4-${adminUserId}@codeddevs.test`],
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

const article = (slug: string, title = 'A Test Article') => ({
  title,
  slug,
  excerpt: 'A concise summary',
  body: 'The full article body.',
});

test(
  'article admin API enforces session, publishes snapshots atomically, filters, paginates, and never leaks drafts',
  { skip: !databaseUrl },
  async () => {
    assert.ok(databaseUrl && pool);
    await pool.query('delete from articles');
    await pool.query(
      'delete from audit_events where actor_admin_user_id = $1',
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
    const server = createApp({
      databaseUrl,
      environment,
    }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const cookieName = getSessionCookiePolicy('test').name;
    const cookie = `${cookieName}=${sessionToken}`;
    let mediaKeys: string[] = [];
    const send = (
      path: string,
      method = 'GET',
      body?: unknown,
      options: { origin?: string; csrf?: boolean; contentType?: string } = {},
    ) =>
      fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          Cookie: cookie,
          ...(options.origin === ''
            ? {}
            : { Origin: options.origin ?? adminOrigin }),
          ...(options.csrf === false
            ? {}
            : { [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE }),
          ...(options.contentType === ''
            ? {}
            : { 'Content-Type': options.contentType ?? 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    try {
      assert.equal(
        (await fetch(`${baseUrl}/api/v1/admin/articles`)).status,
        401,
      );
      assert.equal(
        (await fetch(`${baseUrl}/api/v1/admin/articles/not-an-id/preview`, {}))
          .status,
        401,
      );

      const initial = await send('/api/v1/admin/articles');
      assert.equal(initial.status, 200);
      assert.equal(initial.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await initial.json(), {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
      for (const invalidQuery of [
        '?status=archived',
        '?page=0',
        '?limit=51',
        `?search=${'x'.repeat(201)}`,
        '?unexpected=true',
      ]) {
        assert.equal(
          (await send(`/api/v1/admin/articles${invalidQuery}`)).status,
          400,
        );
      }

      mediaKeys = [`media/${randomUUID()}.png`, `media/${randomUUID()}.webp`];
      await pool.query(
        `insert into media_assets
          (object_key, mime_type, byte_size, created_by_admin_user_id)
         values ($1, 'image/png', 128, $3), ($2, 'image/webp', 96, $3)`,
        [...mediaKeys, adminUserId],
      );
      const mediaUrl = (objectKey: string) => `${mediaBaseUrl}${objectKey}`;
      const draftInput = {
        ...article('cod316-m4-draft', 'Draft Headline'),
        coverImage: mediaUrl(mediaKeys[0]!),
      };
      assert.equal(
        (
          await send('/api/v1/admin/articles', 'POST', {
            ...draftInput,
            unexpected: true,
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await send(`/api/v1/admin/articles/${randomUUID()}/publish`, 'POST', {
            unexpected: true,
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await send('/api/v1/admin/articles', 'POST', draftInput, {
            origin: 'https://evil.example',
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await send('/api/v1/admin/articles', 'POST', draftInput, {
            csrf: false,
          })
        ).status,
        403,
      );

      const created = await send('/api/v1/admin/articles', 'POST', draftInput);
      assert.equal(created.status, 201);
      const createdBody = (await created.json()) as {
        article: ArticleRecord;
      };
      const draftId = createdBody.article.id;
      const refsFor = async (snapshot: 'draft' | 'published') => {
        const result = await pool.query<{
          object_key: string;
          field_key: string;
          position: number;
        }>(
          `select a.object_key, r.field_key, r.position
           from media_asset_references r
           join media_assets a on a.id = r.media_asset_id
           where r.article_id = $1 and r.snapshot = $2
           order by r.field_key, r.position`,
          [draftId, snapshot],
        );
        return result.rows;
      };
      assert.deepEqual(await refsFor('draft'), [
        { object_key: mediaKeys[0], field_key: 'coverImage', position: 0 },
      ]);
      assert.deepEqual(await refsFor('published'), []);
      assert.equal(createdBody.article.status, 'draft');
      assert.equal(createdBody.article.publishedPayload, null);
      assert.equal(
        (await fetch(`${baseUrl}/api/v1/public/articles/cod316-m4-draft`))
          .status,
        404,
      );

      const preview = await send(`/api/v1/admin/articles/${draftId}/preview`);
      assert.equal(preview.status, 200);
      assert.equal(preview.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await preview.json(), {
        article: {
          id: draftId,
          slug: 'cod316-m4-draft',
          title: 'Draft Headline',
          summary: 'A concise summary',
          content: 'The full article body.',
          publishedAt: null,
          coverImage: { url: mediaUrl(mediaKeys[0]!) },
        },
      });

      const updated = await send(`/api/v1/admin/articles/${draftId}`, 'PUT', {
        ...article('cod316-m4-draft-renamed', 'Published Headline'),
        coverImage: mediaUrl(mediaKeys[1]!),
      });
      assert.equal(updated.status, 200);
      assert.deepEqual(await refsFor('draft'), [
        { object_key: mediaKeys[1], field_key: 'coverImage', position: 0 },
      ]);
      const published = await send(
        `/api/v1/admin/articles/${draftId}/publish`,
        'POST',
      );
      assert.equal(published.status, 200);
      assert.equal(
        ((await published.json()) as AdminArticleResponse).article
          .publishedSlug,
        'cod316-m4-draft-renamed',
      );
      assert.deepEqual(await refsFor('published'), [
        { object_key: mediaKeys[1], field_key: 'coverImage', position: 0 },
      ]);
      const publicBeforeEdit = await fetch(
        `${baseUrl}/api/v1/public/articles/cod316-m4-draft-renamed`,
      );
      assert.equal(publicBeforeEdit.status, 200);
      const publicSnapshot = (
        (await publicBeforeEdit.json()) as PublicArticleResponse
      ).article;
      assert.equal(publicSnapshot.title, 'Published Headline');

      await send(
        `/api/v1/admin/articles/${draftId}`,
        'PUT',
        article('cod316-m4-draft-edited', 'Edited but not republished'),
      );
      assert.deepEqual(await refsFor('draft'), []);
      assert.deepEqual(await refsFor('published'), [
        { object_key: mediaKeys[1], field_key: 'coverImage', position: 0 },
      ]);
      const publicAfterEdit = await fetch(
        `${baseUrl}/api/v1/public/articles/cod316-m4-draft-renamed`,
      );
      assert.equal(
        ((await publicAfterEdit.json()) as PublicArticleResponse).article.title,
        'Published Headline',
      );
      const unpublish = await send(
        `/api/v1/admin/articles/${draftId}/unpublish`,
        'POST',
      );
      assert.equal(unpublish.status, 200);
      assert.equal(
        ((await unpublish.json()) as AdminArticleResponse).article
          .publishedSlug,
        null,
      );
      assert.deepEqual(await refsFor('published'), []);
      assert.equal(
        (
          await fetch(
            `${baseUrl}/api/v1/public/articles/cod316-m4-draft-renamed`,
          )
        ).status,
        404,
      );

      const immediate = await send('/api/v1/admin/articles', 'POST', {
        ...article('cod316-m4-immediate', 'Immediate Article'),
        publishImmediately: true,
      });
      assert.equal(immediate.status, 201);
      const immediateArticle = (
        (await immediate.json()) as AdminArticleResponse
      ).article;
      assert.equal(immediateArticle.status, 'published');
      const immediateAudits = await pool.query<{
        event_type: string;
        target_type: string;
        target_id: string;
        metadata: { operation: string };
      }>(
        `select event_type, target_type, target_id, metadata
         from audit_events where actor_admin_user_id = $1 and target_id = $2
        `,
        [adminUserId, immediateArticle.id],
      );
      assert.equal(immediateAudits.rows.length, 2);
      assert.deepEqual(
        Object.fromEntries(
          immediateAudits.rows.map((event) => [
            event.event_type,
            { targetType: event.target_type, metadata: event.metadata },
          ]),
        ),
        {
          'content.save_draft': {
            targetType: 'article',
            metadata: { operation: 'create' },
          },
          'content.publish': {
            targetType: 'article',
            metadata: { operation: 'update' },
          },
        },
      );
      assert.ok(
        immediateAudits.rows.every(
          (event) => event.target_id === immediateArticle.id,
        ),
      );
      assert.doesNotMatch(
        JSON.stringify(immediateAudits.rows),
        /Immediate Article|A concise summary|The full article body\./,
      );
      assert.equal(
        (
          await send(
            '/api/v1/admin/articles',
            'POST',
            article('cod316-m4-immediate', 'Global slug conflict'),
          )
        ).status,
        409,
      );

      const list = await send(
        '/api/v1/admin/articles?search=Immediate&status=published&page=1&limit=1',
      );
      const searched = (await list.json()) as ArticleListResponse;
      assert.deepEqual(
        Object.keys(searched).sort(),
        ['items', 'limit', 'page', 'total', 'totalPages'].sort(),
      );
      assert.equal(searched.total, 1);
      assert.equal(searched.items[0]!.draftPayload.title, 'Immediate Article');
      const allPublished = await send(
        '/api/v1/admin/articles?status=published&page=1&limit=1',
      );
      const pageData = (await allPublished.json()) as ArticleListResponse;
      assert.equal(pageData.limit, 1);
      assert.equal(pageData.total, 1);
      assert.equal(pageData.items[0]!.draftPayload.title, 'Immediate Article');

      const duplicatePayload = article('cod316-m4-race', 'Race Article');
      const duplicateResponses = await Promise.all([
        send('/api/v1/admin/articles', 'POST', duplicatePayload),
        send('/api/v1/admin/articles', 'POST', duplicatePayload),
      ]);
      assert.deepEqual(
        duplicateResponses.map((response) => response.status).sort(),
        [201, 409],
      );
      assert.deepEqual(
        await duplicateResponses
          .find((response) => response.status === 409)
          ?.json(),
        { error: 'Content conflict', code: 'CONTENT_CONFLICT' },
      );
      const raceArticle = (
        (await duplicateResponses
          .find((response) => response.status === 201)!
          .json()) as AdminArticleResponse
      ).article;
      const concurrentPublish = await Promise.all([
        send(`/api/v1/admin/articles/${raceArticle.id}/publish`, 'POST'),
        send(`/api/v1/admin/articles/${raceArticle.id}/publish`, 'POST'),
      ]);
      assert.deepEqual(
        concurrentPublish.map(({ status }) => status),
        [200, 200],
      );
      const publishedRace = await fetch(
        `${baseUrl}/api/v1/public/articles/cod316-m4-race`,
      );
      assert.equal(publishedRace.status, 200);
      const racePublicArticle = (
        (await publishedRace.json()) as PublicArticleResponse
      ).article;
      assert.equal(racePublicArticle.title, 'Race Article');
      assert.equal(
        JSON.stringify(racePublicArticle).includes('draftPayload'),
        false,
      );

      await pool.query(`create function cod316_m4_fail_article_audit() returns trigger
        language plpgsql as $$ begin
          if new.target_type = 'article' and new.event_type = 'content.save_draft' then
            raise exception 'injected article audit failure';
          end if;
          return new;
        end $$`);
      await pool.query(`create trigger cod316_m4_fail_article_audit_trigger
        before insert on audit_events for each row execute function cod316_m4_fail_article_audit()`);
      try {
        const failedCreate = await send(
          '/api/v1/admin/articles',
          'POST',
          article('cod316-m4-audit-rollback', 'Audit rollback'),
        );
        assert.equal(failedCreate.status, 503);
        assert.deepEqual(await failedCreate.json(), {
          error: 'Service unavailable',
          code: 'CONTENT_UNAVAILABLE',
        });
        assert.equal(
          (
            await pool.query('select 1 from articles where draft_slug = $1', [
              'cod316-m4-audit-rollback',
            ])
          ).rowCount,
          0,
        );
      } finally {
        await pool.query(
          'drop trigger cod316_m4_fail_article_audit_trigger on audit_events',
        );
        await pool.query('drop function cod316_m4_fail_article_audit()');
      }

      const auditCountsBeforePublishFailure = await pool.query<{
        save_draft: number;
        publish: number;
      }>(
        `select
           count(*) filter (where event_type = 'content.save_draft')::int as save_draft,
           count(*) filter (where event_type = 'content.publish')::int as publish
         from audit_events where actor_admin_user_id = $1 and target_type = 'article'`,
        [adminUserId],
      );
      await pool.query(`create function cod316_m4_fail_publish_audit() returns trigger
        language plpgsql as $$ begin
          if new.target_type = 'article' and new.event_type = 'content.publish' then
            raise exception 'injected article publish audit failure';
          end if;
          return new;
        end $$`);
      await pool.query(`create trigger cod316_m4_fail_publish_audit_trigger
        before insert on audit_events for each row execute function cod316_m4_fail_publish_audit()`);
      try {
        const failedImmediatePublish = await send(
          '/api/v1/admin/articles',
          'POST',
          {
            ...article(
              'cod316-m4-publish-audit-rollback',
              'Publish audit secret',
            ),
            publishImmediately: true,
          },
        );
        assert.equal(failedImmediatePublish.status, 503);
        assert.deepEqual(await failedImmediatePublish.json(), {
          error: 'Service unavailable',
          code: 'CONTENT_UNAVAILABLE',
        });
        assert.equal(
          (
            await pool.query('select 1 from articles where draft_slug = $1', [
              'cod316-m4-publish-audit-rollback',
            ])
          ).rowCount,
          0,
        );
        const auditCountsAfterPublishFailure = await pool.query(
          `select
             count(*) filter (where event_type = 'content.save_draft')::int as save_draft,
             count(*) filter (where event_type = 'content.publish')::int as publish
           from audit_events where actor_admin_user_id = $1 and target_type = 'article'`,
          [adminUserId],
        );
        assert.deepEqual(
          auditCountsAfterPublishFailure.rows[0],
          auditCountsBeforePublishFailure.rows[0],
        );
      } finally {
        await pool.query(
          'drop trigger cod316_m4_fail_publish_audit_trigger on audit_events',
        );
        await pool.query('drop function cod316_m4_fail_publish_audit()');
      }

      const deleted = await send(
        `/api/v1/admin/articles/${draftId}`,
        'DELETE',
        { rejected: true },
      );
      assert.equal(deleted.status, 400);
      const actualDelete = await send(
        `/api/v1/admin/articles/${draftId}`,
        'DELETE',
      );
      assert.equal(actualDelete.status, 204);
      assert.equal(await actualDelete.text(), '');
      assert.equal(
        (await send(`/api/v1/admin/articles/${draftId}`)).status,
        404,
      );
    } finally {
      server.close();
      await once(server, 'close');
      await pool.query(
        `delete from media_asset_references
         where media_asset_id in (
           select id from media_assets where object_key = any($1::text[])
         )`,
        [mediaKeys],
      );
      await pool.query(
        'delete from media_assets where object_key = any($1::text[])',
        [mediaKeys],
      );
    }
  },
);
