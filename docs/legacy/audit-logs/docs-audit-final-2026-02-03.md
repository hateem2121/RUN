# Documentation & Scripts Audit Report

**Date**: 2026-02-03  
**Repository**: `run-remix-monorepo`  
**Stack**: React 19 + Express 5 + Tailwind CSS v4 + TypeScript + 3D Pipeline (@google/model-viewer)
**Status**: 🛠️ **Audit Complete - Remediation Recommended**

---

## Executive Summary

This audit evaluates the documentation and utility scripts of the RUN Apparel B2B platform. The primary goal is to ensure accuracy against the modernized **React 19 / Express 5 / Tailwind v4** stack and to identify documentation debt or orphaned scripts.

### Key Findings:
1.  **Stack Alignment**: Core documentation (`README.md`, `docs/overview.md`, ADRs) is exceptionally well-maintained and accurately reflects the current tech stack.
2.  **API Accuracy**: `docs/api/endpoints.md` contains minor inconsistencies in field counting for optimized endpoints.
3.  **Script Redundancy**: A significant number of one-off scripts exist in `server/scripts/` and `scripts/testing/` that appear to be for specific historical migrations or debugging.
4.  **Security Gap**: `scripts/security/check-secrets.sh` is present but disconnected from the CI/CD and pre-commit pipeline.
5.  **3D Documentation**: Contrary to previous reports, `docs/development/3d-pipeline.md` exists and provides accurate guidance for the `@google/model-viewer` pipeline.

---

## 1. Inventory and Classification

Total files analyzed: **~120** (excluding `node_modules` and `dist`)

### 1.1 Root & Core Documentation

| Path | Type | Area | Audience | Classification | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `README.md` | doc | Shared | All | `current-and-correct` | Excellent overview. Accurate ports (5002) and stack. |
| `AGENTS.md` | meta | Shared | AI Agents | `current-and-correct` | Correctly points to `overview.md` as SSOT. |
| `CONTRIBUTING.md` | doc | Shared | Dev | `current-and-correct` | Matches React 19 patterns. |
| `CHANGELOG.md` | doc | Shared | Dev | `current-and-correct` | Covers recent Tailwind v4 and React 19 migrations. |
| `docs/overview.md` | doc | Shared | All | `current-and-correct` | **SSOT**. Contains precise version numbers. |
| `docs/index.md` | doc | Shared | Dev | `current-and-correct` | Navigation hub. |

### 1.2 Development & Architecture (docs/core, docs/adr, docs/development)

| Path | Type | Area | Audience | Classification | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `docs/core/architecture.md` | doc | Shared | Dev | `current-and-correct` | High-level system design. |
| `docs/core/tech-stack.md` | doc | Shared | Dev | `current-and-correct` | Accurate list of tools. |
| `docs/adr/*.md` (15) | doc | Shared | Dev | `current-and-correct` | Vital historical context for React 19, Express 5, etc. |
| `docs/development/styling.md` | doc | Frontend | Dev | `current-and-correct` | Modern Tailwind v4 (CSS variables) guide. |
| `docs/development/3d-pipeline.md`| doc | Frontend | Dev | `current-and-correct` | Verified: Good guidance on GLB optimization. |
| `docs/development/testing.md` | doc | Quality | Dev | `current-and-correct` | Vitest + Playwright strategy. |

### 1.3 API Documentation (docs/api)

| Path | Type | Area | Audience | Classification | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `docs/api/endpoints.md` | doc | Backend | Dev | `needs-update` | Inconsistencies in field counts (25→20 vs 25→7). |
| `docs/api/api-reference.md`| doc | Backend | Dev | `current-and-correct` | General API usage guide. |
| `docs/api/auth.md` | doc | Backend | Dev | `current-and-correct` | Session-based auth details. |
| `docs/api/ERROR_CODES.md` | doc | Backend | Dev | `current-and-correct` | |

### 1.4 Operations & Security (docs/operations, docs/runbooks, docs/security)

