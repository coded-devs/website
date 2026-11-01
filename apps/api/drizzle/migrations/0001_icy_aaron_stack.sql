CREATE TABLE "auth_throttle_buckets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket_type" varchar(16) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"blocked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_throttle_buckets_type_valid" CHECK ("auth_throttle_buckets"."bucket_type" in ('account', 'ip')),
	CONSTRAINT "auth_throttle_buckets_failure_count_nonnegative" CHECK ("auth_throttle_buckets"."failure_count" >= 0),
	CONSTRAINT "auth_throttle_buckets_key_hash_format" CHECK ("auth_throttle_buckets"."key_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
CREATE TABLE "recovery_code_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "recovery_code_sets_consumed_after_creation" CHECK ("recovery_code_sets"."consumed_at" is null or "recovery_code_sets"."consumed_at" >= "recovery_code_sets"."created_at")
);
--> statement-breakpoint
CREATE TABLE "recovery_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"set_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recovery_codes_position_valid" CHECK ("recovery_codes"."position" >= 0 and "recovery_codes"."position" < 8),
	CONSTRAINT "recovery_codes_hash_format" CHECK ("recovery_codes"."code_hash" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "credential_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "credential_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "recovery_code_sets" ADD CONSTRAINT "recovery_code_sets_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_codes" ADD CONSTRAINT "recovery_codes_set_id_recovery_code_sets_id_fk" FOREIGN KEY ("set_id") REFERENCES "public"."recovery_code_sets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_throttle_buckets_type_key_unique" ON "auth_throttle_buckets" USING btree ("bucket_type","key_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_code_sets_one_active_per_admin" ON "recovery_code_sets" USING btree ("admin_user_id") WHERE "recovery_code_sets"."consumed_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_codes_code_hash_unique" ON "recovery_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_codes_set_position_unique" ON "recovery_codes" USING btree ("set_id","position");--> statement-breakpoint
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_credential_version_positive" CHECK ("admin_users"."credential_version" > 0);--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_credential_version_positive" CHECK ("sessions"."credential_version" > 0);