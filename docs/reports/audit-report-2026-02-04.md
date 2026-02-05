# Documentation & Scripts Audit Report

**Date:** 2026-02-04
**Auditor:** Antigravity (Google Deepmind)
**Scope:** Full Repository (`RUN-Remix`)

---

## 1. Inventory & Classification

A complete inventory of documentation, scripts, and operational files.

### 1.1 Core Documentation (`docs/`)

| Path | Type | Status | Audience | Confidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `README.md` | `readme` | **Current** | All | 1.0 | Canonical entry point. Matches stack. |
| `docs/overview.md` | `guide` | **Current** | All | 1.0 | Accurate "Single Source of Truth". |
| `docs/core/tech-stack.md` | `guide` | **Current** | Dev/Arch | 1.0 | Correctly identifies React 19/Vite 7. |
| `docs/core/architecture.md` | `guide` | **Current** | Dev/Arch | 0.9 | Matches monorepo structure. |
| `docs/api/endpoints.md` | `api-doc` | **Current** | Backend | 0.9 | Detail matches `server/routes`. |
| `docs/archive/**` | `misc-doc` | **Legacy** | None | 1.0 | Old audits. `docs-audit-2026-02-04.md` contains errors. |
| `docs/development/3d-pipeline.md` | `guide` | **Current** | 3D/Dev | 0.8 | Matches `@google/model-viewer` usage. |
| `docs/guides/developer-workflow.md` | `guide` | **Partially-Outdated** | Dev | 0.7 | Refers to `verify-setup` but could emphasize `bootstrap.sh`. |

### 1.2 Scripts (`scripts/`, `package.json`)

| Path | Type | Status | Audience | Confidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `scripts/bootstrap.sh` | `script` | **Current** | Dev | 1.0 | Exists & functional. Missed by previous audit. |
| `scripts/verify-tech-integrity.ts` | `script` | **Current** | CI/Dev | 1.0 | Critical health check script. |
| `scripts/security/check-secrets.sh` | `script` | **Current** | CI | 0.9 | Exists. |
| `scripts/setup/verify-setup.sh` | `script` | **Current** | Dev | 0.9 | Called by `bootstrap.sh`. |
| `package.json` (root) | `config` | **Current** | Dev | 1.0 | Orchestrates monorepo. |

### 1.3 Infrastructure & Meta

| Path | Type | Status | Audience | Confidence | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `cloudbuild.yaml` | `ci-config` | **Current** | DevOps | 1.0 | Used for deployment (gcloud run). |
| `terraform/**` | `ops` | **Legacy/Unused** | DevOps | 0.9 | Conflicts with `cloudbuild.yaml`. Likely dead code. |
| `.env.example` | `env-template` | **Current** | Dev | 0.9 | Matches server config schema. |
| `Dockerfile` | `ops` | **Current** | DevOps | 1.0 | Node 24 Alpine. Matches stack. |

---

## 2. Issues & Inconsistencies

### Critical / High Impact

1.  **Deployment Method Conflict (`terraform/` vs `cloudbuild.yaml`)**
    *   **Description**: The `terraform/` directory implies a Terraform-managed infrastructure, but `cloudbuild.yaml` explicitly uses `gcloud run deploy` commands directly. There is no evidence of Terraform being run in CI/CD.
    *   **Actual Behavior**: Deployment is handled by Google Cloud Build scripts, not Terraform.
    *   **Impact**: High. Confusion about infrastructure management.
    *   **Fix**: Archive or remove `terraform/` if confirmed unused. Add comment in `cloudbuild.yaml` clarifying deployment mode.

2.  **Inaccurate Audit Record (`docs/archive/docs-audit-2026-02-04.md`)**
    *   **Description**: An existing audit file dated today claims `scripts/bootstrap.sh` is missing. This file *does* exist.
    *   **Actual Behavior**: The script exists and appears functional.
    *   **Impact**: Medium. Misleading historical record.
    *   **Fix**: Mark the archive file as inaccurate or delete it to avoid confusion.

### Medium / Low Impact

3.  **Docs-as-Code Gaps**
    *   **Description**: `docs/guides/developer-workflow.md` references manual setup steps that `scripts/bootstrap.sh` automates.
    *   **Fix**: Update developer workflow to point primarily to `npm run setup` or `./scripts/bootstrap.sh`.

4.  **Version References**
    *   **Description**: Root `package.json` name (`run-remix-monorepo`) differs slightly from README title (`RUN Apparel B2B Platform`).
    *   **Fix**: purely cosmetic, ensure consistency where possible.

---

## 3. Proposed Documentation Structure

No major structural changes needed, but consolidation is recommended.

*   `README.md` (Keep as is)
*   `docs/`
    *   `core/` (Architecture, Tech Stack - Keep)
    *   `api/` (Endpoints - Keep)
    *   `guides/` (Developer workflows - Update)
    *   `operations/` (Runbooks - Keep)
    *   `legacy/` (New folder for archiving)
        *   `terraform/` (Move here if unused)
        *   `archive/` (Move existing archive here)

---

## 4. Implementation Plan

**Step 1: Cleanup & Legacy Archival**
*   Create `docs/legacy/`.
*   Move `terraform/` folder to `docs/legacy/terraform` (or delete if permitted).
*   Move `docs/archive/` content to `docs/legacy/audit-logs`.

**Step 2: Documentation Corrections**
*   Update `docs/guides/developer-workflow.md` to reference `scripts/bootstrap.sh`.
*   Update `README.md` to explicitly mention `scripts/bootstrap.sh` in the "Quick Start" section.

**Step 3: Verification**
*   Run `scripts/verify-tech-integrity.ts` to ensure no broken links after moves.
*   Verify `bootstrap.sh` runs clean.

---

## 5. Removal Plan

| File/Path | Classification | Reason | Recommended Action |
| :--- | :--- | :--- | :--- |
| `terraform/` | Legacy/Unused | Superseded by `cloudbuild.yaml` direct deploy. | **Archive** to `docs/legacy/` |
| `docs/archive/docs-audit-2026-02-04.md` | Inaccurate | Contains incorrect findings (flagged valid scripts as missing). | **Delete** or Mark as Invalid |
| `docs/reports/archive` | Duplicate | Old reports. | **Consolidate** into `docs/legacy` |

**Waiting for user approval to proceed with changes.**
