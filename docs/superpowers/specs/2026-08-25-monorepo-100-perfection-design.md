# 100/100 Monorepo Perfection & Full Remediation Design Spec

**Date:** 2026-08-25  
**Topic:** Complete 11-Finding Remediation & 100/100 Monorepo Quality Score  
**Status:** Approved for Implementation  
**Auditor / Chief Systems Architect:** Antigravity  

---

## 1. Goal and Objectives

Transform the RUN APPAREL CMS (v4.1.2) monorepo from an overall health score of **98.4/100** to a perfect **100/100 across all 5 inspection domains**:
1. **Correctness & Invariants**: 99/100 -> **100/100**
2. **Readability & Simplicity**: 96/100 -> **100/100**
3. **Architecture & Boundaries**: 98/100 -> **100/100**
4. **Security & Armor**: 100/100 -> **100/100**
5. **Performance & Egress**: 99/100 -> **100/100**

---

## 2. Detailed Remediation Specifications

### 2.1 Tooling & Knip Configuration (Finding F-02)
- **File:** `knip.config.ts`
- **Issue:** Assistant skill tools in `.agent/**` are flagged as unused project files.
- **Specification:** Add `".agent/**"` to the `ignore` array in `knip.config.ts`.

### 2.2 Shared Schema Modernization (Finding F-03)
- **File:** `shared/schemas/api/search.ts`
- **Issue:** Chained `.nullable().optional()` in Zod v3 style.
- **Specification:** Replace with Zod v4 idiomatic `.nullish()` for `description`, `categoryName`, and `technicalSummary`.

### 2.3 Server Service Layer Cleanliness (Finding F-04)
- **File:** `server/services/product.service.ts`
- **Issue:** Redundant `new ResultAsync(async () => ...)` constructor inside `listProducts()`.
- **Specification:** Refactor to direct `ResultAsync.fromPromise(...)` with typed error mapping.

### 2.4 Client Root Loader Sanitization (Finding F-05)
- **File:** `client/app/root.tsx`
- **Issue:** Vestigial placeholder keys `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, and `SENTRY_RELEASE` in root loader ENV dictionary.
- **Specification:** Prune `SENTRY_*` keys from `root.tsx` loader and client env types.

### 2.5 Developer Route A11y, Metadata & Theme Compliance (Findings F-06, F-07, F-08)
- **File:** `client/app/routes/developer.tsx`
- **Issue 1 (F-06):** Missing `meta` export causing missing page title warning.
- **Issue 2 (F-07):** Raw Tailwind classes `bg-gray-100 dark:bg-neutral-800` bypassing design tokens.
- **Issue 3 (F-08):** Array index `key={idx}` in navigation lists.
- **Specification:**
  - Export standard `meta()` function returning title: `"Developer Portal | RUN APPAREL"` and description.
  - Replace raw color classes with `@theme` tokens `bg-surface-subtle` or `bg-background-alt`.
  - Use stable unique keys `key={link.href}` for rendered lists.

### 2.6 Dead Code Elimination (Finding F-09)
- **File:** `client/app/services/inquiry.server.ts`
- **Issue:** Commented-out dead debug logging blocks.
- **Specification:** Remove all commented-out code blocks.

### 2.7 Safari Keyboard Accessibility (Finding F-11)
- **Files:** `client/app/routes/manufacturing.tsx` and `client/app/routes/technology.tsx`
- **Issue:** Horizontal scroll container on timeline section lacks `tabIndex={0}` and `role="region"`, failing WCAG SC 2.1.1 / 2.1.3 on Safari/WebKit.
- **Specification:** Add `tabIndex={0}`, `role="region"`, and `focus-visible:ring-1 focus-visible:ring-manufacturing-accent` to the scrollable section.

### 2.8 Integration Test Concurrency Resilience (Finding F-01)
- **File:** `vitest.config.ts`
- **Issue:** 10s default hookTimeout causes occasional timeouts during massive 180-file parallel Vitest executions.
- **Specification:** Configure `hookTimeout: 30000` and `testTimeout: 30000` for integration environments.

---

## 3. Verification Invariants

Every change must pass:
1. `npm run check`: 0 TypeScript compiler errors, 0 Biome linter errors.
2. `npm run check:md && npm run check:docs`: 0 markdownlint issues, 100% valid links.
3. `npm run verify:tech-integrity`: All 8 checks passing.
4. `npm run check:knip`: 0 unused exports, 0 unused dependencies.
