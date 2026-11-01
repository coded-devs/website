# Admin authentication contract

The Express API is the authority for all Admin authentication, authorization, CSRF checks, throttling, sessions, audit events, and cookies. The Admin app forwards same-origin `/api/*` requests, but it must never be treated as an authorization boundary.

The machine-readable endpoint fragment is [OpenAPI authentication](openapi/authentication.json). It is intentionally limited to implemented authentication routes.

The dependency-free workspace package `@codeddevs/auth-contract` is the single typed contract used by Admin and API. Login returns only `{ expiresAt }`; the Admin client then calls `/me` to hydrate `{ admin: { id, email, role: "SUPER_ADMIN" }, session: { expiresAt } }`. There are no legacy `user`/top-level-user fallback shapes or `isSuperAdmin` conversions. Login/logout send the shared `X-CodedDevs-CSRF: 1` header with same-origin credentials. The browser supplies Origin; the rewrite preserves it.

Admin middleware uses the environment-specific session-cookie name only as a navigation hint for protected pages, never as authorization. `/login` stays reachable with stale cookies, and its client uses `/me` before redirecting an authenticated user. Return navigation is restricted to local protected Admin paths. Failed logout retains the authenticated UI, displays a generic retryable error and does not claim server revocation succeeded.

## HTTP contract

All API responses receive a server-generated `X-Request-Id`. Production responses use security headers and never include internal errors, database details, or stack traces. Authentication responses use generic errors and do not reveal secrets.

`POST /api/v1/admin/auth/login` accepts JSON `email` and `password`. It requires the exact configured `Origin` and `X-CodedDevs-CSRF: 1` headers. Unknown email and invalid password both return `401 {"error":"Invalid email or password"}`. Successful login returns `200 {"expiresAt":"…"}` and sets a fresh session cookie. Re-login rotates the prior matching session. `400`, `403`, `413`, `415`, `429`, and `503` use the safe error responses in the OpenAPI fragment. A throttled request returns `429 {"error":"Too many attempts"}` with `Retry-After`.

`POST /api/v1/admin/auth/logout` requires the same exact Origin and CSRF header. It is idempotent: valid, absent, malformed, expired, and revoked cookies all return `204`; a valid session is revoked atomically and its cookie is expired. It returns `403` for failed Origin/CSRF checks and `503` if persistence fails, without clearing a potentially valid cookie.

`GET /api/v1/admin/auth/me` accepts only the session cookie—never an Authorization bearer token. It returns the Super Admin ID, email, role, and absolute session expiry, with `Cache-Control: no-store`. Invalid session states return generic `401`, clear the cookie, and do not reveal why. Safe methods do not mutate authentication state except that a valid authenticated request may transactionally record `last_used_at` no more than once every five minutes; this approved exception enforces the idle timeout and never extends absolute expiry.

`POST /api/v1/admin/auth/recovery/reset` accepts JSON `email`, `recoveryCode`, and `newPassword`; it requires exact Origin and CSRF headers. Wrong email, wrong/consumed code, and replay return the same generic `401`. A successful recovery changes the password, increments credential version, revokes every session, consumes the full kit, writes an audit event, and returns `204` without logging in or setting a cookie.

`POST /api/v1/admin/auth/recovery/codes` requires a valid Super Admin session, exact Origin, CSRF header, JSON, and `currentPassword`. It atomically consumes the previous kit, creates eight replacement codes, and returns them once in `200 {"recoveryCodes":[…]}`. The response is the only time the raw codes exist outside protected operational input; they are never persisted or logged.

There is no registration route. There is no public HTTP operator-recovery route.

## Session and request policy

Production uses `__Host-codeddevs-admin-session` with `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`, no `Domain`, and an eight-hour maximum age. Development/test use `codeddevs-admin-session` with the same HttpOnly, SameSite, and Path policy but without `Secure`. Sessions have a 30-minute idle limit and an eight-hour absolute limit. A valid request updates `last_used_at` at most once every five minutes; activity therefore preserves an active session without ever extending its absolute expiry.

State-changing authentication endpoints require JSON where specified, an exact configured Origin, and `X-CodedDevs-CSRF: 1`. Login and recovery abuse controls use durable PostgreSQL account/IP buckets: five account failures per 15 minutes, 20 IP failures per 15 minutes, and an exponential delay capped at 15 minutes. Invalid-credential and policy-rejection audits are coalesced through durable, HMAC-keyed markers independent of supplied email and IP, so distributed invalid traffic cannot create an unbounded audit stream.

Throttle buckets are durable only for their active abuse window. Operations must run the reviewed maintenance query at least weekly (and before the table reaches its capacity alert): delete only buckets with `blocked_until is null` or `blocked_until < clock_timestamp() - interval '24 hours'`, and whose `window_started_at` is older than 24 hours. This retains more than the 15-minute maximum enforcement window while bounding storage over time. It is an explicit operator/database-maintenance action; no API background worker performs it.

## Operations and environment

Use Node.js 22 and pnpm 10.20.0. `DATABASE_URL` is required by explicit migrations, provisioning, and the API persistence layer. `ADMIN_ORIGIN` is the exact browser-facing Admin origin. `API_TRUST_PROXY_HOPS` is required and positive in production, and must match the verified proxy chain. `AUTH_THROTTLE_HMAC_SECRET` is a shared 32-byte hexadecimal secret required in production; store it only in a secret manager, never in Git, command arguments, logs, or client variables. `PORT` defaults to 4000.

Apply migrations explicitly with `pnpm --filter @codeddevs/api db:migrate`; API startup never runs migrations. For database tests, set `TEST_DATABASE_URL` only in the local process to a disposable PostgreSQL database whose name contains `test` as a separate segment. The test suite resets that database's public and Drizzle schemas.

Provision the sole Super Admin only after migrations: `pnpm --filter @codeddevs/api admin:provision <admin-email>`. Supply the password through protected stdin; it is never accepted as an argument. The command prints eight recovery codes once. Transfer them to approved offline storage and do not capture them in CI output or logs.

If codes are lost, a human must complete approved out-of-band ownership verification before the local-only `pnpm --filter @codeddevs/api admin:operator-recover` command is used. Supply `RECOVER`, then the new password, through protected stdin. The command has no HTTP endpoint and prints a replacement code kit only after its transaction commits.
