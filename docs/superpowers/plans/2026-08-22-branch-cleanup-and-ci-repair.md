# Branch Cleanup & CI Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up excessive repository branches/PRs, configure Dependabot framework ignore rules, and repair failing GitHub Actions CI checks.

**Architecture:** Purge stale remote tracking references and dependabot branches via GitHub CLI/API, update workflow definitions for Gitleaks binary execution and Neon preview resilience, and lock down Dependabot policies.

**Tech Stack:** GitHub Actions, Git, Gitleaks, Dependabot, npm workspaces, Turborepo

---

## Task 1: Branch and Pull Request Cleanup

**Files:**
- Local git repository
- Remote GitHub repository (`hateem2121/RUN`)

- [ ] **Step 1: Close open Dependabot PRs**
Run: `gh pr close 78 80 81 --delete-branch`

- [ ] **Step 2: Prune stale remote tracking branches**
Run: `git remote prune origin`

- [ ] **Step 3: Delete stale local branches**
Run: `git branch -D fix/memory-leaks-and-hydration`

- [ ] **Step 4: Pull origin/main into local main**
Run: `git pull origin main`

---

## Task 2: CI Workflow Hardening & Gitleaks Repair

**Files:**
- Modify: `.github/workflows/security.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/dependabot.yml`

- [ ] **Step 1: Update `.github/workflows/security.yml`**
Replace `gitleaks-action` with the open-source Gitleaks standalone binary:

```yaml
      - name: Install & Run Gitleaks
        run: |
          curl -sSfL https://github.com/gitleaks/gitleaks/releases/download/v8.24.0/gitleaks_8.24.0_linux_x64.tar.gz | tar -xz
          ./gitleaks detect --verbose --redact
```

- [ ] **Step 2: Update `.github/workflows/ci.yml`**
Add `continue-on-error: true` to the `delete_neon_branch` step.

- [ ] **Step 3: Update `.github/dependabot.yml`**
Add ignore rules for core framework dependencies (`react`, `react-dom`, `@react-router/*`, `express`, `drizzle-orm`, `vite`, `typescript`).

---

## Task 3: Monorepo Verification & Deployment to Main

**Files:**
- Whole monorepo

- [ ] **Step 1: Run local typecheck and linting**
Run: `npm run check`

- [ ] **Step 2: Run Knip dead code analysis**
Run: `npm run check:knip`

- [ ] **Step 3: Run markdown documentation check**
Run: `npm run check:docs`

- [ ] **Step 4: Run unit tests**
Run: `npm run test`

- [ ] **Step 5: Run full production build**
Run: `npm run build`

- [ ] **Step 6: Run full tech integrity verification**
Run: `npm run verify:tech-integrity`

- [ ] **Step 7: Commit, push to `main`, and monitor CI check runs**
Run: `git push origin main` and `gh run list --branch main`

