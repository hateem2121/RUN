# Task Plan

## Active Tasks

### [AUDIT] Full System Architecture & Organisation Review — April 2026

- **Status:** ✅ COMPLETE
- **Date Started:** 2026-04-04
- **Date Completed:** 2026-04-04
- **Branch:** main (RUN-PROD branch does not exist — logged as finding C3)
- **Scope:** All 23 domains — full re-audit post remediation sessions 1–3
- **Agent:** Claude Code (Sonnet 4.6) via gstack skill suite
- **Output:** `findings.md` § Architecture Audit — April 2026 (Third Pass)
- **Overall Score:** 7.5/10 (up from 6.7 in second pass)
- **Critical:** 3 | High: 6 | Medium: 10 | Low: 3 | Strengths: 24

### Verification Script Pre-Check Results

| Script | Result | Notes |
|--------|--------|-------|
| `npm run verify-port` | ✅ PASS | Zero warnings — perfect compliance |
| `npm run verify:tech-integrity` | ❌ FAIL | Security audit: lodash (high) + request (critical); Biome 1 error |
| `npm audit` | ❌ 7 vulns | 2 critical, 1 high, 2 moderate, 2 low |
| `npm run build` | ✅ PASS | Turborepo cache — all 3 workspaces built |
| `npm run lint` | ❌ FAIL | 1 error: server/test-cache.ts unused variable |
| `npm run typecheck` | ✅ PASS | 0 errors — significant improvement from 35 errors |
| `npm run test` | ❌ FAIL | 53/95 files failing — zopfli.createGzip TypeError |

---

## Immediate Remediation Backlog (Post Third-Pass Audit)

### Priority 1 — Critical (Block Next Deploy)

- [ ] **[C1-FOLLOW]** Replace `shrink-ray-current` with `compression` (Node 24-compatible). Remove `node-zopfli-es`. Restore 95/95 test file pass rate.
- [ ] **[C2-FOLLOW]** Remove 6 remaining `try/catch` in Express 5 routes: `sustainability.routes.ts`, `api-based-population.ts`, `metrics.ts`, `media/utils.ts`, `media/handlers.ts`, `media/services.ts`
- [ ] **[C3-FOLLOW]** Create `RUN-PROD` branch from `main`. Establish and document branching strategy.

### Priority 2 — High (This Sprint)

- [ ] **[H1-FOLLOW]** Remove `continue-on-error: true` from `.github/workflows/ci.yml` lines 72 (lint), 103 (typecheck), 118 (test)
- [ ] **[H2-FOLLOW]** Split K8s probes: `/healthz` (liveness, no deps) + `/readyz` (readiness, DB+Redis). Update `k8s/argocd/base/deployment.yaml`
- [ ] **[H3-FOLLOW]** Add `PodDisruptionBudget` (minAvailable: 1) to `k8s/argocd/base/pdb.yaml`
- [ ] **[H4-FOLLOW]** Remove `three: ^0.183.2` from `client/package.json` (confirmed unused)
- [ ] **[H5-FOLLOW]** Add `USER node` to `Dockerfile` — container runs as root currently
- [ ] **[H6-FOLLOW]** Fix logout route in `server/routes/auth.ts:65` — add `req.session.destroy()` + `res.clearCookie('connect.sid')`

### Priority 3 — Medium (Next Sprint)

- [ ] M1: Raise root vitest threshold from 70% → 80% (`vitest.config.ts`)
- [ ] M2: Rename `cache` → `_cache` in `server/test-cache.ts:4` (fixes lint error)
- [ ] M3: Replace `request` devDep with `axios` or remove entirely
- [ ] M5: Create `CHANGELOG.md` (constitutional requirement)
- [ ] M6: Update `SOP_DEPLOY.md` version reference from "v3+" to "v4.0.0"
- [ ] M7: Add `$.tsx` 404 catch-all route for React Router v7
- [ ] M8: Remove 3 `console.log/warn/error` from server production paths
- [ ] M9: Set `Sentry tracesSampleRate: 0.1` in production
- [ ] DOC-FOLLOW: Write `docs/adr/0011-gsap-over-framer-motion.md`

### Priority 4 — Deferred

- [ ] D4: Admin parity ADR — document module-driven admin pattern in gemini.md
- [x] M6 (prior): Client-side drizzle — CLOSED ✅ (db.server.ts removed)

---

## Completed (Prior Sessions)

| Session | Items Fixed |
|---------|------------|
| 2026-03-27 (Session 1) | C1 (npm install), C2 (e2e.yml port 5002), C3 (try/catch ~50→31), H1 (any types), OTel dedup, cache stampede |
| 2026-03-28 (Session 2) | H2 (noExplicitAny: error), Migration history, framer-motion → GSAP (73 files), Biome 0 errors |
| 2026-04-03 (Session 3) | TypeScript regression → 0 errors, db.server.ts removed, debug files removed, cloudbuild /api/health fixed, CORS restored |
| 2026-04-04 (Session 4 — Audit) | Third-pass architecture audit. Score 7.5/10 (up from 6.7). 3C/6H/10M/3L findings. All 23 domains covered. |
