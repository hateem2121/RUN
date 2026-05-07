DROP INDEX "products_tags_gin_idx";--> statement-breakpoint
DROP INDEX "products_certificate_ids_gin_idx";--> statement-breakpoint
DROP INDEX "products_accessory_ids_gin_idx";--> statement-breakpoint
DROP INDEX "products_image_ids_gin_idx";--> statement-breakpoint
DROP INDEX "products_name_trgm_idx";--> statement-breakpoint
DROP INDEX "products_description_trgm_idx";--> statement-breakpoint
CREATE INDEX "products_tags_gin_idx" ON "products" USING gin ("tags" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "products_certificate_ids_gin_idx" ON "products" USING gin ("certificate_ids" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "products_accessory_ids_gin_idx" ON "products" USING gin ("accessory_ids" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "products_image_ids_gin_idx" ON "products" USING gin ("image_ids" jsonb_path_ops);--> statement-breakpoint
CREATE INDEX "products_name_trgm_idx" ON "products" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "products_description_trgm_idx" ON "products" USING gin ("description" gin_trgm_ops);