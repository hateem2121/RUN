# Database Optimization Migrations

This directory contains SQL migrations for performance optimizations identified in the Database Health Check Report.

## Migration Files

### 001_add_search_indexes.sql
**Purpose**: Add full-text search indexes using PostgreSQL trigram extension  
**Impact**: 10x faster search queries (500ms → 50ms)  
**Risk**: None (non-breaking, read-only optimization)  
**Tables Affected**: `fabrics`, `accessories`

**What it does**:
- Enables `pg_trgm` extension for trigram similarity search
- Adds GIN index on `fabrics.name` for ILIKE queries
- Adds separate GIN indexes on `accessories.name`, `accessories.description`, and `accessories.sku` for OR queries

**When to apply**: Immediately - safe for production

---

### 002_add_covering_index.sql
**Purpose**: Add covering index for product URL lookups (index-only scans)  
**Impact**: 20-30% faster product page loads  
**Risk**: Minimal - slight increase in write latency (negligible)  
**Tables Affected**: `products`

**What it does**:
- Creates covering index with INCLUDE clause for frequently accessed columns
- Enables index-only scans (no table lookup needed)
- Optionally drops old index after verification

**When to apply**: After testing in staging/development

---

## How to Apply Migrations

### Option 1: Using psql (Recommended)

```bash
# Connect to your NEON database
psql $DATABASE_URL

# Apply search indexes
\i migrations/optimizations/001_add_search_indexes.sql

# Apply covering index
\i migrations/optimizations/002_add_covering_index.sql
```

### Option 2: Using Drizzle Kit

```bash
# If using Drizzle migrations
npm run db:push
```

### Option 3: Using the Migration API

```bash
# Use the built-in migration executor
curl -X POST http://localhost:5000/api/utilities/migrate \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "-- paste migration SQL here --"
  }'
```

---

## Verification

After applying migrations, verify they're working:

```sql
-- Check if indexes were created
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE indexname IN (
  'fabrics_name_trgm_idx',
  'accessories_name_trgm_idx',
  'accessories_description_trgm_idx',
  'accessories_sku_trgm_idx',
  'products_url_path_covering_idx'
);

-- Test fabric search performance
EXPLAIN ANALYZE SELECT * FROM fabrics WHERE name ILIKE '%cotton%';
-- Expected: "Bitmap Index Scan on fabrics_name_trgm_idx"

-- Test accessory search performance
EXPLAIN ANALYZE 
SELECT * FROM accessories 
WHERE name ILIKE '%zipper%' OR description ILIKE '%zipper%' OR sku ILIKE '%zipper%';
-- Expected: "BitmapOr" with three "Bitmap Index Scan" nodes (one per index)

-- Test product URL lookup performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT id, name, slug, category_id, fabric_id 
FROM products 
WHERE url_path = '/products/test' AND is_active = true AND deleted_at IS NULL;
-- Expected: "Index Only Scan using products_url_path_covering_idx"
-- Expected: "Heap Fetches: 0"
```

---

## Index Sizes

Expected index sizes (approximate):

| Index | Size | Impact on Writes |
|-------|------|------------------|
| `fabrics_name_trgm_idx` | ~500KB | +2ms per INSERT |
| `accessories_name_trgm_idx` | ~1MB | +2ms per INSERT |
| `accessories_description_trgm_idx` | ~1.5MB | +2ms per INSERT |
| `accessories_sku_trgm_idx` | ~500KB | +2ms per INSERT |
| `products_url_path_covering_idx` | ~10MB | +1ms per INSERT |

Total overhead: ~13.5MB additional disk space, <10ms write latency increase

---

## Rollback Instructions

If you need to rollback:

```sql
-- Remove search indexes
DROP INDEX CONCURRENTLY IF EXISTS fabrics_name_trgm_idx;
DROP INDEX CONCURRENTLY IF EXISTS accessories_name_trgm_idx;
DROP INDEX CONCURRENTLY IF EXISTS accessories_description_trgm_idx;
DROP INDEX CONCURRENTLY IF EXISTS accessories_sku_trgm_idx;
DROP EXTENSION IF EXISTS pg_trgm;

-- Remove covering index
DROP INDEX CONCURRENTLY IF EXISTS products_url_path_covering_idx;

-- Restore old index if needed
CREATE INDEX CONCURRENTLY products_url_path_active_idx 
ON products (url_path, is_active, deleted_at);
```

---

## Performance Monitoring

After applying migrations, monitor these metrics:

1. **Search Query Time**: Should drop from 500ms → <50ms
2. **Product Page Load**: Should drop from 90ms → ~65ms
3. **Cache Hit Rate**: Should remain 70-85%
4. **Write Latency**: Should increase by <5ms (negligible)

Check query performance:
```sql
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE query ILIKE '%fabrics%' OR query ILIKE '%accessories%'
ORDER BY mean_exec_time DESC;
```

---

## Notes

- All indexes use `CREATE INDEX CONCURRENTLY` to avoid table locks
- Safe to apply during production traffic
- Migrations are idempotent (safe to run multiple times)
- No data changes, only performance improvements

---

## Questions?

Refer to the main **DATABASE_HEALTH_CHECK_REPORT.md** for detailed analysis and recommendations.
