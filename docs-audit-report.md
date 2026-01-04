# Docs Audit Report

**Date:** 2026-01-05
**Auditor:** Antigravity Agent
**Status:** DRAFT (Pending Approval)

---

## 1. Repository Inventory

| Path                                 | Type   | Purpose                     | Usage Evidence             | Status          | Verification Notes                                                       |
| :----------------------------------- | :----- | :-------------------------- | :------------------------- | :-------------- | :----------------------------------------------------------------------- |
| `README.md`                          | Doc    | Main entry point            | Git root                   | **Update**      | References missing `start` script; `build:express` command incorrect.    |
| `AGENTS.md`                          | Doc    | Agent/AI operational truth  | Root                       | **Keep/Expand** | Accurate but minimal. Good candidate for "Operational Truth".            |
| `CODEMAP.md`                         | Doc    | System architecture map     | README link                | **Keep**        | High quality, matches `server/index.ts` structure.                       |
| `package.json`                       | Config | Root dependencies & scripts | npm                        | **Keep**        | Defines workspace. Missing `start` script.                               |
| `client/vite.config.ts`              | Config | Frontend build config       | `client/package.json`      | **Keep**        | Correctly configured for React 19/Vite 6/Tailwind 4.                     |
| `server/index.ts`                    | Code   | Server entry point          | `npm run dev:server`       | **Keep**        | Bootstraps secrets & services.                                           |
| `server/server.ts`                   | Code   | Express app setup           | `server/index.ts`          | **Keep**        | Sets up middleware, routes, listen.                                      |
| `scripts/verify-build.cjs`           | Script | Build verification          | README (orphan?)           | **Remove**      | Not in `package.json` scripts. Only found in README text. Likely legacy. |
| `scripts/check-ssr-invariants.js`    | Script | SSR Safety Checks           | `npm run check:invariants` | **Keep**        | Actively used in package.json.                                           |
| `docs/api/endpoints.md`              | Doc    | API Reference               | README                     | **Update**      | Needs check against OpenApi spec.                                        |
| `docs/CSS_ARCHITECTURE.md`           | Doc    | Styling guide               | README                     | **Keep**        | Matches Tailwind usage.                                                  |
| `antigravity_architecture_report.md` | Doc    | Baseline Report             | Prompt                     | **Missing**     | File described in prompt does not exist in repo.                         |

---

## 2. Drift & Mismatch Findings

### 2.1. Local Dev Setup

- **Finding:** `README.md` claims `npm run start` starts the production server.
- **Reality:** Root `package.json` has NO `start` script. User must `cd server && npm start` or run `node dist/index.js`.
- **Recommendation:** Add `"start": "npm run --workspace=@run-remix/server start"` to root `package.json`.

### 2.2. Build Scripts

- **Finding:** `README.md` lists `npm run build:express` as a command.
- **Reality:** Root `package.json` has `build:server` but no `build:express`. `npm run build:server` calls `npm run build` in server workspace, which does the esbuild step.
- **Recommendation:** Update README to use `npm run build:server` or alias `build:express` in package.json.

### 2.3. Frontend Development

- **Finding:** `client/package.json` has no `dev` script.
- **Reality:** Feature, not bug. The `server` (`@run-remix/server`) acts as the dev server, likely handling Vite middleware (though explicit `vite-express` import wasn't seen in `server.ts`, the `dev` script `tsx watch` implies server-side orchestration). `client/vite.config.ts` confirms it expects a server on port 5001.
- **Recommendation:** Document this architecture clearly in `CONTRIBUTING.md` or `AGENTS.md` (e.g., "Frontend is served by the Express backend in dev").

### 2.4. Missing Baseline

- **Finding:** `antigravity_architecture_report.md` (Version 1.2.0) was not found.
- **Reality:** Prompt implies it exists.
- **Recommendation:** Create `docs/architecture/antigravity_report.md` if this baseline is intended to be preserved.

### 2.5. Legacy Scripts

- **Finding:** `scripts/verify-build.cjs` exists but is not invoked by any `package.json` script. The README references it as a manual step or legacy command.
- **Reality:** `npm run verify:build` uses `npm run build && npm run typecheck`.
- **Recommendation:** Delete `scripts/verify-build.cjs` if `npm run verify:build` suffices.

---

## 3. Legacy Cleanup Plan

1.  **Remove `scripts/verify-build.cjs`**: It appears superseded by `npm run verify:build` (which runs `tsc` and `vite build`).
2.  **Update `README.md`**:
    - Remove references to `verify-build.cjs`.
    - Correct `npm run start` instruction (or add script).
    - Correct `npm run build:express` to `npm run build:server`.
3.  **Archive**: Check `scripts/legacy/` content and confirming if it can be deleted. (Currently keeping as is, but marking for review).

---

## 4. Proposed Doc Structure & Guardrails

### 4.1. Operational Truth: `AGENTS.md`

- **Proposal:** Use `AGENTS.md` as the machine-readable (and human-readable) source of truth for:
  - **Commands**: Accurate `npm run` commands.
  - **Architecture**: Links to `CODEMAP.md`.
  - **Conventions**: Brief points on React 19 / Tailwind 4 usage.
- **Action:** Expand current `AGENTS.md` to include the specific `dev` flow (Server-driven) and correct build commands.

### 4.2. Documentation Architecture

- **Root**:
  - `README.md`: High-level overview, Quick Start.
  - `AGENTS.md`: For AI/Dev tools.
  - `CODEMAP.md`: Visual architecture.
- **`docs/`**:
  - `api/`: OpenAPI and endpoint docs.
  - `architecture/`: Deep dives (SSR, Database).
  - `runbooks/`: Operational guides.

### 4.3. Guardrails

- **CI Link Checker**: `npm run check:links` exists! Ensure it runs in CI.
- **Stale Docs**: Add a "Last Updated" check in `AGENTS.md` or a GitHub Action to flag docs untouched for >6 months.

---

## 5. Implementation-Ready Checklist

- [ ] **Delete**: `scripts/verify-build.cjs`
- [ ] **Edit**: `README.md`
  - [ ] Change `npm run start` -> `npm run dev` (or explain prod start correctly).
  - [ ] Change `npm run build:express` -> `npm run build:server`.
  - [ ] Remove `verify-build.cjs` reference.
- [ ] **Edit**: `package.json` (Root)
  - [ ] Add `"start": "npm run --workspace=@run-remix/server start"` (Verified `server` has `start`).
- [ ] **Edit**: `AGENTS.md`
  - [ ] Add explicit note about `client` lacking `dev` script (Server-driven).
  - [ ] Confirm "React 19" and "Tailwind 4" badges.

---

**Approval Required:**
Please approve this report to proceed with the changes in Section 5.
