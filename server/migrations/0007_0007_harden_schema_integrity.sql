CREATE TABLE "blog_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"featured_image_id" integer,
	"category_id" integer,
	"author_id" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"meta_title" text,
	"meta_description" text,
	"canonical_url" text,
	"og_image" text,
	"keywords" text,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "manufacturing_case_studies" (
	"id" serial PRIMARY KEY NOT NULL,
	"client" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"metric" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"quote" text NOT NULL,
	"author" varchar(255) NOT NULL,
	"image_id" integer,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscription_id" integer NOT NULL,
	"event" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"response_status" integer,
	"response_body" text,
	"attempt_count" integer DEFAULT 1,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "webhook_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"secret" varchar(255) NOT NULL,
	"events" jsonb NOT NULL,
	"is_active" varchar(1) DEFAULT 'Y',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "products" DROP CONSTRAINT "products_slug_unique";--> statement-breakpoint
ALTER TABLE "fabric_compositions" DROP CONSTRAINT "fabric_compositions_fabric_id_fabrics_id_fk";
--> statement-breakpoint
ALTER TABLE "fabric_compositions" DROP CONSTRAINT "fabric_compositions_fiber_id_fibers_id_fk";
--> statement-breakpoint
DROP INDEX "inquiries_email_idx";--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "email" SET DATA TYPE varchar(500);--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "company" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "inquiries" ALTER COLUMN "phone" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "manufacturing_hero" ALTER COLUMN "headline" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "ip_address" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "email_index" varchar(255);--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "items" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "priority" varchar(20) DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "crm_stage" varchar(50) DEFAULT 'lead' NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "crm_logs" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "lead_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD COLUMN "email_index" varchar(255);--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_email_index" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_index" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "lockout_until" timestamp (3);--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_featured_image_id_media_assets_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_case_studies" ADD CONSTRAINT "manufacturing_case_studies_image_id_media_assets_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscription_id_webhook_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."webhook_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "manufacturing_case_studies_is_active_idx" ON "manufacturing_case_studies" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "manufacturing_case_studies_image_id_idx" ON "manufacturing_case_studies" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "manufacturing_case_studies_sort_order_idx" ON "manufacturing_case_studies" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "fabric_compositions" ADD CONSTRAINT "fabric_compositions_fabric_id_fabrics_id_fk" FOREIGN KEY ("fabric_id") REFERENCES "public"."fabrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fabric_compositions" ADD CONSTRAINT "fabric_compositions_fiber_id_fibers_id_fk" FOREIGN KEY ("fiber_id") REFERENCES "public"."fibers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inquiries_email_index_idx" ON "inquiries" USING btree ("email_index");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_unique_idx" ON "products" USING btree ("slug") WHERE "products"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "audit_user_email_index_idx" ON "audit_logs" USING btree ("user_email_index");--> statement-breakpoint
ALTER TABLE "about_hero" DROP COLUMN "headline";--> statement-breakpoint
ALTER TABLE "about_hero" DROP COLUMN "subheadline";--> statement-breakpoint
ALTER TABLE "about_sections" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "about_statistics" DROP COLUMN "icon";--> statement-breakpoint
ALTER TABLE "about_statistics" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "about_timeline_entries" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "manufacturing_hero" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "manufacturing_hero" DROP COLUMN "subtitle";--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_emailIndex_unique" UNIQUE("email_index");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_emailIndex_unique" UNIQUE("email_index");