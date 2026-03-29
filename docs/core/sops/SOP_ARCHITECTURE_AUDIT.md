# SOP: Architecture Audit

**Version:** 1.0.0
**Created:** 2026-03-27
**Owner:** M. Hateem Jamshaid — RUN APPAREL (PVT) LTD
**Trigger:** Quarterly, before major releases, or after significant architectural changes

---

## Purpose

Establish a repeatable, comprehensive process for auditing the RUN Remix codebase against its constitutional rules (`gemini.md` + `CLAUDE.md`). Ensures no architectural drift, dependency violations, or constitutional breaches accumulate over time.

---

## Prerequisites

- `node_modules` installed at monorepo root (`npm install`)
- Access to Neon MCP server for DB schema comparison
- Read-only mode — no code changes during audit unless Critical hotfix is required and explicitly declared

---

## Audit Checklist (14 Domains)

### Pre-Task Protocol (Run First)
- [ ] Read `gemini.md` and `CLAUDE.md` — re-internalize all constitutional rules
- [ ] Update `task_plan.md` — log audit as active task with date
- [ ] Update `findings.md` — create new section `## Architecture Audit — [Month Year]`
- [ ] `npm run verify-port` — PASS required. If FAIL: STOP, log as Critical, surface immediately
- [ ] `npm run verify:tech-integrity` — PASS required. If FAIL: STOP, log as Critical
- [ ] `npm run lint` — capture full Biome output
- [ ] `npm run typecheck` — capture TypeScript strict errors
- [ ] `npm run test:coverage` — capture coverage summary (target: 80%+ on services)

### Domain Checklist

| # | Domain | Key Checks |
|---|---|---|
| 1 | Monorepo Structure | Workspace boundaries, `shared/` has no runtime deps except Zod+Drizzle types, `turbo.json` pipeline |
| 2 | Dependency Health | Versions vs baseline table, no ESLint/Prettier, no `drizzle-orm` in client, Zod v4 API patterns |
| 3 | Service Layering | Routes thin (no business logic, no direct DB), services thick, `shared/schemas/` as SSOT |
| 4 | Admin Parity | Every public route `/x` has `/admin/x` counterpart |
| 5 | Port 5002 Law | No port other than 5002 anywhere in codebase, CI/CD, k8s, Docker |
| 6 | DB Schema Integrity | Migration history in git, no schema drift (run `drizzle-kit generate --dry-run`), no client DB imports |
| 7 | Auth/Session Security | Passport + Google OAuth2 only, connect-redis sessions, SESSION_SECRET from env, helmet headers, CORS not wildcard |
| 8 | Caching | L1 lru-cache + L2 Upstash, stampede protection, connect-redis for sessions |
| 9 | Observability | OTel first import in server.ts, Sentry DSN from env, Pino levels env-appropriate, no console.log in routes |
| 10 | CI/CD | Build step order (test→build→push→deploy), Node 24 Dockerfile, k8s resource limits + probes, .dockerignore whitelist |
| 11 | Test Coverage | 80%+ on services, integration tests present, Playwright E2E, @axe-core/playwright |
| 12 | Code Quality | Biome exits 0, `noExplicitAny: error`, husky hooks active, lint-staged correct |
| 13 | Frontend Architecture | No `forwardRef`, Tailwind v4 `@utility`, `cn()` correct, `LazyUnifiedModelViewer` for all 3D, SSR entry present |
| 14 | Memory/Docs | `gemini.md` current, `task_plan.md` current, `findings.md` complete, SOPs present for deploy/migrate/rollback/audit |

---

## Report Format

Findings are written to `findings.md` under `## Architecture Audit — [Month Year]` with:

1. **Executive Summary** — 3–5 sentences on overall health
2. **Findings Tables** — 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low / ✅ Strengths
3. **Verification Script Outputs** — verbatim output from all 5 scripts
4. **Risk Heatmap** — domain-level risk summary
5. **Remediation Priority** — ordered action list
6. **Deep Investigation Self-Assessment** — 10-area YES/NO analysis + follow-up tasks

---

## Severity Definitions

| Severity | Definition |
|---|---|
| 🔴 Critical | Breaks functionality, security risk, or violates a constitutional rule (auto-Critical) |
| 🟠 High | Significant degradation risk or architectural drift |
| 🟡 Medium | Technical debt, maintainability concern, or suboptimal pattern |
| 🟢 Low | Cosmetic, minor deviation, or future-proofing note |
| ✅ Strength | Well-implemented pattern worth preserving |

**Auto-Critical triggers (no judgment needed):**
- Any port other than 5002
- `try/catch` in Express 5 route handlers
- `forwardRef` in client code
- `@react-three/fiber` or `useGLTF` imports
- `any` type in production code (when `noExplicitAny: error` is enabled)
- Hardcoded secrets in any file

---

## Post-Audit Actions

- [ ] `docs/core/sops/SOP_ARCHITECTURE_AUDIT.md` — add audit date and any new checklist items discovered
- [ ] `task_plan.md` — mark audit complete, list immediate next actions
- [ ] `progress.md` — append audit summary entry
- [ ] If Critical findings: create separate remediation tasks in `task_plan.md` before closing audit

---

## Audit History

| Date | Conducted By | Criticals | Highs | Outcome |
|---|---|---|---|---|
| 2026-03-27 | Claude Code (Sonnet 4.6) | 3 (C1: try/catch, C2: E2E port, C3: no node_modules) | 5 | Findings documented. Remediation pending. |
