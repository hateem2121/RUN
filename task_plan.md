# Task Plan

**Date:** 2026-08-15
**Goal:** Investigate & Diagnose CI Failures (Knip Unused Code Check, Markdown Lint, OpenSSF Scorecard)

## Current Session Plan
- Inspect CI workflow files in `.github/workflows/` related to Knip, Markdown Lint (docs), and OpenSSF Scorecard.
- Reproduce Knip and Markdown Lint / Docs checks locally using `npm run check:knip` / `npm run check:docs` / `npx markdownlint-cli2` / etc.
- Analyze OpenSSF Scorecard workflow configuration, permissions, SARIF upload requirements, and branch settings.
- Document detailed root causes and recommended remediation steps for each of the 3 failing CI checks.



## Current Session Outcome
- Successfully diagnosed and remediated all 3 failing GitHub Actions CI checks on `main`:
  1. **Knip Unused Code Check**: Added `Generate Client Route Types` (`react-router typegen`) to `.github/workflows/code-quality.yml`.
  2. **OpenSSF Scorecard**: Corrected `ossf/scorecard-action` to official v2.4.1 SHA `f49aabe0b5af0936a0987cfb85d86b75731b0186` in `.github/workflows/scorecard.yml`.
  3. **Markdown Lint**: Formatted all community and wiki documentation (`SECURITY.md`, `SUPPORT.md`, `GOVERNANCE.md`, `ROADMAP.md`, `README.md`, `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `wiki/Home.md`, `wiki/Visual-Architecture.md`) to 100% compliance.
- Verified all quality gates:
  - `npx markdownlint-cli2 ...`: **0 issues in 0 files** across 193 markdown files.
  - `npm run check:knip`: **Exit code 0** (clean).
  - `npm run check`: **0 type errors, 0 linter errors** across 973 files.
  - `npm run test`: **170 test files, 2,612 unit/integration tests passed (100%)**.
  - `npm run verify:tech-integrity`: **8/8 checks passed**.

## Next Steps
- All 3 CI check failure causes are remediated and verified locally. Ready for commit/push.

