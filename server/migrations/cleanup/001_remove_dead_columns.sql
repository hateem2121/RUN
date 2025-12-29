-- Migration: Remove unused/dead columns from database schema
-- Date: 2025-11-14
-- Author: Performance Optimization Team
-- Context: Cleanup of columns that are never populated or read, reducing storage overhead

-- =============================================================================
-- CATEGORIES TABLE
-- =============================================================================

-- Remove product_count column (never updated - COUNT queries used instead)
-- Reason: Dynamic product counts calculated via COUNT(*) queries in repository layer
-- Storage impact: ~4 bytes per category row
ALTER TABLE categories DROP COLUMN IF EXISTS product_count;

-- =============================================================================
-- PRODUCTS TABLE
-- =============================================================================

-- Remove category_path column (never populated - client-side path computation used)
-- Reason: Category breadcrumb paths computed dynamically from parent relationships
-- Storage impact: ~500 bytes per product row (varchar 500)
ALTER TABLE products DROP COLUMN IF EXISTS category_path;

-- =============================================================================
-- MEDIA_ASSETS TABLE
-- =============================================================================

-- Remove download_count column (never updated - tracking not implemented)
-- Reason: Feature planned but never implemented; always defaults to 0
-- Storage impact: ~4 bytes per media asset row
ALTER TABLE media_assets DROP COLUMN IF EXISTS download_count;

-- Remove last_accessed_at column (never updated - tracking not implemented)
-- Reason: Feature planned but never implemented; always NULL
-- Storage impact: ~8 bytes per media asset row
ALTER TABLE media_assets DROP COLUMN IF EXISTS last_accessed_at;

-- NOTE: media_assets.size column is RETAINED despite being a duplicate of file_size
-- Reason: Actively used in 16+ frontend locations (UnifiedMediaTheater, MediaGrid, etc.)
-- A separate frontend refactoring task is required before this column can be safely removed

-- =============================================================================
-- MIGRATION SUMMARY
-- =============================================================================
-- Total columns dropped: 4
-- Estimated storage savings: ~516 bytes per product + media asset row
-- Breaking changes: None (columns were never read by application code)

-- =============================================================================
-- ROLLBACK COMMANDS (if needed)
-- =============================================================================
-- WARNING: Rollback will restore column structure but NOT data
-- All columns will be re-created with default/NULL values

-- ROLLBACK for categories table:
-- ALTER TABLE categories ADD COLUMN product_count INTEGER DEFAULT 0;

-- ROLLBACK for products table:
-- ALTER TABLE products ADD COLUMN category_path VARCHAR(500);

-- ROLLBACK for media_assets table:
-- ALTER TABLE media_assets ADD COLUMN download_count INTEGER DEFAULT 0;
-- ALTER TABLE media_assets ADD COLUMN last_accessed_at TIMESTAMP(3);
