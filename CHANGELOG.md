# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
