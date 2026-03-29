ALTER TABLE "about_map_locations" ADD COLUMN "sort_order" integer DEFAULT 0;--> statement-breakpoint
CREATE INDEX "about_map_locations_sort_order_idx" ON "about_map_locations" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "anim_errors_type_resolved_idx" ON "animation_errors" USING btree ("error_type","resolved");--> statement-breakpoint
CREATE INDEX "anim_errors_component_idx" ON "animation_errors" USING btree ("component_name");--> statement-breakpoint
CREATE INDEX "audit_table_record_idx" ON "audit_logs" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "audit_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_timestamp_idx" ON "audit_logs" USING btree ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_action_time_idx" ON "audit_logs" USING btree ("action","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "metrics_type_time_idx" ON "performance_metrics" USING btree ("metric_type","timestamp");--> statement-breakpoint
CREATE INDEX "metrics_component_idx" ON "performance_metrics" USING btree ("component_name");--> statement-breakpoint
CREATE INDEX "metrics_timestamp_idx" ON "performance_metrics" USING btree ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "storage_logs_action_time_idx" ON "storage_change_logs" USING btree ("action","created_at");