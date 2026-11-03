ALTER TABLE "media_assets" ADD COLUMN "lifecycle_status" varchar(16) DEFAULT 'ready' NOT NULL;--> statement-breakpoint
CREATE INDEX "media_assets_lifecycle_status_created_at_index" ON "media_assets" USING btree ("lifecycle_status","created_at");--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_lifecycle_status_valid" CHECK ("media_assets"."lifecycle_status" in ('pending', 'ready', 'deleting'));--> statement-breakpoint
CREATE OR REPLACE FUNCTION media_asset_references_require_ready() RETURNS trigger AS $$
DECLARE
  asset_status varchar(16);
BEGIN
  SELECT lifecycle_status INTO asset_status
    FROM media_assets
    WHERE id = NEW.media_asset_id
    FOR SHARE;

  IF asset_status IS DISTINCT FROM 'ready' THEN
    RAISE EXCEPTION 'Media asset % is not ready', NEW.media_asset_id
      USING ERRCODE = '23514',
            CONSTRAINT = 'media_asset_references_asset_ready';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER media_asset_references_ready_before_insert
BEFORE INSERT ON media_asset_references
FOR EACH ROW EXECUTE FUNCTION media_asset_references_require_ready();--> statement-breakpoint
CREATE TRIGGER media_asset_references_ready_before_asset_update
BEFORE UPDATE OF media_asset_id ON media_asset_references
FOR EACH ROW EXECUTE FUNCTION media_asset_references_require_ready();
