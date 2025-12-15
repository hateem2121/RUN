-- Migration: Add Trigram Indexes for Media and Product Search
-- drizzle:skip (required for CREATE INDEX CONCURRENTLY - cannot run in transaction)
-- Created: 2025-11-14
-- Purpose: Eliminate sequential scans on ILIKE queries for media assets and products
-- Expected Impact: Search queries change from sequential scan to index scan
-- Risk: None (non-breaking, read-only optimization, uses CONCURRENTLY to avoid locks)

-- ============================================================================
-- CONTEXT
-- ============================================================================

-- Current query patterns using ILIKE (partial text search):
-- 1. Media search: WHERE filename ILIKE '%term%' OR original_name ILIKE '%term%' OR alt_text ILIKE '%term%'
-- 2. Product search: WHERE name ILIKE '%term%' OR description ILIKE '%term%'
--
-- Problem: Without trigram indexes, PostgreSQL performs sequential scans
-- Impact: Search performance degrades linearly with table size
--
-- Solution: GIN trigram indexes with gin_trgm_ops for efficient partial text search
-- Note: Extension pg_trgm is already enabled in 001_add_search_indexes.sql
--
-- Query locations:
-- - server/lib/repositories/media-repository.ts: getMediaAssets(), searchAssets()
-- - server/lib/repositories/product-repository.ts: searchProducts()

-- ============================================================================
-- MEDIA ASSETS TRIGRAM INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- INDEX 1: media_assets.filename
-- ----------------------------------------------------------------------------

-- Query pattern: Search media by filename
-- Example: SELECT * FROM media_assets WHERE filename ILIKE '%logo%';
-- Used by: Media library search, asset selection in admin
-- Without index: Sequential scan through all media assets

CREATE INDEX CONCURRENTLY IF NOT EXISTS media_assets_filename_trgm_idx 
ON media_assets USING gin (filename gin_trgm_ops);

COMMENT ON INDEX media_assets_filename_trgm_idx IS 
'Trigram index for fast ILIKE searches on media asset filenames (@@ operator)';

-- ----------------------------------------------------------------------------
-- INDEX 2: media_assets.original_name
-- ----------------------------------------------------------------------------

-- Query pattern: Search media by original filename
-- Example: SELECT * FROM media_assets WHERE original_name ILIKE '%banner%';
-- Used by: Finding assets by their original upload name
-- Without index: Sequential scan

CREATE INDEX CONCURRENTLY IF NOT EXISTS media_assets_original_name_trgm_idx 
ON media_assets USING gin (original_name gin_trgm_ops);

COMMENT ON INDEX media_assets_original_name_trgm_idx IS 
'Trigram index for fast ILIKE searches on original media filenames';

-- ----------------------------------------------------------------------------
-- INDEX 3: media_assets.alt_text
-- ----------------------------------------------------------------------------

-- Query pattern: Search media by alt text (accessibility descriptions)
-- Example: SELECT * FROM media_assets WHERE alt_text ILIKE '%sustainable%';
-- Used by: Content search, accessibility audit
-- Without index: Sequential scan

CREATE INDEX CONCURRENTLY IF NOT EXISTS media_assets_alt_text_trgm_idx 
ON media_assets USING gin (alt_text gin_trgm_ops);

COMMENT ON INDEX media_assets_alt_text_trgm_idx IS 
'Trigram index for fast ILIKE searches on media alt text descriptions';

-- ============================================================================
-- PRODUCTS TRIGRAM INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- INDEX 4: products.name
-- ----------------------------------------------------------------------------

-- Query pattern: Search products by name
-- Example: SELECT * FROM products WHERE name ILIKE '%running%';
-- Used by: Product search, autocomplete
-- Without index: Sequential scan through all products
-- Note: This is a HOT query path - critical for user experience

CREATE INDEX CONCURRENTLY IF NOT EXISTS products_name_trgm_idx 
ON products USING gin (name gin_trgm_ops);

COMMENT ON INDEX products_name_trgm_idx IS 
'Trigram index for fast ILIKE searches on product names (critical for search UX)';

-- ----------------------------------------------------------------------------
-- INDEX 5: products.description
-- ----------------------------------------------------------------------------

-- Query pattern: Search products by description text
-- Example: SELECT * FROM products WHERE description ILIKE '%moisture wicking%';
-- Used by: Product search with description matching
-- Without index: Sequential scan

CREATE INDEX CONCURRENTLY IF NOT EXISTS products_description_trgm_idx 
ON products USING gin (description gin_trgm_ops);

COMMENT ON INDEX products_description_trgm_idx IS 
'Trigram index for fast ILIKE searches on product descriptions';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test media filename search (should use media_assets_filename_trgm_idx):
-- EXPLAIN ANALYZE 
-- SELECT id, filename, type, url 
-- FROM media_assets 
-- WHERE filename ILIKE '%logo%';
--
-- Expected EXPLAIN output:
-- -> Bitmap Heap Scan on media_assets
--    Recheck Cond: (filename ~~* '%logo%'::text)
--    -> Bitmap Index Scan on media_assets_filename_trgm_idx
--       Index Cond: (filename ~~* '%logo%'::text)

