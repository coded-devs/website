# Isolated Coolify Compose deployment (candidate, not yet live)

This is an **alternative** to the existing four standalone Coolify resources. The current healthy API and PostgreSQL stay untouched until this configuration passes CI, a non-public deployment, and a manual cutover gate. Do not run `docker compose down -v` against a database holding important data.

## Intended network boundaries

| Service | Networks | Public hostname |
| --- | --- | --- |
| web | `proxy` (existing `codweb-frontend`), `frontend` | `codeddevs.org` only at cutover |
| admin | `proxy`, `frontend` | `admin.codeddevs.org` only at cutover |
| api | `frontend`, `database` | **none** |
| postgres | `database` only, `internal: true` | **none** |

The Coolify **Traefik proxy is already connected to both `codweb-frontend` and `codweb-db`**. Consequently `codweb-db` is **not** a suitable database isolation boundary. Compose deliberately creates its **own** `database` network with `internal: true`, instead of attaching PostgreSQL to `codweb-db`. Do not enable **Connect To Predefined Network** for this stack; the Compose file explicitly attaches Web/Admin to the existing `codweb-frontend` network only.

No `ports:` mappings exist. API and PostgreSQL cannot be reached through a Coolify domain, host-published port, or `proxy` network. The API retains outbound access for R2 through the `frontend` network. Docker network separation is not a substitute for validating reverse-proxy routing, trusted forwarded headers, app authorization, or server firewall rules.

## Configure in Coolify (pre-cutover)

1. Keep the current standalone `codweb-api` and `cod-pgsql` **running**. Don't remove either or its volume.
2. Create a **new** Docker Compose application from `coded-devs/website` on `main`, pointing to `deploy/coolify/compose.isolated.yml`; verify that Coolify resolves every build context to the repo root. Use **Show Deployable Compose** to review generated networks, volumes, labels, and routing before deploying.
3. Configure separate secrets in the new resource. Required interpolated variables are `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `AUTH_THROTTLE_HMAC_SECRET`, `CONTENT_REVALIDATION_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`. The API database URL must point to **`postgres:5432`** inside this new stack, with the new database credentials and a properly URL-encoded password. Ensure `POSTGRES_DB` matches its path. Do not reuse the URL of the old standalone database, print secrets, or include them in Git.
4. The Admin and Web backends use `http://api:4000` on the private `frontend` network. Confirm the effective direct client-IP forwarding path, including authenticated Cloudflare origin and normalized headers, **before accepting `API_TRUST_PROXY_HOPS=1`**. `WEB_INTERNAL_ORIGIN` remains `https://codeddevs.org`.
5. For dry-run deployment, **do not add public domains or move DNS yet**; the existing site domains must not be assigned to two live resources. Coolify must not add a domain to API or PostgreSQL. If Coolify rewrites networks or creates unauthorized host port mappings, stop and revise the configuration.
6. PostgreSQL data lives in the named Compose `postgres_data` volume (distinct from the existing standalone database volume). Keep backup credentials, R2 backup policies, encryption, and retention separately configured and verify an actual restore to an isolated database.

## Explicit schema installation

After PostgreSQL is healthy, using the **new Compose application's service image** and the internal database network, run a one-time command from the deployment environment:

```bash
docker compose -f deploy/coolify/compose.isolated.yml run --rm --no-deps api node dist/db/migrate.js
```

This is an **illustration for an operator running the same Compose project and secret environment as Coolify**. Coolify generates a deployed Compose model and project name; use its actual deployment context rather than running the raw repository file with missing variables or spawning a separate database project. Before invoking, review the migrations in the exact image and verify the selected database and backup. Do not put migrations in a startup hook or automatically retry failures.

## Acceptance checks before public cutover

- Validate rendered Compose and exact network membership: Web/Admin have `proxy` + `frontend`; API has `frontend` + `database`; PostgreSQL has `database` only. Inspect Docker's actual network attachments, not just labels.
- From **Web and Admin**, query `api:4000` and verify `postgres:5432` is unreachable; from **API**, verify `postgres:5432` is reachable; from **Traefik**, verify PostgreSQL and API are unreachable by direct private network address.
- From API, GET `http://127.0.0.1:4000/api/v1/ready` returns 200 after migrations; Web `/robots.txt` and Admin `/login` return 200. Verify service container health after starting.
- Confirm Cloudflare-to-Traefik-to-Web/Admin request routing and protected origin `CF-Connecting-IP` handling; test requests with spoofed forwarded headers are rejected/sanitized. Verify sessions, CSRF, inquiry submission, CMS publication/revalidation, and R2 media operations.
- Confirm database persistence across controlled restart and complete a backup restore drill. Test both public domains and TLS routes after approved cutover.

## Cutover and rollback

Treat the old deployment as the rollback reference: record original image SHA, Coolify resource IDs, environment variable names (never values), and backup state. Use a maintenance window if database writes have begun. With no user-generated data, the new database can be initialized from reviewed migrations; don't assume two separate databases remain synchronized once traffic begins.

After approval, configure `codeddevs.org` for Web and `admin.codeddevs.org` for Admin using Coolify's domain settings and its Traefik routing. Remove conflicting domain routes on old resources as needed. Verify traffic resolves to the **new** stack and all acceptance checks pass before decommissioning old resources. On failure, restore the old domains/resources and investigate schema and write divergence; do not automatically roll back schema or delete either volume. Keep production deployment gated on explicit operator authorization.
