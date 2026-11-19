# Coolify Compose deployment with standalone PostgreSQL

The `codweb` Coolify resource runs Web, Admin, and API from this Compose file. PostgreSQL is a separate Coolify-managed database on the same server and private Docker destination. During cutover, keep the old Compose PostgreSQL container and volume until the standalone database, API, and authentication have been verified. Do not run `docker compose down -v` against a database holding important data.

## Intended network boundaries

| Service                 | Networks                                           | Public hostname                       |
| ----------------------- | -------------------------------------------------- | ------------------------------------- |
| web                     | `proxy` (existing `codweb-frontend`), `frontend`   | `codeddevs.org`                        |
| admin                   | `proxy`, `frontend`                                | `admin.codeddevs.org`                  |
| api                     | `frontend`, `database`                             | **none**                              |
| standalone PostgreSQL 16 | `database` (dedicated destination `codweb-db-private`) | **none; no published port**       |

The API and standalone database share the dedicated Coolify destination network named `codweb-db-private`; Web and Admin do not. Keep the database's `is_public` setting disabled, do not assign it a domain, and do not publish port 5432. Confirm the actual Docker network membership and proxy reachability on the VPS before cutover. The API retains outbound access for R2 through the `frontend` network. Docker network separation is not a substitute for validating reverse-proxy routing, trusted forwarded headers, app authorization, or server firewall rules.

## Raw Compose HTTPS routing

Raw Compose requires manually maintained Traefik Docker labels. Web and Admin define HTTPS host routers, HTTP-to-HTTPS redirects, explicit target service ports (3000 and 3001), and the `codweb-frontend` proxy network. Router hostname rules are **required configuration**, not hard-coded defaults: `WEB_ROUTER_HOST` and `ADMIN_ROUTER_HOST` must be deliberately provided in Coolify before deployment. Set them to restricted candidate hostnames for a private test or, if proceeding directly to the final deployment as chosen here, to `codeddevs.org` and `admin.codeddevs.org`. Labels begin registering those hostnames with Traefik **as soon as the new containers start**, regardless of whether Coolify's Domains UI contains entries. Check for conflicting routers before deploying. Neither API nor PostgreSQL defines public Traefik routers, and neither joins the proxy network. Coolify's Domains UI may record the same hostnames for resource management, but **do not rely on its generated routing when Raw Compose is enabled**.

Before deployment, confirm the Coolify proxy has entrypoints named `http` and `https` and a certificate resolver named `letsencrypt`. Confirm that both DNS records route through the intended Cloudflare configuration and that the origin's HTTPS certificate validation, Cloudflare-only access restrictions, and forwarded client-IP boundaries are correctly set. This configuration does not by itself protect the origin from direct traffic.

The previous Compose PostgreSQL volume is the rollback copy during migration. Coolify domain settings must map `codeddevs.org` to Web port 3000 and `admin.codeddevs.org` to Admin port 3001; no domain must be configured for API or PostgreSQL.

## Configure in Coolify (pre-cutover)

1. Create or verify a standalone PostgreSQL 16 resource in the same Coolify project, production environment, server, and private destination as the API. Keep it private and persistent, and verify its external backup schedule before cutover.
2. Keep the current Compose database running while preparing and validating the standalone database. Do not delete its container, volume, or credentials until cutover checks pass.
3. Set the API's Coolify-managed `DATABASE_URL` to the standalone resource's generated Internal URL. Keep the password URL-encoded by Coolify's generated URL; do not construct or print it. Configure the existing application secrets in Coolify. Both `AUTH_THROTTLE_HMAC_SECRET` and `CONTENT_REVALIDATION_SECRET` require exactly **64 hexadecimal characters** (32 random bytes), not base64 or a generic password. Generate separate random values inside an approved secret manager; do not save them in shell history, CI logs, chat, or Git.
4. The Admin and Web backends use `http://api:4000` on the private `frontend` network. Confirm authenticated Cloudflare origin and normalized forwarded-IP headers before accepting `API_TRUST_PROXY_HOPS=1`. Configure `WEB_INTERNAL_ORIGIN=https://codeddevs.org` for direct production rollout only if the HTTPS route reaches this new Web container; test content revalidation once routing works. It is **not** the internal Docker service URL and the API requires HTTPS in production.
5. Preserve the existing production hostnames `codeddevs.org` and `admin.codeddevs.org`. Confirm their DNS/TLS configuration and that no conflicting router owns them before deployment. If private testing is required, use restricted candidate hostnames and update `WEB_INTERNAL_ORIGIN` to that candidate HTTPS Web origin. Coolify must not add domains for API/PostgreSQL or publish extra ports.
6. PostgreSQL data lives in the standalone resource's Coolify-managed persistent volume. Keep backup credentials, R2 policies, encryption, and retention separately configured and verify an actual restore to an isolated database.

