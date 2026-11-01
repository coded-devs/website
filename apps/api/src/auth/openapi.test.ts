import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const openApiPath = fileURLToPath(
  new URL('../../../../docs/openapi/authentication.json', import.meta.url),
);

type Operation = {
  parameters?: Array<{ $ref?: string }>;
  requestBody?: {
    required?: boolean;
    content?: { 'application/json'?: { schema?: { $ref?: string } } };
  };
  responses?: Record<
    string,
    { $ref?: string; headers?: Record<string, unknown> }
  >;
};

test('authentication OpenAPI fragment matches the implemented public contract', async () => {
  const document = JSON.parse(await readFile(openApiPath, 'utf8')) as {
    openapi: string;
    paths: Record<string, Record<string, Operation>>;
    components: {
      schemas: Record<
        string,
        { required?: string[]; additionalProperties?: boolean }
      >;
      parameters: Record<
        string,
        { required?: boolean; schema?: { const?: string } }
      >;
      responses: Record<string, { headers?: Record<string, unknown> }>;
      securitySchemes: Record<
        string,
        { in?: string; name?: string; description?: string }
      >;
    };
  };

  assert.equal(document.openapi, '3.1.0');
  assert.deepEqual(Object.keys(document.paths).sort(), [
    '/api/v1/admin/auth/login',
    '/api/v1/admin/auth/logout',
    '/api/v1/admin/auth/me',
    '/api/v1/admin/auth/recovery/codes',
    '/api/v1/admin/auth/recovery/reset',
  ]);
  assert.ok(document.paths['/api/v1/admin/auth/login']?.post);
  assert.ok(document.paths['/api/v1/admin/auth/logout']?.post);
  assert.ok(document.paths['/api/v1/admin/auth/me']?.get);
  assert.ok(document.paths['/api/v1/admin/auth/recovery/reset']?.post);
  assert.ok(document.paths['/api/v1/admin/auth/recovery/codes']?.post);
  assert.equal('/api/v1/admin/auth/register' in document.paths, false);
  assert.equal('/api/v1/admin/auth/operator-recovery' in document.paths, false);
  assert.ok('LoginRequest' in document.components.schemas);
  assert.ok('RecoveryResetRequest' in document.components.schemas);
  assert.ok('RecoveryKitRegenerationRequest' in document.components.schemas);

  for (const path of [
    '/api/v1/admin/auth/login',
    '/api/v1/admin/auth/logout',
    '/api/v1/admin/auth/recovery/reset',
    '/api/v1/admin/auth/recovery/codes',
  ]) {
    const operation = document.paths[path]?.post;
    assert.deepEqual(
      operation?.parameters?.map((parameter) => parameter.$ref),
      ['#/components/parameters/Origin', '#/components/parameters/Csrf'],
    );
  }
  assert.equal(document.components.parameters.Origin?.required, true);
  assert.equal(document.components.parameters.Csrf?.required, true);
  assert.equal(document.components.parameters.Csrf?.schema?.const, '1');

  assert.equal(
    document.paths['/api/v1/admin/auth/login']?.post?.requestBody?.content?.[
      'application/json'
    ]?.schema?.$ref,
    '#/components/schemas/LoginRequest',
  );
  assert.equal(
    document.paths['/api/v1/admin/auth/recovery/reset']?.post?.requestBody
      ?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/RecoveryResetRequest',
  );
  assert.equal(
    document.paths['/api/v1/admin/auth/recovery/codes']?.post?.requestBody
      ?.content?.['application/json']?.schema?.$ref,
    '#/components/schemas/RecoveryKitRegenerationRequest',
  );
  assert.deepEqual(document.components.schemas.LoginRequest.required, [
    'email',
    'password',
  ]);
  assert.equal(
    document.components.schemas.LoginRequest.additionalProperties,
    false,
  );

  const loginResponses =
    document.paths['/api/v1/admin/auth/login']?.post?.responses;
  assert.equal(
    loginResponses?.['401']?.$ref,
    '#/components/responses/InvalidLogin',
  );
  assert.equal(
    loginResponses?.['403']?.$ref,
    '#/components/responses/Forbidden',
  );
  assert.equal(
    loginResponses?.['429']?.$ref,
    '#/components/responses/TooManyAttempts',
  );
  assert.ok(
    document.components.responses.TooManyAttempts?.headers?.['Retry-After'],
  );
  assert.ok(
    document.components.responses.LoginSuccess?.headers?.['Set-Cookie'],
  );
  assert.ok(
    document.components.responses.CurrentSession?.headers?.['Cache-Control'],
  );
  assert.equal(document.components.securitySchemes.AdminSession?.in, 'cookie');
  assert.equal(
    document.components.securitySchemes.AdminSession?.name,
    '__Host-codeddevs-admin-session',
  );
  assert.match(
    document.components.securitySchemes.AdminSession?.description ?? '',
    /Secure, HttpOnly, SameSite=Strict, Path=\//,
  );
});
