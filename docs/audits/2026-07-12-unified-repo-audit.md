# Unified Repository Health Audit
**Date:** 2026-07-12
**Mode:** Multi-agent fan-out/fan-in (1 Orchestrator + 5 Sub-Agents)
**Status:** Complete

## 1. Executive Summary & Composite Health Score
This audit was performed strictly against the live repo state as of July 2026. Prior audit conclusions were re-verified. 

| Dimension | Weight | Score | Notes |
| :--- | :--- | :--- | :--- |
| **Organization & Structure** | 15% | 12/15 | Solid structure, but multiple duplicated docs and a stale k8s directory. |
| **Dead Code & Unused Files** | 15% | 10/15 | 40 absolute path symlinks for `.claude/skills` that will break across environments; incorrect `.gitignore` pattern. |
| **Future-Proofing** | 15% | 13/15 | Node 24 is correct LTS. Vite config has legacy Rollup chunks. Biome version drift. |
| **Correctness Gate** | 15% | 15/15 | `npm run verify:tech-integrity` passed completely. |
| **Test Health** | 15% | 0/15 | **FAIL**: Test suite crashes due to import resolution errors (e.g., `supertest`). |
| **Security & Dependencies** | 15% | 12/15 | `sameSite` session cookie is `lax` instead of `strict`. File uploads allow up to 500MB (intentionally disabled). |
| **Claims & Documentation** | 10% | 5/10 | README versions are stale (React 19.2.7 vs 19.2.4; Drizzle 0.45.2 vs 0.45.1). |
| **TOTAL SCORE** | **100%** | **67 / 100** | |

### Delta vs. 2026-07-11 Audit
- **Corrected**: Yesterday's audit falsely claimed ADR 0017 was duplicated. It is not (`docs/adr/` has exactly 1 file).
- **Corrected**: Yesterday's audit falsely claimed Biome was at 2.3.10 and needed 2.5.3. The live pin is exactly 2.5.2.
- **Corrected**: Yesterday's audit claimed 0 Critical/High, 6 Moderate vulnerabilities. A fresh audit found the same 6 Moderate.
- **Confirmed**: The `react-leaflet` dependency and Knip suppressions are genuinely stale.
- **Confirmed**: Node 24 LTS is the strictly correct target for July 2026. Any recommendation to jump to 26 "early" is a mistake.
- **Confirmed**: The test suite is genuinely failing due to module resolution, not just low coverage.

---

## 2. Organization & Structure (Sub-Agent A)

### Findings
- **A1**: `CHANGELOG.md` (root, 159 lines) is canonical and up-to-date. `docs/core/CHANGELOG.md` (90 lines) is stale.
- **A2**: `docs/core/CONTRIBUTING.md` (93 lines) is canonical for deep guidance. Root `CONTRIBUTING.md` (83 lines) is a quick-start stub.
- **A3**: `docs/development/dependency-graph.md` (542 lines) is canonical. `docs/core/dependency-graph.md` (61 lines) is a stub.
- **A4**: Root `AGENTS.md` and `docs/core/AGENTS.md` are completely distinct. They lack cross-references.
- **A5**: `ops/k8s/` is the canonical Kubernetes reference per recent v4.0.0 changelogs. `k8s/argocd/` is stale. Neither is currently used by `cloudbuild.yaml` which deploys to Cloud Run natively.
- **A8**: `docs/structure.json` is missing the `"scripts"` workspace (present in `package.json`) and output directories like `artifacts/` and `dist/`.
- **A9, A10, A11**: Confirmed clean. No duplicate ADR 0017, no `docs/infra` collision, and unique `gemini.md` headings. `server/migrations/` remains the sole migration directory.

### Recommendations
- [ ] **P2**: Delete `docs/core/CHANGELOG.md` and `k8s/argocd/`.
- [ ] **P3**: Add cross-references to the tops of both `AGENTS.md` files. Merge or redirect `docs/core/dependency-graph.md`.
- [ ] **P3**: Update `docs/structure.json` to include the `scripts` workspace.

---

## 3. Dead Code, Unused Files & Broken References (Sub-Agent B)

### Findings
- **B1**: There are 40 absolute path symlinks in `.claude/skills/*/SKILL.md` pointing to a local machine's `gstack` path. 1 symlink (`checkpoint`) is completely broken. **[Citation: `ls -la .claude/skills/`]**.
- **B2**: `.gitignore` line 96 explicitly ignores `.gstack/`, but the actual directory being tracked is `.claude/skills/gstack/`. **[Citation: `.gitignore` line 96]**.
- **B3**: The 7 ignored files in `knip.config.ts` (`Preloader.tsx`, etc.) no longer exist.
- **B4**: `react-leaflet` is in `knip.config.ts` `ignoreDependencies` and `client/package.json` but is unused. **[Citation: grep in `ClientOnlyMap.tsx`]**.
- **B5 & B6**: `turbo.json` outputs include `.next/**` and Sentry environment variables, both of which are dead features.

