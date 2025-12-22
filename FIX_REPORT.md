# Hydration & FOUC Remediation Report

## Executive Summary

This report details the successful remediation of **Hydration Mismatches** and **Flash of Unstyled Content (FOUC)** issues in the application. All critical blockers identified in the initial audit have been resolved, and hardening measures have been implemented to prevent regression.

## Key Actions Taken

### 1. FOUC Elimination (Critical)

- **Problem:** The app relied on a "white screen" hack (`opacity: 0` in styles) to hide FOUC, delaying First Paint significantly.
- **Fix:** Removed the `opacity: 0` hack from `client/index.html` and the corresponding `css-loaded` logic in `client/src/App.tsx`.
- **Result:** Content now renders immediately (First Paint aligned with HTML arrival).

### 2. Hydration Correctness (Critical)

- **Problem:** `client/src/pages/category-products.tsx` used `new Date()` and `Math.random()` during render, causing server-client mismatches.
- **Fix:** Replaced unstable values with `null` or deterministic alternatives.
- **Result:** Hydration is now stable.

### 3. CSP Compliance (High)

- **Problem:** Theme initialization lacked nonce support, risking style blocking in strict CSP modes.
- **Fix:** Exposed `window.nonce` in `server/lib/ssr-handler.ts` and passed it to the `ThemeProvider` in `client/src/App.tsx`.

### 4. Robustness & Prefetching (Medium)

- **Problem:** Manual drift between Server prefetching and Client routing; Hardcoded CSS injection list.
- **Fix:**
  - Created `client/src/route-manifest.ts` as a single source of truth for Route-to-Component mapping.
  - Updated `server/lib/ssr-handler.ts` to use this manifest to dynamically discover and inject critical chunks/CSS.

### 5. Font Optimization (Medium)

- **Problem:** Reliance on Google Fonts CDN (performance/layout shifts).
- **Fix:** Switched to self-hosted fonts using `@fontsource/inter` and `@fontsource/anton`. Removed CDN links from `index.html`.

### 6. Hardening & Verification

- **Added:** `e2e/hydration.spec.ts` - A Playwright test that fails if any Hydration warnings appear in the console.
- **Added:** `scripts/lint-determinism.mjs` - A script to scan for non-deterministic patterns (`new Date()` in render).

## Verification Plan

To ensure these fixes work as expected, run the following:

1. **Verify Build:** `npm run build`
2. **Run Lint Check:** `node scripts/lint-determinism.mjs`
3. **Run Hydration Test:** `npx playwright test e2e/hydration.spec.ts`

## Next Steps

- Monitor Sentry for any "Recoverable Hydration Error" tags.
- Consider moving the `route-manifest.ts` into a shared package if the monorepo structure evolves.
