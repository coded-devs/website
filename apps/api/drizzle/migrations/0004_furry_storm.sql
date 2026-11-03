CREATE TABLE "inquiry_throttle_buckets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(16) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"request_count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inquiry_throttle_buckets_kind_valid" CHECK ("inquiry_throttle_buckets"."kind" in ('ip', 'email')),
	CONSTRAINT "inquiry_throttle_buckets_count_nonnegative" CHECK ("inquiry_throttle_buckets"."request_count" >= 0),
	CONSTRAINT "inquiry_throttle_buckets_key_hash_format" CHECK ("inquiry_throttle_buckets"."key_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "inquiry_throttle_buckets_expiry_after_start" CHECK ("inquiry_throttle_buckets"."expires_at" > "inquiry_throttle_buckets"."window_started_at")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "inquiry_throttle_buckets_kind_key_unique" ON "inquiry_throttle_buckets" USING btree ("kind","key_hash");--> statement-breakpoint
CREATE INDEX "inquiry_throttle_buckets_expiry_index" ON "inquiry_throttle_buckets" USING btree ("expires_at");
--> statement-breakpoint
CREATE TRIGGER "inquiry_throttle_buckets_set_updated_at"
BEFORE UPDATE ON "inquiry_throttle_buckets"
FOR EACH ROW EXECUTE FUNCTION "set_updated_at"();
