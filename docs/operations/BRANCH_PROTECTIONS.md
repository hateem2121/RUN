# Branch Protection Configuration

Recommended GitHub branch protection settings for `main` and `develop` branches.

## Required Status Checks

Enable "Require status checks to pass before merging" with:

- [x] `Visual Regression / Tailwind v4 Guardrails` (CSS import order lint)
- [x] `Visual Regression / Visual Regression Tests` (Playwright suite)

## Code Review

- [x] Require a pull request before merging
- [x] Require approvals: **1** (minimum)
- [x] Require review from Code Owners (see `.github/CODEOWNERS`)
- [x] Dismiss stale pull request approvals when new commits are pushed

## Branch Rules

- [x] Restrict who can push to matching branches (maintainers only)
- [x] Do not allow force pushes
- [x] Do not allow deletions

## How to Configure

1. Go to **Settings** → **Branches** → **Add rule**
2. Branch name pattern: `main` (repeat for `develop`)
3. Enable settings above
4. Save changes

## CODEOWNERS Enforcement

The `.github/CODEOWNERS` file requires review from designated teams for:

| File Pattern                           | Required Reviewers            |
| :------------------------------------- | :---------------------------- |
| `/client/src/index.css`                | @frontend-team                |
| `/server/lib/ssr-handler.ts`           | @backend-team, @frontend-team |
| `/e2e/visual-regression-audit.spec.ts` | @qa-team                      |
| `/.github/workflows/`                  | @devops-team                  |

## Workflow Status Check Names

When configuring required status checks, use these **exact** job names (from `.github/workflows/visual-regression.yml`):

| Status Check Name         | Job ID              | Required? |
| :------------------------ | :------------------ | :-------- |
| `Tailwind v4 Guardrails`  | `guardrails`        | ✅ Yes    |
| `Visual Regression Tests` | `visual-regression` | ✅ Yes    |

**Steps to Configure:**

1. Go to **Settings** → **Branches** → **Add branch protection rule**
2. Branch name pattern: `main` (or `develop`)
3. Check **Require status checks to pass before merging**
4. Search and add:
   - `Tailwind v4 Guardrails`
   - `Visual Regression Tests`
5. Check **Require branches to be up to date before merging**
6. Check **Require review from Code Owners**
7. Save changes

**Note**: The guardrails job runs CSS import order lint (blocking) and SSR preload check (informational).
