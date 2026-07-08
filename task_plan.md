# RUN Remix - Task Plan

## Session: 2026-07-08 (Phase 3 & 4 Cleanup Remediation Sprint)
**Goal:** Execute Phase 3 (Cosmetic/Housekeeping) and Phase 4 (Assess & Decide) items from the comprehensive codebase audit. Clean up root-level clutter, legacy `src/` app, orphaned files, `scratch/` and `findings/` directories, relocate standalone server files to proper architectural locations, and consolidate migration directories. Branch: `chore/phase3-phase4-cleanup`.
**Status:** 🔄 In Progress
- [ ] Update `.gitignore`
- [ ] Investigate and consolidate `drizzle/` vs `server/migrations/`
- [ ] Investigate and relocate `server/db.ts`, `server/multer-optimized.ts`, `server/image-processor.ts`
- [ ] Delete `src/` legacy app
- [ ] Clean `scratch/` directory
- [ ] Clean `findings/` directory
- [ ] Evaluate and delete unused `queryClient.ts`, `performance-intersection-observer.ts`, `media-queue.ts`
- [ ] Move/delete `Investigative prompts for website/`
- [ ] Delete root-level junk files
- [ ] Run `npm run verify:tech-integrity` — all 8 checks pass
- [ ] Update `findings.md` with resolution status
**Next Steps:** Begin B.L.A.S.T. Blueprint phase.

## Session: 2026-06-23 (System Health Remediation)
- [x] **CURRENT:** Remediation Sprint: Neon Auth & DrizzleSessionStore Migration
**Goal:** Completely replace the custom `RedisSessionStore` and banned `MemoryStore` fallback with a Neon PostgreSQL-backed session store using Drizzle.
**Outcome:**
- [x] Blueprint & Schema created for `sessions` table in `@run-remix/shared`.
- [x] Drizzle migration generated and pushed to Neon.
- [x] `DrizzleSessionStore` implemented with strict `neverthrow` patterns.
- [x] `auth-service.ts` refactored to remove Redis session dependencies.
- [x] Verified live application, Neon rows, and `ioredis` isolation.
- [x] Technical integrity verified via `npm run verify:tech-integrity`.
**Next Steps:** Proceed to feature development.

## Session: 2026-06-23 (System-Wide Documentation Sync)
**Goal:** Execute a comprehensive, system-wide documentation and context synchronization to ensure all READMEs, SOPs, reference files, and architecture docs accurately reflect the RUN Remix v4.0.3 codebase reality.
**Outcome:**
- [x] Updating READMEs to v4.0.3 and current tech stack.
- [x] Updating SOPs, CODE_OF_CONDUCT.md, and CONTRIBUTING.md to reflect RUN APPAREL's premium B2B identity.
- [x] Documented Google Cloud Tasks and opossum in architecture docs.
**Next Steps:** Proceed to `/ship` phase for PR generation.

## Session: 2026-06-23 (P0/P1 Tech Debt Remediation)
- [x] **CURRENT:** Admin Core Technical Debt Remediation
**Goal:** Eradicate Critical (P0) and Major (P1) tech debt identified in the Antigravity audit, specifically removing forbidden packages, fixing animation dependency drift, and realigning worker schemas.
**Outcome:**
- [x] Uninstalled `bullmq`, `connect-redis`, `@sentry/node`, and `@sentry/react`.
- [x] Refactored `auth-service.ts` to use `ioredis` directly instead of `connect-redis`.
- [x] Installed `locomotive-scroll@5.0.1`, updated `gsap@3.15.0` and `@gsap/react@2.1.2`.
- [x] Cleaned up Sentry configurations from frontend boundaries and `vite.config.ts`.
- [x] Renamed `shared/schemas/jobs.ts` to `shared/schemas/worker-payloads.ts` and updated exports.
- [x] Verified `npm run check` and `npm run build` after changes.
**Next Steps:** Proceed with feature development now that the technical debt baseline is resolved.

## Session: 2026-06-20 (Phase 2 Closure & Ship Workflow)
**Goal:** Run closing operations (`/cso`, `/qa`, `/review`, `/ship`, `/context-save`) to finalize Phase 2 remediation.
**Outcome:**
- [x] Unstaged `client/app/components/ui/` D03 named-exception zone (264 arbitrary Tailwind values kept as per Option A).
- [x] Verified `nodemailer` and `undici` are clean via `npm ls` and `npm audit` (resolves `/cso` requirement).
- [x] Executed full Playwright test suite via `npx playwright test`; verified `auth.setup.ts` timeout is fixed and tests run green (resolves `/qa` requirement).
- [x] Form refactoring (`InquiryForm.tsx` and `CategoryForm.tsx` to `<form action={fn}>`) and coverage improvements (`blog.service.test.ts`) are included.
- [x] Committed changes to `audit/health-score-2026-06-20` (resolves `/ship` and `/context-save`).
**Next Steps:** Ready for PR merge and production deployment.

## Session: 2026-06-20 (Documentation & Version Synchronization)
**Goal:** Synchronize monorepo versions to 4.1.2 and update rule configurations.
**Outcome:**
- [x] Bumped `package.json` workspaces to 4.1.2.
- [x] Updated `README.md` and `CHANGELOG.md` with 4.1.2 release notes.
- [x] Unified rules around main branch commits across `CONTRIBUTING.md`, `CLAUDE.md`, and `gemini.md`.
**Next Steps:** Verify everything passes tech integrity, finalizing Phase 1 and Phase 2 implementations.

## Phase 1 (P0) — Security & Test Infrastructure
- [x] **CURRENT:** Issue 1.1 — CVE Remediation (`undici`, `nodemailer`)
- [x] Issue 1.2 — Test Suite Execution (Redis boot crash)
- [x] Verify Tech Integrity and ship Phase 1

