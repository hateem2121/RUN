-- AUDIT FIX: Add missing foreign key indexes for products table
-- Prevents slow JOINs when querying products with media relationships
-- Reference: PRE_PRODUCTION_AUDIT_REPORT.md - Database Analysis - Index & Schema Audit
--
-- UPDATED: 2025-11-14 - All indexes now use CONCURRENTLY to prevent table locks
-- Reason: Production safety - prevents 50-200ms table locks during index creation
-- Critical for zero-downtime deployments and avoiding query blocking

-- Add index for primary_image_id foreign key
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_primary_image_id_idx ON products(primary_image_id);

-- Add index for primary_video_id foreign key
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_primary_video_id_idx ON products(primary_video_id);

-- Add index for model_file_id foreign key
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_model_file_id_idx ON products(model_file_id);

-- Verify indexes were created
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'products' AND indexname LIKE '%image%' OR indexname LIKE '%video%' OR indexname LIKE '%model%';
