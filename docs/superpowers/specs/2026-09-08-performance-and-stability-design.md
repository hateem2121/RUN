# Performance, Stability & Zero-Warning Architecture Design Spec

**Document:** `docs/superpowers/specs/2026-09-08-performance-and-stability-design.md`  
**Date:** September 8, 2026  
**Status:** Approved by User  
**Scope:** RUN APPAREL CMS v4.1.2 (`run-remix`)  
**Target:** Sialkot Dev Environment (Remote WAN to Neon AWS us-east-1) & Production Cloud Run  

---

## 1. Executive Summary & Problem Context

During comprehensive forensic telemetry and audit runs on `http://localhost:5002`, 16 critical, major, and cosmetic defects were diagnosed across four engineering layers:
1. **Memory & Resilience:** Dynamic circuit breaker naming causing exponential Map leaks (2.1 GB RSS, 95% host memory), and development Helmet CSP enforcing `upgrade-insecure-requests` / HSTS over plain HTTP, causing `net::ERR_SSL_PROTOCOL_ERROR`.
2. **Database & ORM:** Trans-oceanic cache loops to Neon's `cache_entries` table on cache misses, distorted stopwatch metrics bundling network latency and cache operations into query execution times, missing high-cardinality and filter indexes, unindexed audit log sorting, egress vector overfetching, and unbounded queries.
3. **Authentication & Session:** Serializing full user objects into Neon PostgreSQL session storage, redundant DB connectivity probes during mock auth, duplicate rate limiting causing early 429 lockouts, and 504 timeouts due to aggressive 5s pool connection timeouts during serverless database wakeups.
4. **Frontend & UX Polish:** Console font preload warnings for unused regular weights, image carousel key collisions with 10s freeze timeouts, verbose Vite rebuild logs, and browser environment mutation.

---

## 2. Architecture & Design Decisions

### 2.1 Track 1: Memory Leak Elimination & Security Header Hardening (P0)

#### Circuit Breakers (`server/lib/storage/app-service.ts`, `server/services/media/media-content.service.ts`)
- **Root Cause:** Appending dynamic IDs or keys to circuit breaker names (e.g. `gcs-${operationName}:${key}`, `get-media-content-${id}`) stores unbounded entries in `circuits` and `metricsStore` Maps in `circuit-breaker.ts`.
- **Solution:** Standardize to 6 singleton circuit breakers:
  - `gcs-upload`
  - `gcs-download`
  - `gcs-metadata`
  - `gcs-delete`
  - `gcs-list`
  - `media-content-asset`
  - `media-content-thumbnail`
- In addition, enforce direct `ResultAsync` return in `media-content.service.ts` to satisfy Protocol 0 / Rule 2.4.

#### Helmet Content Security Policy (`server/boot/middleware.ts`)
- **Root Cause:** `helmet.contentSecurityPolicy.getDefaultDirectives()` includes `"upgrade-insecure-requests": []`. In dev (`NODE_ENV !== "production"`), browsers convert `http://localhost:5002` to `https://localhost:5002`, failing with SSL protocol errors.
- **Solution:** In non-production environments:
  - Set `"upgrade-insecure-requests": null` in CSP directives.
  - Set `hsts: false` in Helmet options.
  - Add `http://localhost:5002` and `http://127.0.0.1:5002` to `img-src` and `connect-src`.

#### Duplicate Rate Limiting (`server/routes/auth.ts`, `server/routes/index.ts`)
- **Root Cause:** `criticalTier` rate limiter is mounted at both `apiRouter.use("/auth", criticalTier, authRouter)` in `server/routes/index.ts` and `router.use(criticalTier)` in `server/routes/auth.ts`.
- **Solution:** Remove the redundant `router.use(criticalTier)` from `server/routes/auth.ts`.

---

### 2.2 Track 2: Database Schema Indexing & Egress Guardrails (P1)

#### Drizzle Schema Indexes (`shared/schemas/`)
- **`certificates` (`shared/schemas/catalog.ts`):** Add compound index `index("certificates_deleted_at_type_idx").on(table.deletedAt, table.type)`.
- **`size_charts` (`shared/schemas/catalog.ts`):** Add compound index `index("size_charts_category_gender_idx").on(table.category, table.gender)`.
- **`blog_posts` (`shared/schemas/blog.ts`):** Add index `index("blog_posts_is_featured_idx").on(table.isFeatured, table.status)`.
- **`users` (`shared/schemas/users.ts`):** Add index `index("users_is_admin_idx").on(table.isAdmin)`.
- **`media_assets` (`shared/schemas/media.ts`):** Add GIN index `index("media_tags_gin_idx").using("gin", sql\`\${table.tags} jsonb_path_ops\`)`.

#### Audit Log Sorting (`server/services/repositories/system-repository.ts`)
- **Root Cause:** Repository orders by `desc(auditLogs.createdAt)`, but the database only has `index("audit_timestamp_idx").on(table.timestamp.desc())`.
- **Solution:** Change `orderBy(desc(auditLogs.createdAt))` to `orderBy(desc(auditLogs.timestamp))`.

