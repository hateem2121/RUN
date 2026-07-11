# RUN Remix — Homepage + CMS Full-Stack Audit Report

**Date:** April 30, 2026
**Mode:** READ-ONLY Discovery (No Code Altered)
**Scope:** Homepage (`_index.tsx`), CMS Admin Modules, Shared Data Pipelines
**Objective:** Identify technical debt, performance bottlenecks, stability risks, and project invariant violations.

---

## Executive Summary

The RUN Apparel Homepage and its supporting CMS infrastructure exhibit strong architectural foundations with a functional two-tier batch caching system (L1/L2) and correct usage of `lazy()` loading. However, the system is hindered by persistent **Tech Stack Rule violations** (Express 5 try/catch redundancies, arbitrary Tailwind values), **Typescript strictness gaps** (`any` types), and **Performance/Hydration** risks stemming from duplicate API endpoints and missing top-level error boundaries.

This report catalogs findings across 10 dimensions, prioritizing them by severity to inform the next stabilization sprint.

---

## Dimension 1: Static Analysis & Compilation

**Status:** ⚠️ Needs Attention
**Command Executed:** `npm run check` and `npx knip`

*   **Findings:**
    *   **TypeScript Errors:** 25 lint/formatting errors identified globally.
    *   **Type Violations (`any`):** Usage of `any` discovered in critical paths, violating the `NO any types EVER` rule:
        *   `client/app/components/admin/media-library/MediaUploadEnhanced.tsx:57:44`
        *   `client/app/lib/product-transformers.ts:406:35`
        *   `client/app/routes/categories.$.tsx:522:32`
        *   `client/app/routes/products.tsx:46:31`
    *   **Configuration Debt:** Widespread use of deprecated `baseUrl: "."` in multiple workspace `tsconfig.json` files. `ignoreDeprecations: "6.0"` is active, masking potential upcoming TS6 breaking changes.

---

## Dimension 2: Tech Stack Invariant Violations

**Status:** 🛑 Critical Failures Detected
**Rules Checked:** Rule 1 (Core Tech Stack), Rule 2 (Tailwind V4 & Express 5)

*   **Findings:**
    *   **Express 5 Anti-Patterns:** Found **28 instances** of explicit `try { ... } catch` blocks in Express 5 async route handlers (e.g., `server/routes/media/services.ts`, `server/routes/media/handlers.ts`, `server/routes/utilities/api-based-population.ts`). This explicitly violates the "NO try/catch in Express 5 async handlers" standard.
    *   **Tailwind V4 Arbitrary Values:** The "NO arbitrary values in JSX" rule is violated extensively across homepage and admin components:
        *   *Homepage:* `h-[300px]`, `blur-[100px]`, `text-[14px]` found in `Process.tsx`, `Hero.tsx`, `Preloader.tsx`.
        *   *Admin CMS:* Highly prevalent usage of explicit pixel/rem values (`max-w-[340px]`, `h-[680px]`, `text-[10px]`, `rounded-[40px]`) in `HomepageHeroTab.tsx`, `HomepageProcessCardsTab.tsx`, etc.
    *   **Tailwind @utility Layer:** `client/app/styles/manufacturing-utilities.css`, `animations.css`, and `overrides.css` use `@layer utilities { ... }` instead of the Tailwind V4 `@utility` directive.
    *   **Positive Confirmations:**
        *   No Framer Motion imports (successfully removed).
        *   No `forwardRef` usage (successfully deprecated).
        *   No @react-three/fiber or drei imports detected.

---

## Dimension 3: Runtime & Browser Defenses

**Status:** ⚠️ Moderate Risk

*   **Findings:**
    *   **Missing Error Boundary:** While granular boundaries exist (`AdminErrorBoundary`, `GlobalErrorBoundary`, `ModelViewerErrorBoundary`), the root homepage `_index.tsx` lacks a dedicated top-level `ErrorBoundary` to gracefully handle catastrophic hydration or data failures.
    *   **Code Splitting:** Excellent. All major homepage sections (`Categories`, `FeaturedProducts`, `Process`, `Sections`, `Slogans`, `Stats`, `Values`) and Admin modules are correctly utilizing `React.lazy()` and `Suspense`.

---

## Dimension 4: Performance & SSR / Hydration

**Status:** ⚠️ Moderate Risk

*   **Findings:**
    *   **Duplicate/Redundant Data Fetching:** `server/routes/resources/homepage-batch.routes.ts` implements a highly optimized `TwoTierBatchCache` utilizing `Promise.all` for 7 concurrent fetches. However, a separate endpoint (`/homepage-process-cards`) exists to lazy-load process cards, conflicting with an inline comment stating process cards were added *back* into the main batch payload to prevent hydration waterfalls. This indicates redundant database querying and caching overhead.

---

## Dimension 5: Animation & GSAP Mechanics

**Status:** ✅ Healthy

