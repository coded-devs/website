# Inquiries and site settings

This document describes the implemented API contract for public inquiry intake, Admin triage, and the existing site-settings draft API. The machine-readable inquiry contract is [OpenAPI](openapi/inquiries.json). The API owns validation, persistence, authorization, and audit behavior; neither browser application connects to PostgreSQL.

## Public inquiry intake

`POST /api/v1/public/inquiries` accepts `application/json` with exactly these fields:

| Field     | Contract                                                                     |
| --------- | ---------------------------------------------------------------------------- |
| `name`    | Required string, trimmed, 2–200 Unicode code points.                         |
| `email`   | Required valid email, trimmed, lowercased, maximum 320 characters.           |
| `company` | Optional string, trimmed, maximum 200 characters; blank becomes absent/null. |
| `message` | Required string, trimmed, 20–5,000 Unicode code points.                      |

Unknown fields are rejected. JSON bodies are limited to 16 KiB. Success is `201 { "received": true }`; submitted personal data is not echoed. There is no public inquiry read, list, detail, update, or delete route. Unmatched GET/DELETE paths return the API's ordinary `404 { "error": "Not found" }`.

Invalid media type, malformed JSON, over-limit body, invalid fields, or unknown fields return `400 { "error": "Invalid inquiry request", "code": "INQUIRY_INVALID_REQUEST" }`. Rate limiting returns `429 { "error": "Too many inquiry submissions", "code": "INQUIRY_RATE_LIMITED" }` and an integer `Retry-After` header (seconds until the limiting window expires, at least 1). Missing database/configuration or database failure returns `503 { "error": "Service unavailable", "code": "INQUIRY_UNAVAILABLE" }`. Submission responses use `Cache-Control: no-store`. Intake persists the inquiry only; it does not send outbound email.

The current detailed-design throttle choices are 60 attempts per IP per fixed 15-minute window and 3 accepted submissions per normalized email per fixed 60-minute window. These are operational policy values, not immutable product requirements. Invalid JSON/schema attempts consume the IP bucket but do not create an email bucket; the email bucket is consumed only when the request is accepted. IP is checked before email. Limits are enforced transactionally across API instances using PostgreSQL. `Retry-After` reports the active bucket's remaining expiry.

The key stored for either throttle bucket is only a lowercase SHA-256 HMAC digest; raw IP addresses and email addresses are not stored in throttle rows. HMAC input includes a versioned, kind-separated domain prefix. Configure `AUTH_THROTTLE_HMAC_SECRET` as 32 cryptographically random bytes encoded as 64 hexadecimal characters. Every API instance must share the same secret. Rotation changes all derived keys and therefore effectively clears current throttle history; coordinate it with other abuse controls. Do not log or commit the secret.

