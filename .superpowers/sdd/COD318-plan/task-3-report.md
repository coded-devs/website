# COD-318 Task 3 report

- Red/green: Added PostgreSQL API coverage first; initial run was red because the new throttle table did not exist yet. After implementing the schema, transaction, and migration, the inquiry suite passed, including parser/schema IP counting, same-IP limits, normalized email limits across IPs, concurrent separate app instances, and Retry-After behavior.
- Migration: Drizzle-generated `0004_furry_storm.sql`; reviewed as additive only. It creates `inquiry_throttle_buckets`, kind/hash/count/window/expiry constraints, unique and expiry indexes, and the standard `updated_at` trigger. No DROP, data, or credentials. Expired rows are cleanup-eligible; no worker was added.
- Safety: Uses HMAC-SHA256 domain-separated IP/email identifiers, trusted Express `request.ip`, fixed IP-then-email row-lock order, and transactional valid admission plus inquiry insert. Invalid parser/schema requests consume IP budget only.
- Checks: API inquiry PostgreSQL tests passed against `INQUIRY_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:63607/cod318_inquiry_test`; API ESLint, typecheck, build, and Prettier checks passed. `pnpm` could not run because NVM firewall blocked the package-manager entrypoint, so equivalent local binaries were used.
- Commit: `feat(api): add durable inquiry abuse controls`.
- Concerns: Bucket cleanup remains an operational maintenance task; this change intentionally adds no worker.
