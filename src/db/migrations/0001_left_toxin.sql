ALTER TABLE "projects" RENAME TO "products";--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "projects_slug_unique";--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "category" text;--> statement-breakpoint
UPDATE "blog_posts" SET "category" = 'Announcement' WHERE "category" IS NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ALTER COLUMN "category" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_slug_unique" UNIQUE("slug");
