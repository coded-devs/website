# Isolated Coolify Compose deployment (candidate, not yet live)

This is an **alternative** to the existing four standalone Coolify resources. The current healthy API and PostgreSQL stay untouched until this configuration passes CI, a non-public deployment, and a manual cutover gate. Do not run `docker compose down -v` against a database holding important data.

## Intended network boundaries

| Service  | Networks                                         | Public hostname                       |
| -------- | ------------------------------------------------ | ------------------------------------- |
| web      | `proxy` (existing `codweb-frontend`), `frontend` | `codeddevs.org` only at cutover       |
| admin    | `proxy`, `frontend`                              | `admin.codeddevs.org` only at cutover |
| api      | `frontend`, `database`                           | **none**                              |
| postgres | `database` only, `internal: true`                | **none**                              |

The Coolify **Traefik proxy is already connected to both `codweb-frontend` and `codweb-db`**. Consequently `codweb-db` is **not** a suitable database isolation boundary. Compose deliberately creates its **own** `database` network with `internal: true`, instead of attaching PostgreSQL to `codweb-db`. Do not enable **Connect To Predefined Network** for this stack; the Compose file explicitly attaches Web/Admin to the existing `codweb-frontend` network only.

No `ports:` mappings exist. API and PostgreSQL cannot be reached through a Coolify domain, host-published port, or `proxy` network. The API retains outbound access for R2 through the `frontend` network. Docker network separation is not a substitute for validating reverse-proxy routing, trusted forwarded headers, app authorization, or server firewall rules.

## Raw Compose HTTPS routing

Raw Compose requires manually maintained Traefik Docker labels. Web and Admin define HTTPS host routers, HTTP-to-HTTPS redirects, explicit target service ports (3000 and 3001), and the `codweb-frontend` proxy network. Neither API nor PostgreSQL defines public Traefik routers, and neither joins the proxy network. Coolify's Domains UI may record the same hostnames for resource management, but **do not rely on its generated routing when Raw Compose is enabled**.

Before deployment, confirm the Coolify proxy has entrypoints named `http` and `https` and a certificate resolver named `letsencrypt`. Confirm that both DNS records route through the intended Cloudflare configuration and that the origin's HTTPS certificate validation, Cloudflare-only access restrictions, and forwarded client-IP boundaries are correctly set. This configuration does not by itself protect the origin from direct traffic.

The previous standalone API and PostgreSQL resources have been intentionally deleted, so the fresh Compose PostgreSQL volume must be initialized and backed up before opening the site. Coolify domain settings must map `codeddevs.org` to Web port 3000 and `admin.codeddevs.org` to Admin port 3001; no domain must be configured for API or PostgreSQL.

## Configure in Coolify (pre-cutover)

1. Keep the current standalone `codweb-api` and `cod-pgsql` **running**. Don't remove either or its volume.
2. Create a **new** Docker Compose application from `coded-devs/website` on `main`, pointing to `deploy/coolify/compose.isolated.yml`; verify that Coolify resolves every build context to the repo root. Use **Show Deployable Compose** to review generated networks, volumes, labels, and routing before deploying.
3. Configure separate secrets in the new resource. Required interpolated variables are `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `AUTH_THROTTLE_HMAC_SECRET`, `CONTENT_REVALIDATION_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `WEB_INTERNAL_ORIGIN`. The API database URL must point to **`postgres:5432`** inside this new stack, with the new database credentials and a properly URL-encoded password. Ensure `POSTGRES_DB` matches its path. Do not reuse the URL of the old standalone database, print secrets, or include them in Git. Both `AUTH_THROTTLE_HMAC_SECRET` and `CONTENT_REVALIDATION_SECRET` require exactly **64 hexadecimal characters** (32 random bytes), not base64 or a generic password. Generate separate random values inside an approved secret manager; for example, run `openssl rand -hex 32` only in a protected session and transfer the result directly into the secret store without saving it to shell history, CI logs, chat, or Git.
4. The Admin and Web backends use `http://api:4000` on the private `frontend` network. Confirm the effective direct client-IP forwarding path, including authenticated Cloudflare origin and normalized headers, **before accepting `API_TRUST_PROXY_HOPS=1`**. `WEB_INTERNAL_ORIGIN` must be an **operator-supplied, candidate-specific HTTPS origin** which routes to the **replacement Web**, never the live `https://codeddevs.org` site during pre-cutover testing. The API enforces HTTPS for this value in production; do not relax that contract. Provision a restricted preview HTTPS hostname reachable from the candidate API before testing revalidation; this preview route must not replace or conflict with the live domain. After cutover, set it to the verified production Web HTTPS origin.
5. For dry-run deployment, **do not assign either existing production domain or move their DNS yet**. A restricted candidate-only HTTPS preview route is needed for revalidation testing; it must be access-controlled and separately configured from production. Coolify must not add a domain to API or PostgreSQL. If Coolify rewrites networks or creates unauthorized host port mappings, stop and revise the configuration.
6. PostgreSQL data lives in the named Compose `postgres_data` volume (distinct from the existing standalone database volume). Keep backup credentials, R2 backup policies, encryption, and retention separately configured and verify an actual restore to an isolated database.

