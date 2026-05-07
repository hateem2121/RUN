CREATE TABLE "sustainability_metric_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_id" integer NOT NULL,
	"value" varchar(100) NOT NULL,
	"recorded_at" timestamp (3) DEFAULT now(),
	"recorded_by" integer,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_featured_image_id_media_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_category_id_blog_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ALTER COLUMN "is_active" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "webhook_subscriptions" ALTER COLUMN "is_active" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "sustainability_metric_history" ADD CONSTRAINT "sustainability_metric_history_metric_id_sustainability_metrics_id_fk" FOREIGN KEY ("metric_id") REFERENCES "public"."sustainability_metrics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "metric_history_metric_id_idx" ON "sustainability_metric_history" USING btree ("metric_id");--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_featured_image_id_media_assets_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manufacturing_qualities" ADD CONSTRAINT "manufacturing_qualities_certificate_id_certificates_id_fk" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE set null ON UPDATE no action;