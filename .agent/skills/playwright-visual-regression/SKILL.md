---
name: playwright-visual-regression
description: |
  Automated UI/UX verification. Triggers:
  - "visual regression", "screenshot test", "playwright"
  - "layout shift", "css change", "pixel matching"
---

# Playwright Visual Regression Standards

## Goal
Prevent visual degradation and layout regressions by maintaining 100% fidelity against "golden baseline" snapshots across all viewports.

## Instructions

### 1. Test Execution
- Trigger `@playwright/test` for any significant CSS or structural modifications.
- Compare DOM snapshots against the baselines located in `e2e/__snapshots__`.

### 2. Iterative Debugging
If a test fails:
1. Review the diff report.
2. Read the error output to understand the layout variance.
3. Iteratively adjust CSS in the implementation until pixel-matching succeeds.

### 3. Viewport Coverage
Ensure tests cover Mobile, Tablet, and Desktop viewports as defined in the project's Playwright config.

## Constraints
- **NO** bypassing of visual regressions for "convenience".
- **STRICT** threshold enforcement: variance exceeding 0.05% must be addressed or manually re-baselined with user approval.
