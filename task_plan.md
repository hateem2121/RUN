# Task Plan

**Date:** 2026-08-22
**Goal:** Clean up excessive branches and PRs, configure Dependabot ignore rules for core frameworks, and repair failing GitHub Actions CI checks (Gitleaks org licensing, Knip typegen resolution, Neon cleanup resilience).

## Current Session Plan
- [x] Protocol 0: Read `task_plan.md` and `findings.md`
- [x] Interview & align with user via `/grill-me` on cleanup and CI fix strategy
- [ ] Pull and sync `main` with latest remote commits
- [ ] Branch Cleanup:
  - [ ] Close open Dependabot PRs (#78, #80, #81)
  - [ ] Delete remote Dependabot branches on GitHub
  - [ ] Prune stale remote tracking branches locally (`git remote prune origin`)
  - [ ] Delete stale local branch (`fix/memory-leaks-and-hydration`)
- [ ] CI / Workflow Remediation:
  - [ ] Replace `gitleaks-action` in `.github/workflows/security.yml` with standalone open-source Gitleaks binary runner
  - [ ] Add `continue-on-error: true` to `delete_neon_branch` step in `.github/workflows/ci.yml`
  - [ ] Ensure deterministic client typegen in `.github/workflows/code-quality.yml` and root dependency resolution
  - [ ] Update `.github/dependabot.yml` ignore rules to exclude core framework dependencies (`react*`, `@react-router/*`, `express*`, `drizzle-orm*`, `vite*`, `typescript`) from automated updates
- [ ] Local & Monorepo Verification:
  - [ ] `npm run check` (TypeScript + Biome)
  - [ ] `npm run check:knip`
  - [ ] `npm run check:docs`
  - [ ] `npm run test` (170 test suites, 2,612 unit tests)
  - [ ] `npm run build` (Turborepo client, server, and shared build)
  - [ ] `npm run verify:tech-integrity` (All 8 checks pass 100%)
- [ ] Commit & push to `main`
- [ ] Monitor GitHub Actions check runs to verify all CI pipelines pass 100% green
- [ ] Update `findings.md` and `task_plan.md` session outcome

## Session Outcome & Next Steps
- **Outcome:** In progress.
