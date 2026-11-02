import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const openApiPath = fileURLToPath(
  new URL('../../../../docs/openapi/content.json', import.meta.url),
);

type Operation = {
  security?: Array<Record<string, string[]>>;
  parameters?: Array<{ $ref?: string }>;
  requestBody?: {
    $ref?: string;
    required?: boolean;
    content?: { 'application/json'?: { schema?: { $ref?: string } } };
  };
  responses?: Record<
    string,
    {
      $ref?: string;
      content?: { 'application/json'?: { schema?: { $ref?: string } } };
    }
  >;
};

test('content OpenAPI fragment matches the implemented content and publication routes', async () => {
  const document = JSON.parse(await readFile(openApiPath, 'utf8')) as {
    openapi: string;
    paths: Record<string, Record<string, Operation>>;
    components: {
      schemas: Record<
        string,
        {
          required?: string[];
          additionalProperties?: boolean;
          unevaluatedProperties?: boolean;
        }
      >;
      parameters: Record<
        string,
        { required?: boolean; schema?: { const?: string } }
      >;
      securitySchemes: Record<string, { in?: string; name?: string }>;
    };
  };

  assert.equal(document.openapi, '3.1.0');
  assert.deepEqual(Object.keys(document.paths).sort(), [
    '/api/v1/admin/articles',
    '/api/v1/admin/articles/{id}',
    '/api/v1/admin/articles/{id}/preview',
    '/api/v1/admin/articles/{id}/publish',
    '/api/v1/admin/articles/{id}/unpublish',
    '/api/v1/admin/content/sections',
    '/api/v1/admin/content/sections/publish-all',
    '/api/v1/admin/content/sections/reorder',
    '/api/v1/admin/content/sections/{key}/draft',
    '/api/v1/admin/content/sections/{key}/publish',
    '/api/v1/admin/content/sections/{key}/unpublish',
    '/api/v1/admin/content/sections/{key}/visibility',
    '/api/v1/admin/content/{collection}',
    '/api/v1/admin/content/{collection}/reorder',
    '/api/v1/admin/content/{collection}/{id}',
    '/api/v1/admin/content/{collection}/{id}/draft',
    '/api/v1/admin/content/{collection}/{id}/publish',
    '/api/v1/admin/content/{collection}/{id}/unpublish',
    '/api/v1/admin/content/{collection}/{id}/visibility',
    '/api/v1/admin/revalidation-jobs',
    '/api/v1/admin/revalidation-jobs/{id}/retry',
    '/api/v1/admin/settings',
    '/api/v1/admin/settings/draft',
    '/api/v1/admin/settings/publish',
    '/api/v1/admin/settings/unpublish',
    '/api/v1/public/articles',
    '/api/v1/public/articles/{slug}',
    '/api/v1/public/site',
  ]);
  const operations = Object.fromEntries(
    Object.entries(document.paths).map(([path, methods]) => [
      path,
      Object.keys(methods).sort(),
    ]),
  );
  assert.deepEqual(operations, {
    '/api/v1/admin/articles': ['get', 'post'],
    '/api/v1/admin/articles/{id}': ['delete', 'get', 'put'],
    '/api/v1/admin/articles/{id}/preview': ['get'],
    '/api/v1/admin/articles/{id}/publish': ['post'],
    '/api/v1/admin/articles/{id}/unpublish': ['post'],
    '/api/v1/admin/content/sections': ['get'],
    '/api/v1/admin/content/sections/publish-all': ['post'],
    '/api/v1/admin/content/sections/reorder': ['post'],
    '/api/v1/admin/content/sections/{key}/draft': ['put'],
    '/api/v1/admin/content/sections/{key}/publish': ['post'],
    '/api/v1/admin/content/sections/{key}/unpublish': ['post'],
    '/api/v1/admin/content/sections/{key}/visibility': ['put'],
    '/api/v1/admin/content/{collection}': ['get', 'post'],
    '/api/v1/admin/content/{collection}/reorder': ['post'],
    '/api/v1/admin/content/{collection}/{id}': ['delete'],
    '/api/v1/admin/content/{collection}/{id}/draft': ['put'],
    '/api/v1/admin/content/{collection}/{id}/publish': ['post'],
    '/api/v1/admin/content/{collection}/{id}/unpublish': ['post'],
    '/api/v1/admin/content/{collection}/{id}/visibility': ['put'],
    '/api/v1/admin/revalidation-jobs': ['get'],
    '/api/v1/admin/revalidation-jobs/{id}/retry': ['post'],
    '/api/v1/admin/settings': ['get'],
    '/api/v1/admin/settings/draft': ['put'],
    '/api/v1/admin/settings/publish': ['post'],
    '/api/v1/admin/settings/unpublish': ['post'],
    '/api/v1/public/articles': ['get'],
    '/api/v1/public/articles/{slug}': ['get'],
    '/api/v1/public/site': ['get'],
  });

  assert.equal(document.components.securitySchemes.AdminSession?.in, 'cookie');
  assert.equal(
    document.components.securitySchemes.AdminSession?.name,
    '__Host-codeddevs-admin-session',
  );
  assert.equal(document.components.parameters.Csrf?.required, true);
  assert.equal(document.components.parameters.Csrf?.schema?.const, '1');

  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (path.startsWith('/api/v1/public/')) {
        assert.equal(operation.security, undefined, `${method} ${path}`);
        continue;
      }
      assert.deepEqual(
        operation.security,
        [{ AdminSession: [] }],
        `${method} ${path}`,
      );
      if (['post', 'put', 'delete'].includes(method)) {
        assert.deepEqual(
          operation.parameters
            ?.map((parameter) => parameter.$ref)
            .filter((reference) =>
              [
                '#/components/parameters/Origin',
                '#/components/parameters/Csrf',
              ].includes(reference ?? ''),
            ),
          ['#/components/parameters/Origin', '#/components/parameters/Csrf'],
          `${method} ${path}`,
        );
      }
    }
  }

  const requestBodyRefs = Object.fromEntries(
    Object.entries(document.paths).flatMap(([path, methods]) =>
      Object.entries(methods).flatMap(([method, operation]) =>
        operation.requestBody?.$ref
          ? [[`${method.toUpperCase()} ${path}`, operation.requestBody.$ref]]
          : [],
      ),
    ),
  );
  assert.deepEqual(requestBodyRefs, {
    'POST /api/v1/admin/articles': '#/components/requestBodies/ArticleCreate',
    'PUT /api/v1/admin/articles/{id}':
      '#/components/requestBodies/ArticleUpdate',
    'POST /api/v1/admin/content/{collection}':
      '#/components/requestBodies/CollectionCreate',
    'POST /api/v1/admin/content/{collection}/reorder':
      '#/components/requestBodies/RecordOrder',
    'PUT /api/v1/admin/content/{collection}/{id}/draft':
      '#/components/requestBodies/RecordDraft',
    'PUT /api/v1/admin/content/{collection}/{id}/visibility':
      '#/components/requestBodies/Visibility',
    'PUT /api/v1/admin/content/sections/{key}/draft':
      '#/components/requestBodies/SectionDraft',
    'PUT /api/v1/admin/content/sections/{key}/visibility':
      '#/components/requestBodies/Visibility',
    'POST /api/v1/admin/content/sections/reorder':
      '#/components/requestBodies/SectionOrder',
    'PUT /api/v1/admin/settings/draft':
      '#/components/requestBodies/SettingsDraft',
  });

  const expectedPublishResponses = {
    '/api/v1/admin/content/sections/publish-all': [
      '200',
      '400',
      '401',
      '403',
      '503',
    ],
    '/api/v1/admin/content/sections/{key}/publish': [
      '200',
      '400',
      '401',
      '403',
      '404',
      '503',
    ],
    '/api/v1/admin/content/{collection}/{id}/publish': [
      '200',
      '400',
      '401',
      '403',
      '404',
      '503',
    ],
    '/api/v1/admin/settings/publish': [
      '200',
      '400',
      '401',
      '403',
      '404',
      '503',
    ],
    '/api/v1/admin/articles/{id}/publish': [
      '200',
      '400',
      '401',
      '403',
      '404',
      '409',
      '503',
    ],
  } as const;
  for (const [path, expected] of Object.entries(expectedPublishResponses)) {
    assert.deepEqual(
      Object.keys(document.paths[path]?.post?.responses ?? {}).sort(),
      [...expected].sort(),
      `POST ${path}`,
    );
  }

  const articleCreateSchema = document.components.schemas.ArticleCreate;
  assert.ok(articleCreateSchema);
  assert.deepEqual(articleCreateSchema.required, [
    'title',
    'slug',
    'excerpt',
    'body',
  ]);
  assert.equal(articleCreateSchema.unevaluatedProperties, false);
  const publicArticleSchema = document.components.schemas.PublicArticle;
  assert.ok(publicArticleSchema);
  assert.deepEqual(publicArticleSchema.required, [
    'id',
    'slug',
    'title',
    'summary',
    'content',
    'publishedAt',
  ]);
  assert.ok(document.components.schemas.RevalidationJob);
  assert.ok(document.components.schemas.SiteSettings);
  const responseSchema = (path: string, method: string, status: string) =>
    document.paths[path]?.[method]?.responses?.[status]?.content?.[
      'application/json'
    ]?.schema?.$ref;
  assert.equal(
    responseSchema('/api/v1/public/site', 'get', '200'),
    '#/components/schemas/PublishedSite',
  );
  assert.equal(
    responseSchema('/api/v1/public/articles', 'get', '200'),
    '#/components/schemas/PublishedArticlePage',
  );
  assert.equal(
    responseSchema('/api/v1/admin/articles', 'get', '200'),
    '#/components/schemas/AdminArticlePage',
  );
  assert.equal(
    responseSchema('/api/v1/admin/settings', 'get', '200'),
    '#/components/schemas/AdminSettingsResponse',
  );
  assert.equal(
    responseSchema('/api/v1/admin/revalidation-jobs', 'get', '200'),
    '#/components/schemas/RevalidationJobPage',
  );
});
