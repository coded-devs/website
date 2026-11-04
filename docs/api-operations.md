# API operations and handoff

This is a provider-neutral runbook. The hosting provider, production domains,
backup service, recovery targets, and alerting system remain service-owner
decisions. This document does not authorize production changes.

## Contracts and errors

The implemented routes are covered by five OpenAPI fragments:
[authentication](openapi/authentication.json),
[content/settings/articles/revalidation](openapi/content.json),
[media](openapi/media.json), [inquiries](openapi/inquiries.json), and
[operational checks](openapi/operations.json). Every response carries a
generated `X-Request-Id`. Error bodies contain an `error` string and may
also contain a feature-specific stable `code`; status, body, and headers are
specified per operation. Do not globally change existing error envelopes
without checking Admin/Web clients. Errors must never disclose raw
exceptions, SQL, secrets, or private inquiry content.

## Local setup and private configuration

Use Node.js 22, pnpm 10.20.0, and PostgreSQL 16. Run
`pnpm install --frozen-lockfile`, then `pnpm --filter @codeddevs/api build`.
After configuring the private environment, launch with
`node apps/api/dist/index.js`. `apps/api/.env.example` contains local examples
only, not production credentials.

| Variable                                                                                       | Requirement                                                                                         |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                                                     | `development`, `test`, or `production`.                                                             |
| `PORT`                                                                                         | Integer 1–65535; default 4000. Test mode alone also accepts 0 for an ephemeral port.                |
| `DATABASE_URL`                                                                                 | PostgreSQL URL; required at production startup and for explicit migrations/provisioning.            |
| `ADMIN_ORIGIN`                                                                                 | Exact browser-facing HTTPS Admin origin in production.                                              |
| `API_TRUST_PROXY_HOPS`                                                                         | Exact positive trusted hop count in production; restrict direct API access.                         |
| `WEB_INTERNAL_ORIGIN`                                                                          | HTTPS Web origin for authenticated revalidation in production.                                      |
| `CONTENT_REVALIDATION_SECRET`                                                                  | Shared 32-byte hexadecimal secret in API and Web secret managers.                                   |
| `AUTH_THROTTLE_HMAC_SECRET`                                                                    | Shared 32-byte hexadecimal secret in the API secret manager; never put its value in `.env.example`. |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE_URL` | All required for production media storage; credentials remain API-side.                             |

Never put secret values in Git, command arguments, browser variables, logs, or
documentation. Coordinate shared-secret rotation across instances. See the
feature runbooks for [authentication](authentication.md),
[content](content-publication.md), [media](media-management.md), and
[inquiries](inquiries-and-settings.md).

## Health and deployment

`GET /api/v1/health` is liveness: `200 {"status":"ok"}` means HTTP is
serving, not that dependencies are ready. `GET /api/v1/ready` returns
`200 {"status":"ready"}` only when PostgreSQL is reachable and the COD-318
inquiry-throttle table exists; otherwise it returns generic
`503 {"status":"unavailable"}`. Readiness is `no-store` with bounded database
connection/query timeouts and one shared in-flight probe per API process. It does not probe R2 or Web revalidation and is not
proof that every migration or external dependency is healthy.

Before deployment, verify the intended database and approved backup. Apply
reviewed migrations explicitly with `pnpm --filter @codeddevs/api db:migrate`
using the intended `DATABASE_URL`; API startup never migrates. Deploy a build
compatible with that schema, then check liveness, readiness, and relevant
public/Admin smoke paths. A readiness failure is an incident to investigate,
not permission to rerun migrations against an unverified target.

## Backup, restoration, and rollback

Before production launch, the owner must approve backup frequency, retention,
storage location, encryption/key custody, restore-drill cadence, maximum data
loss (RPO), and recovery time (RTO). No numeric targets are approved yet.
Configure automated PostgreSQL backups with a tested restoration path; do not
claim protection until a drill succeeds. Account separately for R2 objects
and their database metadata/references.

For a drill, obtain an approved backup through the secret manager and backup
system, verify its checksum and timestamp, and create a new isolated disposable
PostgreSQL database. Restore into that empty target using standard PostgreSQL
tooling, for example `pg_restore --no-owner --dbname
<verified-disposable-service> <approved-backup-file>` for a custom-format
archive. Check required tables, migration history, selected record
counts/invariants, and API readiness against the restored target. Never use
`--clean` or a schema-dropping fixture on an unverified target. Production
restoration requires explicit owner authorization and a separate plan.

Application rollback means redeploying a previously tested artifact and
rechecking critical flows. Do not assume an older binary can read a new
schema; review compatibility before rollout. Database rollback is not an
automatic reverse migration. If restoration is needed, stop writes, preserve
evidence, obtain approval, and restore to an isolated target before cutover.
PostgreSQL restoration alone does not undo R2 object changes or external cache
effects. Provider-specific commands and automation remain deferred.

## Test and CI safety

API CI creates separate disposable PostgreSQL databases for integration
suites, then runs lint, typecheck, the complete API test suite, and build.
Fixture setup refuses non-loopback or non-test targets; `TEST_DATABASE_URL`
must identify a fresh disposable `codeddevs_test` database. Coverage includes
auth/session/CSRF, draft visibility, publication/revalidation, inquiry abuse,
media references, migration invariants, and readiness. Local database tests
must likewise use a verified disposable target; the schema suite drops its
test schemas. Never point fixtures at production or shared development data.
