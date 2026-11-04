import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const openApiPath = fileURLToPath(
  new URL('../../../../docs/openapi/inquiries.json', import.meta.url),
);

type ResponseObject = {
  $ref?: string;
  headers?: Record<string, { schema?: { type?: string; const?: string } }>;
};
type Operation = {
  security?: Array<Record<string, string[]>>;
  parameters?: Array<{ $ref?: string }>;
  requestBody?: { $ref?: string };
  responses?: Record<string, ResponseObject>;
};

test('inquiry OpenAPI fragment matches public and protected lifecycle contracts', async () => {
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
        { content?: Record<string, { schema?: { $ref?: string } }> }
      >;
      schemas: Record<
        string,
        {
          required?: string[];
          enum?: string[];
          properties?: Record<string, unknown>;
          additionalProperties?: boolean;
        }
      >;
      responses: Record<string, ResponseObject>;
    };
  };

  assert.equal(document.openapi, '3.1.0');
  assert.deepEqual(Object.keys(document.paths).sort(), [
    '/api/v1/admin/inquiries',
    '/api/v1/admin/inquiries/{id}',
    '/api/v1/admin/inquiries/{id}/status',
    '/api/v1/public/inquiries',
  ]);
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(document.paths).map(([path, methods]) => [
        path,
        Object.keys(methods).sort(),
      ]),
    ),
    {
      '/api/v1/admin/inquiries': ['get'],
      '/api/v1/admin/inquiries/{id}': ['get'],
      '/api/v1/admin/inquiries/{id}/status': ['put'],
      '/api/v1/public/inquiries': ['post'],
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
      if (path.startsWith('/api/v1/admin/')) {
        assert.deepEqual(
          operation.security,
          [{ AdminSession: [] }],
          `${method} ${path}`,
        );
        assert.ok(operation.responses?.['401'], `${method} ${path} 401`);
        assert.ok(operation.responses?.['503'], `${method} ${path} 503`);
      } else {
        assert.equal(
          operation.security,
          undefined,
          `${method} ${path} is public`,
        );
      }
      if (
        path.startsWith('/api/v1/admin/') &&
        (method === 'put' || method === 'post')
      ) {
        const refs = operation.parameters?.map((parameter) => parameter.$ref);
        assert.ok(refs?.includes('#/components/parameters/Origin'));
        assert.ok(refs?.includes('#/components/parameters/Csrf'));
      }
      if (path.startsWith('/api/v1/admin/')) {
        assert.equal(
          operation.responses?.['200']?.$ref,
          '#/components/responses/PrivateSuccess',
        );
      }
    }
  }

  assert.equal(
    document.paths['/api/v1/public/inquiries']?.post?.requestBody?.$ref,
    '#/components/requestBodies/PublicInquiry',
  );
  assert.equal(
    document.paths['/api/v1/admin/inquiries/{id}/status']?.put?.requestBody
      ?.$ref,
    '#/components/requestBodies/StatusUpdate',
  );
  assert.ok(
    document.paths['/api/v1/admin/inquiries/{id}/status']?.put?.responses?.[
      '403'
    ],
  );
  assert.ok(
    document.paths['/api/v1/admin/inquiries/{id}/status']?.put?.responses?.[
      '415'
    ],
  );
  assert.deepEqual(document.components.schemas.PublicInquiryInput?.required, [
    'name',
    'email',
    'message',
  ]);
  assert.equal(
    document.components.schemas.PublicInquiryInput?.additionalProperties,
    false,
  );
  assert.deepEqual(document.components.schemas.InquiryStatus?.enum, [
    'new',
    'in_progress',
    'resolved',
    'closed',
  ]);
  assert.deepEqual(document.components.schemas.InquiryListItem?.required, [
    'id',
    'name',
    'email',
    'company',
    'status',
    'statusUpdatedByAdminUserId',
    'statusUpdatedAt',
    'createdAt',
    'updatedAt',
  ]);
  assert.equal(
    'message' in
      (document.components.schemas.InquiryListItem?.properties ?? {}),
    false,
  );
  assert.ok(document.components.schemas.InquiryDetail?.properties?.message);

  for (const path of Object.keys(document.paths)) {
    const methods = document.paths[path]!;
    for (const operation of Object.values(methods)) {
      const responses = operation.responses ?? {};
      if (path.startsWith('/api/v1/admin/')) {
        for (const [status, response] of Object.entries(responses)) {
          const responseName = response.$ref?.split('/').at(-1);
          const resolved = responseName
            ? document.components.responses[responseName]
            : response;
          assert.ok(
            resolved?.headers?.['Cache-Control'],
            `${path} ${status} must be no-store`,
          );
        }
      }
      for (const status of ['400', '401', '404', '409', '429', '503']) {
        if (
          (status === '404' && path === '/api/v1/admin/inquiries') ||
          (status === '409' &&
            path !== '/api/v1/admin/inquiries/{id}/status') ||
          (status === '429' && path !== '/api/v1/public/inquiries')
        )
          continue;
        if (status === '401' && path === '/api/v1/public/inquiries') continue;
        if (status === '404' && path === '/api/v1/public/inquiries') continue;
        if (status === '409' && path === '/api/v1/public/inquiries') continue;
        if (status === '429' && path.startsWith('/api/v1/admin/')) continue;
        assert.ok(
          responses[status],
          `${Object.keys(methods)[0]} ${path} ${status}`,
        );
      }
      if (responses['429']) {
        assert.equal(
          responses['429']?.$ref,
          '#/components/responses/TooManyRequests',
        );
        assert.ok(
          document.components.responses.TooManyRequests?.headers?.[
            'Retry-After'
          ],
        );
      }
    }
  }
  assert.equal(
    document.components.responses.PrivateSuccess?.headers?.['Cache-Control']
      ?.schema?.const,
    'no-store',
  );
  assert.equal(
    document.components.responses.PublicSuccess?.headers?.['Cache-Control']
      ?.schema?.const,
    'no-store',
  );
  assert.equal(document.paths['/api/v1/public/inquiries']?.get, undefined);
  assert.equal(document.paths['/api/v1/public/inquiries']?.delete, undefined);
});
