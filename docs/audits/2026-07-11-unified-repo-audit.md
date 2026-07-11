# RUN Remix — Independent Unified Repository Audit (July 2026)

**Date**: 2026-07-11
**Auditors**: Antigravity — Multi-Agent Team (Orchestrator + 4 Specialized Sub-Agents)
**Status**: Read-only Discovery Complete

## 1. Executive Summary & Overall Health Score
Based on the extensive multi-agent fan-out investigation, the RUN Remix monorepo maintains a strong baseline of security, tech stack currency, and operational integrity, but suffers from documentation drift, test fragmentation, and residual cleanup debt.

### Composite Health Score: 78 / 100 (Grade B)

| Dimension | Score | Weight | Assessment Summary |
|-----------|-------|--------|--------------------|
| **Organization & Structure** | **10/15** | 15% | ADR 0010 incomplete; test locations fragmented; directory name collisions. |
| **Dead Code & Unused Files** | **11/15** | 15% | Knip config hides genuinely dead client files; `findings/` directory debt persists. |
| **Best Practices & Future-Proofing**| **13/15** | 15% | High stack currency (React 19, Vite 8, Router v8); TS/Node slightly outdated. |
| **Correctness Gate** | **12/15** | 15% | Build/TSC pass, but Biome lint throws 1167 errors. `verify:tech-integrity` lacks strictness. |
| **Test Health** | **10/15** | 15% | 94.8% pass rate (591/623); 21 test files failing. Coverage unavailable due to fails. |
| **Security & Dependencies** | **15/15** | 15% | 0 Critical/High vulnerabilities. All 10 security invariants pass natively. |
| **Claims & Documentation** | **7/10** | 10% | 70% claims accuracy. Minor documentation drift and unverified claims detected. |

---

## 2. Organization & Structure (Sub-Agent 1)
- **ADR 0010 (Monorepo Structure):** Massively incomplete. It documents `client/`, `server/`, and `shared/`, but totally ignores `tests/`, `e2e/`, `docs/`, `ops/`, `scripts/`, `k8s/`, `.github/`, and `.claude/`.
- **Test-Location Fragmentation:** Multiple conventions are active (`tests/`, `client/tests/`, `server/services/__tests__/`, `e2e/`). Duplicate files exist:
  - `auth-service.test.ts`: Canonical is `server/services/__tests__/`, orphaned duplicate in `tests/unit/services/`.
  - `media-repository.test.ts`: Canonical is `media-repository.test.ts`, orphaned duplicate is `media.repository.test.ts`.
- **Naming Collisions Resolved:**
  - `AUDIT_REPORT.md`: `docs/audits/AUDIT_REPORT.md` is canonical; `docs/AUDIT_REPORT.md` is a legacy overview.
  - `ADR 0017`: Duplicate GSAP ADRs (`0017-gsap-animation.md` and `0017-gsap-over-framer-motion.md`).
  - `docs/infra/` vs `docs/infrastructure/`: Should be merged under `docs/infrastructure/`.
  - `gemini.md`: Sections 10–13 are duplicated at the end of the document. The second set (added 2026-07-08) must be renumbered to §22–§25.
- **`.claude/skills/` Stubs:** Zero empty stubs exist. The 48 subdirectories are valid structural symlinks to `.claude/skills/gstack/`.
- **`docs/structure.json`:** Severely outdated. Expects 10 files, whereas the tree has 20 subdirectories and many undocumented root files.
- **`CLAUDE.md`:** SSOT deferral to `gemini.md` is fully intact. However, its metadata title is outdated (`v4.0.3` instead of `v4.1.2`).

---

