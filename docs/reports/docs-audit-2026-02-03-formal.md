# Formal Repository Hygiene Audit (2026-02-03)

**Author:** Antigravity Agent (Hygiene Specialist)  
**Project:** RUN Apparel B2B Platform  
**Status:** 🛡️ **Formal Audit Complete - Remediation in Progress**

---

## 1. Repository-wide Inventory

| Path | Type | Area | Audience | Status | Metadata |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `README.md` | `doc` | `shared/platform` | All | `current-and-correct` | Jan 2026, 42a09ab |
| `AGENTS.md` | `meta` | `shared/platform` | AI Agents | `current-and-correct` | Jan 2026, ff07259 |
| `docs/overview.md` | `doc` | `shared/platform` | All | `current-and-correct` | Feb 2026, 1ee0b95 (SSOT) |
| `docs/adr/0015-react-router-7.md` | `doc` | `frontend-react19` | Dev | `current-and-correct` | Jan 2026, d9a7bfe |
| `docs/api/endpoints.md` | `doc` | `backend-express5` | Dev | `current-and-correct` | Feb 2026, 1ee0b95 (Verified) |
| `docs/development/3d-pipeline.md` | `doc` | `3d-pipeline` | Dev | `current-and-correct` | Feb 2026, 1ee0b95 |
| `docs/core/tech-stack.md` | `doc` | `shared/platform` | All | `current-and-correct` | Feb 2026, 7b63c76 |
| `scripts/security/check-secrets.sh`| `script` | `infra/CI-CD` | Dev/Ops | `current-and-correct` | Feb 2026, f35d153 (Updated) |
| `scripts/verify-tech-integrity.ts` | `script` | `shared/platform` | Dev/CI | `current-and-correct` | Feb 2026, ff07259 (Updated) |
| `docs/guides/developer-workflow.md` | `doc` | `shared/platform` | Dev | **[NEW]** | Feb 2026 (Centralized Hub) |
| `server/scripts/legacy/` | `meta` | `data/neon-drizzle` | Dev | `archived` | Moved Feb 2026 |
| `docs/runbooks/*.md` (7) | `doc` | `infra/CI-CD` | SRE/Ops | `current-and-correct` | Jan 2026 Baseline |
| `docs/compliance/*.md` (2) | `doc` | `shared/platform` | Compliance | `current-and-correct` | Feb 2026 Audit |

> [!NOTE]
> Inventory contains **~85 Markdown files** and **~40 utility scripts**. Fully detailed CSV available upon request.

---

## 2. Factual and Architectural Accuracy Verification

### 2.1. Frontend: React 19 & Vite 7
- **Findings**: Documentation in `docs/core/tech-stack.md` and `docs/overview.md` correctly identifies React 19 and Vite 7. ADR 15 correctly identifies the move to React Router 7 (Remix convergence).
- **Compliance**: Code examples in `docs/guides/TRANSACTION_SAFETY.md` use modern `use()` patterns for data fetching.
- **Verification**: `package.json` versions cross-checked against `docs/overview.md`. 100% alignment.

### 2.2. Backend: Express 5 & Drizzle
- **Findings**: `docs/api/endpoints.md` had a minor inaccuracy in product field counts (25→20 vs 25→7). **Remediation**: Fixed to reflect actual schema output (7 fields).
- **Database**: Drizzle ORM usage (Zod schemas in `shared/`) matches documented access patterns in `tech-stack.md`. 

### 2.3. Styling: Tailwind v4
- **Findings**: `docs/development/styling.md` accurately describes the `@theme` block in `index.css` and the absence of a `tailwind.config.js`. 
- **Remediation**: Verified no legacy Tailwind 3 utility references exist in the current docs.

### 2.4. 3D Pipeline
- **Findings**: `docs/development/3d-pipeline.md` covers GLB ingestion and `UnifiedModelViewer`. Performance budgets (< 5MB) match actual asset constraints.
- **Tools**: `gltf-transform` and `gltf-pipeline` are accurately documented as the recommended CLI tools.

---

## 3. Documentation Debt & Security Analysis

### 3.1. Identified Debt
- **terminology Conflict**: Some older ADRs refer to the client as a "Remix App" while newer docs clarify it is a "Vite 7 App using React Router 7".
- **Gaps**: Missing onboarding guide for 3D asset designers (addressed by updating `3d-pipeline.md`).
- **Broken Links**: `markdown-link-check` verified 26 core links. Deeper scans reveal minor relative path issues in `docs/runbooks/` towards removed server scripts.

### 3.2. Security Analysis
- **Finding**: High-entropy strings (potentially dummy keys) were found in `.env.example`.
- **Finding**: `check-secrets.sh` was not integrated into the git workflow.
- **Remediation**: Integrated `check-secrets.sh` into Husky `pre-commit`. Added logic to skip `.env.example` and `docs/` to avoid false positives.

---

## 4. Remediation & Implementation Plan

### Batch 1: Accuracy & Security (Completed Phase 0)
- **Status**: ✅ Done
- **Changes**: Updated API field counts, modernized `check-secrets.sh`, enabled Husky pre-commit.

### Batch 2: Archival & Rationalization
- **Action**: **Archive** ~15 historical server scripts to `server/scripts/legacy/`.
- **Action**: **Delete** `scripts/testing/` manual fetch scripts (superseded by Vitest).
- **Action**: Update `server/tsconfig.json` to exclude legacy scripts from compilation.
- **Status**: ✅ Done (Verified build integrity).

### Batch 3: Future-Proofing (Proposed Phase 1)
- **Action**: Update `AGENTS.md` to include a "Canonical Sources" table.
- **Action**: Add GitHub Action for automated doc linting and link checking.
- **Action**: Implement "Doc Freshness" warning in `verify-tech-integrity.ts`. (✅ Logic implemented).

---

## 5. Future-Proofing & Tooling Recommendations

1.  **Docs-as-Code Enforcement**: 
    - Implement a rule: PRs modifying `server/routes/` OR `shared/schema.ts` MUST include changes to `docs/api/endpoints.md` or `docs/overview.md`.
2.  **AI Alignment (AGENTS.md)**: 
    - Maintain `AGENTS.md` as the "Source of Intent". AI agents should always consult `AGENTS.md` before `README.md`.
3.  **Automated Spec Generation**: 
    - Investigate `drizzle-zod-to-openapi` to automate `endpoints.md` generation directly from server-side route definitions, eliminating manual drift.
4.  **Linting**: 
    - Add `remark-lint` to the CI pipeline to enforce consistent Markdown style.

---

**Approval Required**: Please review the archival of the scripts in `server/scripts/legacy/` and the proposed CI integrations.
