# TODOS

## Performance / Caching

*No outstanding high-priority performance or caching issues.*

---

## Completed

### P2: Invalidate `products:count:featured` cache on isFeatured toggle — **Completed: v4.0.3 (2026-05-26)**
- Added invalidation patterns inside the `invalidateProductCount` repository method to proactively clear all category, tag, search, and featured count caches when product records are updated.

### P3: E2E test for CustomDropdown Tab/Escape focus return — **Completed: v4.0.3 (2026-05-26)**
- Attached native capture-phase keydown listeners to the dropdown trigger and option buttons to bypass React's root event delegation and Radix's FocusScope. Added Playwright E2E tests for Escape/Tab keyboard accessibility.

### P2: Harden idempotency middleware for production — **Completed: v4.0.3 (2026-05-26)**
- Hardened the idempotency cache layer by scheduling a periodic background runner in `server/boot/services.ts` that cleans up expired L2 cache entries every hour, resolving potential long-term memory growth in Postgres/Neon.

### P1: Database & Schema Layer Audit Remediation (DS-AUDIT) — **Completed: v4.1.1 (2026-05-30)**
- Remediated type mismatch on `recordedBy` in `sustainability_metric_history` and added parent-child self-referential FK constraint on `folders`.
- Provisioned B-tree database indexes on foreign keys to eliminate sequential scans during JOINs.
- Pruned duplicate indexes and consolidated server route schemas with canonical `@run-remix/shared` imports.
- Integrated serverless HTTP database query client (`httpDb`) to route read-only queries away from WebSocket pools.
- Automated `updatedAt` column triggers using Drizzle's `$onUpdate()` client hook.

### P0: Fix pre-existing test suite failures — **Completed: v4.0.1 (2026-04-15)**
80/80 tests passing (773 test assertions, 0 failed, 0 skipped). All 18 test files fixed across 5 commits (`fef375d`, `6707b51`, `ee617f5`, `4e4a695`, `7a5d0e6`). New: `server/middleware/idempotency.ts` implemented. Key fixes: supertest-based chaos/db-metrics/slow-query tests (no live server), Vitest JSX transform for `.tsx` hooks, Drizzle metricsLogger for counter tracking.