## 3. Dead Code & Unused Files (Sub-Agent 2)
- **Knip Suppressions Verification:**
  - `patch.js` & `test-globals.js`: Genuinely dead (deleted).
  - `server/worker.ts`: Genuinely dead entry (actual path is `server/routes/worker.ts`).
  - False positives handled by Vite/Router: `app/routes.ts`, `app/root.tsx`, `app/entry.client.tsx`, `app/entry.server.tsx`, `server/index.ts`, `shared/index.ts`.
  - Hidden dead files found: `Preloader.tsx`, `ClientOnly.tsx`, `loading-state.tsx`, `GsapWrappers.tsx`, `SectionHeader.tsx`, `OptimizedMapContainer.tsx`, `MapMarkers.tsx`.
- **Historical Report Debt:**
  - `findings/` directory is deprecated and must be fully deleted.
  - Old reports in `docs/audits/` (e.g., `performance_audit_may_2026.md`) should be archived to `docs/audits/historical/`.

---

## 4. Best Practices & Future-Proofing (Sub-Agent 3)
- **Tech Stack Currency:**
  - **Current:** React (19.2.x), React Router (v8), Vite (v8.1.x), Express (5.2.1), Zod (4.2.1), Tailwind CSS (4.2.4).
  - **Outdated:** Node.js (v24.15 vs v26.5), TypeScript (v6.0.3 vs v7.0 GA), Drizzle ORM (0.45.2 vs v1.0), Biome (2.3.10 vs 2.5.3).
- **Vite 8 & Rolldown:** Confirmed natively shipping; no migration needed.
- **React Compiler:** Stable but not adopted. Vite requires an explicit Babel plugin for implementation (forward opportunity).
- **React Router v8:** Confirmed installed. No leftover "v7" language remains in `gemini.md`.
- **TypeScript 7:** GA released 2026-07-08, but waiting for `ts-morph` stability in TS 7.1 (October 2026) is recommended.
- **CI Workflows:** Flagged an open question regarding the proportionality of 15 CI workflows (including chaos-testing) for a B2B CMS site.

---

## 5. Security & Dependencies (Sub-Agent 4)
- **Vulnerabilities:** 0 Critical, 0 High, 6 Moderate. Allowlisted advisories (GHSA-q8mj-m7cp-5q26, GHSA-w5hq-g745-h8pq) are documented.
- **Security Invariants (SEC-01 to SEC-10):** All 10 invariants passed verification from scratch.
  - `isomorphic-dompurify` handles server-side XSS.
  - `csrfProtection` covers double-submit cookies.
  - `DrizzleSessionStore` successfully replaced legacy memory/redis stores.
- **Gitleaks Allowlist:** The `.github/workflows/` exclusions are warranted as they contain placeholder dummy values.

---

## 6. Claims & Documentation Accuracy (Sub-Agent 4)
- **Spot-Check Accuracy Rate:** 70% (7 True, 3 False).
- **Verified False (Failing Claims):**
  1. `docs/core/sdk-workspace.md` does not exist (claimed to have a deprecation notice).
  2. The "100/100" `noExplicitAny` resolution claim in `CHANGELOG.md` is false; strict bypasses still exist in `server/services/technology.service.ts` outside of React Hook Form boundaries.
  3. `shared/tests/` and `shared/__tests__/` directories do not exist (flagged in yesterday's audit).

---

## 7. Recommended Action Plan
1. **Directory & File Cleanup:** Delete the `findings/` directory and orphaned files identified by Knip (e.g., `Preloader.tsx`). Merge duplicate ADRs and `docs/infra/` folders.
2. **Test Consolidation:** Pick one canonical test directory pattern (`server/services/__tests__/` and `tests/unit/`) and delete duplicate historical snapshot files.
3. **Documentation Sync:** Renumber `gemini.md` §10-§13 appended sections to §22-§25. Fix `CLAUDE.md` version title to v4.1.2. Update `docs/structure.json` and `docs/adr/0010-monorepo-structure.md`.
4. **Test Suite Fixes:** Resolve the 21 failing test files to enable successful coverage generation and enforce the >80% coverage mandate.
5. **Strict Typing:** Remove illegal `// biome-ignore lint/suspicious/noExplicitAny` comments outside of RHF scopes.