-- Test media combined search (should use BitmapOr with all 3 media indexes):
-- EXPLAIN ANALYZE 
-- SELECT id, filename, original_name, alt_text 
-- FROM media_assets 
-- WHERE filename ILIKE '%banner%' 
--    OR original_name ILIKE '%banner%' 
--    OR alt_text ILIKE '%banner%';
--
-- Expected: PostgreSQL will use BitmapOr to combine results from:
-- - media_assets_filename_trgm_idx
-- - media_assets_original_name_trgm_idx
-- - media_assets_alt_text_trgm_idx

-- Test product name search (should use products_name_trgm_idx):
-- EXPLAIN ANALYZE 
-- SELECT id, name, description, slug 
-- FROM products 
-- WHERE name ILIKE '%running%';

-- Test product description search (should use products_description_trgm_idx):
-- EXPLAIN ANALYZE 
-- SELECT id, name, description 
-- FROM products 
-- WHERE description ILIKE '%moisture%';

-- ============================================================================
-- PERFORMANCE IMPACT ESTIMATION
-- ============================================================================

-- Media Assets Search (500 assets in database):
-- --------------------------------------------
-- Before (Sequential Scan):
-- - Scans all 500 rows
-- - String pattern matching per row
-- - Estimated time: 30-60ms
--
-- After (GIN Index Scan):
-- - Direct trigram index lookup
-- - Only scans matching rows (~5-50 rows typically)
-- - Estimated time: 3-8ms
--
-- Expected improvement: 7-10x faster
--
-- Scalability:
-- - At 5,000 assets: 300ms → 10ms (30x)
-- - At 50,000 assets: 3000ms → 20ms (150x)

-- Product Search (500 products in database):
-- -------------------------------------------
-- Before (Sequential Scan):
-- - Scans all 500 rows
-- - String pattern matching per row
-- - Estimated time: 40-80ms
--
-- After (GIN Index Scan):
-- - Direct trigram index lookup
-- - Only scans matching rows (~10-100 rows)
-- - Estimated time: 5-12ms
--
-- Expected improvement: 6-8x faster
--
-- Scalability:
-- - At 5,000 products: 400ms → 15ms (27x)
-- - At 50,000 products: 4000ms → 30ms (133x)

-- ============================================================================
-- INDEX SIZE ESTIMATION
-- ============================================================================

-- Trigram indexes are larger than B-tree because they store n-grams:
--
-- Media Assets Indexes:
-- - filename: ~80KB (500 assets × avg 30 chars × 5 trigrams)
-- - original_name: ~80KB (similar size)
-- - alt_text: ~120KB (longer text, more trigrams)
--
-- Product Indexes:
-- - name: ~60KB (500 products × avg 25 chars × 5 trigrams)
-- - description: ~300KB (longer text fields, many trigrams)
--
-- Total additional storage: ~640KB
-- Trade-off: Modest storage cost for significant search performance gains

-- ============================================================================
-- QUERY PATTERN EXAMPLES FROM CODEBASE
-- ============================================================================

-- From server/lib/repositories/media-repository.ts:112-120
-- Current implementation (will benefit from these indexes):
-- 
-- const searchPattern = `%${searchTerm}%`;
-- const searchCondition = or(
--   ilike(mediaAssets.filename, searchPattern),
--   ilike(mediaAssets.originalName, searchPattern),
--   ilike(mediaAssets.altText, searchPattern)
-- );
--
-- This query will now use BitmapOr combining all three trigram indexes
-- instead of performing a full table scan.

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================

-- 1. CONCURRENTLY keyword:
--    - Prevents table locks during index creation
--    - Index builds in background without blocking queries
--    - Safe for production deployment
--
-- 2. gin_trgm_ops operator class:
--    - Optimized for ILIKE/~~ pattern matching
--    - Supports % wildcards at start, middle, or end
--    - More efficient than standard GIN for text search
--
-- 3. Extension dependency:
--    - Requires pg_trgm extension (already enabled in 001_add_search_indexes.sql)
--    - No additional extension setup needed
--
-- 4. Index maintenance:
--    - Trigram indexes auto-update on INSERT/UPDATE
--    - No manual maintenance required
--    - VACUUM will keep indexes healthy

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP INDEX CONCURRENTLY IF EXISTS media_assets_filename_trgm_idx;
-- DROP INDEX CONCURRENTLY IF EXISTS media_assets_original_name_trgm_idx;
-- DROP INDEX CONCURRENTLY IF EXISTS media_assets_alt_text_trgm_idx;
-- DROP INDEX CONCURRENTLY IF EXISTS products_name_trgm_idx;
-- DROP INDEX CONCURRENTLY IF EXISTS products_description_trgm_idx;
