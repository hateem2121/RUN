# Phase 4: Architecture Audit Findings

## ARCH-01: ErrorBoundary missing on routes with loaders/actions
**Severity:** Pass (No missing error boundaries)
**File path:** `client/app/routes/`
**Grep evidence:** `grep -El "export .* (loader|action)" client/app/routes/*.tsx | xargs grep -L "ErrorBoundary"` returned no results.
**Description:** All route files with loaders or actions in `client/app/routes/` properly implement `ErrorBoundary` or re-export `RouteErrorBoundary as ErrorBoundary`.

## ARCH-02: Route manifest parity
**Severity:** P1 Major
**File path:** `shared/route-manifest.ts`
**Grep evidence:** Missing counterparts in `shared/route-manifest.ts`.
**Description:** `/services` and `/blog` both serve CMS content via their loaders (`/api/services` and `/api/blog` respectively), yet they are missing admin counterpart definitions (`/admin/services`, `/admin/blog`) in the route manifest. `/gallery` properly falls back to `/admin/media` while `/collections` and `/resources` do not directly require distinct single admin counterparts as they either hardcode content or aggregate from other modules (which are already in the manifest).

## ARCH-03: useEffect syncing server state
**Severity:** P1 Major
**File paths:**
- `client/app/components/admin/about/about-hero-tab.tsx`
- `client/app/components/admin/about/about-team-message-tab.tsx`
- `client/app/components/admin/blog/blog-management.tsx`
**Grep evidence:** `grep -rnA 10 "useEffect(() => {" client/app/components/` and `grep -rn "fetch" client/app/components/`
**Description:** Found usage of `useEffect` in combination with `fetch` to load server state. Rule explicitly forbids syncing server state using `useEffect`. State synchronization must use `useOptimistic` + `useActionState` instead.

## ARCH-04: Dead packages
**Severity:** P2 Minor (but partial pass)
**File paths:** `client/vite.config.ts`, `server/middleware/production-error-handler.ts`, `server/lib/jobs/queues/cache-invalidation-queue.ts`, `server/lib/jobs/queues/email-queue.ts`, `server/lib/jobs/workers/bullmq-worker.ts`, `server/lib/monitoring/sentry.ts`, `server/lib/monitoring/logger.ts`
**Grep evidence:** Lookups for `three`, `lenis`, `framer-motion` yielded no results (they are not imported and have no dead usage). However, `bullmq` and `@sentry` are actively imported in multiple server and client files and should not be considered "dead" as they are actively powering queue architecture and error reporting.

## ARCH-05: Thin controller enforcement
**Severity:** P0 Critical
**File paths:**
- `server/routes/metrics.ts`
- `server/routes/utilities/metrics.ts`
**Grep evidence:** `grep -rnE "(db|database|pool)\." server/routes/` highlighted `import { getPoolMetrics } from "../db.js";` being executed inside route handlers.
**Description:** Direct access to `db.js` pool metrics from a route handler violates the architectural thin-controller rule which mandates all DB access must go through `server/services/`.

## ARCH-06: Shared boundary
**Severity:** P1 Major
**File paths:** Multiple files in `server/` including `server/services/`, `server/routes/`, `server/lib/db/repositories/`.
**Grep evidence:** `grep -rnE "from ['\"](\.\.\/)+shared" server/` yields 40+ results.
**Description:** The `server` package is bypassing the designated monorepo `@run-remix/shared` import alias and instead imports `shared/index.js` using relative paths (e.g., `../../shared/index.js`). This breaks the workspace boundary rule.

## ARCH-07: Cloud Tasks worker auth
**Severity:** P0 Critical
**File path:** `server/routes/worker.ts`
**Grep evidence:** `grep -n -B 5 -A 10 "const verifyWorkerAuth" server/routes/worker.ts`
**Description:** In `verifyWorkerAuth`, `verifyCloudTaskToken(req)` is invoked correctly, and when unauthorized it issues `res.status(403).json({ error: "Unauthorized" })`. However, it misses the `return` statement afterwards, allowing it to fall through to `next()` and expose worker routes indiscriminately.

## ARCH-08: L1/L2 cache usage
**Severity:** P2 Minor
**File path:** `server/lib/cache/admin-cache.ts`
**Grep evidence:** `grep -rn "LRUCache" server/` -> `import { LRUCache } from "lru-cache"; const adminCache = new LRUCache<string, AdminCacheEntry>({ ... })`
**Description:** The admin-cache module initiates its own isolated `LRUCache` instance directly, completely bypassing `unified-cache.ts`.
