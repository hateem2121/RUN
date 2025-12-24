# Tailwind v4 Post-Migration Checklist

**Project**: RUN-Remix B2B Platform  
**Migration Date**: December 23, 2025

---

## Quick Reference Commands

### Visual Regression Testing

```bash
# Run all visual tests (168 configurations)
npx playwright test e2e/visual-regression-audit.spec.ts

# Update baselines after intentional UI changes
npx playwright test e2e/visual-regression-audit.spec.ts --update-snapshots

# Run specific route category
npx playwright test e2e/visual-regression-audit.spec.ts --grep "Admin"
npx playwright test e2e/visual-regression-audit.spec.ts --grep "Public"
```

### Guardrail Checks

```bash
# Validate CSS import order (Tailwind v4 cascade)
npx tsx scripts/lint-css-import-order.ts

# Validate SSR CSS preload (informational mode)
npx tsx scripts/check-ssr-preload.ts

# Validate SSR CSS preload (strict mode - requires preloads)
SSR_PRELOAD_STRICT=1 npx tsx scripts/check-ssr-preload.ts
```

### CI Workflows (GitHub Actions)

| Workflow                | Trigger            | Purpose                         |
| :---------------------- | :----------------- | :------------------------------ |
| `visual-regression.yml` | PR to main/develop | Runs guardrails + Playwright    |
| `update-baselines.yml`  | Manual             | Updates visual baselines safely |

**Automatic on PRs:**

- CSS import order lint (fails CI if violated)
- SSR preload check (informational)
- Playwright visual tests (168 configurations)
- Artifact upload on failure (report + screenshots)

**Manual Baseline Update:**

1. Go to Actions → "Update Visual Baselines"
2. Click "Run workflow"
3. Type "yes" to confirm
4. Download `updated-baselines` artifact
5. Review screenshots, then commit

---

## When Hydration Warnings Appear

**Symptom**: Playwright tests fail with "Hydration warnings detected"

**Investigation Steps**:

1. Check console output for specific warning text
2. Look for `Math.random()`, `Date.now()`, or `window` access in render paths
3. Common culprits:
   - Random IDs in component state initialization
   - Date formatting during render (locale differences)
   - Window/localStorage access outside useEffect

**Fixes**:

- Replace random IDs with `useId()` hook
- Move randomness/side-effects to `useEffect`
- Guard window access: `typeof window !== 'undefined'`
- Use `suppressHydrationWarning` only as last resort

---

## When Overlays/Z-Index Break

**Symptom**: Modal appears behind navigation, popover clipped, etc.

**Investigation Steps**:

1. Check computed z-index in DevTools
2. Look for `isolation: isolate` or `transform` creating stacking context
3. Verify portal mount point (should be document.body)

**Semantic Z-Index Scale** (defined in index.css):
| Utility | Value | Use For |
|---------|-------|---------|
| z-below | -1 | Behind content |
| z-default | 1 | Normal stacking |
| z-dock | 50 | Navigation dock |
| z-modal-backdrop | 90 | Modal overlays |
| z-modal | 100 | Modal content |
| z-popover | 150 | Popovers, dropdowns |
| z-toast | 200 | Toast notifications |
| z-max | 10001 | Maximum priority |

**Fixes**:

- Replace hardcoded `z-index: 999` with `z-modal` utility
- Use CSS variables: `z-index: var(--z-modal)`
- Remove `!important` from z-index declarations

---

## When FOUC Appears

**Symptom**: Flash of unstyled content on page load

**Investigation Steps**:

1. Check Network waterfall: CSS should load before/during JS
2. Verify SSR HTML contains preload hints
3. Check `server/lib/ssr-handler.ts` CSS injection

**Validation**:

```bash
# Quick check
curl -s http://localhost:5001/ | grep -E 'rel="preload"|rel="stylesheet"'

# Full validation
npx tsx scripts/check-ssr-preload.ts
```

**Fixes**:

- Ensure preload hints exist: `<link rel="preload" as="style">`
- Preloads must appear before stylesheets in `<head>`
- Check `<!--ssr-styles-->` placeholder is being replaced

