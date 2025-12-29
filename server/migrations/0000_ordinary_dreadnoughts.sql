CREATE TABLE "about_hero" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"description" text,
	"headline" varchar(255),
	"subheadline" text,
	"image_id" integer,
	"video_id" integer,
	"background_media_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "about_map_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"description" text,
	"address" text,
	"location_type" varchar(100),
	"type" varchar(50),
	"city" varchar(255),
	"country" varchar(255),
	"details" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "about_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"section_type" varchar(100) NOT NULL,
	"image_id" integer,
	"data" jsonb,
	"media_ids" jsonb,
	"position" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "about_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"value" varchar(100) NOT NULL,
	"unit" varchar(50),
	"description" text,
	"icon_name" varchar(100),
	"icon" varchar(100),
	"position" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "about_team_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"position" varchar(255),
	"message" text NOT NULL,
	"image_id" integer,
	"title" varchar(255),
	"signature" varchar(255),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "about_timeline_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" varchar(10) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"image_id" integer,
	"position" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "accessories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"material" varchar(255),
	"color" varchar(100),
	"size" varchar(100),
	"sku" varchar(100),
	"price" numeric(10, 2),
	"image_id" integer,
	"specifications" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "animation_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"error_type" varchar(100) NOT NULL,
	"message" text NOT NULL,
	"stack_trace" text,
	"component_name" varchar(255),
	"url" varchar(500),
	"user_agent" varchar(500),
	"retry_count" integer DEFAULT 0,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_configuration" (
	"id" serial PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true,
	"track_all_tables" boolean DEFAULT false,
	"tracked_tables" jsonb,
	"default_retention_days" integer DEFAULT 2555,
	"high_compliance_retention_days" integer DEFAULT 3650,
	"critical_compliance_retention_days" integer DEFAULT 7300,
	"batch_size" integer DEFAULT 100,
	"async_processing" boolean DEFAULT true,
	"exclude_sensitive_fields" jsonb,
	"encrypt_payloads" boolean DEFAULT false,
	"alert_on_critical_changes" boolean DEFAULT true,
	"alert_threshold" integer DEFAULT 100,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(50) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" varchar(50) NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" jsonb,
	"user_id" varchar(100),
	"user_email" varchar(255),
	"user_role" varchar(50),
	"ip_address" varchar(45),
	"user_agent" text,
	"session_id" varchar(255),
	"reason" text,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"compliance_level" varchar(50) DEFAULT 'standard',
	"retention_period" integer DEFAULT 2555
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"parent_id" integer,
	"primary_image_id" integer,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"level" integer DEFAULT 0,
	"full_path" varchar(500),
	"meta_title" varchar(255),
	"meta_description" text,
	"featured_on_homepage" boolean DEFAULT false,
	"grid_position" integer DEFAULT 0,
	"product_count" integer DEFAULT 0,
	"featured_content" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) DEFAULT 'sustainability',
	"issuing_organization" varchar(255),
	"description" text,
	"certificate_number" varchar(100),
	"issue_date" timestamp,
	"expiry_date" timestamp,
	"image_id" integer,
	"document_id" integer,
	"status" varchar(50) DEFAULT 'active',
	"show_on_sustainability_page" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "contact_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"company" varchar(255),
	"subject" varchar(255),
	"message" text NOT NULL,
	"inquiry_type" varchar(100),
	"status" varchar(50) DEFAULT 'new',
	"priority" varchar(20) DEFAULT 'medium',
	"assigned_to" varchar(255),
	"responded_at" timestamp,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_page_configurations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"description" text,
	"address" text,
	"phone" varchar(50),
	"email" varchar(255),
	"working_hours" text,
	"map_coordinates" jsonb,
	"social_links" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fabrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"fabric_type" varchar(100),
	"weight" varchar(50),
	"composition" text,
	"weave" varchar(100),
	"stretch" varchar(50),
	"properties" jsonb,
	"care_instructions" text,
	"sustainability_score" integer,
	"certifications" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fibers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"description" text,
	"sustainability_score" integer,
	"environmental_impact" text,
	"properties" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"parent_id" integer,
	"path" varchar(500),
	"level" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "homepage_featured_products_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255),
	"max_products" integer DEFAULT 8,
	"auto_select" boolean DEFAULT true,
	"selected_product_ids" jsonb,
	"sort_by" varchar(50) DEFAULT 'featured',
	"is_active" boolean DEFAULT true,
	"is_enabled" boolean DEFAULT true,
	"dot_grid" jsonb,
	"liquid_glass" jsonb,
	"swipe_animation" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "homepage_hero" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"description" text,
	"primary_image_id" integer,
	"background_image_id" integer,
	"cta_text" varchar(100),
	"cta_link" varchar(255),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "homepage_process_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"image_id" integer,
	"icon_name" varchar(100),
	"step" integer NOT NULL,
	"icon" varchar(100),
	"icon_media_id" integer,
	"icon_type" varchar(20),
	"category" varchar(100),
	"position" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "homepage_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"title" varchar(255),
	"hero_title" varchar(255),
	"content" text,
	"section_type" varchar(100) NOT NULL,
	"data" jsonb,
	"media_ids" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "homepage_slogans" (
	"id" serial PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"position" varchar(50),
	"font_size" varchar(20),
	"color" varchar(20),
	"animation_type" varchar(50),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "homepage_sustainability" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"image_id" integer,
	"metrics" jsonb,
	"highlighted_features" jsonb,
	"statistics" jsonb,
	"impact_metrics" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "logo_animation_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"duration" integer DEFAULT 2000,
	"delay" integer DEFAULT 0,
	"easing" varchar(100) DEFAULT 'ease-out',
	"scale" numeric(4, 2) DEFAULT '1.0',
	"rotation" integer DEFAULT 0,
	"opacity" numeric(3, 2) DEFAULT '1.0',
	"settings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturing_capabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"capacity" varchar(255),
	"unit" varchar(50),
	"category" varchar(100),
	"image_id" integer,
	"specifications" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturing_hero" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"description" text,
	"image_id" integer,
	"video_id" integer,
	"background_media_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturing_processes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"step" integer NOT NULL,
	"duration" varchar(100),
	"image_id" integer,
	"equipment" jsonb,
	"specifications" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "manufacturing_qualities" (
	"id" serial PRIMARY KEY NOT NULL,
	"standard" varchar(255) NOT NULL,
	"description" text,
	"certificate_id" integer,
	"testing_method" varchar(255),
	"criteria" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"original_name" varchar(255),
	"file_size" integer,
	"size" integer,
	"mime_type" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"thumbnail_filename" varchar(255),
	"storage_path" text NOT NULL,
	"bucket_name" varchar(100) NOT NULL,
	"folder_id" integer,
	"tags" jsonb,
	"alt_text" text,
	"caption" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"download_count" integer DEFAULT 0,
	"last_accessed_at" timestamp,
	"uploaded_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "navigation_glassmorphism_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"opacity" numeric(3, 2) DEFAULT '0.8',
	"blur" integer DEFAULT 10,
	"border_radius" integer DEFAULT 12,
	"backdrop_filter" varchar(100) DEFAULT 'blur(10px)',
	"background_color" varchar(20) DEFAULT 'rgba(255,255,255,0.1)',
	"border_color" varchar(20) DEFAULT 'rgba(255,255,255,0.2)',
	"settings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "navigation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" varchar(255) NOT NULL,
	"url" varchar(255),
	"icon_name" varchar(100),
	"icon_type" varchar(20) DEFAULT 'fallback',
	"icon_size" varchar(20) DEFAULT 'medium',
	"fallback_icon" varchar(100) DEFAULT 'IconHome',
	"media_icon_id" integer,
	"parent_id" integer,
	"level" integer DEFAULT 0,
	"show_on_desktop" boolean DEFAULT true,
	"show_on_mobile" boolean DEFAULT true,
	"is_external" boolean DEFAULT false,
	"target" varchar(20) DEFAULT '_self',
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "performance_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_type" varchar(100) NOT NULL,
	"component_name" varchar(255) NOT NULL,
	"component" varchar(255),
	"value" numeric(12, 4) NOT NULL,
	"unit" varchar(20) NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"short_description" text,
	"category_id" integer NOT NULL,
	"primary_image_id" integer,
	"primary_video_id" integer,
	"model_file_id" integer,
	"sku" varchar(100) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"compare_at_price" numeric(10, 2),
	"minimum_order_quantity" integer DEFAULT 1,
	"lead_time" varchar(100),
	"specifications" jsonb,
	"features" jsonb,
	"materials" jsonb,
	"colors" jsonb,
	"sizes" jsonb,
	"tags" jsonb,
	"image_ids" jsonb,
	"videos" jsonb,
	"url_path" varchar(500),
	"custom_weight" varchar(100),
	"custom_fit" varchar(100),
	"fabric_id" integer,
	"size_chart_id" integer,
	"certificate_ids" jsonb,
	"accessory_ids" jsonb,
	"related_product_ids" jsonb,
	"meta_title" varchar(255),
	"meta_description" text,
	"is_active" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "size_charts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100),
	"gender" varchar(20),
	"measurements" jsonb,
	"size_range" jsonb,
	"unit" varchar(10) DEFAULT 'cm',
	"image_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "storage_analysis_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" varchar(50) NOT NULL,
	"total_files" integer NOT NULL,
	"total_size" integer NOT NULL,
	"referenced_files" integer NOT NULL,
	"orphaned_count" integer NOT NULL,
	"duplicate_groups" integer NOT NULL,
	"compression_candidates" integer NOT NULL,
	"potential_savings" jsonb,
	"analysis_time" integer NOT NULL,
	"version" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "storage_change_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" varchar(50) NOT NULL,
	"action" varchar(20) NOT NULL,
	"media_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"size" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sustainability_features" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"impact" text,
	"image_id" integer,
	"metrics" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sustainability_goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"target" varchar(255),
	"current_progress" numeric(5, 2),
	"target_date" timestamp,
	"category" varchar(100),
	"priority" varchar(20) DEFAULT 'medium',
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sustainability_hero" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"description" text,
	"image_id" integer,
	"video_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sustainability_initiatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"impact" text,
	"image_id" integer,
	"status" varchar(50) DEFAULT 'active',
	"start_date" timestamp,
	"target_date" timestamp,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sustainability_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" varchar(100) NOT NULL,
	"unit" varchar(50),
	"description" text,
	"category" varchar(100),
	"icon_name" varchar(100),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technology_cta" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"cta_text" varchar(100),
	"cta_link" varchar(255),
	"background_color" varchar(20),
	"text_color" varchar(20),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technology_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"manufacturer" varchar(255),
	"model" varchar(255),
	"description" text,
	"specifications" jsonb,
	"image_id" integer,
	"installation_date" timestamp,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technology_gradient_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"gradient_type" varchar(100) NOT NULL,
	"colors" jsonb,
	"direction" varchar(50) DEFAULT 'to-right',
	"opacity" numeric(3, 2) DEFAULT '1.0',
	"settings" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technology_hero" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" text,
	"description" text,
	"image_id" integer,
	"video_id" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technology_innovations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"benefits" jsonb,
	"image_id" integer,
	"development_year" varchar(10),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technology_research" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"research_area" varchar(255),
	"status" varchar(50) DEFAULT 'ongoing',
	"start_date" timestamp,
	"expected_completion" timestamp,
	"partners" jsonb,
	"funding" numeric(12, 2),
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "technology_roadmap" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"target_date" timestamp,
	"status" varchar(50) DEFAULT 'planned',
	"priority" varchar(20) DEFAULT 'medium',
	"milestones" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "unified_sustainability" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"section_type" varchar(100) NOT NULL,
	"data" jsonb,
	"metrics" jsonb,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "about_hero" ADD CONSTRAINT "about_hero_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "about_hero" ADD CONSTRAINT "about_hero_video_id_media_assets_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "about_hero" ADD CONSTRAINT "about_hero_background_media_id_media_assets_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "about_sections" ADD CONSTRAINT "about_sections_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "about_team_messages" ADD CONSTRAINT "about_team_messages_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "about_timeline_entries" ADD CONSTRAINT "about_timeline_entries_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accessories" ADD CONSTRAINT "accessories_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_primary_image_id_media_assets_id_fk" FOREIGN KEY ("primary_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_document_id_media_assets_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_hero" ADD CONSTRAINT "homepage_hero_primary_image_id_media_assets_id_fk" FOREIGN KEY ("primary_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_hero" ADD CONSTRAINT "homepage_hero_background_image_id_media_assets_id_fk" FOREIGN KEY ("background_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_process_cards" ADD CONSTRAINT "homepage_process_cards_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_process_cards" ADD CONSTRAINT "homepage_process_cards_icon_media_id_media_assets_id_fk" FOREIGN KEY ("icon_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "homepage_sustainability" ADD CONSTRAINT "homepage_sustainability_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_capabilities" ADD CONSTRAINT "manufacturing_capabilities_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD CONSTRAINT "manufacturing_hero_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD CONSTRAINT "manufacturing_hero_video_id_media_assets_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ADD CONSTRAINT "manufacturing_hero_background_media_id_media_assets_id_fk" FOREIGN KEY ("background_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_processes" ADD CONSTRAINT "manufacturing_processes_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigation_items" ADD CONSTRAINT "navigation_items_media_icon_id_media_assets_id_fk" FOREIGN KEY ("media_icon_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_primary_image_id_media_assets_id_fk" FOREIGN KEY ("primary_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_primary_video_id_media_assets_id_fk" FOREIGN KEY ("primary_video_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_model_file_id_media_assets_id_fk" FOREIGN KEY ("model_file_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_size_chart_id_size_charts_id_fk" FOREIGN KEY ("size_chart_id") REFERENCES "public"."size_charts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "size_charts" ADD CONSTRAINT "size_charts_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sustainability_features" ADD CONSTRAINT "sustainability_features_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sustainability_hero" ADD CONSTRAINT "sustainability_hero_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sustainability_hero" ADD CONSTRAINT "sustainability_hero_video_id_media_assets_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sustainability_initiatives" ADD CONSTRAINT "sustainability_initiatives_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_equipment" ADD CONSTRAINT "technology_equipment_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_hero" ADD CONSTRAINT "technology_hero_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_hero" ADD CONSTRAINT "technology_hero_video_id_media_assets_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technology_innovations" ADD CONSTRAINT "technology_innovations_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_is_active_idx" ON "categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_active_created_idx" ON "categories" USING btree ("is_active","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "categories_featured_idx" ON "categories" USING btree ("featured_on_homepage");--> statement-breakpoint
CREATE INDEX "categories_full_path_idx" ON "categories" USING btree ("full_path");--> statement-breakpoint
CREATE INDEX "media_type_active_idx" ON "media_assets" USING btree ("type","is_active");--> statement-breakpoint
CREATE INDEX "media_folder_id_idx" ON "media_assets" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "media_created_at_idx" ON "media_assets" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "media_active_created_idx" ON "media_assets" USING btree ("is_active","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "media_mime_type_idx" ON "media_assets" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "media_hot_query_idx" ON "media_assets" USING btree ("deleted_at","is_active","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "media_id_active_idx" ON "media_assets" USING btree ("id","is_active","deleted_at");--> statement-breakpoint
CREATE INDEX "media_original_name_idx" ON "media_assets" USING btree ("original_name");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_is_active_idx" ON "products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "products_is_featured_idx" ON "products" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "products_active_created_idx" ON "products" USING btree ("is_active","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "products_featured_active_idx" ON "products" USING btree ("is_featured","is_active");--> statement-breakpoint
CREATE INDEX "products_category_active_idx" ON "products" USING btree ("category_id","is_active");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_fabric_id_idx" ON "products" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "products_hot_query_idx" ON "products" USING btree ("deleted_at","is_active","created_at" DESC NULLS LAST);