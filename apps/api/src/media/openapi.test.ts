import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const openApiPath = fileURLToPath(
  new URL('../../../../docs/openapi/media.json', import.meta.url),
);

type Operation = {
  security?: Array<Record<string, string[]>>;
  parameters?: Array<{ $ref?: string }>;
  requestBody?: {
    $ref?: string;
    content?: Record<string, { schema?: { $ref?: string } }>;
  };
  responses?: Record<string, { $ref?: string }>;
};

test('media OpenAPI fragment describes only the implemented Admin media routes', async () => {
  const document = JSON.parse(await readFile(openApiPath, 'utf8')) as {
    openapi: string;
    paths: Record<string, Record<string, Operation>>;
    components: {
      securitySchemes: Record<string, { in?: string; name?: string }>;
      parameters: Record<
        string,
        { required?: boolean; schema?: { const?: string } }
      >;
      requestBodies: Record<
        string,
        {
          required?: boolean;
          content?: Record<string, { schema?: { $ref?: string } }>;
        }
      >;
      schemas: Record<
        string,
        {
          required?: string[];
          properties?: Record<string, unknown>;
          additionalProperties?: boolean;
        }
      >;
    };
  };

  assert.equal(document.openapi, '3.1.0');
  assert.deepEqual(Object.keys(document.paths).sort(), [
    '/api/v1/admin/media',
    '/api/v1/admin/media/upload',
    '/api/v1/admin/media/{id}',
    '/api/v1/admin/media/{id}/alt-text',
    '/api/v1/admin/media/{id}/replace',
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(document.paths).map(([path, methods]) => [
        path,
        Object.keys(methods).sort(),
      ]),
    ),
    {
      '/api/v1/admin/media': ['get'],
      '/api/v1/admin/media/upload': ['post'],
      '/api/v1/admin/media/{id}': ['delete', 'get'],
      '/api/v1/admin/media/{id}/alt-text': ['put'],
      '/api/v1/admin/media/{id}/replace': ['post'],
    },
  );

  assert.equal(document.components.securitySchemes.AdminSession?.in, 'cookie');
  assert.equal(
    document.components.securitySchemes.AdminSession?.name,
    '__Host-codeddevs-admin-session',
  );
  assert.equal(document.components.parameters.Origin?.required, true);
  assert.equal(document.components.parameters.Csrf?.required, true);
  assert.equal(document.components.parameters.Csrf?.schema?.const, '1');

  for (const [path, methods] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      assert.deepEqual(
        operation.security,
        [{ AdminSession: [] }],
        `${method} ${path}`,
      );
      if (['post', 'put', 'delete'].includes(method)) {
        const references = operation.parameters?.map(
          (parameter) => parameter.$ref,
        );
        assert.ok(references?.includes('#/components/parameters/Origin'));
        assert.ok(references?.includes('#/components/parameters/Csrf'));
      }
    }
  }

  assert.equal(
    document.paths['/api/v1/admin/media/upload']?.post?.requestBody?.$ref,
    '#/components/requestBodies/MediaUpload',
  );
  assert.equal(
    document.paths['/api/v1/admin/media/{id}/replace']?.post?.requestBody?.$ref,
    '#/components/requestBodies/MediaUpload',
  );
  assert.equal(
    document.paths['/api/v1/admin/media/{id}/alt-text']?.put?.requestBody?.$ref,
    '#/components/requestBodies/MediaAltText',
  );
  assert.equal(
    document.components.requestBodies.MediaUpload?.content?.[
      'multipart/form-data'
    ]?.schema?.$ref,
    '#/components/schemas/MediaUpload',
  );
  assert.deepEqual(document.components.schemas.MediaUpload?.required, ['file']);
  assert.equal(
    (
      document.components.schemas.MediaUpload?.properties?.altText as
        { maxLength?: number } | undefined
    )?.maxLength,
    500,
  );
  assert.equal(
    document.components.schemas.MediaUpload?.additionalProperties,
    false,
  );
  assert.deepEqual(document.components.schemas.MediaAsset?.required, [
    'id',
    'objectKey',
    'url',
    'mimeType',
    'byteSize',
    'width',
    'height',
    'altText',
    'referencesCount',
    'createdAt',
    'updatedAt',
  ]);
  assert.ok(
    document.paths['/api/v1/admin/media/{id}']?.delete?.responses?.['204'],
  );
  assert.ok(
    document.paths['/api/v1/admin/media/{id}']?.delete?.responses?.['409'],
  );
  assert.ok(
    document.paths['/api/v1/admin/media/upload']?.post?.responses?.['413'],
  );
  assert.ok(
    document.paths['/api/v1/admin/media/upload']?.post?.responses?.['415'],
  );
  assert.ok(
    document.paths['/api/v1/admin/media/{id}/alt-text']?.put?.responses?.[
      '413'
    ],
  );
  assert.ok(
    document.paths['/api/v1/admin/media/{id}/alt-text']?.put?.responses?.[
      '415'
    ],
  );
});
