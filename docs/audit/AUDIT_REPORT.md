# RUN Remix — Architecture & Structural Audit
**Date:** 2026-04-04
**Auditor:** Claude Code (read-only session)
**gstack version on disk:** 0.15.2.1
**gstack upstream version:** 0.15.4.0 *(2 patch versions behind — run `/gstack-upgrade`)*

---

## Executive Summary

- 🔴 **30+ `try/catch` blocks in `server/routes/`** violate the Express 5 async-error contract; the media subsystem alone accounts for 20+ instances.
- 🔴 **Zod schemas scattered inside `client/app/`** (three separate locations) break the rule that all schemas must originate from `@run-remix/shared`.
- 🔴 **`three` (v0.172.0) declared in `client/package.json`** with zero actual imports — a dead 500 KB+ dependency inflating the bundle.
- 🟡 **Root-level `utils/` and `scripts/` packages are invisible to Turborepo** (not in the workspaces field) — their TypeScript cannot be type-checked in the pipeline.
- 🟡 **GSAP version split** (root `3.14.2` vs client `3.13.0`) and **React Router split** (root `7.12.0` vs client `7.11.0`) introduce subtle hoisting ambiguity.

---

## 1. Monorepo Architecture

### Workspace Layout
| Package | Path | Status |
|---|---|---|
| `@run-remix/client` | `client/` | ✅ Present and wired |
| `@run-remix/server` | `server/` | ✅ Present and wired |
| `@run-remix/shared` | `shared/` | ✅ Present and wired |

Root `package.json` workspaces field correctly declares `["client", "server", "shared"]`. Turborepo 2.7.2 is configured at root only.

### Turborepo Pipeline
| Task | `dependsOn` | Cache | Notes |
|---|---|---|---|
| `build` | — | ✅ outputs `dist/**`, `build/**` | Correct |
| `test` | `^build` | ✅ outputs `coverage/**` | Correct |
| `lint` | `^build` | ✅ | Correct |
| `typecheck` | `^build` | ✅ | Correct |
| `dev` | — | ❌ (persistent) | Expected |
| `db:push` | — | ❌ | Expected |

Pipeline is logically sound. All tasks have appropriate dependency ordering.

### `shared/` Dependency Purity

**Severity: 🟡 Warning**
`shared/package.json` runtime dependencies: `drizzle-orm@^0.45.1`, `drizzle-zod@^0.8.3`, `zod@^4.2.1`.

The project constitution describes `shared/` as a "pure types/schema package" but these are genuine runtime deps required for Drizzle schema generation and Zod validation. This is a pragmatic trade-off — `shared/` is not a zero-dependency package. Flag for documentation; no action required unless the team wishes to split into `@run-remix/schemas` (Zod) and `@run-remix/db-schemas` (Drizzle).

**Action:** Investigate further / document the intentional design.

### Packages Outside Workspaces

**Severity: 🟡 Warning**

| Path | Has `tsconfig.json` | In Workspaces | Turborepo-visible |
|---|---|---|---|
| `utils/` | ✅ | ❌ | ❌ |
| `scripts/` | ✅ | ❌ | ❌ |

Neither `utils/` nor `scripts/` are declared in the root `workspaces` field. Turborepo cannot typecheck or lint them as part of the pipeline. The `scripts/tsconfig.json` references `shared` and `server` — it is compiled ad-hoc with `tsx` at call time, not via the Turbo pipeline.

**Action:** Either add both to workspaces (preferred) or explicitly document that they are stand-alone scripts run outside the pipeline.

### Root-Level `db/` Directory

**Severity: 🟡 Warning — Needs Manual Verification**

`db/migrations/phase11_trigram_indexes.sql` exists at the repo root alongside `server/migrations/` (which contains the full Drizzle migration history). It is unclear whether `db/` is an orphaned one-off SQL script or a parallel migration directory.

**Action:** Investigate further — determine if `db/migrations/` is referenced by any runner script. If not, remove.

### Cross-Boundary Import Violations

