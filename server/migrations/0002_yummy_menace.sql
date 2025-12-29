ALTER TABLE "homepage_sustainability" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "homepage_sustainability" CASCADE;--> statement-breakpoint
ALTER TABLE "homepage_hero" DROP CONSTRAINT "homepage_hero_primary_image_id_media_assets_id_fk";
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
ALTER TABLE "manufacturing_hero" ADD COLUMN "bottom_cta_title" varchar(255);--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN "bottom_cta_description" text;--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN "bottom_cta_text" varchar(100);--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN "bottom_cta_link" varchar(255);--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "thumbnail_storage_path" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN "quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN "capacity" varchar(255);--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN "maintenance_schedule" varchar(255);--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD COLUMN "certifications" jsonb;--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN "icon_name" varchar(100);--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN "status" varchar(50) DEFAULT 'Active';--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN "technical_details" jsonb;--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD COLUMN "related_products" jsonb;--> statement-breakpoint
ALTER TABLE "technology_research" ADD COLUMN "team_members" jsonb;--> statement-breakpoint
ALTER TABLE "technology_research" ADD COLUMN "objectives" jsonb;--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD COLUMN "image_id" integer;--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD COLUMN "video_id" integer;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "fabric_portfolio_description" text;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "features_title" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "features_description" text;--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD CONSTRAINT "technology_roadmap_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD CONSTRAINT "technology_roadmap_video_id_media_assets_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_hero" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "homepage_hero" DROP COLUMN "primary_image_id";--> statement-breakpoint
ALTER TABLE "sustainability_metrics" DROP COLUMN "icon";--> statement-breakpoint
ALTER TABLE "sustainability_metrics" DROP COLUMN "current_value";--> statement-breakpoint
ALTER TABLE "sustainability_metrics" DROP COLUMN "target_value";--> statement-breakpoint
ALTER TABLE "sustainability_metrics" DROP COLUMN "target_year";--> statement-breakpoint
ALTER TABLE "unified_sustainability" DROP COLUMN "metrics";