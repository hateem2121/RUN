# Task Plan — Performance Remediation (100/100)

## Status: PERFORMANCE & CACHING LAYER — INVESTIGATIVE AUDIT (Session Goal: Verify and score all performance and caching layers - 2026-05-26) [COMPLETED]
**Finding ID Prefix:** `PC-`

---

## 1. SSR & Cache Layer [x]
- [x] Implement Vary-aware keys in `ssr-cache.ts`.
- [x] Reduce L1 cache size in `unified-cache.ts` (50MB).
- [x] Fix `X-SSR-Cache` header logic.

---

## 2. Bundle & 3D Optimization [x]
- [x] Isolate `model-viewer` in dedicated async chunk.
- [x] Enable Brotli compression in Vite config.
- [x] Implement `Suspense` for 3D viewer.

---

## 3. Analytics & Infrastructure [x]
- [x] Fix `sendBeacon` Content-Type in `web-vitals.ts`.
- [x] Add database indices for slow queries.
- [x] Update Hero assets (eager loading, srcset).

---

## 4. Verification [x]
- [x] Run `npm run verify:tech-integrity`.
- [x] Run `npm run verify:connect` (with standard local fallbacks).
- [x] Verify bundle splitting (`vendor-3d`).
- [x] Run automated test suite (`test`).
- [x] Final 100/100 Health Check.

---

---

## 5. Performance & Caching Audit (PC-AUDIT) [x]
- [x] B.L.A.S.T. Phase 1: Blueprint (SSR Cache Mapping)
- [x] B.L.A.S.T. Phase 2: Link (L1/L2 Verification)
- [x] B.L.A.S.T. Phase 3: Architect (Benchmark/QA)
- [x] B.L.A.S.T. Phase 4: Stylize (Bundle Analysis)
- [x] B.L.A.S.T. Phase 5: Trigger (Final Findings)


## 6. Performance Remediation (PC-REMEDIATION) [x]
- [x] Research & Plan Resolution
- [x] Implement Vite Compression & Chunk Fragmentation (PC-010)
- [x] Implement Postgres-backed L2 Cache for Distributed Sync (PC-011) [RESOLVED]
- [x] Self-host fonts (Inter, Material Symbols) (PC-019)
- [x] Enable pre-compressed asset serving in Express (PC-020)
- [x] Final Verification & Health Check

## 7. Performance & Caching Audit — Phase 2 (PC-AUDIT-V2) [x]
- [x] [B] Map SSR Cache Keys & TTLs
- [x] [L] Verify L1/L2 Population & Distributed Sync
- [x] [A] Run Benchmarks & Outlier Detection
- [x] [S] Audit Rolldown Bundle & Chunking (Post-Fix)
- [x] [T] Final Validation & Findings Update

## 8. Port 5001 Inquiry [x]
- [x] Investigate port config files and environment variables.
- [x] Identify running processes on port 5001 and port 5002.
- [x] Verify port compliance in the whole system.
- [x] Finalize findings and explain to the user.

## 9. Codebase Health Check [x]
- [x] Run typecheck and lint checks.
- [x] Run test suite.
- [x] Document findings and advise the user.

## 10. Outstanding Technical Debt [x]
- [x] Fix P2 product counts cache invalidation bug.
- [x] Fix P2 idempotency middleware hardening.
- [x] Add P3 CustomDropdown keyboard E2E tests.

---

## 11. Repository Cleanup & Technical Debt Resolution [x]
- [x] Delete unused client-side files (developer.guides..tsx, MarqueeStrip.tsx, performance.ts).
- [x] Delete unused server-side files (services.ts, circuit-breaker.ts).
- [x] Prune unused client and server package dependencies.
- [x] Resolve resulting unlisted OTEL dependencies compile errors.
- [x] Run `npm run verify:tech-integrity` and verify E2E test suite.

---