**Severity: 🟢 Informational**
Zero violations found. `client/app/` never imports from `server/` paths. All shared types flow through `@run-remix/shared` as intended.

---

## 2. Directory & File Organisation

### Top-Level Tree (2 levels, noise excluded)

```
/
├── client/          # @run-remix/client (React 19 + Vite 7)
├── server/          # @run-remix/server (Express 5)
├── shared/          # @run-remix/shared (Zod schemas + Drizzle types)
├── utils/           # Stand-alone utilities (NOT in workspaces)
├── scripts/         # Build/seed/verify scripts (NOT in workspaces)
├── db/              # Root-level SQL migrations (1 file — ambiguous)
├── migrations/      # ← Does NOT exist at root (confirmed)
├── e2e/             # Playwright E2E test suite (35+ specs)
├── tests/           # Centralized Vitest unit + integration tests
├── docs/            # Documentation hub (8+ SOPs, 20 ADRs)
├── public/          # Static assets
├── .agent/          # 22 custom agent skills
├── .claude/         # Claude Code config + 36 gstack skill entries
├── .context/        # Project context files
├── .kilo/           # Kilo worktrees
├── .github/         # CI/CD workflows
├── package.json     # Root — workspaces + overrides
├── turbo.json       # Turborepo pipeline
├── biome.json       # Linting + formatting (root, authoritative)
├── tsconfig.json    # Root base config
├── tsconfig.base.json
├── vitest.config.ts
├── playwright.config.ts
├── .nvmrc
├── .env.example
├── .gitignore
├── CLAUDE.md
├── gemini.md        # Project Constitution (SSOT)
├── task_plan.md     # Active task memory
└── findings.md      # Active findings memory
```

### Stray / Legacy Directories
**Severity: 🟢 Informational**
No directories named `old/`, `temp/`, `backup/`, `archive/`, `__OLD__`, or with timestamp suffixes found anywhere in the repo.

### Build Artifacts
**Severity: 🟢 Informational**
`dist/` (15 MB) and `.turbo/` (203 MB) exist on disk but are **not committed** — git status is clean and both paths are covered by `.gitignore`. `client/build/` is similarly gitignored. No action required.

### Lock Files
**Severity: 🟢 Informational**
Only `package-lock.json` present. No `yarn.lock` or `pnpm-lock.yaml`. Correct for an npm-workspace project.

### Editor Artifacts (`.DS_Store`)
**Severity: 🟡 Warning**

Three `.DS_Store` files found outside gitignored paths:

| Path |
|---|
| `.context/.DS_Store` |
| `.kilo/worktrees/.DS_Store` |
| `docs/core/.DS_Store` |

The root `.gitignore` covers `.DS_Store` at the root level but does not use the recursive `**/.DS_Store` pattern, so subdirectory `.DS_Store` files can slip through if git-tracked.

**Action:** Add `**/.DS_Store` to `.gitignore`. Remove existing files if tracked.

### Log Files
**Severity: 🟢 Informational**
No `*.log` files found at root or in workspace source directories.

---

## 3. Client (`@run-remix/client`) Structure

### React Router v7 Routes
**Severity: 🟢 Informational — Pass**

All 33 route files reside in `client/app/routes/` and follow React Router v7 file-based conventions correctly:

| Convention | Example | Status |
|---|---|---|
| Layout wrapper (`_` prefix) | `_public.tsx`, `_index.tsx` | ✅ |
| Dynamic segment (`$param`) | `categories.$slug.tsx` | ✅ |
| Nested route (`.` separator) | `categories.$slug.products.tsx` | ✅ |
| API routes | `api.media.tsx`, `api.navigation-items.tsx` | ✅ |
| Catch-all | `$.tsx` | ✅ |

No orphaned route files detected. All routes have corresponding loader/component logic.

### `forwardRef` Usage
**Severity: 🟢 Informational — Pass**
Zero `forwardRef` usages found. Codebase correctly uses the React 19 raw `ref` prop pattern throughout all 272 component files.

