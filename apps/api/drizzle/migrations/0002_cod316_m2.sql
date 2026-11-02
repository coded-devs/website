ALTER TABLE "content_sections" ADD COLUMN "published_position" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "published_position" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "published_position" integer;--> statement-breakpoint
ALTER TABLE "revalidation_jobs" ADD COLUMN "targets" jsonb DEFAULT '{"paths":[],"tags":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "revalidation_jobs" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "published_position" integer;--> statement-breakpoint
ALTER TABLE "team_members" ADD COLUMN "published_position" integer;--> statement-breakpoint
INSERT INTO "content_sections" ("section_key", "position", "draft_payload")
SELECT section_key, coalesce((SELECT max("position") FROM "content_sections"), -1) + ordinal_position, '{}'::jsonb
FROM unnest(ARRAY['hero','about','services','products','projects','team','featured_insights','contact']::text[])
  WITH ORDINALITY AS approved_sections(section_key, ordinal_position)
ON CONFLICT ("section_key") DO NOTHING;--> statement-breakpoint
UPDATE "content_sections" SET "published_position" = "position" WHERE "published_payload" IS NOT NULL;--> statement-breakpoint
UPDATE "services" SET "published_position" = "position" WHERE "published_payload" IS NOT NULL;--> statement-breakpoint
UPDATE "products" SET "published_position" = "position" WHERE "published_payload" IS NOT NULL;--> statement-breakpoint
UPDATE "projects" SET "published_position" = "position" WHERE "published_payload" IS NOT NULL;--> statement-breakpoint
UPDATE "team_members" SET "published_position" = "position" WHERE "published_payload" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "content_sections" ADD CONSTRAINT "content_sections_nonnegative_published_position" CHECK ("content_sections"."published_position" is null or "content_sections"."published_position" >= 0);--> statement-breakpoint
ALTER TABLE "content_sections" ADD CONSTRAINT "content_sections_published_position_state_consistent" CHECK (("content_sections"."published_payload" is null and "content_sections"."published_position" is null) or ("content_sections"."published_payload" is not null and "content_sections"."published_position" is not null));--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_nonnegative_published_position" CHECK ("products"."published_position" is null or "products"."published_position" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_published_position_state_consistent" CHECK (("products"."published_payload" is null and "products"."published_position" is null) or ("products"."published_payload" is not null and "products"."published_position" is not null));--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_nonnegative_published_position" CHECK ("projects"."published_position" is null or "projects"."published_position" >= 0);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_published_position_state_consistent" CHECK (("projects"."published_payload" is null and "projects"."published_position" is null) or ("projects"."published_payload" is not null and "projects"."published_position" is not null));--> statement-breakpoint
ALTER TABLE "revalidation_jobs" ADD CONSTRAINT "revalidation_jobs_attempts_maximum" CHECK ("revalidation_jobs"."attempts" <= 5);--> statement-breakpoint
ALTER TABLE "revalidation_jobs" ADD CONSTRAINT "revalidation_jobs_resource_type_valid" CHECK ("revalidation_jobs"."resource_type" in ('site', 'article'));--> statement-breakpoint
ALTER TABLE "revalidation_jobs" ADD CONSTRAINT "revalidation_jobs_targets_shape" CHECK (jsonb_typeof("revalidation_jobs"."targets") = 'object' and "revalidation_jobs"."targets" ? 'paths' and "revalidation_jobs"."targets" ? 'tags' and jsonb_typeof("revalidation_jobs"."targets" -> 'paths') = 'array' and jsonb_typeof("revalidation_jobs"."targets" -> 'tags') = 'array' and "revalidation_jobs"."targets" - 'paths' - 'tags' = '{}'::jsonb);--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_nonnegative_published_position" CHECK ("services"."published_position" is null or "services"."published_position" >= 0);--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_published_position_state_consistent" CHECK (("services"."published_payload" is null and "services"."published_position" is null) or ("services"."published_payload" is not null and "services"."published_position" is not null));--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_nonnegative_published_position" CHECK ("team_members"."published_position" is null or "team_members"."published_position" >= 0);--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_published_position_state_consistent" CHECK (("team_members"."published_payload" is null and "team_members"."published_position" is null) or ("team_members"."published_payload" is not null and "team_members"."published_position" is not null));
--> statement-breakpoint
UPDATE "revalidation_jobs" SET "last_error" = CASE WHEN "last_error" IN ('configuration_unavailable', 'timeout', 'request_failed', 'invalid_response') THEN "last_error" ELSE 'request_failed' END WHERE "last_error" IS NOT NULL;--> statement-breakpoint
UPDATE "revalidation_jobs" SET "completed_at" = coalesce("completed_at", now()), "next_attempt_at" = NULL, "last_error" = NULL WHERE "status" = 'succeeded';--> statement-breakpoint
UPDATE "revalidation_jobs" SET "completed_at" = NULL, "next_attempt_at" = CASE WHEN "attempts" < 5 THEN coalesce("next_attempt_at", now()) ELSE NULL END, "last_error" = coalesce("last_error", 'request_failed') WHERE "status" = 'failed';--> statement-breakpoint
UPDATE "revalidation_jobs" SET "completed_at" = NULL, "next_attempt_at" = NULL, "last_error" = NULL WHERE "status" = 'processing';--> statement-breakpoint
UPDATE "revalidation_jobs" SET "completed_at" = NULL, "last_error" = NULL WHERE "status" = 'pending';--> statement-breakpoint
ALTER TABLE "revalidation_jobs" ADD CONSTRAINT "revalidation_jobs_last_error_allowed" CHECK ("last_error" is null or "last_error" in ('configuration_unavailable', 'timeout', 'request_failed', 'invalid_response'));--> statement-breakpoint
ALTER TABLE "revalidation_jobs" ADD CONSTRAINT "revalidation_jobs_status_consistent" CHECK (("status" = 'pending' and "completed_at" is null and "last_error" is null) or ("status" = 'processing' and "completed_at" is null and "next_attempt_at" is null and "last_error" is null) or ("status" = 'succeeded' and "completed_at" is not null and "next_attempt_at" is null and "last_error" is null) or ("status" = 'failed' and "completed_at" is null and "last_error" is not null and (("attempts" < 5 and "next_attempt_at" is not null) or ("attempts" = 5 and "next_attempt_at" is null))));
