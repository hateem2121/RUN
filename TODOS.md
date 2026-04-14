# TODOS

## Infrastructure / Test Environment

### P0: Fix pre-existing test suite failures (noticed on `claude/quirky-wiles`, 2026-04-14)

**Status: RESOLVED** — committed `fef375d` on 2026-04-14

Five test files fixed (64 tests now passing):
- `server/lib/__tests__/verify-cloud-task-token.test.ts` — vi.hoisted() for Vitest 4.x class mock
- `tests/unit/services/admin-content.service.test.ts` — mock system-repository not audit-repository; avoids schema-drift error
- `server/tests/audit-verification.test.ts` — full Drizzle chain in db mock; logger.debug; adminNotifier guard behavior
- `tests/unit/api/catalog-api.test.ts` — added getFeaturedProductsCount mock (regression from DB pagination landing)
- `server/routes/admin/admin.test.ts` — expose StorageSingleton (hasInstance/getInstance) in storage-singleton mock

**Remaining pre-existing failures (require infra/env, not code fixes):**
- `tests/chaos/chaos-scenarios.test.ts` (6 tests) — requires live Redis/ports
- Integration tests hitting port 5002 (`db-metrics`, `error-propagation`, `slow-query`, `idempotency`, `resilience`, `infrastructure`, `error-handling`, `cms-api`) — require running server + env vars
- `tests/unit/hooks/use-homepage-data.test.ts` — JSX in `.ts` file (pre-existing extension bug, unrelated)

---

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

---

## Completed

<!-- Completed items will be moved here with version tags -->
