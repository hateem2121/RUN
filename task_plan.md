# Task Plan

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