## Phase 2 (P1/P2) — Architecture, Quality, Performance
- [x] Issue 2.1 — React 19 Form Actions (H04)
- [x] Issue 2.2 — Express 5 try/catch Regression (H12/H13)
- [x] Issue 2.3 — Centralize Excess Zod Schemas (D04 regression)
- [x] Issue 2.4 — Biome & TypeScript Errors
- [x] Issue 2.5 — Bundle Code Splitting
- [x] Verify Tech Integrity and ship Phase 2

## Session: 2026-06-20 (Health Score Audit)
**Goal:** Scan monorepo for Health Score.
**Outcome:** Read-only audit completed. Composite Score: 88/100 (Grade B). Documented the `multer` CVE, test coverage failure (32%), broken E2E auth setup, and 2 React 19 form regressions (`onSubmit`). Full report generated at `findings/health-score/2026-06-20-report.md`.
**Next Steps:** Plan remediation phase for the DoS CVE, E2E auth timeout, and React 19 form migrations.
- [x] **CURRENT:** Full-codebase health score audit — 2026-06-20

## Session: 2026-06-17 (System-Wide Forensic Audit)

**Outcome:**
- Completed the exhaustive read-only forensic audit of Hard Rules (H01-H35) and Security Invariants (SEC-01-SEC-10).
- Generated MASTER_AUDIT_REPORT.md with a prioritized remediation roadmap.
- Ran `npm run verify:tech-integrity` (documented failures).

**Next Steps:**
- Begin executing the remediation roadmap detailed in MASTER_AUDIT_REPORT.md starting with P0 Critical Infrastructure & Security vulnerabilities.

**Goal:**
- Perform an exhaustive, zero-tolerance, system-wide forensic audit of the RUN Remix v4.0.3 monorepo.
- Identify every violation of architectural laws, security invariants, Hard Rules (H01–H35), and engineering conventions.

## Session: 2026-06-06 (System Resolution)

**Goal:**
- Execute **Phase 1 — Architecture Enforcement (HIGH)** from the Master System Resolution Plan.
- Ensure strict adherence to Biome rules, React 19 standards, and thin controller patterns.

**Phase 0 Checklist:**
- [x] S-01: Update react-router 7.14.2 → 7.16.0
- [x] S-02: Update turbo 2.9.6 → 2.9.14+
- [x] S-03: Update ws, brace-expansion, protobufjs, qs
- [x] S-04: Disable source maps in production build
- [x] S-05: Add Zod validation to unvalidated req.body routes
- [x] S-06: Audit dangerouslySetInnerHTML in 5 components
- [x] S-07: Fix Express 5 try/catch violations

**Phase 1 Checklist:**
- [x] A-01: Remove ESLint and Prettier configuration files. Ensure Biome `noExplicitAny` is error-level.
- [x] A-02: Fix default export violations in `client/app/components/` and `client/app/routes/`.
- [x] A-03: Enforce React 19 `forwardRef` removal (use `ref` prop natively).
- [x] A-04: Fat controller refactoring for remaining `server/routes/` files violating the "Thin Controller" rule.

**Outcome:**
- Phase 1 fully completed. All routes refactored to use `export function Component` rather than default exports.
- Extracted cache, webhooks, and validation logic from fat controllers (e.g. `categories`, `services`) to the domain service layer.
- Enforced `noExplicitAny` as an error in `biome.json` and confirmed no legacy ESLint configurations remain.
- Migrated generic `throw result.error;` inside `if (result.isErr())` blocks to `result.match()` across the routing layer where applicable.
- Fixed unused variable `data` TypeScript errors generated during refactor.
- Passed `npm run check`, `npm run build`, and `npm run verify:tech-integrity`! Zero compilation, linting, or testing errors remain.

**Phase 2 Checklist:**
- [x] A-05: Migrate all React form `onSubmit` handlers to `action={fn}`.
- [x] A-06: Resolve unused imports and variables globally.
- [x] A-07: Add `aria-label` attributes to ~98 native buttons.

**Phase 3 Checklist:**
- [x] E-01: Implement `.match()` and neverthrow `Result<T, E>` in services and route handlers.
- [x] E-02: Fix failing integration tests for error propagation and format (RFC 9457).

**Outcome:**
- Phases 2 and 3 fully completed.
- Accessibility audit resolved with AST-based automated injection of `aria-label`.
- All integration tests passing. `npm run test` reports 81 files passing and 773 tests passing.

**Phase 4 Checklist:**
- [x] Identify and close exposed routes in production (`/api-docs`).
- [x] Validate `.env` configuration regarding `ENABLE_MOCK_ADMIN` and secrets.
- [x] Run security verification tests.

**Outcome:**
- Phase 4 fully completed.
- Gated the `/api-docs` backend JSON response to prevent scraping API topologies in production.
- Added strict warnings in `.env.example` to ensure `ENABLE_MOCK_ADMIN` stays `false` and secrets are properly rotated in production.

**Phase 5 Checklist:**
- [x] S-08: Resolve SSR ESM module resolution (`ERR_MODULE_NOT_FOUND`).
- [x] S-09: Ensure path configuration enables dynamic loading of `ssr-handler.ts`.
- [x] S-10: Restore `export default` for React Router 7 `routes/*.tsx` component rendering.
- [x] Run `npm run test:e2e` and confirm `authenticate as admin` and all CRUD setups pass.

**Outcome:**
- Phase 5 fully completed.
- E2E tests pass smoothly without any backend 500 crashes.
- Shared `@run-remix/shared` has `.js` extensions injected for ESM support.

**Next Steps:**
- Plan is complete! All architecture, error-handling, security, and rendering bugs have been solved. Ready for shipment to main.
- [x] Session concluded and deployed.
