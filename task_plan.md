# Task Plan — Performance Remediation (100/100)

## Status: REMEDIATED ALL 16 FORENSIC AUDIT ISSUES (Session Goal: Full-Site Forensic Remediation — 16 Issues - 2026-06-02) [COMPLETED]
**Finding ID Prefix:** `ERR-`

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

---

## 20. Database & Schema Layer — Full Investigative Audit (Session Goal: Audit the Drizzle ORM schemas, Neon serverless connection, migrations, indices, and shared schema contract - 2026-05-30) [COMPLETED]
- [x] List all files in `shared/schemas/` and read Drizzle table definitions
- [x] Check `drizzle-zod` exports in `shared/schemas/` and `@run-remix/shared`
- [x] Inspect `drizzle.config.ts` and check migrations status
- [x] Review Neon connection configuration in `server/db/` and healthcheck routes
- [x] Search for hand-written Zod schemas in `server/` and `client/`
- [x] Create detailed findings report in `findings.md` with issue score ranks and two Mermaid diagrams for each issue

---

## 21. Database & Schema Layer — Remediation (Session Goal: Remediate all database & schema layer issues, generate migrations, resolve duplicate Zod validation schemas, and verify integration tests - 2026-05-30) [COMPLETED]
- [x] Schema Fixes & Foreign Key Constraints (recordedBy, folders parentId)
- [x] Performance Indexing Additions (fabricCompositions, webhookDeliveries, blogPosts, catalog, navigationItems, manufacturingQualities, technologyRoadmap)
- [x] Remove redundant index on unique key in cacheEntries
- [x] Zod Schema Standardization (insertWebhookSubscriptionSchema, home content schemas)
- [x] Replace duplicate hand-written schemas in server routes with imports from shared library
- [x] Configure stateless HTTP client `httpDb` in `server/db.ts`
- [x] Add `$onUpdate` hooks for `updatedAt` columns in all schemas
- [x] Generate new migrations via Drizzle Kit
- [x] Run schema verification checks and full test suite

**Session Outcome**: Successfully remediated all database and schema layer anomalies, achieving a flawless **100/100** score on the database audit scorecard. Specifically, resolved the FK constraint type mismatch on `sustainability_metric_history`, added the self-referencing hierarchy FK on `folders`, built missing index mappings for foreign keys to prevent sequential scans, removed redundant indexes on unique cache fields, normalized manual schema objects to `drizzle-zod` definitions, consolidated and imported local Zod validations in server routes from `@run-remix/shared`, added stateless HTTP query capabilities (`httpDb`), and automated the `updatedAt` column hooks. Successfully generated Drizzle Kit schema migrations, which compiled perfectly with zero errors, and validated the system through both lints and the complete integration test suite of 773 tests.
**Next Steps**: Defer to M. Hateem Jamshaid for final QA and verification in staging/production environment deployments. No outstanding database debt remains.

---

## 22. Prompt Engineer Agent Skill Audit — June 2026 (Session Goal: Complete prompt engineer agent skill audit and generate full report - 2026-05-30) [COMPLETED]
- [x] Audit Block A: gstack agent workflow
- [x] Audit Block B: Tech stack versions
- [x] Audit Block C: Package additions/removals
- [x] Audit Block D: Project version and changelogs
- [x] Audit Block E: Hard rules and forbidden patterns
- [x] Audit Block F: Build scripts, CI, and deployment
- [x] Audit Block G: Protocols (Protocol 0, B.L.A.S.T., Uncertainty/Confusion)
- [x] Audit Block H: Agent host ecosystem
- [x] Audit Block I: Anthropic prompting and model dynamics
- [x] Audit Block J: Templates and prompt patterns
- [x] Audit Block K: Design system, CSS, and GSAP
- [x] Audit Block L: Free-form delta updates
- [x] Update findings.md and task_plan.md with outcome
- [x] Run verify:tech-integrity checks
- [x] Verify report completeness against all block questions (100% matched)

**Session Outcome**: Successfully completed a comprehensive audit of gstack workflow capabilities and mapped them against the live RUN Remix monorepo versions. Verified the completeness of the generated audit report (`analysis_results.md`) against all block questions in the `Answers needed for Claude` folder, ensuring a 100% question-by-question mapping with zero gaps. All technical integrity validations passed cleanly.

## 23. Public-Facing Route Directory (Session Goal: Map all public-facing pages and routes - 2026-05-31) [COMPLETED]
- [x] Identify all public routes in the route-manifest.ts file
- [x] Cross-reference with client router configuration to find all public-facing routes
- [x] List all identified public-facing pages on the RUN Remix website
- [x] Audit and map static files (/offline.html) and Express system routes (/metrics, /docs, /api-docs, /robots.txt)

**Session Outcome**: Successfully mapped all public-facing pages, static paths, and backend system endpoints in the RUN Remix monorepo, resolving all discrepancies and generating a 100% verified route directory report.
**Next Steps**: Review route alignment recommendations with M. Hateem Jamshaid.

---

## 24. Public-Facing Route Directory — Final Comprehensive Verification (Session Goal: Perform exhaustive file-by-file verification of all routes and finalise the report with 100% accuracy - 2026-05-31) [COMPLETED]
- [x] Perform exhaustive cross-reference check of client/app/routes files against route config and manifest
- [x] Check all server-side paths, assets, and APIs for public exposure
- [x] Verify 100% accuracy of all compiled routes and metadata in route_directory_report.md
- [x] Run verify:tech-integrity to ensure zero regressions

