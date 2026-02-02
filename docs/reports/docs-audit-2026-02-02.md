# Documentation & Repo Hygiene Audit Report

**Date:** 2026-02-02
**Auditor:** Antigravity (Docs & Repo Hygiene Agent)
**Scope:** Repository-wide documentation, scripts, and structural hygiene.

---

## 1. Executive Summary

The repository `run-remix-monorepo` is observing a high degree of documentation accuracy regarding its core technology stack (React 19, Express 5, Tailwind v4). The `docs/` architecture is well-structured and established as the Source of Truth.

However, verified technical debt exists in the form of orphaned directories (`utils/`, `admin/`) and minor discrepancies in API documentation versioning. This report outlines a plan to eliminate this debt and formalize the "Docs-as-Code" workflow.

**Overall Health:** 🟢 **Good** (Minor Cleanup Required)

---

## 2. Inventory & Classification

### 📂 Root & Config Files

| File | Status | Audience | Summary |
| :--- | :--- | :--- | :--- |
| `README.md` | `current-and-correct` | Everyone | Main entry point; accurately reflects current stack and commands. |
| `AGENTS.md` | `current-and-correct` | Agents | Context injection for AI; matches current architecture constraints. |
| `CONTRIBUTING.md` | `current-and-correct` | Devs | detailed guide; includes React 19/Tailwind v4 specifics. |
| `docs/overview.md` | `current-and-correct` | Devs/Ops | Single Source of Truth for versions and architecture. |
| `package.json` | `current-and-correct` | System | Defines workspaces (`client`, `server`, `shared`) and scripts. |

### 📂 Documentation (`docs/`)

| File | Status | Area | Summary |
| :--- | :--- | :--- | :--- |
| `docs/core/tech-stack.md` | `current-and-correct` | Tech | Baseline stack definition (Jan 2026). Matches code. |
| `docs/core/architecture.md` | `current-and-correct` | Arch | Core architecture patterns. |
| `docs/api/endpoints.md` | `needs-update` | API | Detailed API spec. *Finding: Mentions "no versioning" despite `v1` routes existing.* |
| `docs/runbooks/*.md` | `current-and-correct` | Ops | Operational guides (DB outage, etc.) aligned with Infra. |
| `docs/adr/*.md` | `current-and-correct` | Arch | Record of decisions (React 19, Monorepo, etc.). |

### 📂 Scripts (`scripts/`)

| File | Status | Summary |
| :--- | :--- | :--- |
| `scripts/setup/verify-setup.sh` | `current-and-correct` | Dev setup verification (VS Code extensions). Valid and useful. |
| `scripts/security/check-secrets.sh` | `current-and-correct` | Pre-commit secret scanning. Valid and useful. |
| `scripts/verify-tech-integrity.ts` | `current-and-correct` | Primary quality gate script. Widely used. |

### ⚠️ Legacy & Orphaned Artifacts

| Path | Status | Finding | Action |
| :--- | :--- | :--- | :--- |
| `utils/` | `legacy-or-superseded` | Directory containing compiled JS and TS files (`date-helpers`, `replit-monitor`). Not a workspace. Not referenced by `package.json`. | **Delete** |
| `admin/` | `legacy-or-superseded` | Directory containing `fibers/sportswear_fibers_guide.md`. Not a workspace. Unknown origin (likely content stray). | **Archive/Move** |

---

## 3. Verification Findings

### ✅ Accurate
1.  **Tech Stack**: `docs/core/tech-stack.md` and `README.md` correctly adhere to React 19, Vite 7, Express 5, and Tailwind v4.
2.  **Monorepo Structure**: `docs/adr/0010-monorepo-structure.md` matches `package.json` workspaces.
3.  **Scripts**: Operational scripts in `package.json` (`verify:tech-integrity`, `db:push`) are correctly documented and functional.

### ❌ Issues / Debt
1.  **Orphaned `utils/` Directory**:
    - Contains `tsconfig.json` extending base, but is not a workspace.
    - Contains `replit-monitor.js` suggesting legacy environment.
    - Code is redundant or unused given `@run-remix/shared`.
    - **Risk**: Low (Code appears unused).

2.  **Orphaned `admin/` Directory**:
    - Contains only a content markdown file (`sportswear_fibers_guide.md`).
    - Location is confusing (looks like an app root folder).
    - **Risk**: Low (Static content).

3.  **API Versioning Discrepancy**:
    - `docs/api/endpoints.md` states "API Version: 1.0 (implicit, no versioning)".
    - Codebase contains `server/routes/v1/`.
    - **Risk**: Low (Documentation clarity).

---

## 4. Implementation Plan

The following changes are proposed to be executed after approval.

### Phase 1: Cleanup (Low Risk)
1.  **Delete** `utils/` directory.
    - *Rationale*: Orphaned, legacy code not in workspaces.
2.  **Move** `admin/fibers/sportswear_fibers_guide.md` to `docs/resources/content/sportswear_fibers_guide.md` (creating folder if needed).
3.  **Delete** `admin/` directory (after move).
    - *Rationale*: Remove confusion with potential future admin apps.

### Phase 2: Docs Update (Medium Risk)
1.  **Update** `docs/api/endpoints.md`:
    - Clarify versioning strategy to reflect `v1` route structure if it is intended to be the public interface.
2.  **Update** `scripts/setup/verify-setup.sh`:
    - Remove potentially obsolete Tailwind class regex checks if Tailwind v4 extension handles it natively (optional, cleanup).

### Phase 3: Process Hardening
1.  **CI Check**: Ensure `npm run check:docs` (markdown-link-check) is part of the PR pipeline (it is already in `package.json` scripts, verify usage in `verify:tech-integrity`).

---

## 5. Process Recommendations

1.  **Docs-as-Code**: Continue the practice of requiring `docs/` updates in PRs.
2.  **Agent Protocol**: The `AGENTS.md` file is highly effective. Maintain it as the primary context source.
3.  **Link Checking**: The `check:docs` script is available. We should ensure it runs on CI to prevent broken links in documentation.

---

**Request for Approval**: Please review these findings. Upon approval, I will proceed with **Phase 1 (Cleanup)**.
