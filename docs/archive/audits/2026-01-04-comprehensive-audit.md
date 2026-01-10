# Repository Documentation & Script Audit Report

**Date:** 2026-01-04  
**Auditor:** Antigravity Agent

---

## 1. Repository Inventory

### Documentation (`*.md`)

| Path                                   | Type          | Purpose                                   | Status      | Rationale                                          |
| -------------------------------------- | ------------- | ----------------------------------------- | ----------- | -------------------------------------------------- |
| `README.md`                            | Root Doc      | Entry point, setup, stack overview.       | **Keep**    | Accurate high-level view (React 19, Express 5).    |
| `CODEMAP.md`                           | Arch Doc      | High-level system map & directory guide.  | **Keep**    | Valid references to current structure.             |
| `AGENTS.md`                            | Meta Doc      | Guide for AI agents & context loading.    | **Keep**    | Essential for maintaining context.                 |
| `docs/api/endpoints.md`                | API Doc       | Lists API endpoints.                      | **Update**  | Needs verification against actual `routes/` files. |
| `docs/runbooks/*.md`                   | Runbooks      | Operational guides (Incident, Debugging). | **Keep**    | Valuable for ops.                                  |
| `archive/docs-audit-report-dec2025.md` | Legacy Doc    | Previous audit report.                    | **Archive** | Already in archive, safe to ignore.                |
| `client/src/components/**/README.md`   | Component Doc | Local readme for components.              | **Keep**    | useful context.                                    |

### Operational Scripts

| Path                               | Type        | Purpose                              | Status      | Rationale                                         |
| ---------------------------------- | ----------- | ------------------------------------ | ----------- | ------------------------------------------------- |
| `package.json` (Root)              | Config      | Monorepo orchestrator.               | **Keep**    | **Source of Truth**.                              |
| `scripts/verify-ssr-template.ts`   | Validation  | Checks `index.html` for SSR markers. | **Keep**    | Used in `npm run verify:ssr`.                     |
| `scripts/check-ssr-invariants.js`  | Validation  | Scans code for SSR unsafe patterns.  | **Keep**    | Used in `npm run check:invariants`.               |
| `server/tests/simulate-traffic.sh` | Test Script | Traffic simulation for cache keys.   | **Update**  | Hardcoded port 5000 conflicts with Dev port 5001. |
| `scripts/legacy/*`                 | Legacy      | Old scripts moved here.              | **Archive** | Correctly placed.                                 |

### Configuration Sources of Truth

| File                       | Configures     | Notes                                                    |
| -------------------------- | -------------- | -------------------------------------------------------- |
| `package.json`             | Dependencies   | React 19.2.1, Vite 6.0.0, Tailwind 4.0.0, Express 5.1.0. |
| `Dockerfile`               | Deployment     | Node 20 Alpine. Exposes port 5000.                       |
| `client/vite.config.ts`    | Frontend Build | Configures build output & proxy.                         |
| `.github/workflows/ci.yml` | CI Pipeline    | Runs checks, tests.                                      |

---

## 2. Drift & Mismatch Findings

### 🔴 Critical Mismatches and Risks

#### 1. Port Confusion (5000 vs 5001)

- **Documentation (`README.md`)**: Claims app runs at `http://localhost:5001`.
- **Dev Config (`server/.env` implied)**: `PORT=5001`.
- **Docker (`Dockerfile`)**: `EXPOSE 5000` and `ENV PORT=5000`.
- **Script (`simulate-traffic.sh`)**: Hardcoded to `BASE_URL="http://localhost:5000"`.
- **Risk**: Developers running the simulation script against a local dev server (5001) will see connection refused errors. Docker container runs on 5000, creating environment parity issues.

#### 2. Legacy/Unreferenced Scripts

- `server/tests/simulate-traffic.sh`: Refers to "PHASE 2C", suggesting it was for a specific migration phase. It is not referenced in `package.json`.
- `scripts/legacy/fix_build.sh`: A deprecated script correctly moved to legacy, but still present in the repo tree.

#### 3. Documentation "As-Of" Staleness

- `architecture_report.md` is generally accurate but claims "Generated: 2026-01-04". This should be kept updated or versioned.
- `docs/api/endpoints.md` needs to be checked to ensure it reflects the latest `routes/` implementation.

### 🟢 Verified Accurate

- **Tech Stack**: `package.json` versions match `README.md` claims (React 19, Vite 6, Tailwind 4).
- **SSR Architecture**: `scripts/verify-ssr-template.ts` enforces the structure described in `architecture_report.md`.
- **Linting**: `biome.json` (implied by scripts) and `npm run check` commands align with docs.

---

## 3. Legacy Cleanup Plan

### Strategy: "Move to Archive" > "Delete"

To preserve context while cleaning up the active workspace, we will move obsolete files to `archive/` or `scripts/legacy/`.

### Action Items (Pending Approval)

1.  **Standardize Ports**:
    - Decide on **5001** as the standard application port for consistency, OR update `README.md` to reflect 5000 if that is the intended production port.
    - Update `simulate-traffic.sh` to accept a `PORT` env var or default to the standard port.
2.  **Archive Scripts**:
    - Move `server/tests/simulate-traffic.sh` to `scripts/legacy/` IF it is not intended for active use in CI. Since it's not in `package.json`, it is a candidate for archiving.
3.  **Delete Legacy**:
    - `scripts/legacy/` can be periodically purged.

---

## 4. Documentation Structure & Guardrails

### Proposed Information Architecture

- `/README.md`: High-level entry point. Linking to:
  - `/CODEMAP.md`: For architecture & navigation.
  - `/docs/runbooks/`: For operations.
  - `/docs/api/`: For API consumers.

### Guardrails

1.  **CI Link Checker**: `npm run check:links` is already configured. **Pass**.
2.  **SSR Invariants**: `npm run check:invariants` safeguards SSR patterns. **Pass**.
3.  **Single Source of Truth**: `package.json` scripts should stay the reference for how to run things. Docs should refer to `npm run <script>` rather than raw commands.

---

## 5. Implementation-Ready Checklist

These actions will be taken upon approval of this report.

- [ ] **Fix Port Inconsistency**: Update `server/tests/simulate-traffic.sh` to read `PORT` env var, default to 5001 (Dev) or 5000 (Docker match).
- [ ] **Docs Polish**: Add a note in `README.md` clarifying Port 5001 (Dev) vs 5000 (Container).
- [ ] **Archive**: Move `simulate-traffic.sh` to `scripts/legacy/` if confirmed unused, OR add a `npm run test:load` script to `package.json` to make it a first-class citizen. _(Recommendation: Add script)_.

**Validation Command**:

```bash
npm run check:links
grep -r "5000" .
grep -r "5001" .
```