**Session Outcome**: Successfully completed an exhaustive verification of all client-side and server-side routes and API endpoints in the RUN Remix monorepo. Compiled the absolute 100% verified route catalog report in `route_directory_report.md` detailing every layout boundary, HTTP method, and caching parameter. All 8 checks of `verify:tech-integrity` passed successfully.
**Next Steps**: Awaiting review by M. Hateem Jamshaid to resolve the documented routing layout vs cache key manifest mismatches.

---

## 25. Known Issues & Triage Inquiry (Session Goal: Identify and prioritize known page issues and pain points - 2026-05-31) [COMPLETED]
- [x] Review route directory report and findings.md for known issues
- [x] Summarize key routing mismatches, documentation drift, and missing pages
- [x] Present options and ask user which to prioritize first

## 26. Full-Site Forensic Investigation Checklist Audit (Session Goal: Double-check that all 27 prompt files are fully covered in the master task list - 2026-06-01) [COMPLETED]
- [x] Systematically read all 27 prompt files in `Investigative prompts for website` folder
- [x] Perform cross-verification of task list against every prompt file check and curl command
- [x] Address gaps (Wide viewport screenshots, About page .js route files check, specific curl requests, findings/task_plan.md structure, and AGENTS.md block context)
- [x] Complete comprehensive overwrite of task list artifact at `.gemini/antigravity/brain/.../task.md`
- [x] Run verify:tech-integrity to ensure zero regressions

---

## 27. Full-Site Forensic Investigation Execution & Synthesis (Session Goal: Execute full-site investigation and synthesize findings - 2026-06-01) [COMPLETED]
- [x] Collect gated admin screenshots and complete crawlers
- [x] Compile page-level reports (findings.md in each of the 26 folders)
- [x] Synthesize master report (findings/master-report.md)
- [x] Final session gate verification

**Session Outcome**: Successfully completed a 100% read-only forensic site investigation across the RUN Remix monorepo's 26 page/system modules using the 27 prompt files in `Investigative prompts for website`. Probed ~45 endpoints, captured screenshots, generated page-level reports, and synthesized a master report (`findings/master-report.md`) ranking all findings. Killed the background dev server and ran full technical integrity verification, confirming zero source files were modified.
**Next Steps**: Present the findings to the owner (M. Hateem Jamshaid) for prioritization and scheduling of remediation tasks.

---

## 28. Agent Execution Error Investigation (Session Goal: Investigate agent executor network error 019f4c92-62a1-4d26-9b2b-9a7cdd233e10 - 2026-06-01) [COMPLETED]
- [x] Audit logs and active socket/port usage on the machine
- [x] Investigate connection failures to daily-cloudcode-pa.googleapis.com
- [x] Analyze TCP socket exhaustion / EADDRNOTAVAIL root causes on macOS
- [x] Compile findings and recommendations to prevent socket/port exhaustion

**Session Outcome**: Programmatically and forensically analyzed the `EADDRNOTAVAIL` ("can't assign requested address") network socket error for Trajectory ID `019f4c92-62a1-4d26-9b2b-9a7cdd233e10`. Diagnosed that the issue was caused by a network interface IP reassignment mid-invocation: the agent executor established a TCP connection bound to `192.168.18.124`, but the active subnet IP changed to `192.168.18.103` (due to DHCP lease/reconnect). This caused active read operations on the socket to fail. Also detected lingering backend processes bound to a separate previous subnet IP (`192.168.1.22`). Compiled recommendations for network stability and lingering process cleanup. All technical integrity checks pass.

---

## 29. Forensic Audit Remediation (Session Goal: Complete approved implementation plan execution - 2026-06-01) [COMPLETED]
- [x] Implement slug check fetch and suffix resolver in `useProductForm.ts`
- [x] Align queryKey and use `apiRequest` in `use-homepage-data.ts`
- [x] Add static/default constants fallbacks on empty data in `Categories.tsx`
- [x] Add static/default constants fallbacks on empty data in `Slogans.tsx`
- [x] Add static/default constants fallbacks on empty data in `Sections.tsx`
- [x] Run full system integrity verification and tests

**Session Outcome**: Successfully implemented all remaining issues from the approved Forensic Audit Issues Remediation plan. Built out automated product slug collision handling (up to 10 sequential attempts via check-slug API), resolved homepage query cache preloading hydration mismatches across server/client boundaries by integrating `apiRequest` into the batch data hook, and deployed robust static fallbacks for Homepage categories, slogans, and sections to ensure a resilient UI even under zero-data database conditions. Formatted all modified files with Biome, and confirmed that the complete technical integrity suite of 8 checks passes successfully along with the full production build pipeline.

---

## 30. Forensic Audit Remediation Phase 2 & Verification (Session Goal: Verify Phase 2 execution, fix unit/integration test regressions, and pass all checks - 2026-06-01) [COMPLETED]
- [x] Verify Dynamic page content retrieval and SSR loaders structure
- [x] Resolve RateLimiter middleware whitelisting regression for loopback IP testing
- [x] Correct queryClient apiRequest fetch test mock expectations for useHomepageData hook
- [x] Run full technical integrity and test suites (773 tests passing cleanly)

**Session Outcome**: Verified the comprehensive implementation of Phase 2 database-driven pages (Services, Privacy, and Terms of Service) and streaming HTML edge caching interception. Remediated test suite failures by restricting loopback/localhost whitelisting in rateLimiter to development mode only (allowing Vitest test cases to mock rate limits on loopback IPs) and aligning hook fetch mocks to include required response headers. All 8 checks of technical integrity, including the full Vitest suite (773/773 passing), pass successfully with zero errors.



