-- Migration: Add JSONB GIN Indexes for Array Containment Queries
-- Created: 2025-11-14
-- Purpose: Eliminate sequential scans on products.tags, certificate_ids, accessory_ids, image_ids
-- Expected Impact: Tag/array filtering changes from sequential scan to index scan
-- Risk: None (non-breaking, read-only optimization, uses CONCURRENTLY to avoid locks)

-- ============================================================================
-- CONTEXT
-- ============================================================================

-- Current query patterns using @> operator (containment):
-- 1. Tag searches: WHERE tags @> '["tag1"]'::jsonb
-- 2. Certificate filters: WHERE certificate_ids @> '[123]'::jsonb
-- 3. Accessory lookups: WHERE accessory_ids @> '[456]'::jsonb
-- 4. Image cleanup queries: WHERE image_ids @> '[789]'::jsonb
--
-- Problem: Without GIN indexes, PostgreSQL performs sequential scans
-- Impact: Performance degrades linearly with table size (O(n) instead of O(log n))
--
-- Solution: GIN indexes with jsonb_path_ops for efficient containment queries
-- Note: jsonb_path_ops is optimized for @> and @? operators (smaller, faster than jsonb_ops)

-- ============================================================================
-- STEP 1: Add GIN index for products.tags (tag filtering)
-- ============================================================================

-- Query pattern: Filter products by tags
-- Example: SELECT * FROM products WHERE tags @> '["performance", "sustainable"]'::jsonb;
-- Without index: Sequential scan through all products
-- With index: Direct lookup via GIN index

CREATE INDEX CONCURRENTLY IF NOT EXISTS products_tags_gin_idx 
ON products USING gin (tags jsonb_path_ops);

COMMENT ON INDEX products_tags_gin_idx IS 
'GIN index for fast JSONB array containment queries on product tags (@> operator)';

-- ============================================================================
-- STEP 2: Add GIN index for products.certificate_ids (certificate filtering)
-- ============================================================================

-- Query pattern: Find products with specific certificates
-- Example: SELECT * FROM products WHERE certificate_ids @> '[1, 5]'::jsonb;
-- Used by: Product filtering by sustainability certifications

CREATE INDEX CONCURRENTLY IF NOT EXISTS products_certificate_ids_gin_idx 
ON products USING gin (certificate_ids jsonb_path_ops);

COMMENT ON INDEX products_certificate_ids_gin_idx IS 
'GIN index for fast JSONB array containment queries on certificate IDs (@> operator)';

-- ============================================================================
-- STEP 3: Add GIN index for products.accessory_ids (accessory relationship)
-- ============================================================================

-- Query pattern: Find products that include specific accessories
-- Example: SELECT * FROM products WHERE accessory_ids @> '[10]'::jsonb;
-- Used by: Reverse accessory lookups, product bundling queries

CREATE INDEX CONCURRENTLY IF NOT EXISTS products_accessory_ids_gin_idx 
ON products USING gin (accessory_ids jsonb_path_ops);

COMMENT ON INDEX products_accessory_ids_gin_idx IS 
'GIN index for fast JSONB array containment queries on accessory IDs (@> operator)';

-- ============================================================================
-- STEP 4: Add GIN index for products.image_ids (media cleanup queries)
-- ============================================================================

-- Query pattern: Find products referencing specific media assets
-- Example: SELECT * FROM products WHERE image_ids @> '[42]'::jsonb;
-- Used by: Media cleanup scripts, orphaned asset detection

CREATE INDEX CONCURRENTLY IF NOT EXISTS products_image_ids_gin_idx 
ON products USING gin (image_ids jsonb_path_ops);

COMMENT ON INDEX products_image_ids_gin_idx IS 
'GIN index for fast JSONB array containment queries on image IDs (@> operator)';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test tag filtering (should use products_tags_gin_idx):
-- EXPLAIN ANALYZE 
-- SELECT id, name, tags 
-- FROM products 
-- WHERE tags @> '["performance"]'::jsonb;
--
-- Expected EXPLAIN output:
-- -> Bitmap Heap Scan on products
--    Recheck Cond: (tags @> '["performance"]'::jsonb)
--    -> Bitmap Index Scan on products_tags_gin_idx
--       Index Cond: (tags @> '["performance"]'::jsonb)

-- Test certificate filtering (should use products_certificate_ids_gin_idx):
-- EXPLAIN ANALYZE 
-- SELECT id, name, certificate_ids 
-- FROM products 
-- WHERE certificate_ids @> '[1]'::jsonb;

-- Test accessory lookup (should use products_accessory_ids_gin_idx):
-- EXPLAIN ANALYZE 
-- SELECT id, name, accessory_ids 
-- FROM products 
-- WHERE accessory_ids @> '[10]'::jsonb;

-- Test image reference query (should use products_image_ids_gin_idx):
-- EXPLAIN ANALYZE 
-- SELECT id, name, image_ids 
-- FROM products 
-- WHERE image_ids @> '[42]'::jsonb;

-- ============================================================================
-- PERFORMANCE IMPACT ESTIMATION
-- ============================================================================

-- Assumptions:
-- - 500 products in database
-- - 10% of products match typical tag filter
-- - Average 3 tags per product
--
-- Before (Sequential Scan):
-- - Scans all 500 rows
-- - Parses JSONB for each row
-- - Estimated time: 50-100ms
--
-- After (GIN Index Scan):
-- - Direct index lookup
-- - Only scans ~50 matching rows
-- - Estimated time: 5-10ms
--
-- Expected improvement: 10x faster (90% reduction in query time)
--
-- Scalability:
-- - Sequential scan: O(n) - degrades linearly with table growth
-- - GIN index scan: O(log n) - scales logarithmically
-- - At 5,000 products: 500ms → 15ms (30x improvement)
-- - At 50,000 products: 5000ms → 25ms (200x improvement)

-- ============================================================================
-- INDEX SIZE ESTIMATION
-- ============================================================================

-- Each GIN index size (approximate):
-- - tags: ~50KB (500 products × 3 tags × 32 bytes)
-- - certificate_ids: ~30KB (500 products × 2 certs × 32 bytes)
-- - accessory_ids: ~40KB (500 products × 2.5 accessories × 32 bytes)
-- - image_ids: ~60KB (500 products × 4 images × 32 bytes)
--
-- Total additional storage: ~180KB
-- Trade-off: Minimal storage cost for significant query performance gain

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- DROP INDEX CONCURRENTLY IF EXISTS products_tags_gin_idx;
-- DROP INDEX CONCURRENTLY IF EXISTS products_certificate_ids_gin_idx;
-- DROP INDEX CONCURRENTLY IF EXISTS products_accessory_ids_gin_idx;
-- DROP INDEX CONCURRENTLY IF EXISTS products_image_ids_gin_idx;
