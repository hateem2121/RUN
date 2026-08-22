# Task Plan

**Date:** 2026-08-22
**Goal:** Clean up excessive branches on GitHub so that only `main` remains, configure Dependabot to prevent automated branch spam, and audit/optimize GitHub Actions workflows and checks.

## Current Session Plan
- [x] Protocol 0: Read `task_plan.md` and `findings.md`
- [x] Inspect remote branches, open PRs, and GitHub Actions status
- [ ] User Approval on Plan
- [ ] Branch Cleanup:
  - [ ] Close open Dependabot PRs (#82, #83, #84, #85, #86, #87, #88, #89) with `--delete-branch`
  - [ ] Delete any remaining remote branches on `origin`
  - [ ] Run `git remote prune origin` locally
  - [ ] Verify `git ls-remote --heads origin` shows strictly `main`
- [ ] Dependabot & Workflow Configuration:
  - [ ] Update `.github/dependabot.yml` to set `open-pull-requests-limit: 0`
  - [ ] Optimize `.github/workflows/security.yml` to remove redundant duplicate jobs (`codeql`, `dependency-review`) handled by dedicated workflows
- [ ] Monorepo Integrity & Quality Checks:
  - [ ] `npm run check` (Biome + Typecheck)
  - [ ] `npm run check:knip` (Knip unused exports)
  - [ ] `npm run check:docs` (Documentation link check)
  - [ ] `npm run test` (Unit test suite)
  - [ ] `npm run build` (Turborepo build)
  - [ ] `npm run verify:tech-integrity` (All 8 checks)
- [ ] Commit & push to `main`
- [ ] Monitor GitHub Actions CI runs on `main` to verify 100% green status across all pipelines
- [ ] Protocol 0: Update `findings.md` and `task_plan.md` session outcome

## Session Outcome & Next Steps
- **Outcome:** In progress (Awaiting user approval on plan).
- **Next Step:** Execute branch cleanup and workflow optimization upon user approval.
