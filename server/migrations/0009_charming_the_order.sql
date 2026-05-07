CREATE INDEX "products_tags_gin_idx" ON "products" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "products_certificate_ids_gin_idx" ON "products" USING gin ("certificate_ids");--> statement-breakpoint
CREATE INDEX "products_accessory_ids_gin_idx" ON "products" USING gin ("accessory_ids");--> statement-breakpoint
CREATE INDEX "products_image_ids_gin_idx" ON "products" USING gin ("image_ids");--> statement-breakpoint
CREATE INDEX "products_name_trgm_idx" ON "products" USING gin ("name");--> statement-breakpoint
CREATE INDEX "products_description_trgm_idx" ON "products" USING gin ("description");