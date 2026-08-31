# Monorepo Structural & Organizational Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul, modernize, and clean the entire RUN APPAREL monorepo structure, folder hierarchy, test topology, schema consolidation, server domain architecture, and package hygiene to align with August 31, 2026 enterprise monorepo standards.

**Architecture:** Progressive 4-sprint refactoring across 4 isolated workspaces (`client`, `server`, `shared`, `scripts`), utilizing Turborepo 2.9, React 19, Express 5, Drizzle ORM, and Vitest.

**Tech Stack:** React 19, React Router v8, Express 5, Vite 8, Drizzle ORM, Neon PostgreSQL, Turborepo 2.9, Vitest 4, Biome 2.5, Zod v4, TypeScript 6.

**Spec:** Intent statement confirmed in session on 2026-08-31.

## Global Constraints

- Dev Server Port: `5002` hardcoded.
- React 19 rules: Named exports for components, raw `ref` prop, `<Links nonce="" />`.
- Zero broken links, zero TypeScript errors (`tsc --noEmit`), zero Biome errors (`noExplicitAny: error`).
- No direct database access outside `server/services/`.
- All service methods return `ResultAsync<T, AppError>` directly via `ResultAsync.fromPromise()`.
- Protocol 0 completion standard: `npm run verify:tech-integrity` all 8 gates must pass with exit code 0.

---

### Sprint 1: Schema Single Source of Truth (SSOT) & Validation Consolidation

**Files:**
- Create: `shared/schemas/forms/inquiry.ts`, `shared/schemas/forms/contact.ts`
- Modify: `shared/schemas/index.ts`, `shared/index.ts`, `client/app/components/contact/ContactForm.tsx`, `client/app/services/inquiry.server.ts`, `server/routes/core/accessories.ts`
- Delete: `client/app/schemas/product.ts`, `client/app/lib/schemas/categories.ts`, `client/app/lib/schemas/response-envelopes.ts`, `shared/validation/`, `server/validation/`
- Test: `tests/unit/shared/contract.test.ts`, `tests/unit/shared/schemas/all-schemas.test.ts`

**Interfaces:**
- Consumes: Zod v4 primitives (`.nullish()`)
- Produces: `@run-remix/shared` canonical schemas: `ContactSubmissionSchema`, `QuoteSubmissionSchema`, `CategoryCreateSchema`, `ProductCreateSchema`, `ManufacturingUpdateSchema`

- [ ] **Step 1: Consolidate form and validation schemas into `@run-remix/shared/schemas`**
- [ ] **Step 2: Update all client and server imports to import directly from `@shared/index` or `@run-remix/shared`**
- [ ] **Step 3: Delete redundant schema/validation directories (`client/app/schemas/`, `client/app/lib/schemas/`, `shared/validation/`, `server/validation/`)**
- [ ] **Step 4: Run typecheck and schema tests**
Run: `npm run typecheck && npx vitest run tests/unit/shared/`
Expected: PASS with 0 errors
- [ ] **Step 5: Run Knip to ensure zero broken exports**
Run: `npm run check:knip`
Expected: 0 unused exports, 0 missing exports

---

### Sprint 2: Workspace-Scoped Test Hierarchy & Duplication Elimination

**Files:**
- Relocate: `tests/unit/client/**` -> `client/tests/unit/**`
- Relocate: `tests/unit/components/**` -> `client/tests/components/**`
- Relocate: `tests/unit/server/**` -> `server/tests/unit/**`
- Relocate: `tests/unit/services/**` & `tests/unit/server/services/**` -> `server/tests/services/**`
- Relocate: `tests/unit/repositories/**` -> `server/tests/repositories/**`
- Relocate: `tests/unit/shared/**` -> `shared/tests/**`
- Delete: `tests/e2e/` (purge duplicate Playwright specs in favor of root `e2e/`)
- Modify: `vitest.config.ts`, `package.json`, `client/package.json`, `server/package.json`

**Interfaces:**
- Consumes: Vitest 4 test runner
- Produces: Scoped test scripts `npm run test --workspace=@run-remix/client`, `npm run test --workspace=@run-remix/server`

