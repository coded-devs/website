# Coolify Compose deployment with standalone PostgreSQL

The `codweb` Coolify resource runs Web, Admin, and API from this Compose file. PostgreSQL is a separate Coolify-managed database on the same server and the private `codweb-db-private` destination. This Compose stack has no PostgreSQL service. Preserve the legacy `postgres-data` mount still attached to `codweb` until its owner and purpose are confirmed; do not remove it or use `docker compose down -v` as part of routine deployment cleanup.

## Intended network boundaries

| Service                  | Networks                                               | Public hostname             |
| ------------------------ | ------------------------------------------------------ | --------------------------- |
| web                      | `proxy` (existing `codweb-frontend`), `frontend`       | `codeddevs.org`             |
| admin                    | `proxy`, `frontend`                                    | `admin.codeddevs.org`       |
| api                      | `frontend`, `database`                                 | **none**                    |
| standalone PostgreSQL 16 | `database` (dedicated destination `codweb-db-private`) | **none; no published port** |

The API and standalone database share the dedicated Coolify destination network named `codweb-db-private`; Web and Admin do not. Keep the database's `is_public` setting disabled, do not assign it a domain, and do not publish port 5432. Confirm the actual Docker network membership and proxy reachability on the VPS before cutover. The API retains outbound access for R2 through the `frontend` network. Docker network separation is not a substitute for validating reverse-proxy routing, trusted forwarded headers, app authorization, or server firewall rules.

## Raw Compose HTTPS routing

Raw Compose requires manually maintained Traefik Docker labels. Web and Admin define HTTPS host routers, HTTP-to-HTTPS redirects, explicit target service ports (3000 and 3001), and the `codweb-frontend` proxy network. Router hostname rules are **required configuration**, not hard-coded defaults: `WEB_ROUTER_HOST` and `ADMIN_ROUTER_HOST` must be deliberately provided in Coolify before deployment. Set them to restricted candidate hostnames for a private test or, if proceeding directly to the final deployment as chosen here, to `codeddevs.org` and `admin.codeddevs.org`. Labels begin registering those hostnames with Traefik **as soon as the new containers start**, regardless of whether Coolify's Domains UI contains entries. Check for conflicting routers before deploying. Neither API nor PostgreSQL defines public Traefik routers, and neither joins the proxy network. Coolify's Domains UI may record the same hostnames for resource management, but **do not rely on its generated routing when Raw Compose is enabled**.

Before deployment, confirm the Coolify proxy has entrypoints named `http` and `https` and a certificate resolver named `letsencrypt`. Confirm that both DNS records route through the intended Cloudflare configuration and that the origin's HTTPS certificate validation, Cloudflare-only access restrictions, and forwarded client-IP boundaries are correctly set. This configuration does not by itself protect the origin from direct traffic.

Do not treat the legacy `postgres-data` mount as a verified database rollback copy. Coolify domain settings map `codeddevs.org` to Web port 3000 and `admin.codeddevs.org` to Admin port 3001; no domain is configured for API or PostgreSQL.

## Current Coolify configuration

1. Keep the standalone PostgreSQL 16 resource private, persistent, and attached to `codweb-db-private`. Use its generated Internal URL for API `DATABASE_URL`; do not construct or print the credential-bearing URL.
2. Preserve the existing API secrets and R2 integration. Both `AUTH_THROTTLE_HMAC_SECRET` and `CONTENT_REVALIDATION_SECRET` require exactly **64 hexadecimal characters** (32 random bytes), not base64. The revalidation secret must match between Web and API. Do not save values in shell history, CI logs, chat, or Git.
3. Web and Admin use `http://api:4000` on the private `frontend` network. Keep `WEB_INTERNAL_ORIGIN=https://codeddevs.org`; it is the HTTPS origin used for content revalidation, not an internal Docker service URL. `API_TRUST_PROXY_HOPS=1` is valid only while the direct Web/Admin-to-API path and normalized forwarded-IP boundary remain in place.
4. Preserve current Web and Admin domains, proxy labels, and network attachments. Do not add public domains or published ports for API or PostgreSQL.
5. Coolify has an enabled PostgreSQL backup schedule. Preserve it and its storage configuration; verify restore procedures separately. Do not delete the legacy `postgres-data` mount or change network membership during this cleanup.

## Explicit schema installation

The API does not migrate at startup. After the standalone PostgreSQL resource is healthy and `DATABASE_URL` is set to its generated Internal URL, use the deployed API image and private database network to run the checked-in migrations:

```bash
docker compose --profile ops -f deploy/coolify/compose.isolated.yml run --rm --no-deps api-ops
```

This is an **illustration for an operator running the same Compose project and secret environment as Coolify**. Coolify generates a deployed Compose model and project name; use its actual deployment context rather than running the raw repository file with missing variables or starting a second database project. The `ops` profile keeps the command container out of normal deployments and attaches it only to the database network. Before invoking, review the migrations in the exact image and verify the selected database and backup. Do not put migrations in a startup hook or automatically retry failures.

## Super Admin provisioning

After the standalone database migrations finish, provision the sole Super Admin there before testing sessions, authentication, and CMS publishing. The production image contains `dist/auth/provision-admin.js` (built from `apps/api/src/auth/provision-admin.ts`), and `apps/api/package.json` exposes it through `admin:provision`. The command accepts exactly one email argument and reads the password only from **non-interactive protected stdin**; do not pass a password in shell arguments, environment variables, or logs.

```bash
# Illustration only; use the actual Coolify-generated Compose project and a protected input channel.
# <admin-email> is the new operator's address. Supply the password via a secure private pipe or protected stdin.
docker compose --profile ops -f deploy/coolify/compose.isolated.yml run --rm -T --no-deps api-ops node dist/auth/provision-admin.js "$ADMIN_EMAIL"
```

Never paste a password into a shell command or use an unprotected pipe containing literal credentials. Only execute once a protected-input mechanism is available that does not expose the password to terminal history or log capture. Provisioning emits **eight recovery codes once** on standard output. Disable terminal recording and capture those codes immediately into approved offline encrypted storage; never copy them into chat, CI output, or deployment logs. Follow [authentication operations](authentication.md) for ownership and recovery policy.

## Post-initialization checks

- Validate rendered Compose and exact network membership: Web/Admin have `proxy` + `frontend`; API has `frontend` + `database`; standalone PostgreSQL has `database` only. Inspect Docker's actual network attachments, not just labels.
- From **Web and Admin**, query the API and verify PostgreSQL is unreachable; from **API**, verify the standalone PostgreSQL Internal URL is reachable; from **Traefik**, verify PostgreSQL is unreachable by direct private network address.
- From API, GET `http://127.0.0.1:4000/api/v1/ready` returns 200 after migrations; Web `/robots.txt` and Admin `/login` return 200. Verify service container health after starting.
- Confirm Cloudflare-to-Traefik-to-Web/Admin request routing and protected origin `CF-Connecting-IP` handling; test requests with spoofed forwarded headers are rejected/sanitized. Verify sessions, CSRF, inquiry submission, CMS publication/revalidation, and R2 media operations.
- Confirm database persistence across a controlled restart and complete a backup restore drill. Test both public domains and TLS routes.

## Rollback and retained storage

Keep the previous API image available until smoke checks pass. An application rollback does not reverse a database migration; check schema compatibility before rolling back the API. Never repoint `DATABASE_URL` to an unverified database as a rollback shortcut. Retain the legacy `postgres-data` mount until its ownership, contents, backup status, and retention requirements are established. Keep protected copies of necessary Coolify configuration and credentials outside Git.
