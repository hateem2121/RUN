# Upgrade Safety Checklist & Rollback Plan

## When to Use

Before and after upgrading:

- React / ReactDOM
- Vite / Build tooling
- Tailwind CSS
- Router libraries

## 1. Pre-Flight Verification

- [ ] Run `npm run check:router` (Must pass).
- [ ] Run `npm ls react react-dom` (Must be deduped).
- [ ] Check `client/src/index.css` for `@theme` block (1000-scale).

## 2. Visual Regression Check

- [ ] Run `npx playwright test e2e/visual`
- [ ] Manually verify:
  - **Header:** Sticky, z=1020.
  - **Modal:** Overlays header, z=1050.
  - **Dropdown:** Opens correctly (stacking).

## 3. Hydration Check

- [ ] Open Incognito (No extensions).
- [ ] Check Console for "Hydration failed".

## 4. Rollback Plan (Emergency)

**Trigger:** Blank screen, broken navigation, critical stacking failure.

1. **Revert:** `git checkout main` (or previous tag).
2. **Clean:** `rm -rf node_modules dist`.
3. **Install:** `npm ci` (Strict install).
4. **Verify:** `npm run dev` and `npm run build`.