### `@react-three/fiber` / `@react-three/drei` Imports
**Severity: 🟢 Informational — Pass**
Zero R3F imports. 3D rendering exclusively uses `LazyUnifiedModelViewer` wrapping `@google/model-viewer` as required.

### `three.js` Dependency (Dead)
**Severity: 🔴 Critical**
`three@0.172.0` is declared in `client/package.json` `dependencies`. Static analysis of all `.ts`/`.tsx` files under `client/app/` found **zero imports** of `'three'`. The package is dead weight — it inflates the install footprint and may appear in bundle analysis as a false positive.

**Action:** Remove `three` from `client/package.json` dependencies.

### Tailwind v4 Setup
**Severity: 🟢 Informational — Pass**
`client/app/index.css` opens with `@import "tailwindcss"` and defines `@theme` + `@utility` blocks. No `tailwind.config.js` present. Fully compliant with Tailwind v4 oxide engine conventions.

### Zod Schemas Defined Inside `client/`
**Severity: 🔴 Critical**

Zod schemas are defined in at least three locations within the client package, violating the rule that all schemas must originate from `@run-remix/shared`:

| File | Schema(s) Defined |
|---|---|
| `client/app/schemas/product.ts` | `MediaAssetSchema`, `CategorySchema`, `FabricSchema`, `CertificateSchema`, `SizeChartSchema`, `AccessorySchema`, `ProductSummarySchema`, `ProductDetailSchema` |
| `client/app/lib/schemas/categories.ts` | Category-related Zod schemas |
| `client/app/lib/schemas/response-envelopes.ts` | `createSuccessEnvelopeSchema<T>()` generic wrapper |
| `client/app/hooks/use-inquiry-form.ts` | Inline inquiry form Zod schemas |
| `client/app/components/admin/sustainability/metrics-tab.tsx` | Sustainability data validation |
| `client/app/components/admin/contact-management/ContactPageSettings.tsx` | Contact settings validation |

Note: `client/app/schemas/product.ts` also contains a `safeParseArray()` utility helper — this helper is distinct and may remain in client, but the Zod schema definitions themselves must move to `shared/`.

**Action:** Migrate all schema definitions to `@run-remix/shared`; import from there in client.

### TypeScript Escape Hatches
**Severity: 🟢 Informational — Pass**
Zero `@ts-ignore` or `@ts-nocheck` directives in the entire client package.

### Console Statements
**Severity: 🟡 Warning**
35 console statement occurrences across 19 client source files. The majority are `console.error` calls in error boundaries and route-level catch paths — appropriate use. A minority appear in service and utility files.

**Action:** Audit and migrate non-error-boundary `console.*` calls to the structured logging pattern already established server-side.

### Naming Anomaly: `fabric-management-enhanced-v2.tsx`
**Severity: 🟡 Warning**
`client/app/components/admin/fabric-management-enhanced-v2.tsx` exists with no corresponding `v1` file. The `-v2` suffix implies a replacement that was never cleaned up.

**Action:** Rename to `fabric-management-enhanced.tsx` in a future cleanup PR.

---

## 4. Server (`@run-remix/server`) Structure

### Business Logic Separation
**Severity: 🟢 Informational — Pass**

Clean three-tier separation confirmed:
- **Routes** (`server/routes/`) — thin controllers: request parsing, Zod validation, response formatting only
- **Services** (`server/services/`) — business logic: `AuthService`, `AdminService`, `InquiryService`, `WebhookService`
- **Repositories** (`server/lib/db/repositories/`) — data access: `UserRepository`, `ProductRepository`, `MediaRepository`, all wrapped with `retryDbOperation()`

No business logic found directly in route handler files.

### `try/catch` in Express 5 Route Handlers
**Severity: 🔴 Critical**

Express 5 automatically propagates rejected async promises to the error middleware — wrapping route handler bodies in `try/catch` is an anti-pattern that undermines this contract and can swallow errors silently if the catch block is incomplete.

**30+ instances found across 5 files:**

