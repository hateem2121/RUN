# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.1.2] - 2026-06-20

### Security
- **P0 CVE Remediation**: Pinned `nodemailer` to `v9.0.1` and `undici` to resolve critical vulnerabilities flagged in `npm audit`.

### Architecture
- **Local Schema Violations Resolved (D04)**: Centralized 11 inline Zod schema definitions (`reorderSchema`) into 8 canonical exports within `@run-remix/shared/schemas/api/common.ts`.
- **Express 5 Native Async**: Eliminated 5 redundant `try/catch` blocks from async routes (H12/H13 compliance).
- **React 19 Forms**: Upgraded 5 legacy `onSubmit` handlers to native React 19 `<form action={fn}>` patterns.

### Process & Tooling
- **Main Branch Rules Override**: Updated system agent rules (`gemini.md`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`) to permit direct `main` commits given explicit user authorization, bypassing `/ship`.
- **Bundle Optimization**: Verified code-splitting for `LazyUnifiedModelViewer` (415KB dynamic chunk).

## [4.1.1] - 2026-05-30

### Added
- **Stateless HTTP Driver Connection**: Integrated `httpDb` using `@neondatabase/serverless` HTTP client in `server/db.ts` to execute lightweight, non-transactional read queries without WebSocket handshake overhead.
- **Automated Timestamp Automation**: Added `$onUpdate` hooks for all database `updatedAt` columns across shared schemas.

### Fixed
- **Foreign Key Type Safety**: Resolved columns type mismatch for `recordedBy` in `sustainability_metric_history` to reference `users.id` with a physical foreign key constraint.
- **Media Folders Self-Referential Integrity**: Added parent-child self-referential foreign key constraint on `parentId` referencing `id` in `folders` table to prevent orphan directories.
- **Database Performance Indexes**: Configured database indexes on JOIN foreign key columns across materials, webhooks, blog, catalog, common, manufacturing, technology, and media schemas.
- **Zod Schema Consolidation**: Replaced local manual schemas in `server/routes/admin/products.routes.ts` and `server/routes/media/types.ts` with canonical imports from `@run-remix/shared`.

## [4.1.0] - 2026-05-06

### Added

- **Sustainability Metric Tracking**: New `sustainability_metric_history` table for immutable change tracking.
- **Accessibility Baseline**: Integrated `axe-core` and established regression tests in `client/tests/accessibility.test.tsx`.
- **Web Vitals Monitoring**: Real-time performance capture via `client/app/lib/performance.ts`.
- **Infrastructure Docs**: New comprehensive documentation for Disaster Recovery, Multi-Region Strategy, CSRF Protection, and Security Headers.
- **Dependency Graph**: Monorepo package relationships visualized in `docs/core/dependency-graph.md`.

### Changed

- **Architecture Health Score**: Achieved verified **100/100** score.
- **Product Normalization**: `ProductRepository` refactored to sync `relatedProductIds` with the normalized `product_relations` table.
- **Vitest Stabilization**: Resolved cross-workspace configuration issues via absolute path resolution in `vitest.config.ts`.
- **Constitution Update**: `gemini.md` (v4.1.0) now includes System Health & Integrity invariants.

### Fixed

- **Type Integrity**: Resolved multiple latent typecheck issues in repository layers.
- **Lint Standards**: Enforced project-wide Biome standards with zero-error tolerance.

## [4.0.3] - 2026-04-27

### Changed

- **Media Library architecture fully decomposed**: Three monolithic files reduced by ~45% average LOC. `MediaUploadEnhanced.tsx` (1,106→618), `MediaLibraryContextEnhanced.tsx` (1,016→588), `MediaGrid.tsx` (315→143). Six new focused modules created.
- **Tech debt ledger at zero**: All monoliths from the 5-Lens Review (`ProductCreateEditModal`, `PageContentRepository`, `MediaGrid`, `MediaUploadEnhanced`, `MediaLibraryContextEnhanced`) have been permanently decomposed.

### Added

- `client/app/components/admin/media-library/upload/upload-utilities.ts` — MIME detection, file validation, upload queue manager, performance tracking, and formatting utilities.
- `client/app/components/admin/media-library/upload/UploadItem.tsx` — Memoized upload queue entry component with status icons, progress bars, speed/ETA metrics.
- `client/app/components/admin/media-library/hooks/useMediaFilters.ts` — Filter logic, debounced search, query parameter construction.
- `client/app/components/admin/media-library/hooks/useMediaSelection.ts` — Asset selection, toggle, select-all, selection data calculations.
- `client/app/components/admin/media-library/hooks/useMediaUrlSync.ts` — Bidirectional URL ↔ state synchronization for deep-linkable filter state.
- `client/app/components/admin/media-library/hooks/useMediaGridQuery.ts` — Paginated media query with retry logic, abort handling, and batch signed URL fetching.

## [4.0.2] - 2026-04-26

### Security

- **RBAC bypass fail-closed in production** (`server/middleware/rbac.ts`, `server/services/auth-service.ts`): `BYPASS_RBAC_FOR_TESTING` is now a dead letter in production. A boot-time assertion throws `CRITICAL SECURITY ERROR` if the flag is set with `NODE_ENV=production`. The per-request guard in both `requireRole()` and `requireAdmin()` additionally checks `NODE_ENV !== "production"` so even if the boot assertion were somehow bypassed, role enforcement is still enforced server-side on every request.
- **GitHub Actions least-privilege permissions**: All 14 CI/CD workflows now carry a top-level `permissions: contents: read` block (or tighter per-job overrides where write access is needed). This limits the blast radius of a compromised workflow or supply-chain attack to read-only access to the repository.
- **Supply-chain hardening via SHA-pinned actions**: All 69 third-party GitHub Action references across the 14 workflows are now pinned to immutable commit SHAs with version comments (e.g. `actions/checkout@34e1148...  # v4.3.1`). Floating tags (e.g. `@v4`) are mutable and have been the vector for several high-profile supply-chain attacks (e.g. tj-actions/changed-files).

### Fixed

- **Vitest runner-cache pollution eliminated** (`vitest.config.ts`): `.github/runner/**` is now in the `exclude` list. The self-hosted runner left a stale project checkout under `.github/runner/_work/` that vitest was collecting as a second copy of the test suite, producing 803 phantom test files and 45 phantom failures on every `npm test` run.

### Added

- **Regression tests for production RBAC guard** (`tests/unit/services/auth-service.test.ts`): Two new tests verify the `requireAdmin` bypass invariant: (1) bypass is honored in `NODE_ENV=test`; (2) bypass is silently ignored in `NODE_ENV=production`, enforcing real auth.

## [4.0.1] - 2026-04-14

### Fixed

- **Rate limiting now enforced on write endpoints**: POST `/api/products` and POST `/api/categories` were silently bypassing rate limiting because `checkRateLimit()` always returned `true`. Replaced with production `createRateLimiter()` middleware (Redis-backed + in-memory fallback), 50 req/15 min window.
- **Featured products pagination moved to database**: `GET /api/products?featured=true` was loading all featured products into memory and then JS-slicing, risking OOM at scale. Now uses DB-level `LIMIT`/`OFFSET` with a dedicated `getFeaturedProductsCount()` query.
- **Webhook payload type safety**: `webhookEventSchema` used `z.any()` for the payload field, defeating TypeScript strict mode. Replaced with `z.record(z.string(), z.unknown())` and a `WebhookPayloadMap<E>` generic on `webhookService.trigger()`.
- **Admin slug validation hardened**: `GET /admin/api/products/check-slug` passed raw `req.query.slug` directly to the service. Now validated with Zod (min 1, max 200 chars) and normalized with `normalizeSlug()`.
- **Negative page offset prevented**: `Number("-1")` is truthy so `|| 1` did not clamp; `page=-1` produced `offset=-40`, causing a Postgres `OFFSET must not be negative` error. Clamped with `Math.max(1, ...)`.
- **Cache bypass DoS vector closed**: `/homepage-process-cards?refresh=1` accepted the bypass from unauthenticated callers (same issue fixed in `/homepage-batch` last sprint). Now restricted to admin sessions.
- **CustomDropdown keyboard navigation improved**: Escape/Tab from open listbox now correctly returns focus to the trigger button. Stale `optionRefs` entries on options-list shrink are trimmed to prevent silent keyboard navigation no-ops.

### Changed

- `(p: any)` cast in homepage batch route replaced with typed `HomepageProcessCard`.
- Redundant `as string` casts removed from products route pagination parsing.
- Tailwind V4 arbitrary opacity values (`opacity-[0.03]`, `opacity-[0.05]`, `opacity-[0.07]`) tokenized as `@utility` blocks (`opacity-subtle`, `opacity-faint`, `opacity-muted-decoration`) and `text-[15.5vw]` → `text-logotype` utility.
- Stale JSDoc comment in homepage batch route corrected to reflect actual stale-while-revalidate caching behavior.

### Added

- `findings.md` documents three monolithic files as formal tech debt: `ProductCreateEditModal.tsx` (1,235 LOC), `MediaGrid.tsx` (1,120 LOC), `page-content-repository.ts` (2,367 LOC).
- `TODOS.md` created with P0 pre-existing test failures (schema drift, missing env vars) and P2-P3 follow-up items.
- `package.json` version corrected from `3.0.0` → `4.0.1` to match CHANGELOG.

### For contributors

- **Test suite fully green**: All 80 test files now pass (773 assertions, 0 failed, 0 skipped). Previously 18 files had failures or were gated behind environment flags.
- **Idempotency middleware shipped**: `server/middleware/idempotency.ts` — in-memory key→response cache for mutating requests. Clients can send `Idempotency-Key: <uuid>` on any POST/PUT/PATCH/DELETE to get safe replay behavior. Skips GET requests and `/api/health`. Replayed responses include `Idempotent-Replayed: true` header.
- **Test infrastructure improvements**: Chaos, db-metrics, and slow-query tests converted from live-server fetch to supertest-based unit tests — no port 5002 required in CI. Drizzle instance now wired with `metricsLogger` so pool counters increment correctly. Hook test file renamed `.test.tsx` so Vitest's JSX transform applies.

## [4.0.0] - 2026-04-04

### Added

- PodDisruptionBudget for K8s deployments (minAvailable: 1)
- Separate health check endpoints: `/healthz` (liveness), `/readyz` (readiness)
- 404 catch-all route (`$.tsx`) for unmatched paths
- CHANGELOG.md for release tracking
- ADR-0017: GSAP over Framer Motion decision record

### Changed

- Replaced `shrink-ray-current` with `compression` for HTTP compression
- Raised Vitest coverage thresholds: lines/functions/statements to 80%, branches to 75%
- Sentry `tracesSampleRate` reduced to 0.1 in production
- Logout route changed from GET to POST with session destruction
- Replaced `console.log/warn/error` with Pino logger in server bootstrap
- Dockerfile now runs as non-root `USER node`
- Single-branch model: all work on `main` (no feature branches)

### Removed

- `request`, `node-zopfli-es`, `shrink-ray-current` from dependencies
- `three` from client dependencies (using `@google/model-viewer` only)
- `continue-on-error: true` from CI workflow lint, security, and docs steps
- Route-level try/catch from `/api/health/db` endpoint (Express 5 pattern)

### Security

- Eliminated 2 critical and 1 high npm audit vulnerabilities
- Added session destruction on logout
- Clear session cookie on logout

## [3.0.0] - 2026-03-31

### Added

- Agentic Sportswear Factory v3.0.0
- B.L.A.S.T. Protocol integration
- Neon Serverless Postgres via Drizzle ORM
