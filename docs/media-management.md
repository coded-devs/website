# Media management

The media library is currently read-only. Authenticated Admins can list and
inspect assets, but every API write request for upload, alt text, replacement,
or deletion returns `403` with `CMS content is read-only.` The Admin interface
does not expose media-editing controls. Existing objects, metadata, and
references are preserved.

When media writes are enabled in a future reviewed change, the API will own
media validation, metadata, and object-storage writes. The Admin browser must
send uploads to the API and never receive R2 credentials or write directly to
the bucket.

## Upload validation when writes are enabled

Uploads accept one `file` field and an optional `altText` field as
`multipart/form-data`. The file must be a complete JPEG, PNG, or WebP image; the
declared MIME type must match the decoded image. The API limits files to 10 MiB,
image dimensions to 12,000 pixels on either side, and decoded input to 20 million
pixels. It fully decodes image data before storing it. Alternative text is
limited to 500 characters for both uploads and edits; the multipart parser
also caps its raw input at 2 KiB.

Invalid, truncated, unsupported, or oversized data is rejected before metadata
becomes ready. If these writes are re-enabled, upload and replacement requests
must require the Admin session cookie, the configured `Origin`, and the
`X-CodedDevs-CSRF: 1` header.

## R2 configuration and secret custody

Production media storage requires these API environment variables:

| Variable               | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `R2_ACCOUNT_ID`        | Cloudflare account used for the S3-compatible endpoint |
| `R2_ACCESS_KEY_ID`     | API-side R2 access key identifier                      |
| `R2_SECRET_ACCESS_KEY` | API-side R2 secret access key                          |
| `R2_BUCKET`            | Bucket that stores media objects                       |
| `R2_PUBLIC_BASE_URL`   | Public read-only base URL returned for ready assets    |

Keep the account and access keys in the API deployment's secret manager. Use a
dedicated token scoped to the media bucket with only the object operations the
API needs. Never put the keys in Admin or Web environment variables, browser
bundles, request bodies, responses, URLs, logs, or source control. Rotate the
token through the secret manager and update the API deployment; no database
migration is needed for credential rotation.

`R2_PUBLIC_BASE_URL` is a URL, not a secret. Configure it to the intended public
delivery domain and keep the bucket's public configuration read-only for
visitors. The API does not set public write ACLs or expose an object-listing
endpoint. Browser clients may fetch returned asset URLs, but all uploads,
metadata changes, replacements, and deletions go through the authenticated API.

If R2 is not configured, media endpoints that need storage return a generic
service-unavailable response. The API omits credentials and provider response
details from errors.

## Admin endpoints

All endpoints are mounted beneath `/api/v1/admin/media` and require the existing
Super Admin session:

| Method and path      | Current behavior                                                  |
| -------------------- | ----------------------------------------------------------------- |
| `GET /`              | List ready assets; supports `search`, `mimeType`, `page`, `limit` |
| `GET /{id}`          | Read one ready asset and its delivery URL                         |
| `POST /upload`       | Rejected with `403`; uploads are disabled                         |
| `PUT /{id}/alt-text` | Rejected with `403`; metadata edits are disabled                  |
| `POST /{id}/replace` | Rejected with `403`; replacement is disabled                      |
| `DELETE /{id}`       | Rejected with `403`; deletion is disabled                         |

## Replacement and references (implementation details)

These storage lifecycle details describe the implemented service behavior; the
Admin API currently rejects every write before reaching it.

Each accepted upload receives a new opaque UUID object key under `media/` with
an extension selected from the validated image bytes. Objects are written with
create-only semantics. Replacing an asset creates a separate row and object
key and returns the new asset ID; it does not overwrite the old object or move
draft or published content references. Callers must update content separately
to use the returned asset, confirm the old asset has no references, then delete
it when it is no longer needed.

The database tracks draft and published references. The API rejects deletion
while either snapshot still refers to the asset and returns a conflict. The
Admin reference count is a convenience; the server-side reference check is the
enforcement point.

## Lifecycle recovery (implementation details)

Normal uploads create metadata in `pending`, write the R2 object, then transition
the metadata to `ready`. Only ready assets are listed or returned by the asset
read endpoint. A storage write or ready-transition failure returns a generic 503. Since an interrupted S3-compatible PUT can have an ambiguous outcome, the
pending metadata is retained for reconciliation; this release has no Admin
retry endpoint or automated recovery for pending uploads. This is a tracked
operational limitation: the API cannot promote or clean up a pending row through
an operator endpoint.

Deletion transitions a ready asset to `deleting`, deletes its R2 object, then
finalizes metadata removal. If storage or metadata finalization fails, the
deleting row remains so an authorized operator can retry `DELETE /{id}` after
the underlying issue is resolved. Repeated object deletion is safe for this
workflow.

For a pending-upload incident, use approved database access to read only the
asset ID, lifecycle status, object key, and timestamps. Use approved R2 tooling
to check whether that exact key exists in the configured bucket, then compare
the timestamps with API/storage logs that do not contain credentials or image
contents. Preserve the row and any object, record the findings, and escalate to
the service owner for a separately reviewed recovery action. No automated or
documented state-promotion procedure exists in this release; do not edit the
status or delete metadata/object data directly.

The Admin delete endpoint is currently disabled. Preserve the row and object
for any lifecycle incident and escalate for a separately reviewed recovery
action. Do not manually change lifecycle states, delete rows, or remove objects
while draft or published references exist: the database constraints and audit
events are part of the lifecycle safeguards.