---

## When CSS Cascade Breaks

**Symptom**: Tailwind utilities don't override legacy styles

**Root Cause**: Legacy imports appear before `@import "tailwindcss"` in index.css

**Validation**:

```bash
npx tsx scripts/lint-css-import-order.ts
```

**Correct Order** (index.css):

```css
/* 1. Tailwind FIRST */
@import "tailwindcss";

/* 2. Plugins */
@plugin "tailwindcss-animate";

/* 3. Legacy imports AFTER */
@import "./styles/legacy.css";
```

---

## Initial Baseline Creation

First-time setup for new repository or after major refactor:

1. **Build and start server**:

   ```bash
   npm run build && npm run start
   ```

2. **Create initial baselines**:

   ```bash
   npx playwright test e2e/visual-regression-audit.spec.ts --update-snapshots
   ```

3. **Verify baselines pass**:

   ```bash
   npx playwright test e2e/visual-regression-audit.spec.ts
   ```

4. **Commit baselines**:
   ```bash
   git add e2e/__snapshots__/
   git commit -m "chore: initial visual regression baselines"
   ```

**Expected snapshot count**: 168 configurations (43 routes × breakpoints × themes)

---

## Safe Baseline Update Process

When intentionally changing UI:

1. **Pull latest**: `git pull origin main`
2. **Make UI changes**
3. **Update baselines**:
   ```bash
   npx playwright test e2e/visual-regression-audit.spec.ts --update-snapshots
   ```
4. **Verify baselines pass**:
   ```bash
   npx playwright test e2e/visual-regression-audit.spec.ts
   ```
5. **Review screenshots** in `e2e/__snapshots__/`
6. **Commit in PR** for visual review

---

## Files to Monitor

| File                                | Impact           | Guardrail                |
| ----------------------------------- | ---------------- | ------------------------ |
| client/src/index.css                | Tailwind cascade | lint-css-import-order.ts |
| server/lib/ssr-handler.ts           | FOUC             | check-ssr-preload.ts     |
| client/src/context/\*.tsx           | SSR crashes      | Playwright 500 checks    |
| e2e/visual-regression-audit.spec.ts | Coverage         | Run on every PR          |

---

## How to Debug CI Failures

When the visual regression workflow fails:

### 1. Download Artifacts

Go to the failed workflow run → **Artifacts** section:

| Artifact            | Contents         | When Uploaded   |
| :------------------ | :--------------- | :-------------- |
| `playwright-report` | HTML test report | Always          |
| `test-results`      | Traces, videos   | On failure only |
| `screenshots-diff`  | Screenshot diffs | On failure only |

### 2. Common Failure Types

**CSS Import Order Lint Failed**:

```bash
# Check locally
npx tsx scripts/lint-css-import-order.ts
```

Fix: Ensure `@import "tailwindcss"` is first in `index.css`.

**Visual Diff Failed**:

- Download `screenshots-diff` artifact
- Compare actual vs expected
- If intentional change: update baselines locally, commit, push

**Hydration Warning**:

- Check Playwright report for console logs
- Search codebase for `Math.random()` or `window` in render paths

### 3. Update Baselines After Intentional Changes

```bash
# Regenerate baselines
npx playwright test e2e/visual-regression-audit.spec.ts --update-snapshots

# Verify they pass
npx playwright test e2e/visual-regression-audit.spec.ts

# Commit and push
git add e2e/__snapshots__/
git commit -m "chore: update visual baselines"
git push
```

### 4. Traces and Videos

For flaky tests, download `test-results` artifact:

- `trace.zip` → Open with `npx playwright show-trace trace.zip`
- `video.webm` → Shows actual browser recording

---

## Branch Protection Status Checks

Required checks before merge (see `docs/BRANCH_PROTECTIONS.md`):

| Check                     | Blocks Merge? | What It Validates      |
| :------------------------ | :------------ | :--------------------- |
| `Tailwind v4 Guardrails`  | ✅ Yes        | CSS import order       |
| `Visual Regression Tests` | ✅ Yes        | 168 screenshot configs |