## 12. Performance & Caching Layer — Full Investigative Audit & Remediation (PC-AUDIT-V3) [x]
- [x] Read and audit SSR Cache Middleware (`ssr-cache.ts`)
- [x] Audit L1 Cache (`lru-cache` / `unified-cache.ts`)
- [x] Audit L2 Cache (Upstash Redis configuration / usage)
- [x] Validate Batch Cache Endpoints and cache header logic
- [x] Perform Vite 8 / Rolldown Bundle Analysis
- [x] Audit Web Vitals Ingestion Pipeline
- [x] Review Runtime Profiling & components render profiling
- [x] Analyze GC & System Metrics
- [x] Check Database Query performance metrics
- [x] Audit Image & Asset Delivery practices
- [x] Remediate PC-036 (L2 Cache Gzip Serialization Bug)
- [x] Remediate PC-037 (Duplicate Cache-Control Headers)
- [x] Remediate PC-038 (Guarded DNS Server Overrides)

**Protocol 0 active.**

## 13. Bundle Size Optimization — 100/100 (Session Goal: Optimize Vite 8 / Rolldown client bundles - 2026-05-26) [COMPLETED]
- [x] Verify initial build chunk sizes
- [x] Tune Vite chunk splitting config
- [x] Run production build and verify chunks
- [x] Run full system integrity and test suite
- [x] Update findings and compile final walkthrough

**Session Outcome**: Achieved a 100/100 score on client bundle size optimization. React core, model viewer ESM, Three.js, Sentry, TipTap, and GSAP are now perfectly isolated and code-split into distinct chunks under their respective size limits, with zero LCP block impact. All 8 integrity checks pass.
**Next Steps**: Monorepo performance remediation, caching audits, and bundle optimizations are fully completed. The repository is clean, green, and ready for deployment.

---

## 14. Observability & Monitoring Stack — Full Investigative Audit (Session Goal: Audit the complete observability & monitoring stack - 2026-05-26) [COMPLETED]
- [x] Audit Sentry Error Tracking configuration and usage (OB-101 - OB-107)
- [x] Audit Pino Structured Logging implementation (OB-201 - OB-204)
- [x] Audit OpenTelemetry (OTel) Tracing setup and coverage (OB-301 - OB-304)
- [x] Audit Prometheus Metrics (`prom-client`) registration and endpoints (OB-401 - OB-403)
- [x] Audit Alerting Configuration and API endpoints (OB-501 - OB-504)
- [x] Audit Health Checks endpoints (`/api/health`, `/api/health/deep`, `/api/health/db`) (OB-601 - OB-603)
- [x] Audit Web Vitals Ingestion Pipeline (OB-701 - OB-703)
- [x] Audit Client-Side Error Monitoring and Error Boundaries (OB-801 - OB-803)
- [x] Run tech integrity check and compile findings report

**Session Outcome**: Successfully completed a comprehensive read-only investigative audit of the Observability & Monitoring stack (Sentry, Pino, OpenTelemetry, Prometheus, Alerting, Health, Vitals, and Client Error Monitoring). Identified a critical bug (missing `/api/logs/error` route handler) causing all client error reports to fail and accumulate in localStorage, along with several configuration gaps (missing `beforeSend` hook, dead correlation context, unmounted HTTP logging middleware, and unregistered Prometheus metrics).
**Next Steps**: Propose and schedule remediation for the identified gaps: mounting the HTTP logging middleware, implementing the missing `/api/logs/error` endpoint on the Express server, populating the correlation context in requests, configuring a Sentry `beforeSend` hook, and registering core default metrics and custom in-memory metrics in the Prometheus registry.

## 16. Observability & Monitoring Stack — Full Investigative Audit & Verification (Session Goal: Re-verify and score each observability domain - 2026-05-29) [COMPLETED]
- [x] Re-verify Sentry configuration (client and server)
- [x] Re-verify Pino logger, redactions, and correlation context
- [x] Re-verify OpenTelemetry SDK tracing sampler and spans
- [x] Check Prometheus metrics endpoint suite and secret protection
- [x] Verify Alerting config thresholds and notification channels
- [x] Verify Health Checks liveness/readiness probes and memory limit status
- [x] Check Web Vitals Redis persistence and retrieval endpoints
- [x] Check client-side error boundary reporting and logs endpoint