## Explicit schema installation

After the standalone PostgreSQL resource is healthy, use the API image and its private database network to run the checked-in migrations exactly once:

```bash
docker compose --profile ops -f deploy/coolify/compose.isolated.yml run --rm --no-deps api-ops
```

This is an **illustration for an operator running the same Compose project and secret environment as Coolify**. Coolify generates a deployed Compose model and project name; use its actual deployment context rather than running the raw repository file with missing variables or starting a second database project. The `ops` profile keeps the command container out of normal deployments and attaches it only to the database network. Before invoking, review the migrations in the exact image and verify the selected database and external backup. Do not put migrations in a startup hook or automatically retry failures.

## Super Admin provisioning

After the standalone database migrations finish, provision the sole Super Admin there before testing sessions, authentication, and CMS publishing. The production image contains `dist/auth/provision-admin.js` (built from `apps/api/src/auth/provision-admin.ts`), and `apps/api/package.json` exposes it through `admin:provision`. The command accepts exactly one email argument and reads the password only from **non-interactive protected stdin**; do not pass a password in shell arguments, environment variables, or logs.

```bash
# Illustration only; use the actual Coolify-generated Compose project and a protected input channel.
# <admin-email> is the new operator's address. Supply the password via a secure private pipe or protected stdin.
docker compose --profile ops -f deploy/coolify/compose.isolated.yml run --rm -T --no-deps api-ops node dist/auth/provision-admin.js "$ADMIN_EMAIL"
```

Never paste a password into a shell command or use an unprotected pipe containing literal credentials. Only execute once a protected-input mechanism is available that does not expose the password to terminal history or log capture. Provisioning emits **eight recovery codes once** on standard output. Disable terminal recording and capture those codes immediately into approved offline encrypted storage; never copy them into chat, CI output, or deployment logs. Follow [authentication operations](authentication.md) for ownership and recovery policy.

## Acceptance checks before cutover

- Validate rendered Compose and exact network membership: Web/Admin have `proxy` + `frontend`; API has `frontend` + `database`; standalone PostgreSQL has `database` only. Inspect Docker's actual network attachments, not just labels.
- From **Web and Admin**, query the API and verify PostgreSQL is unreachable; from **API**, verify the standalone PostgreSQL Internal URL is reachable; from **Traefik**, verify PostgreSQL is unreachable by direct private network address.
- From API, GET `http://127.0.0.1:4000/api/v1/ready` returns 200 after migrations; Web `/robots.txt` and Admin `/login` return 200. Verify service container health after starting.
- Confirm Cloudflare-to-Traefik-to-Web/Admin request routing and protected origin `CF-Connecting-IP` handling; test requests with spoofed forwarded headers are rejected/sanitized. Verify sessions, CSRF, inquiry submission, CMS publication/revalidation, and R2 media operations.
- Confirm database persistence across controlled restart and complete a backup restore drill. Test both public domains and TLS routes after approved cutover.

## Cutover and rollback

Keep the previous Compose PostgreSQL container and volume available while the standalone database is initialized and the API is cut over. With no real user data, initialize the standalone database from reviewed migrations and provision its administrator through the secure operator command. Verify health, backup, API readiness, authentication, and essential CMS behavior before removing the old PostgreSQL service from Compose. Keep protected copies of the necessary Coolify configuration and credentials outside Git.

The production hostnames are already configured on the live application; preserve their current routing during the database cutover. Verify DNS, TLS, proxy entrypoints, Cloudflare origin restrictions, and private network membership before deployment. On failure, restore the previous API image and point `DATABASE_URL` back to the still-running Compose PostgreSQL. Do not delete the old volume until the standalone deployment is stable and the rollback window has ended.