Client IP is `request.ip`, derived by Express only from the configured `API_TRUST_PROXY_HOPS`. Web and Admin ignore visitor-supplied `X-Forwarded-For`; they validate Cloudflare's single-value `CF-Connecting-IP` and replace `X-Forwarded-For` with that one IP on private requests to the API. In production they fail closed with `503` if the Cloudflare identity is missing or invalid; they do not rate-limit all clients under a shared app-container address. The API's direct peer is therefore the Web or Admin container, and the hop setting counts this normalized internal boundary, not the public Cloudflare/Coolify chain. Production must block direct origin access that could spoof `CF-Connecting-IP` and restrict API network access to the frontends. See the [Coolify proxy trust runbook](coolify-deployment.md#client-ip-and-proxy-trust); leave the production hop value unset until the actual private path is verified.

There is no application cleanup worker. At least weekly, an authorized operator should run the reviewed maintenance query below against the verified API database. It deletes only buckets whose window expired more than 24 hours ago, retaining a buffer beyond both active enforcement windows:

```sql
DELETE FROM inquiry_throttle_buckets
WHERE expires_at < clock_timestamp() - INTERVAL '24 hours';
```

## Admin inquiry lifecycle

All routes below require the authenticated Admin session cookie `__Host-codeddevs-admin-session` (Secure in production, HttpOnly, SameSite=Strict, Path=/). Responses containing private Admin data are `Cache-Control: no-store`. A missing/invalid session returns `401 { "error": "Unauthorized" }`; service/database failure returns `503 { "error": "Service unavailable" }`.

Every mutation also requires an `Origin` header exactly equal to configured `ADMIN_ORIGIN` and `X-CodedDevs-CSRF: 1`. Either check failing returns `403 { "error": "Forbidden" }`. A mutation with a non-JSON content type returns `415 { "error": "Unsupported media type" }`. These checks remain server-enforced even when requests are forwarded by the Admin application.

### List and detail

`GET /api/v1/admin/inquiries` returns `{ "items", "total", "page", "limit", "totalPages" }`. Query parameters are:

- `page`: integer >= 1, default 1.
- `limit`: integer 1–100, default 20.
- `status`: optional `new`, `in_progress`, `resolved`, or `closed`.
- `search`: optional trimmed string, max 200 characters; literal substring match across name, email, and company. SQL wildcard characters are escaped.

Unknown query parameters and invalid values return `400 { "error": "Invalid inquiry request", "code": "INQUIRY_INVALID_REQUEST" }`. Items are ordered by `createdAt DESC`, then `id DESC` for deterministic ties. List summaries contain `id`, `name`, `email`, nullable `company`, `status`, nullable `statusUpdatedByAdminUserId`, nullable ISO `statusUpdatedAt`, `createdAt`, and `updatedAt`. They intentionally omit `message`.

`GET /api/v1/admin/inquiries/{id}` requires a UUID. A malformed UUID returns the same `400` invalid-request body; an unknown UUID returns `404 { "error": "Inquiry not found", "code": "INQUIRY_NOT_FOUND" }`. Detail wraps the summary plus the private `message` in `{ "inquiry": ... }`.

### Status and audit

`PUT /api/v1/admin/inquiries/{id}/status` takes exactly `{ "status": "..." }`. Allowed transitions are:

| Current       | Allowed next status     |
| ------------- | ----------------------- |
| `new`         | `in_progress`, `closed` |
| `in_progress` | `resolved`, `closed`    |
| `resolved`    | `in_progress`, `closed` |
| `closed`      | none (terminal)         |

The destination must differ from the current state. Invalid body/UUID returns `400` with `INQUIRY_INVALID_REQUEST`; unknown inquiry returns the `404` body above; disallowed or same-state transition returns `409 { "error": "Invalid inquiry status transition", "code": "INQUIRY_INVALID_TRANSITION" }`. Success is `200 { "inquiry": <detail> }`, including the acting Admin UUID and ISO update time.

The inquiry row change and `inquiry.update` audit event commit atomically. Audit metadata records only `fromStatus` and `toStatus`; it does not contain message, name, email, or company. If the audit write fails, the status change rolls back and the API returns `503`.

## Site settings compatibility

Settings remain on the existing authenticated Admin API; this task adds no settings product behavior. `GET /api/v1/admin/settings` returns `{ "settings": ... }` or `404 { "error": "Content not found", "code": "CONTENT_NOT_FOUND" }` if the singleton row has not yet been created. `PUT /api/v1/admin/settings/draft` accepts `{ "settings": <partial settings object> }`, merges that partial object with the existing draft, validates the complete merged value, saves it, and returns `{ "settings": ... }`. Unknown settings keys are rejected. Supported fields are `companyName` (required nonempty string, max 200), `contactEmail` (required email, max 320), and optional `contactPhone` (50), `address` (500), `twitterUrl`, `linkedinUrl`, `githubUrl`, `ogImageUrl` (empty or valid HTTP(S) URL, each max 2,048), `footerNotice` (500), `metaTitle` (160), and `metaDescription` (500). An invalid partial update returns `400 { "error": "Invalid content request", "code": "CONTENT_INVALID_REQUEST" }` without changing the prior draft. A draft update does not publish settings. Existing publication routes remain separate and are outside this lifecycle contract.

## Privacy and operations

Inquiry content is personal information. Restrict database, backup, and Admin access; use TLS; keep retention/deletion policy under the organization's approved privacy policy. Do not put inquiry fields, session cookies, throttle secret, raw IP/email identifiers, or request bodies in application logs, traces, analytics, URLs, or error reports. Public success is intentionally non-reflective. Admin list responses omit message to reduce routine exposure; read message only through the authenticated detail route. The API currently provides no inquiry deletion endpoint.

Schema changes are applied only through reviewed, explicit migrations. Generate/review with `pnpm --filter @codeddevs/api db:generate`, then apply a reviewed migration with `pnpm --filter @codeddevs/api db:migrate` after setting `DATABASE_URL` to the intended database. The API never applies migrations at startup. Verify the database target before migration or maintenance; never run either against production without explicit authorization.
