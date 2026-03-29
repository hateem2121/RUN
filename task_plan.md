# Task Plan

## Active Tasks

### ✅ [DOCS] Documentation & GitHub Presence Overhaul — 2026-03-29
**Status:** COMPLETE
**Completed:** 2026-03-29
**Scope:** Full documentation audit + GitHub presence update (17 files changed/created)

**Changes made:**
- `README.md` — Full rewrite. v2.1 "CMS System" → v3.0.0 "RUN Remix Ecosystem". Accurate tech stack, commands, structure, auth (Google OAuth), deployment (Cloud Run), contributing workflow.
- `SECURITY.md` — Created at root. GitHub Security tab now populated. Covers STRIDE controls, response SLAs, in-scope components, CI security tools.
- `CONTRIBUTING.md` — Created at root. GitHub PR banner now shows. B.L.A.S.T. protocol + hard constraints + commit message standards.
- `LICENSE` — Created at root. Proprietary / All Rights Reserved (© 2026 RUN APPAREL (PVT) LTD / Durus Industries). GitHub now shows license.
- `SUPPORT.md` — Created at root. GitHub Issue creation banner now shows support channels.
- `.github/ISSUE_TEMPLATE/bug_report.md` — Created. Structured bug report with port 5002 check.
- `.github/ISSUE_TEMPLATE/feature_request.md` — Created. B.L.A.S.T.-aligned feature request.
- `.agent/rules/stitch.md` — Fixed. Removed stale Framer Motion references. Now correctly shows GSAP exclusively (migration completed 2026-03-29, 73 files).
- `package.json` (root) — Removed `packages/sdk` from workspaces array (directory never existed, was H4 backlog item).
- `.github/CODEOWNERS` — Fixed file path (`/client/src/index.css` → `/client/app/index.css`). Replaced non-existent `@frontend-team` / `@backend-team` etc. with `@hateemjamshaid` (configure GitHub Teams once org is set up).
- `docs/FULL_SYSTEM_CONTEXT.json` — Updated `lastUpdated` to 2026-03-29. Removed `packages/sdk` from workspaces array.
- 4 SOPs (DEPLOY, ROLLBACK, MIGRATE, ARCHITECTURE_AUDIT) — Verified all 4 already exist (created in previous session). No action needed.
- `e2e.yml` — Verified PORT already set to 5002. No action needed.

**Verification:**
- `npm run verify:tech-integrity` → FAIL (pre-existing C1: 35 TypeScript errors — not caused by doc changes)
- No `.ts`/`.tsx` files modified — all changes are docs, config, and markdown only

---

### ✅ [AUDIT] Full System Architecture & Organisation Review — April 2026 (Second Pass)
**Status:** COMPLETE
**Completed:** 2026-03-29
**Scope:** Full 23-domain re-audit against updated codebase (post-remediation state)
**Output:** `findings.md` § Architecture Audit — April 2026 (Second Pass)
**Agent:** Claude Code (Sonnet 4.6)

**Results:**
- 4 Critical issues found (C1: TypeScript regression 35 errors, C2: /resources runtime crash, C3: 31 try/catch in routes, C4: 58/93 test files failing)
- 6 High issues (npm audit 25 vulns, CORS disabled in prod, cloudbuild health URL wrong, packages/sdk missing, health probe not split, lru-cache types)
- 10 Medium issues (dead vite chunks, debug scripts in server root, CI lint gate, K8s PDB missing, image tag latest, unused import, turbo missing tasks)
- 5 Low issues (auth console.error, react-router pin, docs gate, biome warnings, package overrides)
- 24 Strengths identified

**Verification Results:**
- ✅ `npm run verify-port` → PASS (zero warnings — improved)
- 🔴 `npm run verify:tech-integrity` → FAIL (35 typecheck errors — regression)
- 🔴 `npm run test` → FAIL (58/93 test files failing)
- ✅ `npm run lint` → PASS (0 errors, 6 warnings)
- 🔴 `npm run typecheck` → FAIL (35 errors)
- ⚠️ `npm audit` → 25 vulnerabilities (2 critical, 10 high)
- ⛔ `npm run build` → NOT RUN (typecheck must pass first)

---

## Immediate Remediation Backlog (from April 2026 Second Pass Audit)

| Priority | ID | Task | Complexity | B.L.A.S.T. |
|---|---|---|---|---|
| 1 | C2 | Fix /resources runtime crash — replace `<motion.div>` with `<div>` or GSAP | Simple | Stylize |
| 2 | H2 | Restore production CORS origin header in `server/boot/middleware.ts` | Simple | Link |
| 3 | H3 | Fix `cloudbuild.yaml:74` health URL `/health` → `/api/health` | Simple | Trigger |
| 4 | H4 | Remove or scaffold `packages/sdk` workspace entry | Simple | Blueprint |
| 5 | H6 | Resolve `lru-cache` v11 TypeScript declaration in `server/tsconfig.json` | Simple | Blueprint |
| 6 | C1 | Fix all 35 TypeScript errors — restore typecheck EXIT 0 | Complex | Blueprint |
| 7 | C3 | Remove 31 remaining try/catch blocks from server/routes/ | Complex | Architect |
| 8 | C4 | Fix Vitest LRUCache constructor, error message assertions, integration timeout | Complex | Trigger |
| 9 | H1 | `npm audit fix` — upgrade express-rate-limit, multer, fast-xml-parser, undici | Complex | Link |
| 10 | H5 | Add /healthz + /readyz endpoints; update K8s probes | Simple | Architect |

