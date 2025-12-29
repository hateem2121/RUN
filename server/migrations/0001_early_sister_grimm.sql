CREATE TABLE "fabric_compositions" (
	"id" serial PRIMARY KEY NOT NULL,
	"fabric_id" integer,
	"fiber_id" integer,
	"percentage" numeric
);
--> statement-breakpoint
CREATE TABLE "footer_configuration" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_form_heading" text DEFAULT 'GET IN TOUCH WITH RUN APPAREL',
	"contact_form_enabled" boolean DEFAULT true,
	"navigation_columns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"social_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"certificate_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"legal_links" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"company_name" varchar(255) DEFAULT 'RUN APPAREL (PVT) LTD',
	"company_address" text DEFAULT '13km Daska Road, Sialkot 51040, Pakistan',
	"company_phone" varchar(50) DEFAULT '+92 336 1777313',
	"company_email" varchar(255) DEFAULT 'team@run-apparel.com',
	"brand_text" varchar(255) DEFAULT 'RUN APPAREL',
	"brand_tagline" varchar(255) DEFAULT 'Ethically Engineered • Sustainably Crafted',
	"brand_subtext" varchar(255) DEFAULT 'A subsidiary of Durus Industries',
	"structured_data" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "inquiries_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"email" varchar(320) NOT NULL,
	"company" varchar(100),
	"phone" varchar(20),
	"country" varchar(100),
	"preferred_platform" varchar(50),
	"message" text NOT NULL,
	"source" varchar(50) DEFAULT 'contact-page' NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"submitted_at" timestamp (3) DEFAULT now() NOT NULL,
	"responded_at" timestamp (3),
	"admin_notes" text,
	"assigned_to" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar(255) PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp (3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"profile_image_url" varchar(500),
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "contact_inquiries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "contact_inquiries" CASCADE;--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_slug_unique";--> statement-breakpoint
ALTER TABLE "about_hero" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "about_hero" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "about_hero" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "about_hero" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "about_map_locations" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "about_map_locations" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "about_sections" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "about_sections" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "about_sections" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "about_sections" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "about_statistics" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "about_statistics" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "about_team_messages" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "about_team_messages" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "about_timeline_entries" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "about_timeline_entries" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "accessories" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "accessories" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "accessories" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "accessories" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "accessories" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "animation_errors" ALTER COLUMN "resolved_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "animation_errors" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "animation_errors" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "audit_configuration" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "audit_configuration" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "audit_configuration" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "audit_configuration" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "timestamp" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "timestamp" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "issue_date" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "expiry_date" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "certificates" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "fabrics" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "fabrics" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "fabrics" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "fibers" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "fibers" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "fibers" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "folders" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_featured_products_settings" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_featured_products_settings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "homepage_featured_products_settings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_featured_products_settings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "homepage_hero" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_hero" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "homepage_hero" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_hero" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "homepage_process_cards" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_process_cards" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "homepage_sections" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_sections" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "homepage_sections" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_sections" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "homepage_slogans" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_slogans" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "homepage_sustainability" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "homepage_sustainability" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "manufacturing_capabilities" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "manufacturing_capabilities" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "manufacturing_processes" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "manufacturing_processes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "uploaded_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "uploaded_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "media_assets" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "navigation_items" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "navigation_items" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "navigation_items" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "navigation_items" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "navigation_items" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "performance_metrics" ALTER COLUMN "timestamp" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "performance_metrics" ALTER COLUMN "timestamp" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "performance_metrics" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "performance_metrics" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "size_charts" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "size_charts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "size_charts" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "size_charts" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "size_charts" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "storage_analysis_results" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "storage_analysis_results" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "storage_change_logs" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "storage_change_logs" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sustainability_features" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_features" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sustainability_goals" ALTER COLUMN "target_date" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_goals" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_goals" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sustainability_goals" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_goals" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sustainability_hero" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_hero" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sustainability_hero" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_hero" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ALTER COLUMN "start_date" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ALTER COLUMN "target_date" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sustainability_metrics" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_metrics" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sustainability_metrics" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "sustainability_metrics" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_cta" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_cta" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_cta" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_cta" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_equipment" ALTER COLUMN "installation_date" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_equipment" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_equipment" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_gradient_settings" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_gradient_settings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_gradient_settings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_gradient_settings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_hero" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_hero" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_hero" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_hero" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_innovations" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_innovations" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_research" ALTER COLUMN "start_date" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_research" ALTER COLUMN "expected_completion" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_research" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_research" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_research" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_research" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_roadmap" ALTER COLUMN "target_date" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_roadmap" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_roadmap" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "technology_roadmap" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "technology_roadmap" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "unified_sustainability" ALTER COLUMN "created_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "unified_sustainability" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (3);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "accessories" ADD COLUMN "type" varchar(100);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "display_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "banner_url" varchar(500);--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "issuing_body" varchar(255);--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "document_url" varchar(500);--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN "image_url" varchar(500);--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "hero_title" varchar(255);--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "location_line1" text;--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "location_line2" text;--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "location_button_text" varchar(100) DEFAULT 'GET DIRECTIONS';--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "trading_hours" jsonb;--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "platform_options" jsonb DEFAULT '["Phone Call", "WhatsApp", "WeChat", "Telegram", "Other"]'::jsonb;--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "form_button_text" varchar(255) DEFAULT 'Get a Response Within 24 Hours';--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "form_privacy_text" text DEFAULT 'We value your privacy and will never share your information.';--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "success_heading" varchar(255) DEFAULT 'Thank you!';--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "success_message" text DEFAULT 'We''ve received your message and will be in touch shortly.';--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "contact_info_title" varchar(255);--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "contact_info_subtitle" text;--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "show_contact_info" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "show_business_hours" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "show_location_map" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "hero_background_style" varchar(100) DEFAULT 'gradient';--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "hero_background_color" varchar(50);--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "contact_cards_layout" varchar(50) DEFAULT 'grid';--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "show_form_in_separate_section" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "form_background_style" varchar(100) DEFAULT 'default';--> statement-breakpoint
ALTER TABLE "contact_page_configurations" ADD COLUMN "meta_title" varchar(255);--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "sport" text;--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "market_segment" text;--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "seasonality" text;--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "weave_type" varchar(100);--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "weave_types" jsonb;--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "finish_treatment" varchar(255);--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "visual_swatch_id" integer;--> statement-breakpoint
ALTER TABLE "fabrics" ADD COLUMN "key_applications" jsonb;--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "motion_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "motion_speed" numeric(3, 2);--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "motion_elements" jsonb;--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "animation_duration_multiplier" numeric(3, 2) DEFAULT '1.0';--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "draw_stagger" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "draw_easing" varchar(100);--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "skip_button_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "show_frequency" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "custom_css_class" varchar(255);--> statement-breakpoint
ALTER TABLE "logo_animation_settings" ADD COLUMN "debug_mode" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "manufacturing_capabilities" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "manufacturing_capabilities" ADD COLUMN "icon" varchar(100);--> statement-breakpoint
ALTER TABLE "manufacturing_capabilities" ADD COLUMN "equipment" jsonb;--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN "headline" varchar(255);--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN "subheadline" text;--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN "cta_text" varchar(100);--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD COLUMN "cta_link" varchar(255);--> statement-breakpoint
ALTER TABLE "manufacturing_processes" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "manufacturing_processes" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "manufacturing_processes" ADD COLUMN "efficiency" integer;--> statement-breakpoint
ALTER TABLE "manufacturing_processes" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "manufacturing_processes" ADD COLUMN "icon_name" varchar(100);--> statement-breakpoint
ALTER TABLE "manufacturing_processes" ADD COLUMN "media_ids" jsonb;--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ADD COLUMN "standards" text[];--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ADD COLUMN "icon" varchar(100);--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ADD COLUMN "image_id" integer;--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ADD COLUMN "frequency" varchar(100);--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ADD COLUMN "checkpoints" jsonb;--> statement-breakpoint
ALTER TABLE "media_assets" ADD COLUMN "image_variants" jsonb;--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ADD COLUMN "background_opacity" numeric(3, 2) DEFAULT '0.8';--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ADD COLUMN "blur_strength" integer DEFAULT 10;--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ADD COLUMN "border_opacity" numeric(3, 2) DEFAULT '0.2';--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ADD COLUMN "shadow_intensity" numeric(3, 2) DEFAULT '0.1';--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ADD COLUMN "top_highlight_opacity" numeric(3, 2) DEFAULT '0.5';--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ADD COLUMN "left_highlight_opacity" numeric(3, 2) DEFAULT '0.3';--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ADD COLUMN "inner_shadow_opacity" numeric(3, 2) DEFAULT '0.5';--> statement-breakpoint
ALTER TABLE "navigation_glassmorphism_settings" ADD COLUMN "enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "navigation_items" ADD COLUMN "name" varchar(255);--> statement-breakpoint
ALTER TABLE "navigation_items" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "navigation_items" ADD COLUMN "href" varchar(255);--> statement-breakpoint
ALTER TABLE "navigation_items" ADD COLUMN "path" varchar(255);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "technical_specs" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "fiber_composition" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "care_instructions" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "customization_options" jsonb;--> statement-breakpoint
ALTER TABLE "size_charts" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "size_charts" ADD COLUMN "type" varchar(100);--> statement-breakpoint
ALTER TABLE "size_charts" ADD COLUMN "region" varchar(100);--> statement-breakpoint
ALTER TABLE "size_charts" ADD COLUMN "fit_notes" text;--> statement-breakpoint
ALTER TABLE "sustainability_features" ADD COLUMN "highlighted_features" jsonb;--> statement-breakpoint
ALTER TABLE "sustainability_goals" ADD COLUMN "current_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sustainability_goals" ADD COLUMN "target_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sustainability_goals" ADD COLUMN "target_year" integer;--> statement-breakpoint
ALTER TABLE "sustainability_goals" ADD COLUMN "unit" varchar(50);--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ADD COLUMN "icon_name" varchar(50);--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ADD COLUMN "highlighted_features" jsonb;--> statement-breakpoint
ALTER TABLE "sustainability_metrics" ADD COLUMN "icon" varchar(100);--> statement-breakpoint
ALTER TABLE "sustainability_metrics" ADD COLUMN "current_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sustainability_metrics" ADD COLUMN "target_value" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sustainability_metrics" ADD COLUMN "target_year" integer;--> statement-breakpoint
ALTER TABLE "technology_cta" ADD COLUMN "benefits" jsonb;--> statement-breakpoint
ALTER TABLE "technology_hero" ADD COLUMN "primary_button_text" varchar(100);--> statement-breakpoint
ALTER TABLE "technology_hero" ADD COLUMN "primary_button_link" varchar(255);--> statement-breakpoint
ALTER TABLE "technology_hero" ADD COLUMN "secondary_button_text" varchar(100);--> statement-breakpoint
ALTER TABLE "technology_hero" ADD COLUMN "secondary_button_link" varchar(255);--> statement-breakpoint
ALTER TABLE "technology_hero" ADD COLUMN "background_media_id" integer;--> statement-breakpoint
ALTER TABLE "technology_research" ADD COLUMN "current_projects" jsonb;--> statement-breakpoint
ALTER TABLE "technology_research" ADD COLUMN "publications" jsonb;--> statement-breakpoint
ALTER TABLE "technology_research" ADD COLUMN "outcomes" jsonb;--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD COLUMN "timeline" varchar(255);--> statement-breakpoint
ALTER TABLE "technology_roadmap" ADD COLUMN "impact" jsonb;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "headline" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "subheadline" text;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "cta_text" varchar(100);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "cta_link" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "metrics_title" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "metrics_description" text;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "certifications_title" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "certifications_description" text;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "certifications_footer_note" text;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "certification_ids" jsonb;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "initiatives_title" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "initiatives_description" text;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "goals_title" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "goals_description" text;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "fabric_portfolio_title" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "call_to_action_title" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "call_to_action_description" text;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "call_to_action_button_text" varchar(100);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "call_to_action_button_link" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "button_text" varchar(100);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "button_link" varchar(255);--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD COLUMN "background_image_id" integer;--> statement-breakpoint
ALTER TABLE "fabric_compositions" ADD CONSTRAINT "fabric_compositions_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_compositions" ADD CONSTRAINT "fabric_compositions_fiber_id_fibers_id_fk" FOREIGN KEY ("fiber_id") REFERENCES "public"."fibers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inquiries_status_idx" ON "inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inquiries_submitted_at_idx" ON "inquiries" USING btree ("submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inquiries_email_idx" ON "inquiries" USING btree ("email");--> statement-breakpoint
CREATE INDEX "inquiries_source_idx" ON "inquiries" USING btree ("source");--> statement-breakpoint
CREATE INDEX "inquiries_status_submitted_idx" ON "inquiries" USING btree ("status","submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
ALTER TABLE "fabrics" ADD CONSTRAINT "fabrics_visual_swatch_id_media_assets_id_fk" FOREIGN KEY ("visual_swatch_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ADD CONSTRAINT "manufacturing_qualities_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_hero" ADD CONSTRAINT "technology_hero_background_media_id_media_assets_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unified_sustainability" ADD CONSTRAINT "unified_sustainability_background_image_id_media_assets_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "about_hero_is_active_idx" ON "about_hero" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "about_hero_image_id_idx" ON "about_hero" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "about_hero_video_id_idx" ON "about_hero" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "about_hero_background_media_id_idx" ON "about_hero" USING btree ("background_media_id");--> statement-breakpoint
CREATE INDEX "about_map_locations_is_active_idx" ON "about_map_locations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "about_sections_is_active_idx" ON "about_sections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "about_sections_image_id_idx" ON "about_sections" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "about_sections_sort_order_idx" ON "about_sections" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "about_statistics_is_active_idx" ON "about_statistics" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "about_statistics_sort_order_idx" ON "about_statistics" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "about_team_messages_is_active_idx" ON "about_team_messages" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "about_team_messages_image_id_idx" ON "about_team_messages" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "about_team_messages_sort_order_idx" ON "about_team_messages" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "about_timeline_entries_is_active_idx" ON "about_timeline_entries" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "about_timeline_entries_image_id_idx" ON "about_timeline_entries" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "about_timeline_entries_sort_order_idx" ON "about_timeline_entries" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "accessories_sku_idx" ON "accessories" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "accessories_is_active_idx" ON "accessories" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_unique_active" ON "categories" USING btree ("slug") WHERE "categories"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "certificates_show_on_sustainability_idx" ON "certificates" USING btree ("show_on_sustainability_page");--> statement-breakpoint
CREATE INDEX "certificates_is_active_idx" ON "certificates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "fabrics_is_active_idx" ON "fabrics" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "fabrics_fabric_type_idx" ON "fabrics" USING btree ("fabric_type");--> statement-breakpoint
CREATE INDEX "fabrics_sport_idx" ON "fabrics" USING btree ("sport");--> statement-breakpoint
CREATE INDEX "fabrics_seasonality_idx" ON "fabrics" USING btree ("seasonality");--> statement-breakpoint
CREATE INDEX "fabrics_deleted_at_idx" ON "fabrics" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "fabrics_active_query_idx" ON "fabrics" USING btree ("deleted_at","is_active");--> statement-breakpoint
CREATE INDEX "fibers_type_idx" ON "fibers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "fibers_is_active_idx" ON "fibers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "fibers_deleted_at_idx" ON "fibers" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "homepage_hero_is_active_idx" ON "homepage_hero" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "homepage_hero_primary_image_id_idx" ON "homepage_hero" USING btree ("primary_image_id");--> statement-breakpoint
CREATE INDEX "homepage_hero_background_image_id_idx" ON "homepage_hero" USING btree ("background_image_id");--> statement-breakpoint
CREATE INDEX "homepage_hero_sort_order_idx" ON "homepage_hero" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "homepage_process_cards_is_active_idx" ON "homepage_process_cards" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "homepage_process_cards_image_id_idx" ON "homepage_process_cards" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "homepage_process_cards_icon_media_id_idx" ON "homepage_process_cards" USING btree ("icon_media_id");--> statement-breakpoint
CREATE INDEX "homepage_process_cards_sort_order_idx" ON "homepage_process_cards" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "homepage_sections_is_active_idx" ON "homepage_sections" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "homepage_sections_sort_order_idx" ON "homepage_sections" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "homepage_slogans_is_active_idx" ON "homepage_slogans" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "homepage_slogans_sort_order_idx" ON "homepage_slogans" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "homepage_sustainability_is_active_idx" ON "homepage_sustainability" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "homepage_sustainability_image_id_idx" ON "homepage_sustainability" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "manufacturing_capabilities_is_active_idx" ON "manufacturing_capabilities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "manufacturing_capabilities_image_id_idx" ON "manufacturing_capabilities" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "manufacturing_capabilities_sort_order_idx" ON "manufacturing_capabilities" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "manufacturing_hero_is_active_idx" ON "manufacturing_hero" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "manufacturing_hero_image_id_idx" ON "manufacturing_hero" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "manufacturing_hero_video_id_idx" ON "manufacturing_hero" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "manufacturing_hero_background_media_id_idx" ON "manufacturing_hero" USING btree ("background_media_id");--> statement-breakpoint
CREATE INDEX "manufacturing_processes_is_active_idx" ON "manufacturing_processes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "manufacturing_processes_image_id_idx" ON "manufacturing_processes" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "manufacturing_processes_sort_order_idx" ON "manufacturing_processes" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "manufacturing_qualities_is_active_idx" ON "manufacturing_qualities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "manufacturing_qualities_image_id_idx" ON "manufacturing_qualities" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "manufacturing_qualities_sort_order_idx" ON "manufacturing_qualities" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "media_uploaded_at_idx" ON "media_assets" USING btree ("uploaded_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "products_url_path_active_idx" ON "products" USING btree ("url_path","is_active","deleted_at");--> statement-breakpoint
CREATE INDEX "products_primary_image_id_idx" ON "products" USING btree ("primary_image_id");--> statement-breakpoint
CREATE INDEX "products_primary_video_id_idx" ON "products" USING btree ("primary_video_id");--> statement-breakpoint
CREATE INDEX "products_model_file_id_idx" ON "products" USING btree ("model_file_id");--> statement-breakpoint
CREATE INDEX "size_charts_is_active_idx" ON "size_charts" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "size_charts_deleted_at_idx" ON "size_charts" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "size_charts_active_query_idx" ON "size_charts" USING btree ("is_active","deleted_at");--> statement-breakpoint
CREATE INDEX "sustainability_goals_is_active_idx" ON "sustainability_goals" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sustainability_goals_sort_order_idx" ON "sustainability_goals" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "sustainability_hero_is_active_idx" ON "sustainability_hero" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sustainability_hero_image_id_idx" ON "sustainability_hero" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "sustainability_hero_video_id_idx" ON "sustainability_hero" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "sustainability_initiatives_is_active_idx" ON "sustainability_initiatives" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sustainability_initiatives_image_id_idx" ON "sustainability_initiatives" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "sustainability_initiatives_sort_order_idx" ON "sustainability_initiatives" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "sustainability_metrics_is_active_idx" ON "sustainability_metrics" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sustainability_metrics_sort_order_idx" ON "sustainability_metrics" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "technology_cta_is_active_idx" ON "technology_cta" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "technology_equipment_is_active_idx" ON "technology_equipment" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "technology_equipment_image_id_idx" ON "technology_equipment" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "technology_equipment_sort_order_idx" ON "technology_equipment" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "technology_gradient_settings_is_active_idx" ON "technology_gradient_settings" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "technology_hero_is_active_idx" ON "technology_hero" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "technology_hero_image_id_idx" ON "technology_hero" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "technology_hero_video_id_idx" ON "technology_hero" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "technology_hero_background_media_id_idx" ON "technology_hero" USING btree ("background_media_id");--> statement-breakpoint
CREATE INDEX "technology_innovations_is_active_idx" ON "technology_innovations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "technology_innovations_image_id_idx" ON "technology_innovations" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "technology_innovations_sort_order_idx" ON "technology_innovations" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "technology_research_is_active_idx" ON "technology_research" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "technology_research_sort_order_idx" ON "technology_research" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "technology_roadmap_is_active_idx" ON "technology_roadmap" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "technology_roadmap_sort_order_idx" ON "technology_roadmap" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "product_count";--> statement-breakpoint
ALTER TABLE "fabrics" DROP COLUMN "composition";--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" DROP COLUMN "standard";--> statement-breakpoint
ALTER TABLE "media_assets" DROP COLUMN "download_count";--> statement-breakpoint
ALTER TABLE "media_assets" DROP COLUMN "last_accessed_at";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "compare_at_price";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "features";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "materials";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "colors";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sizes";