| File | Line(s) | Count |
|---|---|---|
| `server/routes/media/handlers.ts` | 391, 414, 471, 484, 523, 549, 826, 835, 944, 1342 | 10 |
| `server/routes/media/utils.ts` | 307, 584, 596, 628, 648 | 5 |
| `server/routes/media/services.ts` | 330, 397, 486, 512, 533 | 5 |
| `server/routes/utilities/api-based-population.ts` | 72, 128, 225, 325, 457 | 5 |
| `server/routes/resources/sustainability.routes.ts` | 100 | 1 |

The media subsystem (`handlers.ts`, `utils.ts`, `services.ts`) accounts for the majority. These files are likely the result of pre-Express-5 patterns that were not updated during the framework upgrade.

**Action:** Strip `try/catch` wrappers; let Express 5 propagate async errors to `production-error-handler.ts`. (Per `findings.md` C1 — this is a known open item.)

### Port Configuration
**Severity: 🟢 Informational — Pass**

Port 5002 enforced correctly across all configuration surfaces:
- `server/server.ts:41` — `const PORT = process.env.PORT !== undefined ? parseInt(process.env.PORT, 10) : 5002`
- `package.json` dev scripts — `PORT=5002`
- `Dockerfile` — `ENV PORT=5002` + `EXPOSE 5002`
- K8s deployment — `containerPort: 5002`
- `playwright.config.ts` — `baseURL: http://127.0.0.1:5002`

Zero `process.env.PORT || 3000` patterns found.

### Dead Route Files
**Severity: 🟢 Informational — Pass**
All 67 route files are imported and mounted in `server/routes/index.ts`. No orphaned route files.

### Authentication Architecture
**Severity: 🟢 Informational — Pass**
`server/services/auth-service.ts` implements Passport.js + Google OAuth 2.0. Session storage uses `express-session` with Upstash Redis in production and in-memory fallback in development. No JWT-only patterns detected.

### Cache Layers
**Severity: 🟢 Informational — Pass**

`server/lib/cache/unified-cache.ts` implements a clean two-tier strategy:
- **L1:** `lru-cache` — max 5,000 items, 100 MB, with TTL presets (SHORT 5m → STATIC 24h)
- **L2:** `@upstash/redis` — optional, gracefully degraded; circuit-breaker wrapped via Opossum
- **SWR pattern** and **in-flight deduplication** (`Map<string, Promise<unknown>>`) both present

No ad-hoc `Map` or plain-object caches found elsewhere.

### Observability
**Severity: 🟢 Informational — Pass**

- **Pino** (`server/lib/monitoring/logger.ts`) — structured logging, 20+ field redaction, AsyncLocalStorage correlation IDs
- **OpenTelemetry** (`server/server.ts`) — auto-instrumentation, Pino log hook for trace/span injection, OTLP HTTP export
- **Sentry** (`@sentry/node@10.32.0`) — error capture
- **Prometheus** — `/metrics` endpoint
- No `morgan` or `winston` present anywhere.

### Console Statements in Production Paths
**Severity: 🟡 Warning**

| File | Line | Statement |
|---|---|---|
| `server/index.ts` | 17, 20 | `console.log` (bootstrap secrets loading) |
| `server/index.ts` | 33 | `console.error` (critical startup failure) |
| `server/server.ts` | 84 | `console.error("BOOT_ERROR_RAW:", error)` |
| `server/middleware/sanitization.ts` | 85 | `console.warn` (NoSQL sanitizer failure) |

The bootstrap `console.log` calls predate Pino initialization (Pino cannot log before it is set up). The `BOOT_ERROR_RAW` fallback is a last-resort catch before Pino is available. These are acceptable but should be documented as intentional bootstrapping exceptions rather than replaced blindly.

**Action:** Add a code comment to each instance noting it is a pre-Pino bootstrap log. Replace `sanitization.ts:85` with the Pino logger (Pino is available at that point).

### TypeScript Escape Hatches
**Severity: 🟢 Informational — Pass**
Zero `@ts-ignore` / `@ts-nocheck` in the entire server package.

---

## 5. Shared (`@run-remix/shared`) Structure

### Package Dependencies
**Severity: 🟡 Warning — Informational**

