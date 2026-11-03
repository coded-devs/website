# Media management

The API owns media validation, metadata, and object-storage writes. The Admin
browser sends uploads to the API and receives a read-only delivery URL. It never
receives R2 credentials or writes directly to the bucket.

## Supported uploads

Uploads accept one `file` field and an optional `altText` field as
`multipart/form-data`. The file must be a complete JPEG, PNG, or WebP image; the
declared MIME type must match the decoded image. The API limits files to 10 MiB,
image dimensions to 12,000 pixels on either side, and decoded input to 20 million
pixels. It fully decodes image data before storing it. Alternative text is
limited to 500 characters for both uploads and edits; the multipart parser
also caps its raw input at 2 KiB.

Invalid, truncated, unsupported, or oversized data is rejected before metadata
becomes ready. Upload and replacement requests require the Admin session cookie,
the configured `Origin`, and the `X-CodedDevs-CSRF: 1` header.

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

| Method and path      | Behavior                                                                |
| -------------------- | ----------------------------------------------------------------------- |
| `GET /`              | List ready assets; supports `search`, `mimeType`, `page`, and `limit`   |
| `GET /{id}`          | Read one ready asset and its delivery URL                               |
| `POST /upload`       | Upload a new image using `file` and optional `altText` multipart fields |
| `PUT /{id}/alt-text` | Update `altText` with a JSON body                                       |
| `POST /{id}/replace` | Upload a new asset to replace an existing one                           |
| `DELETE /{id}`       | Delete an asset only when it has no content references                  |

For example, an upload uses the same headers as other Admin writes and the
browser-generated multipart boundary:

```sh
curl --cookie '...session cookie...' \
  -H 'Origin: https://admin.example.test' \
  -H 'X-CodedDevs-CSRF: 1' \
  -F 'file=@logo.png;type=image/png' \
  -F 'altText=Company logo' \
  https://api.example.test/api/v1/admin/media/upload
```

Do not manually set the multipart `Content-Type` header in browser code; the
client must include the boundary generated with the form body.

## Immutable replacement and references

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

## Lifecycle recovery

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

For deleting assets, retry the Admin delete endpoint after the storage or
database issue is resolved; it repeats the object removal and metadata
finalization. Do not manually change lifecycle states, delete rows, or remove
objects while draft or published references exist: the database constraints
and audit events are part of the lifecycle safeguards.
