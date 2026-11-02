# Content and publication API

The Express API owns content validation, authorization, published snapshots,
and PostgreSQL persistence. The machine-readable contract is
[OpenAPI content](openapi/content.json). Only routes currently registered in
`apps/api/src/app.ts` are included; this document does not describe planned
Admin or website capabilities.

## Public reads

All public reads are unauthenticated and select published snapshots only:

- `GET /api/v1/public/site` returns published homepage sections, services,
  products, projects, team members, and site settings. Collections contain
  stable record IDs, published positions, and payloads.
- `GET /api/v1/public/articles?page=1&limit=10` returns published article
  summaries as `{ items, total, page, pageSize, totalPages }`. Page is at least
  1; limit is 1–50.
- `GET /api/v1/public/articles/{slug}` returns `{ article }` with the published
  article content. Unknown and unpublished slugs both return `404` with
  `CONTENT_NOT_FOUND`.

Successful public reads use `Cache-Control: public, max-age=0, must-revalidate`.
Request errors do not return database or internal implementation details.

## Admin access and request rules

Admin routes require the authenticated Super Admin session cookie described in
[Admin authentication](authentication.md). The API remains the authorization
boundary. Admin responses are `no-store`. Every state-changing Admin request
requires the exact configured `Origin` and `X-CodedDevs-CSRF: 1`. JSON bodies
must use `application/json`; publication, unpublication, retry, and delete
operations are bodyless. Invalid JSON or unexpected fields are rejected.

### Structured site content

`/api/v1/admin/content` manages the eight fixed homepage sections (`hero`,
`about`, `services`, `products`, `projects`, `team`, `featured_insights`, and
`contact`) and four record collections (`services`, `products`, `projects`,
`team_members`). Section and record reads expose draft and published snapshots.
Draft edits, ordering, and visibility changes do not change the public
snapshot. Explicit `publish` copies a draft snapshot to published state;
`unpublish` clears it. Section drafts can also be published together with
`POST /api/v1/admin/content/sections/publish-all`. Record create, draft edit,
visibility, reorder, publish, unpublish, and delete paths are listed in the
OpenAPI fragment.

### Settings

`GET /api/v1/admin/settings` reads current settings snapshots; it returns
`404 CONTENT_NOT_FOUND` until settings have been initialized. `PUT
/api/v1/admin/settings/draft` accepts `{ "settings": { ... } }` with a partial
set of settings fields. The merged settings must include a valid
`companyName` and `contactEmail`. `POST /publish` publishes the current draft;
`POST /unpublish` removes the published snapshot. The public site includes only
published settings.

### Articles and publication

`GET /api/v1/admin/articles` lists draft and published records and supports
`search`, `status=all|draft|published`, `page`, and `limit` (1–50). `POST` on
that path creates a draft by default. Its body requires `title`, `slug`,
`excerpt`, and `body`; `publishImmediately` optionally publishes at creation.
`GET /{id}` reads both snapshots; `GET /{id}/preview` returns a private preview
of the draft. `PUT /{id}` updates only the draft, preserving the current
published payload and slug. `POST /{id}/publish` atomically saves the current
draft as the published snapshot and queues cache revalidation. `POST
/{id}/unpublish` clears the published snapshot. `DELETE /{id}` deletes the
record and returns `204`.

Publication commits before cache revalidation runs. A revalidation failure does
not roll publication back: the new content remains public and a durable failed
job records a safe failure code for inspection and retry. The API currently
accepts only lowercase hyphenated slugs of up to 160 characters.

### Revalidation jobs

`GET /api/v1/admin/revalidation-jobs` supports `page` (minimum 1), `limit`
(1–100, default 20), and optional `status=pending|processing|succeeded|failed`.
It returns `{ items, total, page, limit, totalPages }`; job items contain the
resource, status, attempt count, revalidation paths/tags, safe `lastError`,
retry/completion timestamps, and creation/update timestamps. They never expose
the internal response body or shared secret.

`POST /{id}/retry` claims a retryable job and runs one attempt. A claimed attempt
returns `200 { "success": true, "status": "succeeded"|"failed" }`, including
when that retry attempt fails. A job that is not due, is already claimed, or
has exhausted its five attempts returns `409`. Failed jobs use increasing
backoff (1, 2, 4, 8, then 15 minutes); the first four attempts have a scheduled
retry time. A retry does not republish content.

## Error responses

Content endpoints use stable codes: `CONTENT_INVALID_REQUEST` (`400`),
`CONTENT_NOT_FOUND` (`404`), `CONTENT_CONFLICT` (`409`),
`CONTENT_FORBIDDEN` (`403`), and `CONTENT_UNAVAILABLE` (`503`). Public read
validation failures use `CONTENT_INVALID_REQUEST`; unavailable public storage
uses `SERVICE_UNAVAILABLE`. Session failures return `401`, rejected Origin/CSRF
returns `403`, and revalidation-job list/retry persistence failures return a
generic `500`. Error bodies omit SQL, stack traces, remote response bodies,
cookies, and secrets.

## PostgreSQL lifecycle integration test

The lifecycle test reads `CONTENT_M6_TEST_DATABASE_URL` from the local test
process only. It refuses to run against a non-loopback host or any database
whose name is not exactly `cod316_content_m6_test`. Create that disposable local
PostgreSQL database before setting the variable. The test uses a fake Admin
session and a loopback-only fake web revalidation endpoint; no real credentials
or production systems are involved. Without the variable, the PostgreSQL test
is skipped.