*   **Findings:**
    *   **Framer Motion:** 100% eradicated from the codebase.
    *   **GSAP Lifecycle:** Components (`Stats.tsx`, `FeaturedProducts.tsx`, `Process.tsx`) correctly utilize `@gsap/react` `useGSAP()` hooks with proper dependency arrays, `scope` definitions, and `gsap.matchMedia()` for responsive animations.
    *   **Reduced Motion:** Extensive and proper use of `useReducedMotion()` hook to disable complex GSAP timelines for accessibility compliance.

---

## Dimension 6: Data Pipelines & Schema Integrity

**Status:** ✅ Healthy

*   **Findings:**
    *   **Shared Schemas:** The `shared/schemas` directory strictly imports only `zod`, `drizzle-orm`, and `drizzle-zod`. It does not leak server (`express`) or client (`react`) dependencies.
    *   **Zod Parsing:** No illegal `.optional().nullable()` chains detected.

---

## Dimension 7: Security (RBAC / Auth / Uploads)

**Status:** ✅ Healthy

*   **Findings:**
    *   **Admin CMS Guards:** All mutation endpoints (`POST`, `PATCH`, `DELETE`, `/cleanup/trigger`, `/products/initial-data`) in `server/routes/admin/admin.ts` and `homepage-management.routes.ts` are strictly protected by the `authService.requireAdmin` middleware.
    *   **Batch Endpoint Rate Limiting:** The public `/api/homepage-batch` employs `stale-while-revalidate` caching logic that correctly prevents unauthenticated cache bypasses (DoS protection).

---

## Dimension 8: Accessibility (A11y / ARIA / Roles)

**Status:** ⚠️ Minor Debt

*   **Findings:**
    *   **Semantic HTML:** Good usage of `<section>`, `<nav>`, and `role="region"` with `aria-labelledby` across homepage components.
    *   **Image Alt Text:** `<img ... alt={...}>` is consistently applied to dynamic CMS images.
    *   **Missing ARIA Labels:** Interactive generic elements (e.g., the "View Full Catalogue" button in `FeaturedProducts.tsx`) lack explicit `aria-label` attributes for screen readers.

---

## Dimension 9: Error Handling & Fallbacks

**Status:** 🛑 Critical Deficit (Backend)

*   **Findings:**
    *   As noted in Dimension 2, the backend Express 5 async routes are manually catching and logging errors (`try/catch`) instead of allowing Express 5 to propagate them naturally to the global error handling middleware. This results in bloated controllers and inconsistent error response formatting.

---

## Dimension 10: Developer Experience (DX) & Dead Code

**Status:** ⚠️ High Clutter

*   **Findings:**
    *   **Knip Analysis:** Identified **55 unused files, dependencies, and exports** across the workspace. This clutter impacts compilation times and IDE intellisense efficiency.

---

## 🎯 Top 10 Fixes (Prioritized Action Plan)

To bring the Homepage and CMS into full alignment with the RUN APPAREL Constitution, the following tasks must be executed:

1.  **[CRITICAL] Strip Express 5 Try/Catch Blocks:** Refactor `media/services.ts`, `media/handlers.ts`, and `api-based-population.ts` to remove all manual `try/catch` blocks in async handlers.
2.  **[CRITICAL] Purge `any` Types:** Resolve the 4 identified TypeScript `any` violations in `MediaUploadEnhanced.tsx`, `product-transformers.ts`, and routes.
3.  **[HIGH] Refactor Tailwind Arbitrary Values:** Migrate explicit pixel/rem values (e.g., `w-[340px]`, `text-[10px]`) in Homepage and Admin CMS components to standardized Tailwind theme tokens or custom `@utility` classes.
4.  **[HIGH] Update CSS `@layer` directives:** Change `@layer utilities` to `@utility` in `manufacturing-utilities.css`, `animations.css`, and `overrides.css` for Tailwind V4 compatibility.
5.  **[MODERATE] Resolve Batch Fetch Redundancy:** Deprecate or align the standalone `/homepage-process-cards` endpoint with the main `/homepage-batch` payload to prevent double-fetching and hydration mismatches.
6.  **[MODERATE] Implement Homepage Error Boundary:** Add a top-level `ErrorBoundary` to `client/app/routes/_index.tsx`.
7.  **[MODERATE] Fix TSConfig BaseUrl:** Remove `baseUrl: "."` from workspace `tsconfig.json` files and standardize on strict path mapping.
8.  **[MODERATE] A11y Enhancements:** Add explicit `aria-label` attributes to interactive elements and "View All" buttons on the homepage.
9.  **[LOW] Dead Code Elimination:** Execute a targeted cleanup based on the `knip` audit to remove the 55 unused exports/files.
10. **[LOW] Fix 25 Lint Errors:** Run `biome check --write` or manually resolve the remaining baseline formatting and linting errors identified during Phase 1.
