# 100/100 Monorepo Perfection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 11 structural and architectural remedies to elevate all 5 monorepo inspection domains to 100/100 perfection.

**Architecture:** Systematic file-by-file refactoring across Tooling (`knip.config.ts`), Schemas (`shared/schemas/api/search.ts`), Server (`server/services/product.service.ts`), Client (`root.tsx`, `developer.tsx`, `manufacturing.tsx`, `technology.tsx`, `inquiry.server.ts`), and Testing (`vitest.config.ts`).

**Tech Stack:** TypeScript 6, React 19, Express 5, Zod 4, Tailwind CSS v4, Drizzle ORM, Vitest, Biome, Knip.

**Spec:** `docs/superpowers/specs/2026-08-25-monorepo-100-perfection-design.md`

## Global Constraints

- Never use `try/catch` in Express 5 route handlers or middleware (use `neverthrow` `ResultAsync`).
- Direct `@theme` functional utilities only (no arbitrary variable brackets `z-(--)`).
- Every React Router v8 route must export `meta` function with title and description.
- All horizontal scroll containers must declare `tabIndex={0}`, `role="region"`, and an `aria-label`.
- All checks must pass: `npm run check`, `npm run check:md`, `npm run check:docs`, `npm run verify:tech-integrity`.

---

### Task 1: Knip Configuration & Tooling Cleanliness (Finding F-02)

**Files:**
- Modify: `knip.config.ts`

- [ ] **Step 1: Add `.agent/**` to Knip ignore list**
- [ ] **Step 2: Verify Knip ignores assistant scripts**
  Run: `npm run check:knip`

---

### Task 2: Shared Zod Schema Modernization (Finding F-03)

**Files:**
- Modify: `shared/schemas/api/search.ts`

- [ ] **Step 1: Replace `.nullable().optional()` with `.nullish()`**
- [ ] **Step 2: Verify type check passes**
  Run: `npm run typecheck`

---

### Task 3: Product Service ResultAsync Refactoring (Finding F-04)

**Files:**
- Modify: `server/services/product.service.ts`

- [ ] **Step 1: Refactor `listProducts` to use direct `ResultAsync.fromPromise`**
- [ ] **Step 2: Run server unit tests**
  Run: `npx vitest run server/`

---

### Task 4: Root Loader SENTRY Key Cleanup (Finding F-05)

**Files:**
- Modify: `client/app/root.tsx`

- [ ] **Step 1: Prune vestigial `SENTRY_*` keys from root loader ENV dictionary**
- [ ] **Step 2: Verify client typecheck passes**
  Run: `npm run typecheck`

---

### Task 5: Developer Route Accessibility, Tokens & Stable Keys (Findings F-06, F-07, F-08)

**Files:**
- Modify: `client/app/routes/developer.tsx`

- [ ] **Step 1: Add `meta` export returning document title and description**
- [ ] **Step 2: Replace raw color classes with `@theme` tokens**
- [ ] **Step 3: Replace array index `key={idx}` with `key={link.href}`**
- [ ] **Step 4: Verify linter and typecheck pass**
  Run: `npm run check`

---

### Task 6: Inquiry Server Dead Code Cleanup (Finding F-09)

**Files:**
- Modify: `client/app/services/inquiry.server.ts`

- [ ] **Step 1: Remove commented-out legacy debug logging blocks**
- [ ] **Step 2: Verify Biome linter passes**
  Run: `npm run lint`

---

### Task 7: Safari Keyboard Accessibility on Scroll Containers (Finding F-11)

**Files:**
- Modify: `client/app/routes/manufacturing.tsx`
- Modify: `client/app/routes/technology.tsx`

- [ ] **Step 1: Add `tabIndex={0}`, `role="region"`, and focus visible styling to timeline scroll containers**
- [ ] **Step 2: Run Playwright a11y test on manufacturing route**
  Run: `npx playwright test e2e/a11y-wcag22.spec.ts -g "manufacturing"`

---

### Task 8: Integration Test Concurrency Timeout Resilience (Finding F-01)

**Files:**
- Modify: `vitest.config.ts`

- [ ] **Step 1: Add `hookTimeout: 30000` and `testTimeout: 30000` to Vitest config**
- [ ] **Step 2: Run Vitest sanity check**
  Run: `npx vitest run tests/unit/ssr/invariants.test.ts`

---

### Task 9: Final Tech-Integrity Gate & Master Report Update

**Files:**
- Modify: `CODE_REVIEW_AND_QUALITY_REPORT.md`
- Modify: `findings.md`
- Modify: `task_plan.md`

- [ ] **Step 1: Run full verification suite**
  Run: `npm run check && npm run check:md && npm run check:docs && npm run verify:tech-integrity`
- [ ] **Step 2: Update report scores to 100/100 across all domains**
