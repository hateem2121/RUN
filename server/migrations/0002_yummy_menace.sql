ALTER TABLE "homepage_sustainability" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "homepage_sustainability" CASCADE;--> statement-breakpoint
ALTER TABLE "homepage_hero" DROP CONSTRAINT IF EXISTS "homepage_hero_primary_image_id_media_assets_id_fk";
--> statement-breakpoint
DROP INDEX "homepage_hero_primary_image_id_idx";--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "contact_form_heading" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "contact_form_heading" SET DEFAULT 'GET IN TOUCH WITH RUN APPAREL';--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "contact_form_heading" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "contact_form_enabled" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "company_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "company_name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "company_address" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "company_address" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "company_phone" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "company_phone" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "company_email" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "company_email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "brand_text" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "brand_text" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "brand_tagline" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "brand_tagline" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "brand_subtext" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "footer_configuration" ALTER COLUMN "brand_subtext" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "profile_image_url" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN IF NOT EXISTS "bottom_cta_title" varchar(255);--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN IF NOT EXISTS "bottom_cta_description" text;--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN IF NOT EXISTS "bottom_cta_text" varchar(100);--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN IF NOT EXISTS "bottom_cta_link" varchar(255);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN IF NOT EXISTS "thumbnail_storage_path" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN IF NOT EXISTS "category" varchar(100);--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN IF NOT EXISTS "capacity" varchar(255);--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN IF NOT EXISTS "maintenance_schedule" varchar(255);--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN IF NOT EXISTS "certifications" jsonb;--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN IF NOT EXISTS "short_description" text;--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN IF NOT EXISTS "icon_name" varchar(100);--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN IF NOT EXISTS "status" varchar(50) DEFAULT 'Active';--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN IF NOT EXISTS "technical_details" jsonb;--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN IF NOT EXISTS "related_products" jsonb;--> statement-breakpoint
ALTER TABLE "technology_research" ADD COLUMN IF NOT EXISTS "team_members" jsonb;--> statement-breakpoint
ALTER TABLE "technology_research" ADD COLUMN IF NOT EXISTS "objectives" jsonb;--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD COLUMN IF NOT EXISTS "image_id" integer;--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD COLUMN IF NOT EXISTS "video_id" integer;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN IF NOT EXISTS "fabric_portfolio_description" text;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN IF NOT EXISTS "features_title" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN IF NOT EXISTS "features_description" text;--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD CONSTRAINT "technology_roadmap_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD CONSTRAINT "technology_roadmap_video_id_media_assets_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_hero" DROP COLUMN IF EXISTS "description";--> statement-breakpoint
ALTER TABLE "homepage_hero" DROP COLUMN IF EXISTS "primary_image_id";--> statement-breakpoint
ALTER TABLE "sustainability_metrics" DROP COLUMN IF EXISTS "icon";--> statement-breakpoint
ALTER TABLE "sustainability_metrics" DROP COLUMN IF EXISTS "current_value";--> statement-breakpoint
ALTER TABLE "sustainability_metrics" DROP COLUMN IF EXISTS "target_value";--> statement-breakpoint
ALTER TABLE "sustainability_metrics" DROP COLUMN IF EXISTS "target_year";--> statement-breakpoint
ALTER TABLE "unified_sustainability" DROP COLUMN IF EXISTS "metrics";