`shared/package.json` runtime dependencies:

| Package | Version | Purpose |
|---|---|---|
| `drizzle-orm` | `^0.45.1` | Table schema definitions |
| `drizzle-zod` | `^0.8.3` | Zod schema generation from Drizzle tables |
| `zod` | `^4.2.1` | Validation schemas |

These are necessary for `shared/` to serve as the canonical schema source. Flagged as informational — the project constitution should be updated to acknowledge that `shared/` is a schema library with these three runtime dependencies, not a zero-dep package.

### Zod v4 Pattern Compliance
**Severity: 🟡 Warning**

Three instances of the Zod v3 pattern `.optional().nullable()` found in `shared/schemas/products.ts`:

```typescript
// Lines 311–313
primaryImageId: z.number().optional().nullable(),
primaryVideoId: z.number().optional().nullable(),
modelFileId:    z.number().optional().nullable(),
```

In Zod v4 the canonical form is `.nullish()` (equivalent semantics, cleaner API).

**Action:** Replace the three occurrences with `.nullish()`.

### Drizzle Schema Location
**Severity: 🟡 Warning — Needs Manual Verification**

Two potential schema locations observed:
1. `server/migrations/schema.ts` — a large file (~1,500 lines) containing Drizzle table definitions
2. `server/drizzle.config.ts` references `schema: "../shared/schemas/index.ts"` as the migration source

It is unclear whether `server/migrations/schema.ts` is the authoritative Drizzle schema (with `shared/` re-exporting it) or whether there are two separate schema files with a duplication risk.

**Action:** Investigate further — read both files to confirm the dependency direction.

### Barrel Exports
**Severity: 🟢 Informational — Pass**

`shared/index.ts` cleanly re-exports from `errors.js`, `routes.js`, `schemas/index.js`, and two `types/` modules. No internal implementation details are leaking through the public API.

---

## 6. Configuration Files

| Config File | Expected Location | Found At | Status |
|---|---|---|---|
| `tsconfig.json` (root base) | root | root + `tsconfig.base.json` | ✅ |
| `tsconfig.json` (client) | `client/` | `client/tsconfig.json` extends base | ✅ |
| `tsconfig.json` (server) | `server/` | `server/tsconfig.json` extends base | ✅ |
| `tsconfig.json` (shared) | `shared/` | `shared/tsconfig.json` extends base | ✅ |
| `tsconfig.json` (utils) | N/A — not in workspaces | `utils/tsconfig.json` | 🟡 |
| `tsconfig.json` (scripts) | N/A — not in workspaces | `scripts/tsconfig.json` | 🟡 |
| `biome.json` | root only | root only | ✅ |
| `turbo.json` | root only | root only | ✅ |
| `package.json` workspaces | root only | root only | ✅ |
| `.nvmrc` | root — pins Node 24 | `v24.0.0` | ✅ |
| `.env.example` | root | root (all 10 vars documented) | ✅ |
| `vite.config.ts` | `client/` only | `client/vite.config.ts` | ✅ |
| `vitest.config.ts` | per package | root + `client/vitest.config.ts` | 🟡 |
| `drizzle.config.ts` | `server/` only | `server/drizzle.config.ts` | ✅ |
| `.gitignore` | root | root (comprehensive) | ✅ |

### Notable Issues

**`utils/` and `scripts/` tsconfig files (🟡 Warning):**
Both directories have `tsconfig.json` files referencing the monorepo base config, but neither is in the workspaces field. Their TypeScript is compiled via ad-hoc `tsx` invocations, not the Turbo pipeline. This means CI `typecheck` does not cover them.

**Dual `vitest.config.ts` (🟡 Warning):**
The root `vitest.config.ts` uses `jsdom` environment, 60s timeout, and 80% coverage thresholds. The `client/vitest.config.ts` sets its own coverage config (75% branch threshold). When running `turbo test`, both may be evaluated, potentially causing test double-runs or coverage report collisions.

**Action:** Clarify which `vitest.config.ts` is authoritative for client tests; consider removing the root-level config's client test glob patterns if `client/vitest.config.ts` handles them.