#### Egress Overfetching & Unbounded Queries
- **`product-repository.ts`:** In `getProductsIncludingDeleted`, explicitly select product fields excluding heavy vector `embedding` (384 float dimensions).
- **`blog-repository.ts`:** In `getPublishedPosts`, exclude the heavy `content` column (full HTML/markdown) from list views, populating title, slug, excerpt, metadata, and timestamps.
- **Repository Bounds:** Add default `.limit(100)` to `getFibers`, `getCertificates`, `getSizeCharts`, `getFolders`, and `getAdminUsers`.

---

### 2.3 Track 3: Cache Calibration, Stopwatch Precision & Auth Streamlining (P1)

#### L2 Cache Short-Circuit in Development (`server/lib/cache/unified-cache.ts`)
- **Root Cause:** Remote WAN queries to Neon's `cache_entries` table add 260ms+ per miss. Sequential misses quadruple latency.
- **Solution:** Default `this.l2 = dummyCache` when `process.env.NODE_ENV !== "production"` unless explicitly overridden via `process.env.FORCE_L2_CACHE === "true"`. In production, retain `postgresCache` write-through.

#### Query Performance Monitor Stopwatch Calibration (`server/lib/db/query-performance.ts`)
- **Root Cause:** Timers start before cache reads, measure aggregate cache + count + query execution, and trigger alerts at a static 400ms threshold despite physical WAN RTT of 267ms from Pakistan to AWS us-east-1.
- **Solution:**
  - Introduce WAN-aware default threshold: `process.env.NODE_ENV === "production" ? 400 : 750` ms.
  - Record and evaluate actual database execution duration (`phases.dbQuery` if present) when deciding whether a query is slow.
  - Register catalog operations (`getAccessories`, `getAccessoriesWithCount`, `getMediaAssets`, `getProductsSummary`) under `USER_FACING`.
  - In `accessory-repository.ts`, eliminate duplicate nested tracking between `getAccessoriesWithCount` and `getAccessories`.

#### Neon Pool Connection Timeout (`server/db.ts`)
- **Root Cause:** `connectionTimeoutMillis` set to 5000ms. Cold starts of suspended Neon compute across the ocean take up to 4-7s, throwing statement/connection timeouts mapped to 504 `DatabaseTimeoutError`.
- **Solution:** Increase `connectionTimeoutMillis` to `10000` (10s) with proper backoff logging.

#### Mock Login Streamlining (`server/routes/auth.ts`, `server/services/system/auth.service.ts`)
- **Root Cause:** Full user profile serialized into Neon PostgreSQL session store; repeated DB probe (`isDatabasePoolHealthy`) and user upserts on every login.
- **Solution:**
  - Serialize only `{ id: user.id, isMock: true }` in Passport session.
  - Cache seeded mock admin user in-memory in `auth.service.ts` so repeated mock logins take 0 database queries.
  - Skip redundant pool health probe during mock admin login.

---

### 2.4 Track 4: Frontend Polish & Asset Delivery (P2/P3)

#### Font Preload Optimization (`client/app/root.tsx`)
- **Root Cause:** `NeueStance-Regular.woff2` preloaded via `<link rel="preload">`, but the app headings use `NeueStance-Bold.woff2` and body uses `Inter.woff2`. Chrome logs unused preload warning after 3 seconds.
- **Solution:** Remove the unused `NeueStance-Regular.woff2` link preload tag from `root.tsx`.

#### Product Image Carousel Keying & Timeouts (`client/app/components/products/ProductImageCarousel.tsx`)
- **Root Cause:** `images[imageIndex]?.id || 0` causes key collisions across items with ID 0 or undefined, corrupting timeout tracking. 10s timeout leaves skeleton spinner hanging too long.
- **Solution:**
  - Create robust composite key: `currentImage?.id ?? currentImage?.url ?? \`img-\${imageIndex}\``.
  - Reduce timeout from 10,000ms to 3,500ms.
  - Handle load/error events cleanly without shared key pollution.

#### Vite Build Cleanliness & Browser Scope Guard (`client/vite.config.ts`, `client/app/lib/model-viewer-loader.ts`)
- **`client/vite.config.ts`:** Remove raw `console.warn("[VITE-CONFIG-ARGS]", ...)` output.
- **`client/app/lib/model-viewer-loader.ts`:** Remove `process.env.NODE_ENV = "production"` mutation from client-side bundle; configure Lit via `(globalThis as any).litDisableDevelopmentMode = true` and SSR flags only.

---

## 3. Verification & Acceptance Criteria

1. **Protocol 0 Tech Integrity:** `npm run verify:tech-integrity` passes all 8 gates (Typecheck, Biome lint, Biome format, Knip, Bundle budget, Vitest, Clean seed, Audit).
2. **Slow Query Zero-Degradation:** `/api/metrics` reports `isDegraded: false`, 0 user-facing slow query warnings, and clean DB metrics.
3. **Memory Baseline:** RSS memory on `/api/metrics` stabilizes below 300MB (down from 2.1GB).
4. **Mock Login Speed:** `/api/auth/mock-login` executes in under 50ms (down from 2,561ms).
5. **Console Cleanliness:** 0 font preload warnings, 0 `ERR_SSL_PROTOCOL_ERROR` image failures, 0 Vite config argument pollutions.
