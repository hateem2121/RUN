# TODOS

## Performance / Caching

### P2: Invalidate `products:count:featured` cache on isFeatured toggle (noticed 2026-04-14)

**Priority:** P2 — stale featured count until TTL expiry; low impact but misleading pagination metadata

- File: `server/lib/db/repositories/product-repository.ts`
- `invalidateProductCount()` (line ~345) deletes `CacheKeys.products.totalCount()` but NOT `products:count:featured`
- When a product's `isFeatured` is toggled, the featured count remains stale until `PRODUCT_CACHE_TTL` expires
- Fix: Add `await cache.del("products:count:featured")` inside `invalidateProductCount()` or fire it from the product-update service
- Joins the existing class of stale-count keys for category/tag/search counts

### P3: E2E test for CustomDropdown Tab/Escape focus return (noticed 2026-04-14)

**Priority:** P3 — UI behavior, keyboard accessibility, Playwright test

- File: `client/app/components/admin/CustomDropdown.tsx`
- Fix 8 wired `triggerRef.current?.focus()` on Tab/Escape from open listbox
- Behavior can only be verified via browser automation (focus isn't visible in unit tests)
- Add Playwright test: open dropdown → Tab → assert focus on trigger button; repeat for Escape

### P2: Harden idempotency middleware for production (noticed 2026-04-15)

**Priority:** P2 — current implementation safe for single-instance dev/staging; not production-safe at scale

- File: `server/middleware/idempotency.ts`
- In-memory `Map` store has no TTL or eviction — sustained load leaks memory indefinitely
- No cross-instance state: horizontal scaling (multiple pods/Cloud Run replicas) will execute duplicate requests on different instances, defeating the guarantee
- Process restarts clear all cached keys — clients replaying after a pod restart get a fresh execution
- Fix options: (a) add TTL + max-entries cap to the in-memory store for single-instance safety, (b) migrate store to Redis/Upstash for multi-instance correctness

---

## Completed

### P0: Fix pre-existing test suite failures — **Completed: v4.0.1 (2026-04-15)**

80/80 tests passing (773 test assertions, 0 failed, 0 skipped). All 18 test files fixed across 5 commits (`fef375d`, `6707b51`, `ee617f5`, `4e4a695`, `7a5d0e6`). New: `server/middleware/idempotency.ts` implemented. Key fixes: supertest-based chaos/db-metrics/slow-query tests (no live server), Vitest JSX transform for `.tsx` hooks, Drizzle metricsLogger for counter tracking.