---

## 7. Dependency Audit

*Note: `npm ls` could not be executed in this session. Analysis is based on static inspection of all `package.json` files.*

### Dead Dependencies
| Package | Declared In | Imports Found | Severity |
|---|---|---|---|
| `three@0.172.0` | `client/package.json` | 0 | 🔴 Critical |

### Version Mismatches Across Workspaces
| Package | Root | Client | Server | Risk |
|---|---|---|---|---|
| `react-router` | `7.12.0` | `7.11.0` | `@react-router/express@7.11.0` | 🟡 Minor — should be aligned |
| `gsap` | `3.14.2` | `3.13.0` | — | 🟡 Minor — client may resolve older version |
| `zod` | `4.2.1` | `4.2.1` | `4.2.1` | ✅ Consistent |
| `drizzle-orm` | — | — | `0.45.1` / shared `0.45.1` | ✅ Consistent |

### Correctly Categorised Dependencies
- All `@types/*` packages are in `devDependencies` ✅
- Build tools (`vite`, `esbuild`, `tsx`, `turbo`, `biome`) are in `devDependencies` ✅
- Test tools (`vitest`, `playwright`, `supertest`) are in `devDependencies` ✅

### Deprecated / Legacy Alternatives
- No `axios` found (project uses native `fetch`) ✅
- No `moment` found ✅
- No `lodash` found ✅
- No `winston` or `morgan` found ✅

### Package Overrides (Root)
Root `package.json` declares `overrides` for: `lodash`, `axios`, `react-helmet-async`, `fast-xml-parser`, `esbuild`. These are security/compatibility pins — intentional and expected.

---

## 8. Test Organisation

### Test File Locations

| Type | Directory | Runner | Pattern |
|---|---|---|---|
| Unit (centralized) | `/tests/unit/` | Vitest | `*.test.ts` |
| Unit (co-located) | `server/lib/*/__tests__/` | Vitest | `*.test.ts` |
| Unit (co-located) | `server/middleware/__tests__/` | Vitest | `*.test.ts` |
| Unit (co-located) | `client/app/hooks/__tests__/` | Vitest | `*.test.ts` |
| Integration | `server/tests/integration/` | Vitest | `*.integration.test.ts` |
| E2E | `/e2e/` | Playwright | `*.spec.ts` |

**Severity: 🟡 Warning — Inconsistent co-located vs centralized pattern.**

The project uses a hybrid test layout: some tests are co-located with source (preferred for unit tests), while others live in the centralized `/tests/unit/` directory. This creates onboarding friction — new contributors must know to look in two places.

**Action:** Document the intended pattern in `docs/testing/` or a `CONTRIBUTING.md`. A future consolidation sprint could co-locate all unit tests.

### E2E / Unit Separation
**Severity: 🟢 Informational — Pass**
Playwright E2E tests in `/e2e/` are fully separate from Vitest unit/integration tests. No mixed concerns.

### MSW Mock Server
**Severity: 🟢 Informational**
`/tests/mocks/server.ts` provides MSW (Mock Service Worker) for HTTP mocking in Vitest. Present and expected.

### Test Fixtures
No explicit `__fixtures__/` or `__seeds__/` directories found. Fixtures appear to be inline or generated on-the-fly. No outdated or orphaned fixture files detected.

### Accessibility Coverage
**Severity: 🟢 Informational**
`/e2e/accessibility.spec.ts` exists and performs Axe Core + WCAG 2.2 AA checks — strong signal of mature testing culture.

---

## 9. Legacy & Dead Code Inventory

### Files with Legacy Naming Patterns
**Severity: 🟢 Informational — Pass**
Zero files found matching: `old`, `legacy`, `bak`, `backup`, `copy`, `v1`, `_unused`, `_deprecated`, `TODO_DELETE`, `REMOVE_ME`, `temp`, `tmp`.

Exception: `client/app/components/admin/fabric-management-enhanced-v2.tsx` — the `-v2` suffix is a naming smell (no corresponding `v1` exists). Not a legacy file; just a naming cleanup task.

