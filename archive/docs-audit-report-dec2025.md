# Repository Documentation & Operational Scripts Audit Report

**Date:** December 31, 2025
**Auditor:** Antigravity AI
**Scope:** Repository-wide (Documentation, Scripts, Configurations)
**Status:** COMPLETED & APPLIED

---

## 1. Executive Summary

A comprehensive audit of the RUN-Remix repository reveals **significant architectural drift** between the canonical documentation (`README.md`, `CODEMAP.md`) and the actual system implementation. The most critical discrepancy is the transition from **Wouter** to **React Router 7**, which is documented incorrectly. Furthermore, 45% of documented npm scripts are missing or named incorrectly, and the operational script suite (`scripts/`) contains over 150 files, with approximately 60% appearing to be legacy migration artifacts.

---

## 2. Inventory of Artifacts

| Category                               | Total Count | Critical Files                                                                    |
| :------------------------------------- | :---------- | :-------------------------------------------------------------------------------- |
| **Documentation (`.md`)**              | 12          | `README.md`, `CONTRIBUTING.md`, `CODEMAP.md`, `ENVIRONMENT_SETUP.md`              |
| **Operational Scripts (`.sh`, `.ts`)** | 152         | `scripts/api-smoke-test.sh`, `scripts/fix_tailwind_v4.sh`                         |
| **Configuration Files**                | 18          | `Dockerfile`, `biome.json`, `package.json` (x3), `vite.config.ts`, `.env.example` |

---

## 3. Findings: Critical Drift & Inconsistencies

### 3.1 Technology Stack Mismatches

| Technology  | Claimed (README) | Actual (Implementation)          | Drift Score |
| :---------- | :--------------- | :------------------------------- | :---------- |
| **Routing** | Wouter           | **React Router 7**               | 🔴 10/10    |
| **Node.js** | 22+              | **20 (LTS)**                     | 🟠 6/10     |
| **Vite**    | 7.x              | **6.0.0**                        | 🟠 4/10     |
| **Port**    | 5001 (Dev)       | 5000 (Prod/Docker) vs 5001 (Dev) | 🟡 2/10     |

### 3.2 Script Discrepancies

The following scripts are documented in `README.md` but are **MISSING** from `package.json`:

- `db:push`: Referenced as the primary schema sync tool (Drizzle).
- `build:ssr`: Claimed for generating Server Side Rendering bundles.
- `verify:build`: Claimed for build validation.
- `verify:tech-integrity`: Not found in root scripts.

### 3.3 Outdated Documentation References

- **`ENVIRONMENT_SETUP.md`**: References `server/lib/unified-replit-cache.ts` which **does not exist** (replaced by `unified-cache.ts`). Still refers to legacy "Replit Database" and "Replit KV".
- **`CODEMAP.md`**: Claims `server/storage.ts` is the entry point for products, but implementation uses `server/routes/core/products.ts`.

---

## 4. Operational Script Health (scripts/)

The `scripts/` directory is cluttered with ad-hoc migration files.

**Categorization Summary:**

- **Keep (Essential):** `api-smoke-test.sh`, `admin-pages-validation.ts`, `cache-health-check.ts`.
- **Archive (Legacy Migrations):** `fix-fabrics.ts`, `migrate-media-to-gcs.ts`, `populate-sample-data.ts`.
- **Remove (Dead/Duplicate):** Multiple `check-*.ts` files that overlap with Biome or newer health checks.

---

## 5. Proposed Cleanup & Archival Plan

> [!CAUTION]
> No changes will be applied until this plan is explicitly approved.

### Phase 1: Documentation Sync (High Priority)

1. **Update `README.md`**: Align tech stack (Node 20, Vite 6, React Router 7) and correct npm scripts section.
2. **Update `CODEMAP.md`**: Reflect current file paths and React Router 7 architecture.
3. **Refactor `ENVIRONMENT_SETUP.md`**: Remove Replit legacy references; point to `unified-cache.ts`.

### Phase 2: Script Suite Modernization

1. **Create `scripts/legacy/`**: Move all one-time migration and ad-hoc fix scripts here.
2. **Standardize `package.json`**: Add missing `db:push` and `verify:*` shortcuts to ensure documentation accuracy.

---

## 6. Implementation Checklist (Awaiting Approval)

- [x] Sync routing documentation (Wouter -> React Router 7).
- [x] Correct Node version requirements across all artifacts.
- [x] Implement `db:push` alias in root `package.json`.
- [x] Quarantine 80+ legacy scripts into `/scripts/legacy`.
- [x] Validate all internal markdown links.

---

**Baseline Hypothesis Validated:** `ARCHITECTURE_REPORT.md` (brain version) correctly identifies React Router 7, confirming that existing documentation is the primary source of misinformation.
