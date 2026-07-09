# RUN Remix — Active Development Rules

## Environment
- Server port: 5002 (never 3000)
- Base URL: http://localhost:5002
- Mode: Active Development — full read/write access to client/, server/, and shared/

## Scope
- Full implementation access across the monorepo.
- Follow B.L.A.S.T. execution order for all tasks.
- Always run `npm run verify:tech-integrity` before considering a feature complete.

## Documentation & Markdown Constraints
- **Identity:** All generated documentation, SOPs, and code comments must reflect RUN APPAREL (PVT) LTD's "100% B2B, premium sustainable manufacturing identity."
- **Link Checking:** `npm run check:docs` runs rigorously in CI. To prevent pipeline failures:
  - Do not hyperlink private repository URLs (use `<repository-url>` or plain text).
  - Do not hyperlink local files with line-number fragments (e.g., `[file.ts](file.ts:10)`). Use inline code ticks instead.

## Browser Viewports
- Mobile:  375px
- Tablet:  768px
- Desktop: 1440px
- Wide:    1920px (check max-width constraints)

## Severity Scoring
- P0: Critical — broken, crash, security issue, data missing
- P1: Major — feature broken, SEO invisible, significant a11y failure
- P2: Minor — layout issue, slow endpoint, non-critical warning
- P3: Cosmetic — visual polish, minor inconsistency

## Model Routing
- Crawling, screenshots, API probing: @gemini-3.5-flash
- Report synthesis, pattern analysis: @claude-opus-4-6

## Tech Stack Hard Rules (for TypeScript/Biome/animation checks)
- React 19.2.4 (compatible with latest 19.2.7): no forwardRef, named exports, form action= not onSubmit
- Tailwind 4.2.4 (compatible with latest 4.3.2): @theme + @utility syntax, no arbitrary values
- Zod 4.2.1 (supports up to 4.4.3): error: param only (not message:, required_error:)
- Biome 2.3.10 (supports up to 2.5.2): noExplicitAny + noMisusedPromises active
- GSAP 3.15.0 only: zero framer-motion imports allowed (hard rule)
- Scroll library: locomotive-scroll 5.0.1 only (lenis is strictly forbidden)
- sonner ^2.0.7: no custom toast implementations
- neverthrow Result types in service layer: no raw throw statements
- Port: 5002 always — never 3000
- gstack: v1.26.3.0 (enforce gstack-upgrade protocol if version is lower)
- React Router v8 CSP Nonce: Express server `getLoadContext` must return a `RouterContextProvider` instance. To avoid `rootDir` compiler errors and workspace boundary violations, do NOT import client context keys in server files. Instead, define the context key locally on the server, bind it to `globalThis.__nonceContext`, and retrieve it dynamically in the client's `entry.server.tsx`.
- Vite SSR Resolution of Browser-Mapped Packages: For libraries like `isomorphic-dompurify` that define `"browser"` export conditions, ensure they are placed in Vite's `ssr.external` array, and set `ssr.resolve.conditions: ["module", "node"]` and `ssr.resolve.externalConditions: ["node"]` in `vite.config.ts`. This prevents Vite from evaluating browser bundles on the server during SSR.

## Auth & Session Constraints (Enforced via Drizzle)
- **Auth & Sessions:** All session storage MUST use `DrizzleSessionStore` backed by Neon PostgreSQL. The store implementation must return `neverthrow` ResultAsync objects. Raw throws and generic try-catch blocks are strictly prohibited.
- **Redis Boundaries:** `ioredis` is strictly isolated to rate limiting (`rateLimiter.ts`), unified caching (`unified-cache.ts`), and background job coordination. It must NEVER be used for session persistence.

## Server File Location Conventions (Updated 2026-07-08)

These rules were codified after the Phase 3/4 cleanup sprint:

- **`server/db.ts`** — Primary Neon WebSocket DB connection pool. Lives at `server/db.ts` (conventional Express placement). Do NOT move it; it is imported by 14+ files via `"../db.js"` and `"../../db.js"`. Treat as a core infrastructure module.
- **`server/lib/multer-optimized.ts`** — Multer upload middleware with magic-number validation. Canonical location: `server/lib/multer-optimized.ts`. Import via `"../../lib/multer-optimized.js"` from route files.
- **`server/lib/image-processor.ts`** — Sharp-based image processing pipeline. Canonical location: `server/lib/image-processor.ts`. Import via `"../lib/image-processor.js"` from service/route files.
- **`server/migrations/`** — Authoritative Drizzle-kit migration output directory. The root `migrations/` and `drizzle/` directories have been removed (their content was superseded). All new migrations generate into `server/migrations/` as configured in `server/drizzle.config.ts`.

## Deprecated Directories (Removed 2026-07-08)

The following directories were removed in the Phase 3/4 cleanup sprint and must NOT be recreated:

- `src/` — Legacy pre-Remix React application. Permanently removed. All source code is in `client/`, `server/`, and `shared/`.
- `scratch/` — Temporary script graveyard. Gitignored. Do not accumulate scripts here; use the proper `scripts/` workspace instead.
- `findings/` — Session-specific investigation reports. Gitignored. Persistent findings belong in `docs/audits/` or `MASTER_AUDIT_REPORT.md`.
- `tools/` — Contained a single orphaned CMS auditor script. Permanently removed.
- `drizzle/` (root) — Removed. Use `server/migrations/` exclusively.
- `migrations/` (root) — Removed. Use `server/migrations/` exclusively.
- `server/lib/jobs/workers/` — Empty directory from the removed BullMQ integration. Do not recreate. Background jobs use Google Cloud Tasks with `server/routes/worker.ts`.
- `server/lib/jobs/connection.ts` — BullMQ-era Redis connection file. Permanently removed. Never recreate.
- `client/app/types/lenis.d.ts` — Type declaration for the forbidden `lenis` library. Permanently removed. Use `locomotive-scroll` 5.0.1 only.

## GSAP Import Rule (Hardened 2026-07-08)

All GSAP imports in component files MUST use the centralized registry:
```ts
// ✅ Correct — always
import { gsap, ScrollTrigger } from "@/lib/gsap";

// ❌ Never — direct import bypasses plugin registration
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
```
This rule applies to ALL files under `client/app/`. No exceptions.
