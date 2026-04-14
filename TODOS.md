# TODOS

## Infrastructure / Test Environment

### P0: Fix pre-existing test suite failures (noticed on `claude/quirky-wiles`, 2026-04-14)

**Priority:** P0 — breaks 15 tests in CI, blocks accurate coverage reporting

Three root causes identified:

**1. Schema drift: `user_email_index` column missing from `audit_logs` table**

- Failing tests: `tests/unit/services/admin-content.service.test.ts` (3 tests)
- Error: `column "user_email_index" of relation "audit_logs" does not exist`
- Fix: Run the missing DB migration that adds `user_email_index` to `audit_logs`

**2. Missing env vars in test environment**

- Failing tests: `tests/chaos/chaos-scenarios.test.ts` (6 tests), `server/tests/audit-verification.test.ts` (5 tests), `tests/api/cms-api.test.ts`, `server/routes/admin/admin.test.ts`, `tests/integration/db-metrics.test.ts` (2 tests), `tests/error-handling.integration.test.ts`, `tests/infrastructure.test.ts`, `tests/integration/idempotency.test.ts`, `tests/integration/resilience.test.ts`, `tests/integration/slow-query.test.ts`, `tests/integration/error-propagation.test.ts`
- Missing: `REDIS_URL`, `GCS_BUCKET_NAME`, `UPSTASH_REDIS_REST_URL`, `DIRECT_DATABASE_URL`
- Fix: Add required env vars to `.env.test` or stub them in vitest setup

**3. Broken mock export in secret-manager**

- Failing test: `server/lib/__tests__/verify-cloud-task-token.test.ts`
- Error: `No "getSecret" export is defined on the "../server/lib/secrets/secret-manager.js" mock`
- Fix: Update `vi.mock` in this test to export `getSecret` from the mock factory

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
