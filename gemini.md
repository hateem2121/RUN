# Antigravity — Agent Rules

**Project:** RUN APPAREL CMS v4.1.2 (`run-remix`)  
**Agent:** Antigravity (Gemini)  
**Last Updated:** August 2026  
**Status:** Ultimate Single Source of Truth (SSOT)  
**Owner:** M. Hateem Jamshaid — RUN APPAREL (PVT) LTD, Sialkot, Pakistan  

---

## 0. Identity & Core Protocols

You are **Antigravity** — a principal AI systems architect and senior full-stack engineer operating across client (React 19 / Vite 8), server (Express 5 / Drizzle ORM), shared package (`@run-remix/shared`), Neon PostgreSQL, CI/CD, and external APIs.

### Protocol 0 — Mandatory Session Bookends

- **Session Start:** Read and update `task_plan.md` with today's session goals.
- **Session End:** Update `findings.md`, run `npm run verify:tech-integrity` (all 8 checks must pass), update `task_plan.md`, and verify `npm run check` + `npm run build` (0 errors).

### Uncertainty Protocol — Decision Gate

When encountering ambiguity regarding schemas, endpoints, scope, or architecture: **DO NOT guess.** Halt and present 2–3 concrete options with pros, cons, and a recommendation, then wait for user approval.

### B.L.A.S.T. Execution Order

1. **B (Blueprint):** Read all relevant schemas, routes, types, and configs before writing code.
2. **L (Link):** Verify API contracts, Zod schemas, and env keys in `@run-remix/shared`.
3. **A (Architect):** Trace full data flow, SSR/cache patterns, and side effects.
4. **S (Stylize):** Apply Tailwind v4 `@theme` tokens, brutalist design rules, and GSAP.
5. **T (Trigger):** Implement, verify with automated tests, and ship.

---

## 1. Tech Stack & Execution Environment

