# Isolated Coolify Compose deployment (not yet live)

This is the **replacement deployment** for the previously standalone CodedDevs API and PostgreSQL. The operator has already deleted the old resources; no running standalone API or database exists for rollback. The new stack must be initialized, validated, and backed up before accepting users. Do not run `docker compose down -v` against a database holding important data.

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

Raw Compose requires manually maintained Traefik Docker labels. Web and Admin define HTTPS host routers, HTTP-to-HTTPS redirects, explicit target service ports (3000 and 3001), and the `codweb-frontend` proxy network. Router hostname rules are **required configuration**, not hard-coded defaults: `WEB_ROUTER_HOST` and `ADMIN_ROUTER_HOST` must be deliberately provided in Coolify before deployment. Set them to restricted candidate hostnames for a private test or, if proceeding directly to the final deployment as chosen here, to `codeddevs.org` and `admin.codeddevs.org`. Labels begin registering those hostnames with Traefik **as soon as the new containers start**, regardless of whether Coolify's Domains UI contains entries. Check for conflicting routers before deploying. Neither API nor PostgreSQL defines public Traefik routers, and neither joins the proxy network. Coolify's Domains UI may record the same hostnames for resource management, but **do not rely on its generated routing when Raw Compose is enabled**.

Before deployment, confirm the Coolify proxy has entrypoints named `http` and `https` and a certificate resolver named `letsencrypt`. Confirm that both DNS records route through the intended Cloudflare configuration and that the origin's HTTPS certificate validation, Cloudflare-only access restrictions, and forwarded client-IP boundaries are correctly set. This configuration does not by itself protect the origin from direct traffic.

The previous standalone API and PostgreSQL resources have been intentionally deleted, so the fresh Compose PostgreSQL volume must be initialized and backed up before opening the site. Coolify domain settings must map `codeddevs.org` to Web port 3000 and `admin.codeddevs.org` to Admin port 3001; no domain must be configured for API or PostgreSQL.

## Configure in Coolify (pre-cutover)

1. The old standalone `codweb-api` and `cod-pgsql` resources have already been **deleted by the operator**. Do not assume they exist for rollback. Preserve the R2 backups and securely saved credentials.
2. Create a **new** Docker Compose application from `coded-devs/website` on `main`, pointing to `deploy/coolify/compose.isolated.yml`; verify that Coolify resolves every build context to the repo root. Use **Show Deployable Compose** to review generated networks, volumes, labels, and routing before deploying.
3. Configure separate secrets in the new resource. Required interpolated variables are `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `AUTH_THROTTLE_HMAC_SECRET`, `CONTENT_REVALIDATION_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `WEB_INTERNAL_ORIGIN`, `WEB_ROUTER_HOST`, and `ADMIN_ROUTER_HOST`. The API database URL must point to **`postgres:5432`** inside this new stack, with the new database credentials and a properly URL-encoded password. Ensure `POSTGRES_DB` matches its path. Do not reuse the URL of the old standalone database, print secrets, or include them in Git. Both `AUTH_THROTTLE_HMAC_SECRET` and `CONTENT_REVALIDATION_SECRET` require exactly **64 hexadecimal characters** (32 random bytes), not base64 or a generic password. Generate separate random values inside an approved secret manager; for example, run `openssl rand -hex 32` only in a protected session and transfer the result directly into the secret store without saving it to shell history, CI logs, chat, or Git.
4. The Admin and Web backends use `http://api:4000` on the private `frontend` network. Confirm authenticated Cloudflare origin and normalized forwarded-IP headers before accepting `API_TRUST_PROXY_HOPS=1`. Configure `WEB_INTERNAL_ORIGIN=https://codeddevs.org` for direct production rollout only if the HTTPS route reaches this new Web container; test content revalidation once routing works. It is **not** the internal Docker service URL and the API requires HTTPS in production.
5. Choose the routing hostnames **explicitly** before deployment. For direct production rollout, set `WEB_ROUTER_HOST=codeddevs.org` and `ADMIN_ROUTER_HOST=admin.codeddevs.org` in Coolify, confirm their DNS/TLS configuration and that no other router owns them, and obtain operator approval before starting the stack. If private testing is required, instead configure restricted candidate hostnames and update `WEB_INTERNAL_ORIGIN` to that candidate HTTPS Web origin. Coolify must not add domains for API/PostgreSQL; if it rewrites networks or publishes extra ports, stop.
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

The previously standalone API and PostgreSQL resources were removed before this replacement launched. **There is no immediate rollback to running old containers.** With no user-generated data, initialize the new database from reviewed migrations, provision its administrator, and verify backups and restore capability before serving users. Keep protected copies of the necessary Coolify configuration and credentials outside Git.

For direct production rollout, configure `WEB_ROUTER_HOST=codeddevs.org` and `ADMIN_ROUTER_HOST=admin.codeddevs.org` before the first deploy. These Host rules take effect as soon as Traefik discovers the containers; Coolify's Domains UI is not a safety switch. Verify DNS, TLS, proxy entrypoints and Cloudflare origin restrictions before deployment. After deployment verify traffic, health and end-to-end content publication. On failure, stop or disable the new routers and repair or rebuild from the reviewed Compose configuration and database backup. Do not delete the volume or assume an old database can be restored automatically. Operator authorization is still required before exposing the service.