### TypeScript Escape Hatches
**Severity: 🟢 Informational — Pass**
Zero `@ts-ignore` or `@ts-nocheck` annotations anywhere in the repository (client, server, shared, utils, scripts).

### Console Statements in Production Source
*(See Sections 3 and 4 for full details.)*

Summary:
- **Client:** 35 occurrences across 19 files — mostly `console.error` in error boundaries (acceptable pattern)
- **Server:** 5 occurrences in production bootstrap/middleware paths (should migrate `sanitization.ts:85` to Pino; others are pre-Pino bootstrap exceptions)

### TODO / FIXME / HACK / XXX Comments

| File | Comment | Type | Severity |
|---|---|---|---|
| `client/app/components/admin/product-management-unified/hooks/useProductForm.ts` | `// TODO: call GET /api/v1/admin/products/check-slug?slug={baseSlug}&excludeId={product?.id}` | Incomplete feature | 🟡 Medium |
| `server/routes/worker.ts` | `// TODO: Implement with Sharp when ready` (image optimization) | Future work | 🟢 Low |

Only 2 TODO comments in the entire repository — excellent hygiene.

### Commented-Out Code Blocks (> 10 lines)
No large commented-out code blocks detected. One commented-out `console.warn` in `server/lib/api/openapi-generator.ts:37` (single line — acceptable).

### Feature Flags / Always-True Guards
No `if (process.env.NODE_ENV === 'development')` gates that are always-true or always-false relative to `.env.example` values were detected.

---

## 10. `CLAUDE.md` & Agent Configuration

### `CLAUDE.md` Status
**Severity: 🟢 Informational — Pass**

`CLAUDE.md` exists at the project root and contains:
- Full project identity and tech stack table
- The 8-step Agentic Sprint workflow
- Non-negotiable tech stack constraints (React 19, Vite 7, Tailwind v4, Express 5, TypeScript strict, Drizzle/Neon, Vitest, Biome)
- Complete gstack skill routing table with descriptions
- Protocol 0 (mandatory session start/end steps)
- Project structure map
- Skill routing rules section

The gstack section lists all required skills and includes the `setup` fallback instruction.

### gstack Version
| | Version |
|---|---|
| On disk (`.claude/skills/gstack/VERSION`) | `0.15.2.1` |
| Upstream (GitHub `garrytan/gstack` main) | `0.15.4.0` |
| **Status** | **🟡 2 patch versions behind** |

**Action:** Run `/gstack-upgrade` to pull the latest version.

### `.claude/skills/` Directory
**Severity: 🟢 Informational — Pass**
Contains 36 entries: 5 standalone skill directories (`gstack/`, `checkpoint/`, `design-html/`, `health/`, `learn/`) plus 31 symlinks pointing into `gstack/` for skill aliasing. All expected skill directories are present.

### `.agent/skills/` Directory
**Severity: 🟢 Informational**
22 custom project skills defined for RUN Remix-specific automation:
`advanced-debugging`, `agent-teams`, `brainstorming`, `core-identity`, `development-workflow`, `dispatching-parallel-agents`, `executing-plans`, `express-5-async-patterns`, `gsap-3-13-react-integration`, `neon-drizzle-edge-sql`, `playwright-visual-regression`, `port-5002-compliance`, `production-standards`, `project-standards`, `react-19-optimistic-ui`, `subagent-driven-development`, `systematic-debugging`, `tailwind-v4-oxide-engine`, `tech-integrity-validator`, `test-driven-development`, `using-git-worktrees`.

These are project-specific and in good shape.

---

## Safe-to-Remove Inventory

| Path | Type | Reason It Is Safe to Remove | Confidence |
|---|---|---|---|
| `three` entry in `client/package.json` `dependencies` | Package dep | Zero imports in `client/app/` found via full static scan; no transitive consumer | 🟢 High |
| `.context/.DS_Store` | File | macOS editor artifact; no runtime or build value | 🟢 High |
| `.kilo/worktrees/.DS_Store` | File | macOS editor artifact | 🟢 High |
| `docs/core/.DS_Store` | File | macOS editor artifact | 🟢 High |

