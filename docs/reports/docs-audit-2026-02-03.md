# Documentation & Repository Hygiene Audit Report

**Date**: 2026-02-03  
**Repository**: `run-remix-monorepo`  
**Stack**: React 19 + Express 5 + Tailwind CSS v4 + TypeScript + GLTF/GLB Pipeline  
**Auditor**: Docs, Scripts & Repo Hygiene Agent  
**Status**: ⚠️ **Changes Recommended** (Gaps identified in API & 3D Documentation)

---

## Executive Summary

This audit validates the accuracy and structure of repository documentation against the current `React 19 / Express 5 / Tailwind v4` stack. 

While the majority of the documentation is **current-and-correct** (building upon the findings of the 2026-02-02 audit), significant **gaps** were identified in:
1.  **3D Asset Pipeline Documentation**: Missing specific guidance on model optimization / ingestion despite `package.json` dependencies.
2.  **API Documentation Accuracy**: A conflicting "field count" description in `docs/api/endpoints.md`.

---

## 1. Repository-Wide Inventory Table

### Root & Core Documentation

| Path | Type | Area | Status | Notes |
|------|------|------|--------|-------|
| `README.md` | doc | shared | `current-and-correct` | Accurate stack refs. Mentions "3D model support" but links to overview. |
| `AGENTS.md` | meta | shared | `current-and-correct` | Excellent operational map. |
| `docs/overview.md` | doc | shared | `current-and-correct` | SSOT for versions. Mentions Three.js. |
| `docs/api/endpoints.md` | doc | backend | `needs-update` | **Finding**: Inconsistency in "Fields Removed" counts (20 vs 7). |
| `docs/development/styling.md` | doc | frontend | `current-and-correct` | Accurate Tailwind v4 guide. |

### scripts/

| Path | Type | Area | Status | Usage |
|------|------|------|--------|-------|
| `scripts/verify-tech-integrity.ts` | script | shared | `current-and-correct` | Critical health check. |
| `scripts/setup/verify-setup.sh` | script | shared | `current-and-correct` | Verified VS Code extension checks. |

*(Full inventory from previous audit remains valid for unaltered files)*

---

## 2. Per-File Findings and Recommendations

### 🚨 Critical Findings (Action Required)

#### 1. `docs/api/endpoints.md` (Accuracy)
-   **Issue**: The section "GET /api/products" claims "**Optimization Applied**: Column selection reduced from 25 → 20 fields". However, the response example and subsequent "Fields Removed (18)" list clearly indicate only **7 fields** remain (25 - 18 = 7).
-   **Evidence**: The `AFTER` block lists `id, name, slug, description, primaryImageId, categoryId, isFeatured` (7 items).
-   **Risk**: Medium. Confusing for integrators.
-   **Recommendation**: Update header to "Optimization Applied: reduced from 25 → 7 fields".

#### 2. Missing 3D Pipeline Documentation (Gap)
-   **Issue**: `client/package.json` includes `@google/model-viewer` and `@react-three/drei`. `README.md` claims "3D model support". The Scope required verifying "documentation about 3D model ingestion... reflects current tools".
-   **Finding**: **No dedicated documentation found**. Searches for "optimization", "GLB", "pipeline" yielded no guides on *how* to add models, polygon limits, compression steps, or where to host them.
-   **Risk**: High. Knowledge silo.
-   **Recommendation**: Create `docs/development/3d-pipeline.md`.

### ✅ Verified High-Value Docs

-   **`docs/development/styling.md`**: Correctly mandates `@theme` tokens and forbids arbitrary values. Matches Tailwind v4.
-   **`AGENTS.md`**: Correctly directs agents to `docs/overview.md` and enforces `npm run verify:tech-integrity`.

---

## 3. Implementation Plan

### Batch 1: Immediate Corrections (Low Risk)
-   **Target**: `docs/api/endpoints.md`
-   **Action**: Fix the "20 fields" typo to "7 fields".
-   **Approvals**: None (Correction).

### Batch 2: Documentation Creation (Medium Risk)
-   **Target**: `docs/development/3d-pipeline.md`
-   **Action**: Draft a new guide covering:
    -   Supported formats (GLB/GLTF).
    -   Compression tools (`@gltf-transform` / `gltf-pipeline`).
    -   Component usage (`<model-viewer>` vs `Canvas`).
    -   Asset location (`public/models` vs CDN).
-   **Approvals**: Tech Lead (for pipeline specifics).

### Batch 3: Process Improvements (From 02-02 Report)
-   Implement **Docs-as-Code** checks in CI (markdown-link-check is already present).
-   Add Frontmatter to key docs.

---

## 4. Process and Tooling Recommendations

1.  **Spec-Driven API Docs**: The discrepancy in `endpoints.md` highlights the risk of manual docs.
    -   **Recommendation**: Transition to generating `docs/api/endpoints.md` (or a Swagger UI static export) directly from the Express 5 route definitions / Zod schemas if possible.
2.  **3D Asset Validation**:
    -   **Recommendation**: Add a script `scripts/verify-assets.ts` to check if GLB files in `public/` exceed a size limit (e.g., 5MB) to enforce performance budgets documented in the new 3D guide.

---

**Report Status**: Ready for Review.
