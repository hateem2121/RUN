# Task Plan

**Date:** 2026-08-16
**Goal:** Plan and resolve failing GitHub Actions CI checks: (1) "Code Quality & Dead Code / Knip Unused Code Check" and (2) "CI / Neon Preview / Lint (Biome)"

## Current Session Plan
- [x] Investigate CI run failures for `Code Quality & Dead Code` (run `31940898209`) and `CI / Neon Preview / Lint (Biome)` (run `31940898168`).
- [x] Identify root causes: PR #58 accidentally committed generated React Router types, corrupted `.gitignore`, introduced Biome formatting errors, and degraded `server/lib/db/session-store.ts`.
- [x] Present comprehensive implementation plan to the user and obtain approval before execution.
- [x] Merge `origin/main`, purge committed type/test artifacts from git tracking, and restore `.gitignore`.
- [x] Restore `server/lib/db/session-store.ts` to compliant `neverthrow` `ResultAsync` pattern.
- [x] Run `npx biome check --write` across all modified files.
- [x] Verify locally: `npm run check:knip`, `npm run check`, `npm run build`, `npm run test`, and `npm run verify:tech-integrity`.
- [ ] Commit, push to `main`, and verify GitHub Actions CI runs are green.

## Current Session Outcome
- Successfully diagnosed, remediated, and verified both CI failures locally:
  1. **Knip Unused Code Check**: Untracked 39 generated type files in `client/.react-router/types/`, restored clean `.gitignore`, verified `npm run check:knip` exits with code 0.
  2. **CI / Neon Preview / Lint (Biome)**: Restored `server/lib/db/session-store.ts` to `neverthrow` `ResultAsync` standard, formatted E2E spec files with Biome, verified `npm run check` passes with 0 errors across 972 files.
- Full verification matrix passed:
  - `npm run check`: 0 type errors, 0 lint errors.
  - `npm run check:knip`: Exit code 0 (clean).
  - `npm run test`: 170/170 test files passed (2,612 tests).
  - `npm run build`: Turborepo build passed across client, server, and shared.
  - `npm run verify:tech-integrity`: All 8 checks passed.
  - `npm run check:docs`: 0 broken links.

## Next Steps
- Commit changes and push to `origin/main`.
- Monitor live GitHub Actions CI workflows.