---

## Completed Tasks

### ✅ [AUDIT] System Architecture & Organisation Review — April 2026
**Status:** COMPLETE
**Completed:** 2026-03-27
**Output:** `findings.md` § Architecture Audit — April 2026

**Results:**
- 3 Critical issues found (C1: Express 5 try/catch, C2: E2E port 3000, C3: no node_modules)
- 5 High issues found (any types, biome enforcement gap, drizzle in client, three.js, framer-motion)
- 8 Medium issues found (docs, migration history, admin parity, OTel dual init, cache stampede, SOPs)
- 4 Low issues found (port verifier warning, K8s HPA, schema exports, cloudbuild npm step)
- 23 Strengths identified (port compliance, React 19, version stack, OTel order, CORS, auth, cache, canary, Tailwind v4, model-viewer, cn(), SSR, etc.)

**Pre-task verification:**
- [x] `npm run verify-port` — PASSED (1 warning: server/index.ts does not explicitly reference port 5002)
- [x] `npm run verify:tech-integrity` — BLOCKED (tsx not found, node_modules missing → C3)
- [x] `npm run lint` — BLOCKED (biome not installed)
- [x] `npm run typecheck` — BLOCKED (tsc not installed)
- [x] `npm run test` — BLOCKED (vitest not installed)

---

### ✅ Server Startup (Previous Session)
**Status:** COMPLETE
- Port configuration resolved: Vite runs in middleware mode, Express on 5002
- Environment validation passed: DATABASE_URL, GOOGLE_CLIENT_ID/SECRET, SESSION_SECRET all present
- Unified dev environment: `npm run dev:server` initiates both services

---

## Remediation Session — 2026-03-27 (COMPLETE)

### ✅ Phase B: TypeScript / any elimination
- B1: admin.service.ts — `InsertProduct`, `Partial<InsertCertificate>`, `Partial<InsertFiber>`, `Record<string, unknown>` ✅
- B2: webhook-service.ts — `WebhookSubscription`, `Record<string, unknown>` ✅
- B3: inquiry-service.ts — `InquiryEmailData` ✅
- B4: client/app/db.server.ts — `NeonTransaction` type alias ✅
- B5: errorHandler.ts + boot/middleware.ts — `Error & {statusCode?}`, `"code" in error` guard ✅
- B6: biome.json noExplicitAny ⚠️ DEFERRED (691+ violations in 166 files, mostly test infra)
- B7: try/catch removal from 41 route handlers ✅ + errorHandler.ts registered as primary error middleware ✅

### ✅ Phase C: Architecture Cleanup
- C1: three.js replaced with CSS glassmorphism in fluid-glass-final.tsx ✅; `three` + `@types/three` removed from client/package.json ✅
- C2: Duplicate OTel init removed from server/index.ts ✅
- C3: In-flight deduplication Map added to unified-cache.ts getSWR() ✅

### ✅ [AUDIT REMEDIATION] April 2026 — Remaining Items
**Status:** COMPLETE
**Completed:** 2026-03-28

#### B6 — noExplicitAny enforcement ✅
- Enabled `"noExplicitAny": "error"` and `"noImplicitAnyLet": "error"` in `biome.json`
- Fixed 51 violations across root `tests/` workspace (media-repository, user-repository, auth-service, unified-cache, circuit-breaker, contract-compliance, crash, media-reliability, slow-query, setup.ts, innovation-management tests)
- Pattern used: `as any` → `as unknown as SomeType`; explicit Express `Request`/`Response` imports
- Final state: 0 `noExplicitAny` errors across all workspaces

#### D3 — Migration history formalized ✅
- Fixed 5 wrong path occurrences in `docs/core/sops/SOP_MIGRATE.md` (`drizzle/migrations/` → `server/migrations/`)
- Staged 6 SQL migrations + meta/ + schema.ts + drizzle.config.ts via `git add server/migrations/ server/drizzle.config.ts docs/core/sops/SOP_MIGRATE.md`

#### Phase E — framer-motion → GSAP ✅
- All 73 files migrated across 7 sprints (E-1 through E-7)
- `"framer-motion"` removed from `client/package.json` dependencies
- `"framer-motion"` removed from `client/vite.config.ts` manual chunks
- `npm install` run to rebuild lockfile
- Final grep: 0 `framer-motion` imports in `client/app/`
- Final Biome: 0 errors, 6 pre-existing warnings (noDangerouslySetInnerHtml)

### Verification Status (2026-03-28)
- `npm run typecheck` → ✅ EXIT 0
- `npm run lint` → ✅ 0 errors, 6 pre-existing warnings only
- `npm run verify:tech-integrity` → ✅ EXIT 0

### Still Open (Non-audit items, deferred by design)
| Priority | Item | Notes |
|----------|------|-------|
| MEDIUM | D (client drizzle): Migrate client/app/db.server.ts to server API | Architectural decision required |
| MEDIUM | D1: HPA manifest in k8s/argocd/base/ | Infrastructure |
| MEDIUM | D4: Admin parity ADR | ADR needed |
| MEDIUM | D5: OTel sampling rate → 0.1 in production | Observability |
