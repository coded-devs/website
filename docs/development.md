# Development

For production-neutral API deployment, health checks, backup/restore, and
rollback procedures, see [API operations](api-operations.md).
For independent Web, Admin, and API Docker builds and Coolify configuration,
see [Coolify deployment](coolify-deployment.md).

## Prerequisites

- Node.js 22
- pnpm 10.20.0 (via Corepack or an equivalent installation)
- PostgreSQL when working on database-backed features

## Install and run

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` runs workspace development scripts in parallel. The Next.js public website uses port 3000 by default; the admin app uses port 3001. Inspect `apps/api/src/index.ts` for the current API port behavior.

Run a single app with:

```bash
pnpm --filter @codeddevs/web dev
pnpm --filter @codeddevs/admin dev
pnpm --filter @codeddevs/api dev
```

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For a focused change, use `pnpm --filter @codeddevs/<app> <script>` with `web`, `admin`, or `api` and the scripts defined in each package. GitHub Actions runs independent workspace, web, admin, and API checks.

For browser-based frontend regression checks, install the Chromium test browser
with `pnpm exec playwright install chromium`. Start the Web app on port 3000
and the Admin app on port 3001 in separate terminals, then run
`pnpm --filter @codeddevs/web test:e2e` and
`pnpm --filter @codeddevs/admin test:e2e`. The Web check starts a temporary
mock published-content API on localhost port 4000, so that port must be free
and Web dev must use its unset-`API_URL` localhost default.
The Admin check mocks only the current-session response in the browser and
uses a test-only navigation cookie; it does not exercise database authorization.
These checks do not write screenshots or traces into the repository.

## Environment and database

Use locally configured environment variables appropriate to the feature being developed. Do not commit `.env` files, secrets, or credentials. Confirm actual variable names from the implementation rather than inventing them.

The public Web app uses the server-only `API_URL` for published articles. Set it to the Express API's exact HTTP(S) origin in production; do not use a `NEXT_PUBLIC_` variable. Development and test default to `http://localhost:4000` only when `API_URL` is unset. The Insights listing renders on request and retains 60-second tagged fetch revalidation, so an unavailable API is shown as an error rather than baked into an empty production page. The `apps/web/.env.example` file lists `API_URL` without a value.

The Admin app requires `API_INTERNAL_ORIGIN` at server startup in both development and production. Set it only in the Admin server's private environment to the Express API's HTTP(S) origin, without credentials, a path, query, or fragment. The production build does not require a deployment-specific value. The `apps/admin/.env.example` file lists the variable without a value. The browser uses the Admin origin's `/api/*` path; server-side middleware rewrites that path to the configured API without changing its path or query. Do not use a `NEXT_PUBLIC_` variable for the internal origin.

There is one proxy mechanism: the combined Admin navigation/API middleware. The Next configuration preserves the monorepo `outputFileTracingRoot` and has no separate `API_URL` rewrite or implicit production destination. `@codeddevs/auth-contract` supplies shared typed responses and public cookie/CSRF constants; it contains no secrets or API-internal implementation. Admin tests include both the actual middleware and a running Next forwarding fixture, while the PostgreSQL lifecycle runs the real Admin auth client against Express.

Configure the API's `ADMIN_ORIGIN` as the exact browser-facing Admin origin. Production also requires `API_TRUST_PROXY_HOPS` to match the verified private Web/Admin-to-API path and `AUTH_THROTTLE_HMAC_SECRET` as described below; configure these in the API's server environment, not the Admin client. Web and Admin replace visitor-supplied `X-Forwarded-For` with a validated Cloudflare `CF-Connecting-IP` before forwarding. The API must remain private, and direct VPS-origin requests must be blocked before trusting that Cloudflare header. Express remains responsible for origin/CSRF checks, authentication, authorization, throttling, and cookies. Next.js may expose its rewrite destination in response headers, so the internal origin must not be treated as a secret.

For login throttling, configure `AUTH_THROTTLE_HMAC_SECRET` through a secret manager as 32 cryptographically random bytes encoded in hexadecimal. Production startup requires it; login fails closed without it in other environments. All API instances must share the same secret. Rotation changes bucket identifiers and effectively resets existing throttle state, so coordinate rotation with other abuse controls. Never commit or log the value.

Authentication throttle buckets are retained only for active enforcement. At least weekly, and before the throttle-table capacity alert, an authorized operator must run the reviewed maintenance query against the API database: delete buckets whose `window_started_at` is older than 24 hours and whose `blocked_until` is null or older than 24 hours. This exceeds the 15-minute enforcement window and bounds persistent storage without an application background worker. Do not run this maintenance against an unverified database target.

Do not run migrations against production without explicit authorization.

## Database migrations

The API owns the PostgreSQL schema and reviewed migrations. Generate a migration after a schema change with:

```bash
pnpm --filter @codeddevs/api db:generate
```

Review the generated SQL under `apps/api/drizzle/migrations/` before committing it. Apply reviewed migrations explicitly with:

```bash
pnpm --filter @codeddevs/api db:migrate
```

`DATABASE_URL` is required for migration execution. The API never runs migrations at startup. Before a destructive production migration, take and verify a backup and document the rollback plan.

## Super Admin provisioning

After explicitly applying reviewed migrations and building the API, run `pnpm --filter @codeddevs/api admin:provision <admin-email>`, supplying the password through protected standard input from an approved secret manager or equivalent private pipe. The command refuses an interactive terminal for password input and accepts no password argument. Do not put passwords in shell history, command arguments, environment variables, or logs.

New Admin passwords must be 8–128 characters and no more than 256 UTF-8 bytes. The same limits apply to password recovery; there are no composition rules.

On success the command prints eight recovery codes exactly once to standard output. Run it only in a private, trusted environment; do not capture its output in CI logs. Transfer the codes immediately to secure offline storage. A failed or duplicate provisioning attempt prints no codes. If output is lost after the database commit, the kit cannot be retrieved from the database; follow the offline operator recovery procedure below after the required ownership verification. Provisioning never runs during migrations or API startup.

## Offline operator recovery

A human must complete the approved out-of-band ownership verification before invoking operator recovery. This command cannot verify real-world identity. After explicit authorization, apply reviewed migrations and build the API, then run `pnpm --filter @codeddevs/api admin:operator-recover` in a private environment. Supply the exact confirmation line `RECOVER`, followed by the new password on protected standard input. The command accepts no arguments and refuses an interactive terminal; do not place the password in command arguments, environment variables, configuration, shell history, or logs. Use an approved secret-management mechanism to provide the input privately.

After the transaction commits, eight replacement codes are printed once to standard output; transfer them directly to secure offline storage and do not capture them in CI logs. All earlier sessions are revoked and the previous recovery kit is consumed. If output is lost after commit, the codes cannot be retrieved; repeat the human verification and authorized operator procedure to create a new kit. The command is local only and is never exposed as an HTTP route.

Database tests require `TEST_DATABASE_URL` to point to a manually verified disposable PostgreSQL database named exactly `codeddevs_test` on `localhost`, `127.0.0.1`, or `::1`. The schema suite refuses any other host or database name before connecting, then resets that database's `public` and Drizzle migration schemas, starts the API once to prove startup does not apply migrations, applies reviewed migrations, and verifies database invariants. Never point `TEST_DATABASE_URL` at development, staging, or production data.

## Contribution workflow

Create a task-scoped branch, implement the approved change, run relevant checks, and open a PR to `main`. Follow the root and applicable application `AGENTS.md` instructions.
