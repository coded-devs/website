# COD-318 Task 2 report

- Red: before implementation, the new public API tests failed because `POST /api/v1/public/inquiries` returned 404 instead of the expected safe 503/201.
- Green: with only `INQUIRY_TEST_DATABASE_URL` set to the confirmed disposable loopback database, both focused tests passed. They verify durable normalized insert, `201 {received:true}`, no-store cache policy, unavailable and invalid responses, JSON-only handling, malformed/oversized body handling, preserved public GET behavior, and absence of a public inquiry read route.
- Changed files: `apps/api/src/inquiries/public-api.test.ts`, `apps/api/src/inquiries/public-router.ts`, `apps/api/src/inquiries/repository.ts`, and `apps/api/src/app.ts`.
- Checks passed: focused integration test; API `tsc --noEmit`; ESLint on changed TypeScript files; API build; `git diff --check`.
- Limitation: full API test discovery had one failure because existing `db/schema.test.ts` requires `TEST_DATABASE_URL`. Per task instructions, only `INQUIRY_TEST_DATABASE_URL` was set; the remaining 83 tests passed and 9 were skipped.
- Commit: `feat(api): add public inquiry submission` (see repository HEAD).
- Concerns: none identified. No migration, throttling, or Admin behavior was added.