### Recommendations
- [ ] **P0**: Convert all 40 `.claude/skills` symlinks to relative paths (e.g., `../gstack/<skill>/SKILL.md`).
- [ ] **P1**: Fix `.gitignore` line 96 to `.claude/skills/gstack/` so git tracking aligns with intent.
- [ ] **P2**: Remove `react-leaflet` from `client/package.json` and its Knip ignore entry. Remove `.next/**` and Sentry vars from `turbo.json`.

---

## 4. Future-Proofing & Best Practices (Sub-Agent C)

### Findings
- **Node.js**: Verified at `v24.15.0`. **Staying on 24 is the correct production choice right now.** Node 26 does not reach LTS until October 2026. Recommending a jump to 26 now is an error.
- **TypeScript**: Pinned at `^6.0.3`. Waiting for TS 7.1 is recommended due to `ts-morph` dependency limitations with the v7.0 Go rewrite.
- **Vite/Rolldown**: Verified at Vite `^8.1.3`. However, `client/vite.config.ts` still explicitly relies on legacy Rollup configurations.
- **React Router**: Installed at `^8.0.0`, but ADR is still named `docs/adr/0015-react-router-7.md`.
- **Accessibility**: A11y rules (§13) verified active using `a11y-debugging` methodology (e.g., `dialog.tsx` strictly implements `aria-labelledby`).
- **VoidZero Supply Chain Risk**: Vite, Rolldown, and Biome are now all part of the VoidZero ecosystem, constituting a vendor lock-in risk for frontend infrastructure.

### Recommendations
- [ ] **P3**: Rename `docs/adr/0015-react-router-7.md` to reflect v8. 
- [ ] **P3**: Clean up legacy Rollup configurations in `client/vite.config.ts` to fully embrace native Rolldown.

---

## 5. Correctness Gate & Test Health (Sub-Agent D)

### Findings
- **Tech Integrity**: `npm run verify:tech-integrity` passed.
  - TypeScript: 0 errors.
  - Biome: Checked 883 files in 211ms. 0 violations, 8 non-critical warnings.
  - Bundle Size: Passed (e.g. `root-DKh4EA8k.css: 38.4 kB`).
- **Test Health**: `npm run test:coverage` **FAILED** (Exit code 1).
  - 35 failed out of 79 test files due to import resolution errors (`Failed to resolve import "supertest"` and `Failed to resolve import "../../../../server/lib/db/repositories/index.js"`). No coverage report was emitted.
- **Dependency Audit**: 6 Moderate vulnerabilities. 0 High, 0 Critical.

### Recommendations
- [ ] **P0**: Fix test suite resolution paths for `supertest` and `repositories/index.js` to restore coverage reporting.

---

## 6. Security & Dependencies (Sub-Agent E)

### Findings
- **SEC-01 (CSRF)**: Satisfied (`server/middleware/csrf.ts` Lines 171-179).
- **SEC-02 (Admin Auth)**: Satisfied (`server/services/auth-service.ts` Lines 359-388).
- **SEC-03 (Session Cookie)**: **Failed/Partial** (`server/services/auth-service.ts` Lines 96-100). `sameSite` is `"lax"`, violating `gemini.md` §6.10 which dictates `"strict"`.
- **SEC-05 (TipTap)**: Satisfied (`server/lib/sanitize-html.ts` Lines 16-51 uses isomorphic-dompurify).
- **SEC-07 (File Limits)**: **Failed** (`server/lib/multer-optimized.ts` Lines 163-169). Hardcoded to 500MB with comment: `REMOVED file size limits per user request`.
- **SEC-10 (No `.unwrap()`)**: Satisfied. Zero hits in `server/`.
- **Exclusions**: `.gitleaks.toml` exceptions and `.zap/rules.tsv` comments are genuinely secure and justified.

### Recommendations
- [ ] **P1**: Enforce `sameSite: 'strict'` for session cookies in `auth-service.ts` to comply with the constitution.
- [ ] **P2**: Review the 500MB multer upload limit to ensure it doesn't present an intentional DoS vector.

---

## 7. Claims & Documentation (Sub-Agent E)

### Findings
- **E1**: `CHANGELOG.md` (Line 46) claims `Architecture Health Score: Achieved verified 100/100 score`.
- **Spot-Checks**: `README.md` versions are stale relative to `package.json`:
  - Claims React 19.2.4 (Actually 19.2.7)
  - Claims Express 5.1.0 (Actually 5.2.1)
  - Claims Drizzle 0.45.1 (Actually 0.45.2)

### Recommendations
- [ ] **P3**: Add a timestamp caveat to the score claim in `CHANGELOG.md`.
- [ ] **P3**: Synchronize `README.md` versions with current `package.json` installs.