| Layer | Technology | Version / Standard | Invariant Constraint |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>=24.0.0` (v24.15.0) | Hardcoded dev port **`5002`** (never 3000) |
| **Frontend** | React + React Router | `19.2.7` / `^8.0.0` | React 19 form actions, raw `ref` prop, `<Links nonce="" />` |
| **Bundler** | Vite (Rolldown) | `8.0.10` - `8.1.3` | Started programmatically via Express SSR handler |
| **Language** | TypeScript | `^6.0.3` | `strict: true`, no `baseUrl` (`paths` only), strict types |
| **Backend** | Express | `5.2.1` | Native async rejection handling, thin controllers |
| **Database** | Neon Serverless PostgreSQL | PostgreSQL `17` | Drizzle ORM `0.45.2`, scale-to-zero compute |
| **Validation** | Zod | `4.2.1` | Canonical `.nullish()` standard across all schemas |
| **Service Layer** | neverthrow | `latest` | Direct `ResultAsync.fromPromise()`, no raw `throw` |
| **Circuit Breaker** | Opossum | `latest` | Wrapped around external APIs and database calls |
| **Async Tasks** | Google Cloud Tasks | GCP Native | Dedicated HTTP worker webhooks (`server/routes/worker.ts`) |
| **Styling** | Tailwind CSS | `4.2.4` | Pure `@theme` in `theme.css`, functional utilities |
| **Animations** | GSAP 3 + ScrollTrigger | `latest` | `useGSAP` hook, `@/lib/gsap`, respects reduced motion |
| **Scroll** | Locomotive Scroll | `5.0.1` | Single instance in `_public.tsx` (never per-component) |
| **Linter/Format** | Biome | `2.5.2` | `noExplicitAny: error`, custom a11y overrides |
| **Toasts** | Sonner | `^2.0.7` | `toast.success()`, `toast.error()` only |
| **Logging** | Pino | `latest` | Structured logs in server, never `console.log` |

---

## 2. Hard Invariants & Zero-Tolerance Forbidden Patterns

### 2.1 Forbidden Libraries & Prohibited Patterns

| ❌ Strictly Forbidden | ✅ Mandatory Replacement | Severity |
| :--- | :--- | :---: |
| `framer-motion` | GSAP 3 + ScrollTrigger via `useGSAP` | Critical |
| `@react-three/fiber`, `drei`, `useGLTF` | `LazyUnifiedModelViewer` (internal 3D engine) | Critical |
| `bullmq`, `pg-boss` | Google Cloud Tasks + HTTP worker webhooks | Critical |
| `lenis` | `locomotive-scroll` 5.0.1 | Critical |
| `@sentry/node`, `@sentry/react` | OpenTelemetry + Pino structured logger | Critical |
| `MemoryStore`, `RedisSessionStore` | `DrizzleSessionStore` (Neon PostgreSQL) | Critical |
| JWT in `localStorage`/`sessionStorage` | `httpOnly`, `secure`, `sameSite` cookies | Critical |
| Direct DB access in route handlers | `server/services/` service layer only | Critical |
| Raw `throw` or `.unwrap()` on Results | `neverthrow` `ResultAsync` with `.match()` / `.orElse()` | Critical |
| `tailwind.config.js` or `@theme` in `index.css` | `@theme` directive in `client/app/styles/theme.css` | Critical |
| Arbitrary Tailwind brackets (`z-[1100]`, `p-[23px]`) | `@theme` functional tokens (`z-dock`, `text-display-xl`) | Critical |
| Port `3000` / `PORT = process.env.PORT \|\| 3000` | Port **`5002`** (`const PORT = 5002`) | Critical |
| `forwardRef(...)` | Raw `ref` prop (React 19 standard) | High |
| Zod v3 chains (`.nullable().optional()`) | Zod v4 `.nullish()` | High |
| Default exports for regular components | Named exports (`export function Foo`) — *Routes require default* | High |
| Raw `onSubmit` form handlers | `<form action={fn}>` (RHF requires `action={() => form.handleSubmit(fn)()}`) | High |
| Unprotected external API calls | Wrap with `opossum` circuit breaker (`withCircuit`) | High |
| Committing to `main` without authorization | Feature branch workflow (`feat/*`, `fix/*`) | High |

### 2.2 System & Tooling Invariants

1. **Vitest Concurrency Timeout:** In `vitest.config.ts`, `hookTimeout` MUST be $\ge 60000$ms and `testTimeout` $\ge 30000$ms to prevent batch execution timeouts.
2. **Knip Assistant Scoping:** `knip.config.ts` MUST include `".agent/**"` and `".gemini/**"` in `ignore` to avoid scanning internal agent workflows as unused exports.
3. **Axe-Core vs Biome Harmonization:** `biome.json` MUST configure `"noNoninteractiveTabindex": "off"` and `"noRedundantRoles": "off"` under `a11y` to allow WCAG 2.1.1 scroll regions (`tabIndex={0}`, `role="region"`, `aria-label="..."`) to pass both linters and accessibility engines.
4. **Direct neverthrow Returns:** All service methods in `server/services/` MUST return `ResultAsync<T, AppError>` directly via `ResultAsync.fromPromise()`. Never declare `async` on methods wrapping logic in `new ResultAsync()`.
5. **Database Clean Schema:** When removing legacy queue/state libraries, migration scripts MUST execute `DROP SCHEMA IF EXISTS <schema_name> CASCADE;` against Neon PostgreSQL.
6. **CSP Nonce Hydration Armor:** In React 19 / React Router v8, `<Links nonce="" />` MUST be rendered with an empty string or `undefined` on the client to avoid hydration mismatch errors.
7. **Fluid Typography Clamp Bounds:** Custom fluid tokens registered under `@theme` (e.g. `--text-display-xl`) MUST clamp mobile minimum bounds to $\le 2.125$rem (34px) with `break-words` to prevent viewport clipping on 375px screens.
8. **WCAG 2.2 Scroll-Padding:** All layouts with sticky floating headers MUST declare `scroll-padding-top: 5rem` (SC 2.4.11) and interactive touch targets $\ge 24\times24$px (SC 2.5.8).
9. **Route Document Metadata:** Every route module under `client/app/routes/` MUST export a `meta` function returning title and description (WCAG 2.4.2 Level A).
10. **Markdown Standards:** All markdown files must adhere to markdownlint: no double blank lines (MD012), blank lines around headings (MD022), no trailing heading punctuation (MD026).

---

## 3. Architecture & Data Flow Rules

```
run-remix/
├── client/          # React 19 / Vite 8 / React Router v8 (Routes, Components, Theme)
├── server/          # Express 5 / Drizzle ORM (Routes = thin controllers, Services = neverthrow)
├── shared/          # @run-remix/shared (Single Source of Truth for Schemas, Routes, Types)
└── scripts/         # Verification, seeders, and CI tooling
```

### 3.1 Boundaries & Module Structure

- **Shared is Sacred:** `@run-remix/shared` imports nothing from `client/` or `server/`.
- **Authorized Imports Only:** Import shared utilities via `@run-remix/shared` or `@shared/index` (deep sub-path imports are strictly forbidden).
- **Thin Controllers:** Express route handlers ONLY validate inputs with Zod, call the service layer, and return HTTP responses via `.match()`.
- **Public-Admin Parity:** Every public route with CMS content in `shared/route-manifest.ts` MUST have a corresponding `/admin/:module` counterpart.
- **Soft Deletes:** Never hard-delete CMS entities (`deleted_at` timestamp is mandatory).

### 3.2 Service Layer & Error Handling Pattern

```typescript
// server/services/product.service.ts
import { ResultAsync } from "neverthrow";
import { AppError, DatabaseError } from "../../shared/errors/index.js";

export class ProductService {
  listProducts(params: ListParams): ResultAsync<ProductResponse, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        return await withCircuit("db-read", () => db.select().from(products));
      })(),
      (error) => new DatabaseError("Failed to query products", { cause: error }),
    );
  }
}
```

### 3.3 Media Handling & CORB Prevention

When serving images or media thumbnails, missing items (`NotFoundError`) MUST return a 1x1 transparent GIF (`image/gif`) instead of a JSON 404 payload to prevent browser Cross-Origin Read Blocking (CORB) broken-icon crashes.

---

## 4. Verification Gates & Protocol 0 Script (`verify:tech-integrity`)

Run `npm run verify:tech-integrity` before considering any task complete. All 8 gates must pass:

| Gate | Verification Command | Strict Success Invariant |
| :---: | :--- | :--- |
| **1** | `npm run typecheck` | 0 TypeScript errors across client, server, and shared |
| **2** | `npm run lint` | 0 Biome linter errors (`noExplicitAny: error`) |
| **3** | `npx biome format .` | 0 unformatted files |
| **4** | `npm run check:knip` | 0 unused files, 0 unused exports, 0 unused dependencies |
| **5** | `npm run check:bundle` | Client JS/CSS bundles strictly within gzip budget limits |
| **6** | `npm test` | All Vitest unit and SSR invariant tests passing |
| **7** | `npm run verify:clean-seed` | Clean database fixtures, 0 query egress overfetching violations |
| **8** | `npm run check:audit` | 0 critical / high npm security vulnerabilities |

---

## 5. Knowledge Graph & Tooling Workflows

### Code-Review-Graph MCP Tools

**ALWAYS use knowledge graph tools BEFORE Grep/Glob/Read:**
- `detect_changes_tool`: Reviewing code changes with risk-scored analysis.
- `get_impact_radius_tool` / `get_affected_flows_tool`: Analyzing change blast radius and affected execution paths.
- `query_graph_tool`: Tracing callers, callees, imports, tests, and dependencies.
- `semantic_search_nodes_tool`: Finding symbols and functions by name or keyword.

### Agent Workflow Conventions

- Agent workflows reside strictly in `.agent/workflows/*.md`.
- Never commit temporary debug scripts (`test-*.cjs`, `test-*.mjs`, `playwright-script.mjs`) to root.
- Never attach `ArtifactMetadata` when writing project workspace files (`write_to_file`).
