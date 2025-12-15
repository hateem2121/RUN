# Phase 2D: Homepage Query Consolidation Analysis

## Current Architecture

### Frontend
- **Single endpoint**: `/api/homepage-batch` (already consolidated at HTTP level ✅)
- **Query key**: `["/api/homepage-batch"]`
- **Stale time**: 30s (matches server cache)

### Backend - Current Implementation
**Route**: `server/routes/modules/homepage-batch-routes.ts`

**8 Separate Database Queries (via Promise.all):**
1. `storage.getHomepageHero()` - Homepage hero section
2. `storage.getHomepageSlogans()` - Array of slogans
3. `storage.getHomepageProcessCards()` - Array of process cards
4. `storage.getHomepageSections()` - Array of sections
5. `storage.getHomepageSustainability()` - Sustainability data
6. `storage.getHomepageFeaturedProductsSettings()` - Featured products config
7. `storage.getProducts(20, 0)` - **BOTTLENECK: 555-3021ms** ⚠️
8. `storage.getCategories()` - Categories list

### Performance Analysis

**Total Response Time**: ~200-3500ms (varies by cache state)
- **Hero, slogans, cards, sections, sustainability**: <50ms each (fast ✅)
- **getProducts**: 555-3021ms (**CRITICAL BOTTLENECK** ❌)
- **getCategories**: ~50-200ms (moderate)

**Why Parallel Promise.all Isn't Enough:**
- Each query opens a separate DB connection
- getProducts has expensive JOINs (mediaAssets, categories, variants)
- No request coalescing at DB level (8 round-trips to Postgres)

## Consolidation Strategy

### Option 1: Single SQL Query with UNION ALL (Recommended)
**Pros:**
- True 1 round-trip to database
- Eliminates connection overhead
- Predictable performance

**Cons:**
- Complex SQL to maintain
- Different table schemas need normalization
- Risk of regression if not carefully tested

**Implementation:**
```sql
-- Pseudo-SQL concept
WITH homepage_data AS (
  SELECT 'hero' as type, to_jsonb(h.*) as data FROM homepage_hero h LIMIT 1
  UNION ALL
  SELECT 'slogans', jsonb_agg(to_jsonb(s.*)) FROM homepage_slogans s WHERE s."isActive" = true
  UNION ALL
  SELECT 'processCards', jsonb_agg(to_jsonb(p.*)) FROM homepage_process_cards p ORDER BY p."sortOrder"
  UNION ALL
  SELECT 'sections', jsonb_agg(to_jsonb(sec.*)) FROM homepage_sections sec
  UNION ALL
  SELECT 'sustainability', to_jsonb(sus.*) FROM homepage_sustainability sus LIMIT 1
  UNION ALL
  SELECT 'settings', to_jsonb(fps.*) FROM homepage_featured_products_settings fps LIMIT 1
  UNION ALL
  SELECT 'products', jsonb_agg(product_data) FROM (
    SELECT p.id, p.name, p.slug, ... FROM products p
    LEFT JOIN media_assets ma ON p."primaryImageId" = ma.id
    LIMIT 20
  ) product_data
  UNION ALL
  SELECT 'categories', jsonb_agg(to_jsonb(c.*)) FROM categories c
)
SELECT jsonb_object_agg(type, data) FROM homepage_data;
```

### Option 2: Optimize getProducts Query (Quick Win)
**Focus on the bottleneck:**
- Add database indexes on products.primaryImageId, products.categoryId
- Remove unnecessary JOINs for homepage (just need basic product info)
- Use simpler query for featured products vs full product details

**Impact:** Could reduce getProducts from 3021ms → <500ms (83% improvement)

### Option 3: Hybrid Approach (Balanced)
1. Keep separate queries for simple tables (hero, slogans, cards - already fast)
2. Consolidate complex queries (products + categories + media) into single optimized query
3. Use 2 parallel queries instead of 8 (4x reduction)

## Recommendation

**Phase 2D Implementation Plan:**

### Step 1: Quick Win - Optimize getProducts (HIGH PRIORITY)
- Profile current getProducts query plan
- Add missing indexes
- Create lightweight `getHomepageFeaturedProducts()` variant
- **Target**: 3021ms → <200ms

### Step 2: Consolidate Related Data
- Merge products + categories + featuredSettings into single query
- Keep simple tables separate (already fast)
- **Target**: 8 queries → 3 queries

### Step 3: Feature Flag for Safety
- Implement `USE_CONSOLIDATED_HOMEPAGE_QUERY` flag
- A/B test old vs new implementation
- Rollback capability if issues arise

## Success Metrics
- **Response time**: <100ms (from current 200-3500ms)
- **Query count**: 3 queries (from 8)
- **Cache hit rate**: Maintain 69%+ with consolidated cache key
- **Data integrity**: Zero mismatches in A/B testing

## Next Actions
1. Profile getProducts query execution plan
2. Identify missing indexes
3. Implement lightweight homepage variant
4. Measure performance improvement
