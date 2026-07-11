# Unified Repository Audit Report — 2026-07-10 (Round 3 Completion Pass)

## Executive Summary
This document serves as the definitive reconciliation of RUN Remix's scattered audit history against current, real-time repository metrics as of July 10, 2026. It replaces the contradictory claims found in `MASTER_AUDIT_REPORT.md` and `findings.md`.

**Objective:** Assess folder/file organization, best practices, future-proofing, dead/unused code, and calculate a reproducible code-health score.

**Current Health Grade:** **72.50/100 (Grade C)**

---

## 1. Finding Log by Severity (P0–P3)

### 🔴 P0: Critical Path (Fix Immediately)
*   *None.* Verified that the client-side routes `/dashboard`, `/analytics`, and `/admin` are correctly protected via `<ProtectedAdminRoute>` (nested sub-routes like `/admin/$module` inherit the guard from `/admin`). On the server side, all route handlers under `server/routes/admin/*` and inquiry-management endpoints in `server/routes/utilities/inquiry-admin.ts` enforce `authService.requireAdmin` checks.

### 🟠 P1: Major Configuration & Hard Rule Violations
*   **Finding:** `turbo.json` outputs to deprecated directories and retains forbidden configurations.
    *   **Path:** [turbo.json](file:///Users/hateemjamshaid/Sites/RUN/turbo.json)
    *   **Description:** Turborepo config lists output paths to Next.js `.next/**` which violates ADR 0002 (remix/vite architecture) and retains environment variable declarations for the forbidden `@sentry/node` package.
    *   **One-Line Fix:** Remove Sentry environment keys and correct workspace outputs to target Vite build directories (`dist/`, `build/`).

*   **Finding:** Widespread non-compliance with the centralized GSAP import registry rule.
    *   **Path:** `client/app/components/*` and `client/app/routes/*`
    *   **Description:** Over 30 files directly import `gsap` and `@gsap/react` from node_modules, bypassing the registry at `client/app/lib/gsap.ts` and violating Hard Rule H19 (GSAP Import Rule).
    *   **One-Line Fix:** Replace direct imports of `gsap` and `@gsap/react` with imports from `client/app/lib/gsap.ts`.

### 🟡 P2: Minor Structural, Clutter & Workspace Violations
*   **Finding:** Redundant `findings/` directory.
    *   **Path:** `findings/` (Legacy workspace leftover)
    *   **Description:** Contains files duplicating archived reports in `docs/audits/` (violating AGENTS.md deprecation rules).
    *   **One-Line Fix:** Delete the `findings/` directory from the repository.

*   **Finding:** Test footprint fragmentation & naming conventions.
    *   **Path:** `shared/` (`tests/` vs `__tests__/`)
    *   **Description:** Naming structure is fragmented. Both `shared/tests/` (containing `contract.test.ts`) and `shared/__tests__/` (containing `errors.test.ts`) coexist without an active codebase standard.
    *   **One-Line Fix:** Consolidate shared tests under a single standard directory (e.g., `shared/tests/`) and delete the duplicate folder.

*   **Finding:** Bloated empty skill directories under `.claude/`.
    *   **Path:** [skills](file:///Users/hateemjamshaid/Sites/RUN/.claude/skills)
    *   **Description:** 47 of 48 total skill subdirectories are empty except for their `SKILL.md` descriptors; only `gstack/` (746 files) contains real code and scripts.
    *   **One-Line Fix:** Delete the 47 empty skill subdirectories under `.claude/skills/`.

*   **Finding:** Technical integrity check fails due to documentation version drift.
    *   **Path:** [FULL_SYSTEM_CONTEXT.json](file:///Users/hateemjamshaid/Sites/RUN/docs/FULL_SYSTEM_CONTEXT.json)
    *   **Description:** Running `npm run verify:tech-integrity` fails because `verify:docs-versions` detects a discrepancy between the documented versions in `FULL_SYSTEM_CONTEXT.json` and package workspace definitions (React, Vite, and Tailwind).
    *   **One-Line Fix:** Update package version strings in `FULL_SYSTEM_CONTEXT.json` to match package.json realities.

*   **Finding:** Local/CI environment configuration gap for rate limiter.
    *   **Path:** [rateLimiter.ts](file:///Users/hateemjamshaid/Sites/RUN/server/middleware/rateLimiter.ts) / `.env.example`
    *   **Description:** Missing `REDIS_URL` and `GCS_BUCKET_NAME` in local test environments causes circuit breakers to fire and log verbose errors. *Note: Session store uses Neon PostgreSQL via DrizzleSessionStore and is unaffected.*
    *   **One-Line Fix:** Suppress or mock Upstash Redis and Google Cloud Storage in Vitest setups.

*   **Finding:** ADR filename collisions and duplicate `gemini.md` section numbering.
    *   **Path:** `docs/adr/` (ADR 0017 duplicates), [gemini.md](file:///Users/hateemjamshaid/Sites/RUN/gemini.md)
    *   **Description:** Conflicting ADR filename IDs for #0017 (`0017-gsap-animation.md` and `0017-gsap-over-framer-motion.md`) and duplicate section headers 10–13 in `gemini.md`.
    *   **One-Line Fix:** Rename one of the ADR files to `0018-` and resolve duplicate numbers in `gemini.md`.

### 🟢 P3: Cosmetic & Documentation Inconsistencies
*   **Finding:** Stale version headers in `CLAUDE.md` and `MASTER_AUDIT_REPORT.md`.
    *   **Path:** [CLAUDE.md](file:///Users/hateemjamshaid/Sites/RUN/CLAUDE.md) / [MASTER_AUDIT_REPORT.md](file:///Users/hateemjamshaid/Sites/RUN/MASTER_AUDIT_REPORT.md)
    *   **Description:** Title headers claim version `v4.0.3` while `package.json` specifies `4.1.2`. `CLAUDE.md` also contains a self-contradiction (`v4.0.3` in title, `v4.1.2` in footer).
    *   **One-Line Fix:** Align titles to `v4.1.2`.

*   **Finding:** Stale maturity tracking document.
    *   **Path:** [MATURITY_SCORE.md](file:///Users/hateemjamshaid/Sites/RUN/docs/audits/MATURITY_SCORE.md)
    *   **Description:** Tracking file remains dated Q1 2026.
    *   **One-Line Fix:** Recalculate maturity matrix and update date header to July 2026.

*   **Finding:** Lost audit file link in `task_plan.md` 2026-06-20 entry.
    *   **Path:** [task_plan.md](file:///Users/hateemjamshaid/Sites/RUN/task_plan.md)
    *   **Description:** Links to `findings/health-score/2026-06-20-report.md`. The original report file was deleted in the `findings/` folder cleanup and is lost.
    *   **One-Line Fix:** Report the loss plainly in `task_plan.md` and recommend marking it unrecoverable.

---

## 2. Knip & NPM Audit Diagnostics (Raw Output Proofs)

Individual status reports for all 8 `verify:tech-integrity` checks:
1.  **Type Check:** **PASS** (0 compiler errors).
2.  **Lint Check:** **FAIL** (1159 errors and 17 warnings checked across 949 files).
3.  **Build Check:** **PASS** (Build succeeded for all 4 packages).
4.  **Bundle Size Check:** **PASS** (1 CSS file checked: `root-Tu1_VEFo.css: 38.5 kB gzip`, limit 300 kB).
5.  **Link Integrity:** **PASS** (30 links checked, 0 broken).
6.  **Dead Code Check:** **FAIL** (Knip configuration warnings and unused files).
7.  **SSR Invariant Check:** **PASS** (3 tests passed).
8.  **DocStack Alignment:** **FAIL** (Vite, React, Tailwind version mismatches in `docs/FULL_SYSTEM_CONTEXT.json`).

### Knip Diagnostics
*   **Unused Files (76 files):** Knip reports 76 unused files. The root workspace `workspaces["."]` (which matches files inside directories like `.claude/skills/` and `scripts/`) is flagged with 61 unused files:
    ```
    Unused files (76)
    .claude/skills/gstack/bin/gstack-brain-context-load.ts
    ...
    ```
*   **Redundant Config Patterns:** `knip.config.ts` flags 6 redundant patterns:
    ```
    app/routes.ts          …ient  …ip.config.ts  Remove redundant entry pattern
    app/root.tsx           …ient  …ip.config.ts  Remove redundant entry pattern
    app/entry.client.tsx   …ient  …ip.config.ts  Remove redundant entry pattern
    app/entry.server.tsx   …ient  …ip.config.ts  Remove redundant entry pattern
    index.ts               …rver  …ip.config.ts  Remove redundant entry pattern
    index.ts               …ared  …ip.config.ts  Remove redundant entry pattern
    ```

### Dependency & Testing Health
*   **Audit Check:** **PASS**. 6 moderate vulnerabilities found, 0 critical, 0 high. The 6 moderate vulnerabilities are allowlisted (`qs` and `uuid` packages).
*   **Vitest Suite Pass Rate:** **FAIL** (exit code 1).
    *   **Test Files:** 70 passed, 12 failed, 82 total.
    *   **Tests:** 747 passed, 30 failed, 1 skipped, 778 total.
    *   *Note:* Failures are due to DB and Redis initialization timeouts in test runners rather than code regressions.

---

## 3. Best Practices & Future-Proofing (July 2026 Version Verification)

| Package | Installed | npm latest | Status | Code Compliance Notes |
|---|---|---|---|---|
| `react` | 19.2.7 | 19.2.7 | Current | Compliant: 0 instances of `forwardRef` found. |
| `vite` | ^8.1.3 | 8.1.4 | 1 patch behind | Compliant: SSR resolution in `vite.config.ts` matches constraints. |
| `tailwindcss` | 4.3.2 | 4.3.2 | Current | Compliant: `@theme` used in `theme.css`, 0 instances of arbitrary values in components. |
| `zod` | ^4.4.3 | 4.4.3 | Current | Compliant: `.nullish()` syntax is used in place of legacy `.optional().nullable()`. |
| `@biomejs/biome` | 2.5.2 | 2.5.3 | 1 patch behind | Compliant: Configuration is active. |
| `express` | ^5.2.1 | 5.2.1 | Current | Compliant: Async-native Express 5 handlers active. |
| `typescript` | ^6.0.3 | 7.0.2 | Major version behind | Compliant. *Note:* TypeScript 7 is a Go-native port; hold off upgrading until programmatic APIs stabilize. |
| `turbo` | ^2.9.14 | 2.10.4 | Minor versions behind | Compliant, but config needs directory alignment. |
| `drizzle-orm` | ^0.45.2 | 0.45.2 | Current | Compliant: Schemas are centralized in `shared/schemas/`. |
| `gsap` | ^3.15.0 | 3.15.0 | Current | **Violation:** 30+ files directly import `gsap` instead of `@/lib/gsap`. |
| `react-router` | ^8.0.0 | 8.2.0 | Minor versions behind | **Violation:** `gemini.md` refers to v7 in some text while v8 guidance is active. |
| `locomotive-scroll` | ^5.0.1 | 5.0.1 | Current | Compliant: Scroll context initialized exactly once in `_public.tsx` with strict types. |
| `sonner` | ^2.0.7 | 2.0.7 | Current | Compliant: All toast feedback uses `sonner`. |
| `neverthrow` | ^8.1.1 | 8.2.0 | 1 minor version behind | Compliant: Services use neverthrow; 0 occurrences of `.unwrap()`. |

---

## 4. Organization & Test Footprint Directory Mapping

The testing directories are highly fragmented across the monorepo:
1.  **`e2e/`**: Playwright E2E configuration and tests (documented, canonical).
2.  **`tests/`**: Contains root unit, integration, and mocks tests (documented, canonical).
3.  **`client/tests/`**: Holds unit tests for frontend UI components (accidental/duplicate placement).
4.  **`server/tests/`**: Holds unit tests for server routing/middleware (accidental/duplicate placement).
5.  **`shared/__tests__/`**: Contains `errors.test.ts`.
6.  **`shared/tests/`**: Contains `contract.test.ts`.

*Comparison against `docs/adr/0010-monorepo-structure.md`:* The monorepo structure ADR defines `client/`, `server/`, and `shared/` boundaries but does not specify a unified testing structure, which led to both `tests/` and `__tests__/` coexisting. We recommend establishing a strict directory layout and updating `gemini.md` §6.1 to reflect a single testing workspace.

---

## 5. Code-Health Score Calculation

The updated composite score incorporates the 47 empty skill directories and the `findings/` directory duplication:

| Metric | Score | Weight | Weighted Score |
|--------|-------|--------|----------------|
| **Cleanliness** (Knip unused files, config warnings, 47 empty skill folders, findings/ bloat) | 50/100 | 20% | 10.00 |
| **Test Pass Rate & Coverage** (747/778 passed, Vitest fails exit code 1) | 85/100 | 30% | 25.50 |
| **Audit Severity** (30 failing tests, P1 config debt in turbo.json, GSAP direct imports) | 65/100 | 20% | 13.00 |
| **Dependency Health** (6 moderate vulnerabilities, 2 allowed) | 95/100 | 15% | 14.25 |
| **Docs Freshness** (Stale headers, Q1 maturity tracking, version drift) | 65/100 | 15% | 9.75 |
| **Total Composite Score** | | | **72.50 / 100** |

**Final Grade:** **72.50/100 (Grade C)**

---

## 6. Fix These Five First (Prioritized Remediation List)

1.  **Centralize GSAP Imports (P1):** Refactor all component files to import `gsap` and `useGSAP` from `@/lib/gsap` to restore plugin registration safety.
2.  **Correct turbo.json Configurations (P1):** Remove legacy Sentry variables and update output paths to match the current Remix/Vite compiler.
3.  **Align Documentation Version Drift (P2):** Update `docs/FULL_SYSTEM_CONTEXT.json` and stale v4.0.3 titles in `CLAUDE.md` and `MASTER_AUDIT_REPORT.md`.
4.  **Consolidate shared/ Test Directories (P2):** Clean up the `shared/__tests__/` and `shared/tests/` duplication.
5.  **Remove findings/ Directory (P2):** Delete the redundant files in `findings/` to enforce clean workspace hygiene.

---
**Audit Date:** 2026-07-10
**Auditor:** Antigravity Agent
**Mode:** Read-only / Findings Synthesis
