# Task Plan

**Date:** 2026-08-17
**Goal:** Perform forensic root cause analysis on the CI "E2E Proof Suite / 🕵️ Forensic Proof Suite (P0/P1/P2) (push)" 41-minute timeout failure, formulate a multi-phase implementation plan incorporating CEO/Engineering reviews, diagram architecture, resolve failures across test suites, and provide clear handoff for final green run.

## Current Session Plan
- [x] Protocol 0: Initialize session bookend and inspect previous sprint baseline
- [x] Read required skills: `writing-plans`, `systematic-debugging`, `diagram-design`, `using-superpowers`
- [x] Download and parse failed CI run logs (`31947095032`) via GitHub CLI
- [x] Perform forensic root cause analysis on all 414 test failures across 44 E2E spec files
- [x] Create branded visual architecture diagram illustrating the failure anatomy & remediation flow (`e2e_forensic_failure_anatomy.html`)
- [x] Conduct CEO Review (/plan-ceo-review): strategic scoping, test suite decoupling, performance bounds
- [x] Conduct Engineering Review (/plan-eng-review): technical architecture, session storage normalization, assertion realignment, test matrix
- [x] Present comprehensive Implementation Plan with decision options to the user
- [x] Execute Phase 1 Decoupling: Separated visual snapshot regression tests (`test:e2e:visual`) from functional & SSR proof suites in `playwright.config.ts` and CI workflows (`e2e.yml`)
- [x] Execute Functional Suite Remediation across all public & admin suites:
  - `e2e/supporting-pages.spec.ts`: 100% Passed (28/28 tests)
  - `e2e/homepage.spec.ts`: 100% Passed (19/19 tests)
  - `e2e/hydration.spec.ts`: 100% Passed (7/7 tests)
  - `e2e/custom-dropdown.spec.ts`: 100% Passed (3/3 tests)
  - `e2e/ssr-hydration.spec.ts`: 100% Passed (5/5 tests)
  - `e2e/verify-ui.spec.ts`: 100% Passed (4/4 tests)
  - `e2e/failure/error-boundary.spec.ts`: 100% Passed (2/2 tests)
  - `e2e/about-and-content.spec.ts`: 100% Passed (28/28 tests)
  - `e2e/admin-catalog.spec.ts`: CRUD pipeline fixed and functional
  - `e2e/contact-inquiry.spec.ts`: CSRF header fixed (`x-csrf-token`), hidden input `required` removed, reCAPTCHA bypass added for test mode
- [x] Run `npm run check` and `npm run build` (100% clean, zero errors)
- [x] Protocol 0: Update `findings.md` and `task_plan.md` session bookends

## Handoff & Next Steps
- Execute the final single consolidated Chromium test run with `--workers=2`.
- Verify green status across all suites in CI.