- [ ] **Step 1: Relocate client unit/component tests into `client/tests/`**
- [ ] **Step 2: Relocate server route, service, and repository unit tests into `server/tests/`**
- [ ] **Step 3: Relocate shared schema and contract tests into `shared/tests/`**
- [ ] **Step 4: Delete redundant `tests/e2e/` folder**
- [ ] **Step 5: Update `vitest.config.ts` test search globs to match all workspace `**/tests/**`**
- [ ] **Step 6: Run full test suite and verify test count**
Run: `npm test`
Expected: All 181+ test suites pass

---

### Sprint 3: Server Domain Bounded Contexts (DDD) & DB Modularization

**Files:**
- Create: `server/services/catalog/`, `server/services/cms/`, `server/services/media/`, `server/services/system/`, `server/services/index.ts`
- Create: `server/db/schema/catalog.ts`, `server/db/schema/cms.ts`, `server/db/schema/media.ts`, `server/db/schema/users.ts`, `server/db/schema/relations.ts`, `server/db/schema/index.ts`
- Relocate & Rename:
  - `server/services/auth-service.ts` -> `server/services/system/auth.service.ts`
  - `server/services/inquiry-service.ts` -> `server/services/system/inquiry.service.ts`
  - `server/services/navigation-service.ts` -> `server/services/cms/navigation.service.ts`
  - `server/services/webhook-service.ts` -> `server/services/system/webhook.service.ts`
  - Group remaining services into respective domain subfolders
- Delete: `server/repositories/` (empty directory)
- Modify: `server/db.ts` to export modular schema from `server/db/schema/`
- Test: `server/tests/`

**Interfaces:**
- Consumes: Drizzle ORM pgTable definitions, `ResultAsync`
- Produces: Centralized barrel export `server/services/index.ts`

- [ ] **Step 1: Modularize Drizzle schema definitions into `server/db/schema/` and re-export from `server/db.ts`**
- [ ] **Step 2: Reorganize `server/services/` into domain bounded contexts (`catalog/`, `cms/`, `media/`, `system/`)**
- [ ] **Step 3: Normalize all service filenames to `<domain>.service.ts`**
- [ ] **Step 4: Create `server/services/index.ts` barrel export**
- [ ] **Step 5: Delete empty `server/repositories/` directory**
- [ ] **Step 6: Update server route handlers to import from services barrel**
- [ ] **Step 7: Run server tests and typecheck**
Run: `npm run typecheck && npx vitest run server/tests`
Expected: PASS with 0 errors

---

### Sprint 4: Monorepo Hygiene, Package Cleanliness & Naming Normalization

**Files:**
- Modify: `package.json` (prune 42 redundant server runtime dependencies), `scripts/package.json` (bump to v4.1.2)
- Relocate & Rename:
  - Client hooks in `client/app/hooks/`: rename camelCase files (`useAnalyticsTracker.ts`, etc.) to kebab-case (`use-analytics-tracker.ts`, etc.)
  - Relocate `client/app/lib/useHydratedStore.ts` -> `client/app/hooks/use-hydrated-store.ts`
  - Relocate `client/app/utils/icon-resolver.ts` -> `client/app/lib/icon-resolver.ts`
  - Delete single-file `client/app/utils/`
- Delete:
  - `.gemini/skills/`
  - `.gemini/config/skills/impeccable/`
  - `.superpowers/`
  - `scripts/assets/`
  - `server/lib/jobs/queues/`
  - `tests/integration/server/lib/cache/`
- Modify: Root `findings.md` and `task_plan.md`

- [ ] **Step 1: De-duplicate runtime dependencies in root `package.json` and sync `scripts/package.json` version**
- [ ] **Step 2: Normalize client hook filenames to kebab-case and relocate misplaced utils/hooks**
- [ ] **Step 3: Purge duplicated `.gemini/skills/` and empty folders across the repository**
- [ ] **Step 4: Run full verification suite across all 8 Protocol 0 gates**
Run: `npm run verify:tech-integrity`
Expected: All 8 gates PASS (Exit code 0)
