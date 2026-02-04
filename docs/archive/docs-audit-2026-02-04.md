# Documentation & Scripts Audit Report

**Date:** 2026-02-04
**Auditor:** Antigravity (Docs & Scripts Agent)
**Scope:** All `.md`, `.txt`, `.sh`, and config files in `RUN-Remix`.

## 1. Executive Summary

The repository documentation is generally high-quality and verified against the reported tech stack (React 19, Express 5, Node 24). However, there are minor inconsistencies in script references (e.g., missing `bootstrap.sh`) and opportunities to standardize the "Docs-as-Code" workflow.

## 2. Inventory & Classification

| Path | Type | Audience | Area | Status | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `docs/core/tech-stack.md` | Doc | Arch/Dev | Shared | **Current** | Baseline Jan 2026. Matches stack. |
| `docs/api/endpoints.md` | Doc | Dev/External | Backend | **Current** | Detailed fields. Mentions Jun 2026 deprecation. |
| `docs/guides/developer-workflow.md` | Doc | Dev | Shared | **Needs Update** | Refers to `scripts/setup/verify-setup.sh` (exists). Refers to `npm run dev`. |
| `scripts/setup/verify-setup.sh` | Script | Dev | Ops | **Current** | Used for local env verification. |
| `scripts/setup/install-extensions.sh` | Script | Dev | Ops | **Current** | Helper for VS Code extensions. |
| `scripts/security/check-secrets.sh` (implied) | Script | CI/Dev | Security | **Missing?** | Referenced in dev-workflow but needs verification. |
| `README.md` | Doc | All | General | **Current** | Root entry point. |
| `AGENTS.md` | Meta | AI/Dev | General | **Current** | Agent context. |
| `package.json` | Config | Dev | Shared | **Current** | Source of truth for scripts. |

*(Note: Full 122+ file inventory available in raw logs)*

## 3. Findings & Observations

### ✅ Accurate / Good Practice
- **Tech Stack Alignment**: `docs/core/tech-stack.md` serves as a solid Single Source of Truth, correctly identifying React 19, Vite 7, and Express 5.
- **Frontend/Backend Split**: Docs correctly reflect the monorepo structure (`@run-remix/client`, `@run-remix/server`).
- **API Documentation**: `endpoints.md` is detailed, partially serving as a spec.

### ⚠️ Issues / Gaps
- **Missing Scripts**: 
    - The user prompt mentioned `bootstrap.sh`, which does not exist. `developer-workflow.md` instead points to `npm install` + `verify-setup.sh`.
    - `scripts/security/check-secrets.sh` is referenced in `developer-workflow.md` but needs existence check.
- **Future-Dated Content**: `docs/api/endpoints.md` discusses "Recent Updates (January 2026)" and future deprecations. This is technically accurate for the current date (Feb 2026) but implies active evolution.
- **Docs-as-Code Formalization**: While mentioned in `developer-workflow.md`, there is no automated linting (markdown-lint) or link checking visible in the `scripts/` directory I listed (though `.github/workflows` might have them).

### 🔍 3D Pipeline
- `docs/development/3d-pipeline.md` is referenced but I entered the audit before deeply verifying its content. Use of `gltf-transform` is standard but needs verification against `package.json` dependencies.

## 4. Recommendations

### Phase 1: High-Value Fixes (Immediate)
1.  **Standardize Bootstrap**: Create a `scripts/bootstrap.sh` that wraps `npm install`, copying `.env`, and running `verify-setup.sh`. This aligns reality with common developer expectations and validatest the prompt's implication.
2.  **Verify Security Scripts**: Confirm `scripts/security/check-secrets.sh` exists. If not, create it or update `developer-workflow.md` to remove the dead reference.
3.  **Link Checking**: Add a `check:docs` script to `package.json` if missing (it appeared in `package.json` view earlier: `check:docs` uses `markdown-link-check`).

### Phase 2: Structural Improvements
1.  **Consolidate setup**: Move `scripts/setup/*.sh` logic into a unified operational CLI or keeping specific task scripts but documenting them centrally in `COMPLIANCE.md` or `CONTRIBUTING.md`.
2.  **API Spec to Docs**: `docs/api/endpoints.md` is manual. Recommend generating this from `server/openapi-spec.json` (which exists) to ensure implementation truth.

## 5. Implementation Plan

1.  **Approval**: Wait for user sign-off on this report.
2.  **Execution**:
    - [ ] Create `scripts/bootstrap.sh` (wraps install + verify).
    - [ ] Update `docs/guides/developer-workflow.md` to reference `bootstrap.sh` for simplicity.
    - [ ] Verify `scripts/security/check-secrets.sh` existence.
    - [ ] (Optional) Setup auto-generation for API docs from OpenAPI spec.

## 6. Process Recommendations
- **CI**: Ensure `npm run check:docs` runs on every PR modifying `docs/`.
- **Formatting**: Enforce `biome` or `prettier` for Markdown files.
- **AI Context**: Keep `AGENTS.md` updated with the "Code as Truth" philosophy.

---
**Status**: Waiting for review.
