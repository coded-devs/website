# Production Docker and Coolify deployment

This runbook prepares the public website, Admin CMS, and API for independent
Coolify deployments from the same pnpm workspace. It does not authorize
production changes. The root of the repository is the Docker build context for
all three images. Use Node.js 22 and pnpm 10.20.0 as pinned in the Dockerfiles.

## Repository and services

The verified canonical repository is
[`coded-devs/website`](https://github.com/coded-devs/website), branch `main`.
The `onerandomd3v/website` URL previously recorded in the root `AGENTS.md` was
outdated; both repositories pointed to the same `main` commit when checked.

Create four independent Coolify resources:

| Resource   | Repository branch                      | Dockerfile path         | Build context         |      Internal port |
| ---------- | -------------------------------------- | ----------------------- | --------------------- | -----------------: |
| Public Web | `coded-devs/website`, `main`           | `apps/web/Dockerfile`   | `.` (repository root) |               3000 |
| Admin CMS  | `coded-devs/website`, `main`           | `apps/admin/Dockerfile` | `.` (repository root) |               3001 |
| API        | `coded-devs/website`, `main`           | `apps/api/Dockerfile`   | `.` (repository root) |               4000 |
| PostgreSQL | Coolify-managed PostgreSQL 16 resource | provider image          | n/a                   | 5432, private only |

Do not use the app directory as the build context: each Dockerfile installs
workspace packages from the root lockfile. The API image includes its reviewed
Drizzle migrations for an explicit operator-run command. The API and database
needs a private route to PostgreSQL; Web and Admin must not have a network route
to the database. Web and Admin need only reach the API as their server-side
clients.

## Hostnames and routing

The configured public hostnames are `codeddevs.org` and
`admin.codeddevs.org`. The repository does not define a public API hostname, and
Web and Admin call the API from their server processes. Keep the API private on
the shared Coolify Docker network; do not create a public API domain or publish
port 4000. Set `API_URL` and `API_INTERNAL_ORIGIN` to the API resource's
verified internal network hostname and port, for example
`http://<api-resource-hostname>:4000`. Replace the placeholder with the actual
Coolify/Docker network alias after checking the deployed resource configuration.
The API calls Web revalidation at `WEB_INTERNAL_ORIGIN=https://codeddevs.org`,
which remains HTTPS as required by the API's production configuration.

In Coolify, route only the two public hostnames to their matching container
ports using the platform proxy and HTTPS. Place Web, Admin, API, and PostgreSQL
on the same Coolify server. Use separate private networks where supported:
attach Web and Admin to a frontend/API network, and attach API and PostgreSQL
to an API/database network. The API is the only long-running application on the
database network. Run migration containers on that database network only. Verify
from Web and Admin that PostgreSQL's hostname and port are unreachable, and
from API and the migration container that the generated PostgreSQL Internal URL
is reachable. Do not attach all four resources to one unrestricted shared
network. If the selected Coolify resource types cannot provide this separation,
treat database reachability isolation as a launch blocker and configure an
equivalent network access policy before deployment. Do not publish port 5432 on
the VPS. Do not enable permissive CORS
or change existing origin, CSRF, cookie, session, or authorization checks. The
API continues to enforce those contracts itself. Configure
`API_TRUST_PROXY_HOPS` to the exact verified request-proxy chain and ensure
trusted proxies sanitize forwarded headers; do not infer the value from the
number of Coolify resources.

Coolify's [networking guide](https://coolify.io/docs/core/networking-in-coolify)
describes private communication through a shared Docker network without a
public domain or published host port. Use the database resource's generated
[Internal URL](https://coolify.io/docs/databases/how-databases-work) for
`DATABASE_URL`; do not assemble or expose a public database URL.

## Runtime configuration

Use [`deploy/coolify/production.env.example`](../deploy/coolify/production.env.example)
as a variable checklist. It contains no generated secrets. Set variables only
on the service that consumes them:

| Service    | Variables                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Web        | `NODE_ENV=production`, `PORT=3000`, `SITE_URL=https://codeddevs.org`, private `API_URL=http://<api-resource-hostname>:4000`, shared `CONTENT_REVALIDATION_SECRET`                                                                                                                                                                          |
| Admin      | private `API_INTERNAL_ORIGIN=http://<api-resource-hostname>:4000`; container `PORT=3001`                                                                                                                                                                                                                                                   |
| API        | `NODE_ENV=production`, `PORT=4000`, `DATABASE_URL`, `ADMIN_ORIGIN=https://admin.codeddevs.org`, `WEB_INTERNAL_ORIGIN=https://codeddevs.org`, `API_TRUST_PROXY_HOPS`, `AUTH_THROTTLE_HMAC_SECRET`, shared `CONTENT_REVALIDATION_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_PUBLIC_BASE_URL` |
| PostgreSQL | Configure its database name and credentials in the Coolify database resource; use its generated Internal URL in API `DATABASE_URL`; persistent storage required                                                                                                                                                                            |

`CONTENT_REVALIDATION_SECRET` must be the same 32 random bytes encoded as 64
hexadecimal characters in Web and API. `AUTH_THROTTLE_HMAC_SECRET` must be a
shared 32 random bytes encoded as 64 hexadecimal characters across API
instances. Generate both in an approved secret manager; never place secret
values in Git, Docker build arguments, image layers, or logs. R2 credentials
(`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`) belong only in the API service's
secret store; `R2_ACCOUNT_ID`, `R2_BUCKET`, and HTTPS `R2_PUBLIC_BASE_URL`
complete media configuration. Production API startup currently requires R2
configuration as well as PostgreSQL and the production authentication and
revalidation settings.

Set API `DATABASE_URL` to the Coolify database resource's generated Internal
URL. Do not construct a public URL or set `DATABASE_URL` in Web or Admin.
Migration commands use the same API image and API-side `DATABASE_URL`.

## Health checks

Configure Coolify's container health checks against the internal port:

| Service | HTTP path       | Expected behavior                                                                       |
| ------- | --------------- | --------------------------------------------------------------------------------------- |
| Web     | `/robots.txt`   | HTTP 200; does not depend on API data availability                                      |
| Admin   | `/login`        | HTTP 200                                                                                |
| API     | `/api/v1/ready` | HTTP 200 only when PostgreSQL is reachable and the required readiness schema is present |

The API's `/api/v1/health` endpoint is liveness only; use `/api/v1/ready` for
deployment readiness. Readiness is not an R2 probe and does not prove every
feature or external dependency is healthy. Do not make a failed readiness probe
trigger automatic migrations.

## Migrations and deployment order

1. Create or verify the private PostgreSQL resource, persistent volume, backup
   policy, and connection credentials. Never reuse a test database.
2. Review the migration SQL in the exact release commit. Take and verify an
   approved backup before a destructive change.
3. Build the API image from that commit. Run a one-off container from that image
   on the private database network with the API's `DATABASE_URL`, executing
   `node dist/db/migrate.js`. This command applies checked-in Drizzle
   migrations not already recorded in Drizzle's migration history, so rerunning
   the same image does not reapply completed migrations. Check its exit status
   and migration state. Do not add this
   command to the API entrypoint or a restart hook.
4. Deploy the API image and wait for `/api/v1/ready`.
5. Deploy Admin and verify `/login`, session inspection, and its same-origin
   `/api/*` forwarding to the API.
6. Deploy Web and verify the homepage, published content, inquiries, and
   authenticated content revalidation path as applicable.

API startup runs `node dist/index.js` and does not migrate the database. For
every release, keep the previous application image available until smoke checks
pass. If checks fail, redeploy the last known good image and inspect
compatibility with the current schema. Application rollback does not reverse a
database migration. Treat schema rollback as a separately reviewed restore or
forward-fix decision; do not run destructive rollback SQL automatically.

## Restart, persistence, and recovery

Set restart policy to restart on failure. PostgreSQL must use a persistent
volume and private networking. Approve backup frequency, retention, encryption
and key custody, restore-drill cadence, RPO, and RTO before launch. Back up R2
objects separately from their PostgreSQL metadata and test restoration to an
isolated database before any production restore. The platform runbook in
[`API operations`](api-operations.md) describes readiness, restoration, and
application rollback boundaries.

## Production-readiness checklist

- [ ] Verify the API resource's private network hostname from Web and Admin; confirm the API has no public domain or published port.
- [ ] Confirm proxy header sanitization and exact `API_TRUST_PROXY_HOPS` value.
- [ ] Store all credentials and shared secrets in Coolify's protected environment settings.
- [ ] Verify PostgreSQL is private, persistent, backed up, and reachable from API and migration containers only; confirm Web/Admin cannot reach it.
- [ ] Review and explicitly apply the release's Drizzle migrations from its API image.
- [ ] Check Web, Admin, and API health paths and critical auth, CSRF, session, CORS/origin, content, and media flows.
- [ ] Retain the previous application images and document the schema compatibility and rollback plan.
- [ ] Complete a backup restore drill, including R2 object recovery, before claiming recovery readiness.