## Explicit schema installation

After PostgreSQL is healthy, using the **new Compose application's service image** and the internal database network, run a one-time command from the deployment environment:

```bash
docker compose -f deploy/coolify/compose.isolated.yml run --rm --no-deps api node dist/db/migrate.js
```

This is an **illustration for an operator running the same Compose project and secret environment as Coolify**. Coolify generates a deployed Compose model and project name; use its actual deployment context rather than running the raw repository file with missing variables or spawning a separate database project. Before invoking, review the migrations in the exact image and verify the selected database and backup. Do not put migrations in a startup hook or automatically retry failures.

## Super Admin provisioning

After the candidate database migrations finish, provision the sole Super Admin in the **candidate database** before testing sessions, authentication, and CMS publishing. The verified production image contains `dist/auth/provision-admin.js` (built from `apps/api/src/auth/provision-admin.ts`), and `apps/api/package.json` exposes it through `admin:provision`. The command accepts exactly one email argument and reads the password only from **non-interactive protected stdin**; do not pass a password in shell arguments, environment variables, or logs.

```bash
# Illustration only; use the actual Coolify-generated Compose project and its protected secret context.
# <admin-email> is the new operator's address. Supply the password via a secure private pipe or protected stdin.
docker compose -f deploy/coolify/compose.isolated.yml run --rm -T --no-deps api node dist/auth/provision-admin.js "$ADMIN_EMAIL"
```

Never paste a password into a shell command or use an unprotected pipe containing literal credentials. Only execute once a protected-input mechanism is available that does not expose the password to terminal history or log capture. Provisioning emits **eight recovery codes once** on standard output. Disable terminal recording and capture those codes immediately into approved offline encrypted storage; never copy them into chat, CI output, or deployment logs. Follow [authentication operations](authentication.md) for ownership and recovery policy.

## Acceptance checks before public cutover

- Validate rendered Compose and exact network membership: Web/Admin have `proxy` + `frontend`; API has `frontend` + `database`; PostgreSQL has `database` only. Inspect Docker's actual network attachments, not just labels.
- From **Web and Admin**, query `api:4000` and verify `postgres:5432` is unreachable; from **API**, verify `postgres:5432` is reachable; from **Traefik**, verify PostgreSQL and API are unreachable by direct private network address.
- From API, GET `http://127.0.0.1:4000/api/v1/ready` returns 200 after migrations; Web `/robots.txt` and Admin `/login` return 200. Verify service container health after starting.
- Confirm Cloudflare-to-Traefik-to-Web/Admin request routing and protected origin `CF-Connecting-IP` handling; test requests with spoofed forwarded headers are rejected/sanitized. Verify sessions, CSRF, inquiry submission, CMS publication/revalidation, and R2 media operations.
- Confirm database persistence across controlled restart and complete a backup restore drill. Test both public domains and TLS routes after approved cutover.

## Cutover and rollback

Treat the old deployment as the rollback reference: record original image SHA, Coolify resource IDs, environment variable names (never values), and backup state. Use a maintenance window if database writes have begun. With no user-generated data, the new database can be initialized from reviewed migrations; don't assume two separate databases remain synchronized once traffic begins.

After approval, configure `codeddevs.org` for Web and `admin.codeddevs.org` for Admin using Coolify's domain settings and its Traefik routing. Remove conflicting domain routes on old resources as needed. Verify traffic resolves to the **new** stack and all acceptance checks pass before decommissioning old resources. On failure, restore the old domains/resources and investigate schema and write divergence; do not automatically roll back schema or delete either volume. Keep production deployment gated on explicit operator authorization.
