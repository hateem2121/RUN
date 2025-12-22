# Upgrade & Maintenance Playbook

## Technical Guardrails

This project uses strict guardrails to prevent regression of specific known issues.

### 1. Visual Regression (Playwright)

- **Scope:** Header sticking, Modal stacking (z-1050), Dropdown layering (z-1000).
- **Update Policy:** Only update snapshots (`--update-snapshots`) if the UI change is intentional and verified correct manually.
- **CI vs Local:** Tests run against `dist/index.js` (Production Mode) in both environments to ensure parity.

### 2. Router Purity

- **Constraint:** `wouter` is the only allowed router.
- **Fail:** `npm run check:router` grep searches for `@tanstack/react-router` imports.
- **Fix:** Replace any accidental imports with `wouter` equivalents.

### 3. Duplicate React

- **Constraint:** Single instance of `react` and `react-dom` to preserve Context and Hooks.
- **Fail:** `npm ls react` returns non-zero code or duplicates found.
- **Fix:** `npm dedupe` or use `overrides` in `package.json`.

## Upgrade Steps

1. **Bump Version:** `npm install react@latest react-dom@latest` (or target lib).
2. **Verify Duplicates:** `node scripts/check-dupes.cjs`.
3. **Verify Release:** `npm run verify:release`.
4. **Commit:** Only if step 3 passes.

## Adding New Visual Tests

1. Edit `e2e/visual/regression.spec.ts`.
2. Add a test case with `.toHaveScreenshot()`.
3. Use masking for dynamic elements (video, dates):
   ```typescript
   await expect(page).toHaveScreenshot("name.png", {
     mask: [page.locator(".dynamic-content")],
   });
   ```
