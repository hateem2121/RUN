-- 5 New Performance & Stability Indexes (Phase 2 Database Optimization)
CREATE INDEX IF NOT EXISTS "blog_posts_is_featured_idx" ON "blog_posts" USING btree ("is_featured", "status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "certificates_deleted_at_type_idx" ON "certificates" USING btree ("deleted_at", "type");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "size_charts_category_gender_idx" ON "size_charts" USING btree ("category", "gender");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_tags_gin_idx" ON "media_assets" USING gin ("tags" jsonb_path_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_is_admin_idx" ON "users" USING btree ("is_admin");