| Path | Type | Area | Audience | Classification | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `docs/operations/slos.md` | doc | Infra | Ops/SRE | `current-and-correct` | Consolidated SLI/SLO source. |
| `docs/runbooks/*.md` (7) | doc | Infra | Ops/SRE | `current-and-correct` | Critical for incident response. |
| `docs/security/*.md` (3) | doc | Security | Dev/Ops | `current-and-correct` | Threat models and policies. |

### 1.5 Scripts & Automation (scripts/, server/scripts/)

| Path | Type | Area | Audience | Classification | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `scripts/verify-tech-integrity.ts` | script | Platform | Dev/CI | `current-and-correct` | Core health check (Husky pre-push). |
| `scripts/security/check-secrets.sh`| script | Security | Dev | `legacy-or-superseded`| **Orphaned**. Not in Husky/CI. |
| `scripts/setup/verify-setup.sh` | script | Platform | Dev | `current-and-correct` | Used for local onboarding. |
| `server/scripts/*.ts` (20+) | script | Data/Ops | Dev | `candidate-for-archive` | Mostly one-off tasks (e.g., `cleanup-duplicates`). |
| `scripts/testing/*.js` | script | Quality | Dev | `candidate-for-removal` | Adirondack/Old test scripts. |

---

## 2. Per-File Findings and Recommendations

### 2.1 API Documentation (docs/api/endpoints.md)
*   **Finding**: The document states "Product listings optimized from 25 fields → 20 fields" in the summary, but later claims "reduced from 25 → 7 fields". The example response and field removal list confirm that **7 fields** is the correct number.
*   **Recommendation**: Update all references in `docs/api/endpoints.md` to consistently reflect the 25→7 field reduction for products and 25→8 for media.

### 2.2 Secret Scanning (scripts/security/check-secrets.sh)
*   **Finding**: The script is functional but not integrated into the development workflow. 
*   **Recommendation**: 
    1.  Add `scripts/security/check-secrets.sh` to the root `package.json` under `lint-staged` or as a standalone `scripts:check` step.
    2.  Update `AGENTS.md` to mention that this script MUST pass before commit.

### 2.3 Orphaned/Legacy Scripts
*   **Finding**: `scripts/testing/` contains scripts like `test-product-fetch.js` which seem redundant given Vitest integration. `server/scripts/` contains many historical "backfill" scripts.
*   **Recommendation**: 
    1.  Move one-off backfill scripts to a `scripts/archive/` or `server/scripts/legacy/` directory.
    2.  Remove `scripts/testing/` if Vitest covers these scenarios.

### 2.4 Missing Global Workflow Docs
*   **Finding**: While individual components are well-documented, a high-level "Developer Workflow" doc connecting coding -> linting -> local testing -> CI/CD is primarily scattered between `README.md` and `docs/overview.md`.
*   **Recommendation**: Create `docs/guides/developer-workflow.md` as a cohesive entry point for new contributors.

---

## 3. Modernization & Implementation Plan

### Phase 1: Corrections (Immediate)
- Update `docs/api/endpoints.md` with correct field counts.
- Modernize `scripts/security/check-secrets.sh` to use more robust exclusion patterns for `.env.example`.

### Phase 2: Rationalization (Cleanup)
- Move ~15 scripts from `server/scripts/` to `server/scripts/legacy/`.
- Archive `scripts/testing/` directory.

### Phase 3: workflow Integration
- Wire up `check-secrets.sh` to Husky `pre-commit`.
- Add a new "Doc Check" to `scripts/verify-tech-integrity.ts` that fails if `docs/overview.md` is older than 3 months without review.

---

## 4. Verification Plan

### Automated Verification
- Run `npm run verify:tech-integrity` after all removals to ensure no broken dependencies.
- Run `npm run check:docs` to verify no broken links.

### Manual Verification
- Verify that `check-secrets.sh` correctly blocks a commit containing a dummy Google API key.
- Review doc corrections with the platform team.

---

**Report Status**: Final Draft. Ready for Review.
