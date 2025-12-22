# CI Guardrails & Enforcement

## Overview

To prevent regression of the critical issues identified (Dual Router, Z-Index conflicts, Hydration instability), we enforce strict checks in our CI pipeline.

## 1. Router Purity (`check:router` / `check-router.cjs`)

- **Purpose:** Ensures absolutely NO imports from `@tanstack/react-router` exist in the codebase.
- **Trigger:** CI Failure if found.
- **Fix:** If this fails, remove the import and switch to `wouter`.

## 2. Dependency Sanitation (`check-dupes.cjs`)

- **Purpose:** Detects duplicate instances of `react` or `react-dom` which cause "Invalid Hook Call" errors and Context breakage.
- **Trigger:** CI Failure if `npm ls` detects invalid tree or duplicates.
- **Fix:** Run `npm dedupe` or fix version mismatches in `package.json`.

## 3. Build Verification

- **Purpose:** Ensures the build completes and generates valid artifacts (`dist/`).
- **Trigger:** CI Failure if build script exits non-zero or output is missing.

## Future Gates

- **Visual Regression:** Playwright stats will be added here once coverage is sufficient.