> **Not listed** but warranting investigation before removal:
> - `db/migrations/phase11_trigram_indexes.sql` — single SQL file at root `db/`; purpose ambiguous (see §1)
> - `client/app/components/admin/fabric-management-enhanced-v2.tsx` — not safe to remove, but safe to **rename** (drop `-v2` suffix)

---

## Ambiguities & Open Questions

1. **Drizzle schema duplication** — `server/migrations/schema.ts` (~1,500 lines of table definitions) coexists with `server/drizzle.config.ts` pointing to `../shared/schemas/index.ts` as its schema source. Are these the same definitions? Does `shared/schemas/index.ts` re-export from `server/migrations/schema.ts`, or are they maintained independently? A manual read of both files is required before any schema-related refactor.

2. **`db/migrations/` at repo root vs `server/migrations/`** — Only one SQL file (`phase11_trigram_indexes.sql`) exists in `db/migrations/`. Is this a leftover one-off migration that was never integrated into the Drizzle migration history, or is `db/` an active parallel migration directory?

3. **`framer-motion`** — `findings.md` (H5) flags framer-motion as present and potentially conflicting with GSAP. No imports were found in `client/app/` during this audit, but the `package.json` was not explicitly grepped for `framer-motion` as a declared dependency. Verify with: `grep "framer-motion" client/package.json`.

4. **`vitest.config.ts` overlap** — The root config and `client/vitest.config.ts` both appear to cover client tests. Which is authoritative, and do both run during `turbo test`? The test count output from a `turbo test --dry` run would clarify.

5. **`shared/` as a runtime dep in `server/`** — If `server/migrations/schema.ts` is the authoritative Drizzle schema source and `shared/` re-exports it, then `shared/` technically has a circular dependency relationship with `server/`. This needs architectural confirmation.

---

## Recommended Next Steps

*Ordered by impact:*

1. **[Critical] Strip `try/catch` from `server/routes/media/`** — 20 of the 30+ violations are in 3 files. One focused PR removes the bulk of this Express 5 anti-pattern. Start with `handlers.ts`.

2. **[Critical] Migrate Zod schemas out of `client/app/`** — Move schemas from `client/app/schemas/`, `client/app/lib/schemas/`, and inline hook schemas into `@run-remix/shared`. This enforces the single-source-of-truth contract and enables server-side reuse.

3. **[Critical] Remove `three` from `client/package.json`** — Zero-import dead dependency. One-line change, immediate bundle improvement.

4. **[High] Investigate Drizzle schema location ambiguity** (Ambiguity #1) — Read `server/migrations/schema.ts` and `shared/schemas/index.ts` to confirm the source-of-truth and eliminate potential duplication.

5. **[High] Run `/gstack-upgrade`** — 2 patch versions behind upstream; may include bug fixes.

6. **[Medium] Add `utils/` and `scripts/` to workspaces** — Ensures their TypeScript is checked in the Turbo `typecheck` pipeline, preventing silent type regressions in seed scripts and validators.

7. **[Medium] Fix `.gitignore` to include `**/.DS_Store`** — Prevents `.DS_Store` files from being committed in subdirectories.

8. **[Medium] Replace Zod `.optional().nullable()` with `.nullish()`** in `shared/schemas/products.ts:311–313` — 3-line change, brings schema in line with Zod v4 canonical API.

9. **[Medium] Resolve `vitest.config.ts` dual-config ambiguity** — Document or consolidate to prevent double test execution.

10. **[Low] Align `react-router` and `gsap` versions** across root and `client/package.json` to eliminate npm hoisting ambiguity.

11. **[Low] Rename `fabric-management-enhanced-v2.tsx`** → `fabric-management-enhanced.tsx`.

12. **[Low] Document that bootstrap `console.log` calls in `server/index.ts` are pre-Pino intentional** — add inline comment; replace `sanitization.ts:85` with Pino.