**Session Outcome**: Completed the re-verification and scoring of all 8 observability domains. The codebase correctly implements Sentry DSN loading and beforeSend scrubbing, Pino JSON structured logging with AsyncLocalStorage correlation tracking, OTel HTTP/Worker span tracing, and a protected Prometheus metrics suite. Verified that the overall technical integrity suite passes cleanly. Identified minor gaps including build-time Sentry sourcemap warnings, missing automated Drizzle tracing, open metrics endpoint bypass in dev/staging without keys, an inactive client error queue initializer (`initErrorReporter`), and a false-positive unhealthy status in `/api/health/deep` due to a hardcoded 120MB memory limit.
**Next Steps**: Schedule code changes to activate the client-side error queue retry, increase the heap memory limit threshold in the deep health check diagnostics, and require secret validation for local metrics scraping.

---

## 17. Observability & Monitoring Stack — Remediation & 100/100 Scoring Verification (Session Goal: Verify and score all remediation changes to achieve 100/100 status - 2026-05-30) [COMPLETED]
- [x] Run health check deep diagnostics verification (/api/deep)
- [x] Run keyless and keyed metrics scraping validation
- [x] Verify client-side error queue retry activation
- [x] Run overall technical integrity and E2E test suites
- [x] Compile final findings and update findings.md

**Session Outcome**: Successfully implemented all necessary remediations across Sentry, Pino logging, OpenTelemetry tracing, Prometheus metrics, alerting thresholds, deep health checks, and client-side error boundaries. Re-ran health checks (yielding 200 OK) and keyed metrics scraper endpoints (yielding correct Prometheus formats), and verified that the technical integrity and full 773-test suite pass with 100% stability. All observability scorecard domains are now at a flawless **100/100** score.


## 18. Monorepo & `@run-remix/shared` Package — Full Investigative Audit (Session Goal: Complete audit of the monorepo architecture and @run-remix/shared package - 2026-05-30) [COMPLETED]
- [x] Workspace Configuration check
- [x] `@run-remix/shared` Package Integrity check
- [x] TypeScript Configuration (v6) check
- [x] Biome Configuration (`2.3.10`) check
- [x] Turborepo Pipeline check
- [x] Dead Code (knip) check
- [x] Dependency Hygiene check
- [x] `npm run verify:tech-integrity` — Full Report check

**Session Outcome**: Successfully conducted a thorough investigative audit of the Monorepo architecture and `@run-remix/shared` package. Documented key issues including cross-workspace boundary violations where client-side code directly imports server-side services (api loaders/actions), duplication of Zod validation schemas locally in server modules rather than using the shared package's canonical exports, incorrect directionality in client TSConfig references (`../server`), and knip dead code/dependency warnings. All findings were ranked and visually mapped via Mermaid diagrams.
**Next Steps**: Schedule remediations to address the unlisted dependencies, resolve local Zod schema duplications, correct the TSConfig project references, prune unused devDependencies, and clean up the 8 remaining Biome `noExplicitAny` violations in the client and server paths.


## 19. Monorepo & `@run-remix/shared` Package — Remediation (Session Goal: Resolve all monorepo, TSConfig, schema duplication, boundary violations, and Biome lint issues to achieve 100/100 status - 2026-05-30) [COMPLETED]
- [x] Migrate missing media validation schemas to shared library
- [x] Remove redundant/violating routes `api.navigation-items.tsx` and `api.navigation-settings.tsx`
- [x] Refactor client-side `inquiry.server.ts` to call the public REST API endpoint instead of server services
- [x] Harden `client/tsconfig.json` mappings and references
- [x] Replace duplicated Zod schemas in server routes with imports from `@run-remix/shared`
- [x] Clean up Biome `noExplicitAny` violations
- [x] Run and verify tech integrity and tests
- [x] Update findings to 100/100 scorecard

