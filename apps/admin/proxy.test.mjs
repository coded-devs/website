import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cp, mkdtemp, rm, symlink } from 'node:fs/promises';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import nextConfig from './next.config.mjs';

test('configuration preserves monorepo tracing and has no competing rewrite fallback', () => {
  const configuration = nextConfig('phase-production-build');
  assert.equal(
    configuration.outputFileTracingRoot,
    join(import.meta.dirname, '../..'),
  );
  assert.equal(configuration.rewrites, undefined);
});

test('production refuses to start without its internal API origin', async () => {
  const environment = { ...process.env, NODE_ENV: 'production' };
  delete environment.API_INTERNAL_ORIGIN;
  // Keep this test independent of developer .env files loaded by Next.js.
  const cwd = await mkdtemp(join(tmpdir(), 'codeddevs-next-start-test-'));
  try {
    await cp(
      join(import.meta.dirname, 'next.config.mjs'),
      join(cwd, 'next.config.mjs'),
    );
    await cp(
      join(import.meta.dirname, 'api-origin.mjs'),
      join(cwd, 'api-origin.mjs'),
    );
    await symlink(
      join(import.meta.dirname, 'node_modules'),
      join(cwd, 'node_modules'),
      'junction',
    );
    await symlink(
      join(import.meta.dirname, '.next'),
      join(cwd, '.next'),
      'junction',
    );
    await cp(
      join(import.meta.dirname, 'package.json'),
      join(cwd, 'package.json'),
    );
    const result = spawnSync(
      process.execPath,
      [
        join(import.meta.dirname, 'node_modules/next/dist/bin/next'),
        'start',
        '--port',
        '0',
      ],
      { cwd, env: environment, encoding: 'utf8', timeout: 15000 },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /API_INTERNAL_ORIGIN is required/);
  } finally {
    await rm(cwd, {
      recursive: true,
      force: true,
      maxRetries: 10,
      retryDelay: 250,
    });
  }
});

test('a production build does not require a deployment-specific API origin', () => {
  const environment = { ...process.env, NODE_ENV: 'production' };
  delete environment.API_INTERNAL_ORIGIN;
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "(await import('./next.config.mjs')).default('phase-production-build')",
    ],
    { cwd: import.meta.dirname, env: environment, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
});

test('configuration rejects non-origin destinations and ignores public variables', () => {
  for (const value of [
    'https://user:password@example.test',
    'https://example.test/api',
    'https://example.test?target=elsewhere',
    'file:///etc/passwd',
  ]) {
    const result = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "(await import('./next.config.mjs')).default('phase-production-server')",
      ],
      {
        cwd: import.meta.dirname,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          API_INTERNAL_ORIGIN: value,
        },
        encoding: 'utf8',
      },
    );
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /API_INTERNAL_ORIGIN must be an HTTP or HTTPS origin/,
    );
  }
  const environment = {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_PUBLIC_API_INTERNAL_ORIGIN: 'https://ignored.example.test',
  };
  delete environment.API_INTERNAL_ORIGIN;
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "(await import('./next.config.mjs')).default('phase-production-server')",
    ],
    { cwd: import.meta.dirname, env: environment, encoding: 'utf8' },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /API_INTERNAL_ORIGIN is required/);
});

