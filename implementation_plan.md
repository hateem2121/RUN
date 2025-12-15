# Implementation Plan - UI/UX Regression Resolution

**Status:** Proposed  
**Date:** December 15, 2025

## Goal

Resolve the 3 critical regressions identified in the forensic audit to restore the application's functionality and "Luxury" aesthetic.

## Proposed Changes

### 1. Fix Product Detail 404s (Blocker)

**Problem:** The frontend generates hierarchical URLs (e.g., `/categories/men/running/t-shirt`) but the API expects/validates against a database `path` that doesn't match this format.
**Solution:**

- Modify `client/src/lib/product-transformers.ts` (or relevant transformer) to construct the `detailUrl` using the `product.path` directly from the database if available, or ensure the constructed path matches the API expectation.
- Alternatively, if the frontend URL structure is desired, update the API `products.ts` to support loose matching or redirecting. _Decision: Align frontend to use the canonical `path` if present, or fix the construction logic._

### 2. Restore Luxury Styles (Major)

**Problem:** `ProductCard` looks flat because Tailwind Utility classes (`bg-card`) override custom Component classes (`glass-card-light`).
**Solution:**

- Update `client/src/pages/products-new.tsx`:
  - Remove conflicting `bg-white` / `bg-card` classes when `glass-card-light` is used.
  - Explicitly pass `bg-transparent` or similar to the `Card` component if necessary to allow the custom class to show through.
- Verify `luxury-light-theme.css` variables are resolving correctly.

### 3. Fix Z-Index Inconsistencies (Minor)

**Problem:** Components use hardcoded `z-50` instead of the design token `--z-index-modal`.
**Solution:**

- Search and replace hardcoded `z-50` with `z-[var(--z-index-modal)]` (or `z-modal` if mapped in config) in critical components:
  - `client/src/components/ui/dialog.tsx`
  - `client/src/components/ui/sheet.tsx`
  - `client/src/components/ui/toaster.tsx`

## Verification Plan

### Automated Tests

- Run `npx playwright test e2e/forensic-execution.spec.ts`

### Manual Verification

- **Products Page:** Verify cards have the glass/gradient effect and are not just white boxes.
- **Detail Page:** Click a product and verify it loads (no 404).
- **Modals:** Open a modal and check it overlays correctly without stacking issues.
