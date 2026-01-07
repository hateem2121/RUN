# Visual Snapshot Governance Protocol

This document defines the rules for managing visual snapshots in the **RUN Apparel** project.

## 1. Snapshot Lifecycle

Snapshots are "Visual Contracts". Once committed to the `main` branch, they represent the approved state of the UI.

### When to Update

- **Intentional Design Change**: If a UI component is redesigned or updated.
- **Tailwind/React Upgrade**: After verifying that diffs are caused by engine changes, not regression.
- **Fixed Regression**: When a bug is fixed and the new snapshot is the correct one.

### Update Workflow

1. Run `npm run test:visual:update` locally.
2. Review the diffs carefully using the Playwright HTML report.
3. Commit the updated `.png` files in a **dedicated commit** with the prefix `chore(visual): update baselines`.
4. Include a reason for the update in the PR description.

## 2. PR Review Guidelines

Reviewers MUST check visual diffs if snapshots are updated.

- **Check Stacking**: Ensure banners or overlays don't block navigation.
- **Check Layout**: Ensure no shifting (layout shift) occurred.
- **Check Determinism**: If a snapshot shows a random ticker or dynamic value, the test must be masked.

## 3. Stabilization Rules

- All visual tests MUST use `expectVisualMatch(page, name)` helper.
- Avoid full-page snapshots for highly dynamic pages; use component-level locators instead.
- If a route is dev-only (e.g., `/visual-contracts`), it still must have a snapshot to prevent token drift.
