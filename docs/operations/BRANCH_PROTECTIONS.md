# Branch Protection Configuration

Recommended GitHub branch protection settings for `main` and `develop` branches.

## Required Status Checks

Enable "Require status checks to pass before merging" with:

- [x] `CI / Neon Preview / Test & Verify`
- [x] `CI / Neon Preview / Build`
- [x] `E2E Proof Suite / 🕵️ Forensic Proof Suite (P0/P1/P2)`
- [x] `Security Audit`

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
| `/client/app/index.css`                | @frontend-team                |
| `/server/lib/ssr-handler.ts`           | @backend-team, @frontend-team |
| `/e2e/visual-regression-audit.spec.ts` | @qa-team                      |
| `/.github/workflows/`                  | @devops-team                  |

## Workflow Status Check Names

When configuring required status checks, use these **exact** job names:

| Status Check Name         | Job ID              | Required? |
| :------------------------ | :------------------ | :-------- |
| `Test & Verify`           | `test`              | ✅ Yes    |
| `Build`                   | `build`             | ✅ Yes    |
| `🕵️ Forensic Proof Suite (P0/P1/P2)` | `verify-proofs` | ✅ Yes    |

**Steps to Configure:**

1. Go to **Settings** → **Branches** → **Add branch protection rule**
2. Branch name pattern: `main` (or `develop`)
3. Check **Require status checks to pass before merging**
4. Search and add:
   - `Test & Verify`
   - `Build`
   - `🕵️ Forensic Proof Suite (P0/P1/P2)`
5. Check **Require branches to be up to date before merging**
6. Check **Require review from Code Owners**
7. Save changes

**Note**: The E2E Proof Suite runs visual regression, accessibility, and functional checks across all browsers.
