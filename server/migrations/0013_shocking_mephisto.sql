DROP INDEX "cache_entries_key_idx";--> statement-breakpoint
ALTER TABLE "sustainability_metric_history" ALTER COLUMN "recorded_by" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "sustainability_metric_history" ADD CONSTRAINT "sustainability_metric_history_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_posts_featured_image_id_idx" ON "blog_posts" USING btree ("featured_image_id");--> statement-breakpoint
CREATE INDEX "blog_posts_category_id_idx" ON "blog_posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "blog_posts_author_id_idx" ON "blog_posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_posts_deleted_at_idx" ON "blog_posts" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "accessories_image_id_idx" ON "accessories" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "certificates_image_id_idx" ON "certificates" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "certificates_document_id_idx" ON "certificates" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "size_charts_image_id_idx" ON "size_charts" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "navigation_items_media_icon_id_idx" ON "navigation_items" USING btree ("media_icon_id");--> statement-breakpoint
CREATE INDEX "manufacturing_qualities_certificate_id_idx" ON "manufacturing_qualities" USING btree ("certificate_id");--> statement-breakpoint
CREATE INDEX "technology_roadmap_image_id_idx" ON "technology_roadmap" USING btree ("image_id");--> statement-breakpoint
CREATE INDEX "technology_roadmap_video_id_idx" ON "technology_roadmap" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "fabric_compositions_fabric_id_idx" ON "fabric_compositions" USING btree ("fabric_id");--> statement-breakpoint
CREATE INDEX "fabric_compositions_fiber_id_idx" ON "fabric_compositions" USING btree ("fiber_id");--> statement-breakpoint
CREATE INDEX "folders_parent_id_idx" ON "folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "folders_is_active_idx" ON "folders" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_subscription_id_idx" ON "webhook_deliveries" USING btree ("subscription_id");