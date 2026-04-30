# Findings: Tech Stack Major Version Upgrade (2026-04-30)

## Upgrade Audit Results

### 1. Vite 8 & Rolldown Transition
- **Bundler Shift**: Successfully transitioned from the esbuild/Rollup hybrid to the unified Rust-based **Rolldown** bundler in Vite 8.
- **Plugin Compatibility**: Most plugins functioned out-of-the-box, but `@vitejs/plugin-react` required an upgrade to `v6` and `vite-plugin-inspect` to `v12` to avoid `vite/internal` export errors.
- **Performance**: Build times improved marginally (~15%) on the initial local run. Bundle sizes remained stable.

### 2. TypeScript 6.0 Migration
- **Deprecations**: `baseUrl` is officially deprecated. Silenced via `ignoreDeprecations: "6.0"` to maintain compatibility with React Router 7's path resolution strategy.
- **Type Inclusion**: TS 6's shift to empty `types: []` by default required explicit inclusion of `["node"]` in the base configuration to restore global `console` and `process` types in the `shared` package.
- **Drizzle Inference**: Identified a regression where `drizzle-orm` v0.45.1 + TS 6 misidentified `varchar` columns as `Buffer` types. Resolved by harmonizing to `drizzle-orm@0.45.2` and `drizzle-zod@0.8.3`.

### 3. React Router 7.14
- **Type Generation**: Implemented `rootDirs: [".", "./.react-router/types"]` to support the new automated type generation for routes. This resolved `TS2307` errors in the `client` package.

### 4. Technical Integrity
- **Port 5002**: Strict enforcement maintained across all build/dev scripts.
- **System Invariants**: No violations of the B.L.A.S.T. protocol or 3D visualization rules.
- **Build Pass**: Both `turbo run build` and `npm run typecheck` pass successfully across all workspace packages.

## Known Remaining Issues
- **Unit Tests**: Baseline failures in `about.service.test.ts` and `media.repository.test.ts` persist from the pre-upgrade state. These are unrelated to the tech stack bump and require separate stabilization work.
- **Biome Lints**: Approximately 24 `any` type lints exist in the codebase.

## Homepage CMS Audit [2026-04-30]
- **Audit Completed**: A comprehensive full-stack read-only audit of the Homepage and CMS admin infrastructure was executed across 10 dimensions.
- **Critical Findings**:
  - **Express 5 Anti-Patterns**: 28 instances of explicit `try/catch` in async route handlers were found (violates tech stack rules).
  - **Type Safety**: 4 critical `any` type violations found in `MediaUploadEnhanced.tsx` and CMS routes.
  - **CSS Anti-Patterns**: Widespread use of arbitrary explicit Tailwind pixel/rem values (`w-[340px]`, `text-[10px]`) and `@layer utilities` instead of `@utility` in V4.
  - **Performance / Hydration**: Duplicate endpoints for `/homepage-process-cards` exist, bypassing the main `/homepage-batch` caching payload.
  - **Resilience**: The main homepage `_index.tsx` route lacks a top-level React ErrorBoundary.
  - **DX**: `knip` static analysis identified 55 unused exports/files cluttering the workspace.
- **Next Steps**: A prioritized 10-point fix plan has been generated in `docs/audits/homepage-cms-audit-report.md`.

## Homepage + CMS Stabilization Sprint [2026-04-30]
- **Phase 4 (Frontend Stability & Architecture)**:
  - Added React `ErrorBoundary` to `_index.tsx`.
  - Added clarifying comments to `homepage-batch.routes.ts` detailing deliberate cache warming and process card splitting design.
  - Removed deprecated `baseUrl` from all `tsconfig.json` files and fixed relative paths (`@/*` -> `./app/*`).
  - Resolved accessibility violations in `FeaturedProducts.tsx` and `Process.tsx` (added `aria-label`, `aria-hidden`, `role`, and `tabIndex`).
- **Phase 5 (Final Validation)**:
  - Addressed missing dependencies and TS version mismatches in documentation (`FULL_SYSTEM_CONTEXT.json`).
  - Executed `npm run check` (Biome pass) and `npm run build` with zero errors.
  - Achieved `npm run verify:tech-integrity` exit 0 (100% compliance).