test(
  'the Admin API transparently forwards the complete path, cookies and origin',
  { timeout: 60000 },
  async () => {
    let observed;
    const upstream = createServer(async (request, response) => {
      let body = '';
      for await (const chunk of request) body += chunk;
      observed = {
        url: request.url,
        cookie: request.headers.cookie,
        origin: request.headers.origin,
        csrf: request.headers['x-codeddevs-csrf'],
        method: request.method,
        body,
      };
      response.setHeader('Set-Cookie', [
        '__Host-codeddevs-admin-session=rotated; Path=/; Secure; HttpOnly; SameSite=Strict',
        'other=example; Path=/; HttpOnly',
      ]);
      response.writeHead(201, { 'Content-Type': 'application/json' });
      response.end('{"ok":true}');
    });
    upstream.listen(0, '127.0.0.1');
    await once(upstream, 'listening');
    const upstreamOrigin = `http://127.0.0.1:${upstream.address().port}`;
    const reservePort = async () => {
      const reservation = createServer();
      reservation.listen(0, '127.0.0.1');
      await once(reservation, 'listening');
      const reservedPort = reservation.address().port;
      await new Promise((resolve) => reservation.close(resolve));
      return reservedPort;
    };
    const fixture = await mkdtemp(
      join(tmpdir(), 'codeddevs-admin-proxy-test-'),
    );
    for (const entry of [
      'app',
      'src',
      'middleware.ts',
      'api-origin.mjs',
      'next.config.mjs',
      'package.json',
      'tsconfig.json',
    ]) {
      await cp(join(import.meta.dirname, entry), join(fixture, entry), {
        recursive: true,
      });
    }
    await symlink(
      join(import.meta.dirname, 'node_modules'),
      join(fixture, 'node_modules'),
      'junction',
    );
    let port = await reservePort();
    let child;
    let compilerDiagnostics = '';
    try {
      let ready = false;
      for (let attempt = 0; attempt < 5 && !ready; attempt++) {
        let startupOutput = '';
        child = spawn(
          process.execPath,
          [
            join(import.meta.dirname, 'node_modules/next/dist/bin/next'),
            'dev',
            '--hostname',
            '127.0.0.1',
            '--port',
            String(port),
          ],
          {
            cwd: fixture,
            env: {
              ...process.env,
              // Production mode disallows Next's eval middleware bundle.
              NODE_ENV: 'development',
              API_INTERNAL_ORIGIN: upstreamOrigin,
              NEXT_TELEMETRY_DISABLED: '1',
            },
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
          },
        );
        child.stderr.on('data', (chunk) => {
          const output = chunk.toString();
          startupOutput += output;
          compilerDiagnostics += output
            .split('\n')
            .filter((line) =>
              /Module not found|Can't resolve|Error:|Failed to compile/.test(
                line,
              ),
            )
            .join('\n');
        });
        const outcome = await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error('Next.js did not start')),
            45000,
          );
          child.stdout.on('data', (chunk) => {
            if (chunk.toString().includes('Ready in')) {
              clearTimeout(timeout);
              resolve('ready');
            }
          });
          child.once('exit', () => {
            clearTimeout(timeout);
            resolve('exit');
          });
        });
        if (outcome === 'ready') {
          ready = true;
          break;
        }
        await once(child, 'close');
        if (
          !/EADDRINUSE|address already in use/i.test(startupOutput) ||
          attempt === 4
        )
          throw new Error(`Next.js exited before starting: ${startupOutput}`);
        port = await reservePort();
      }
      const response = await fetch(
        `http://127.0.0.1:${port}/api/v1/admin/auth/login?destination=https%3A%2F%2Fevil.test`,
        {
          method: 'POST',
          headers: {
            cookie: 'codeddevs-admin-session=original',
            origin: 'https://admin.example.test',
            'content-type': 'application/json',
            'x-codeddevs-csrf': '1',
            'x-api-origin': 'https://evil.test',
          },
          body: '{}',
        },
      );
      assert.equal(response.status, 201, compilerDiagnostics);
      assert.deepEqual(observed, {
        url: '/api/v1/admin/auth/login?destination=https%3A%2F%2Fevil.test',
        cookie: 'codeddevs-admin-session=original',
        origin: 'https://admin.example.test',
        csrf: '1',
        method: 'POST',
        body: '{}',
      });
      assert.deepEqual(response.headers.getSetCookie(), [
        '__Host-codeddevs-admin-session=rotated; Path=/; Secure; HttpOnly; SameSite=Strict',
        'other=example; Path=/; HttpOnly',
      ]);
      assert.deepEqual(await response.json(), { ok: true });
      const manifest = await fetch(
        `http://127.0.0.1:${port}/_next/static/development/_buildManifest.js`,
      );
      assert.equal(manifest.status, 200);
      assert.equal((await manifest.text()).includes(upstreamOrigin), false);
    } finally {
      if (process.platform === 'win32')
        spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f']);
      else child.kill('SIGTERM');
      if (child.exitCode === null && child.signalCode === null)
        await once(child, 'close');
      await new Promise((resolve) => upstream.close(resolve));
      await rm(fixture, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 250,
      });
    }
  },
);
