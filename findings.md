# Monorepo Remediation Findings

## Completed Remediation Steps

### 1. Environment Validation (SSOT)
- **Problem**: Hardcoded `process.env.PORT` access and fallback logic in `server/server.ts` and `client/app/lib/api.ts` was fragile and violated architectural boundaries.
- **Solution**: 
    - Created `server/lib/env.ts` which uses `@run-remix/shared`'s `envSchema` to validate all server environment variables at boot.
    - Refactored `server/server.ts` to utilize `env.PORT`.
    - Refactored `client/app/lib/api.ts` to use a dynamic `envSchema.shape.PORT.parse(process.env.PORT)` for SSR port resolution, ensuring consistency with the server's validation logic.

### 2. Schema Centralization
- **Problem**: Business logic validation schemas were fragmented and defined locally in Express routes.
- **Solution**: Migrated the following schemas to `@run-remix/shared/validation`:
    - `createInquirySchema`
    - `productsQuerySchema`
    - `productByPathSchema`
    - `categoryReorderSchema`
- **Result**: Server and client (SSR/Loaders) now share exact validation logic, preventing data divergence.

### 3. UI Component Standardization
- **Problem**: Multiple core UI components used `default` exports, violating the project rule for named exports.
- **Solution**: Converted the following to named exports and updated all import sites:
    - `FlipCard`
    - `ExpandableCard`
    - `ProductCreateEditModal`
    - `StandardMediaSelectionDialog`
    - `CategoryList`
    - `CategoryDisplay`
    - `CategoryForm`

### 4. Workspace Configuration
- **Knip**: Updated `knip.config.ts` to include `shared/` and `utils/` scopes for comprehensive unused code detection.
- **TypeScript**: Hardened `client/tsconfig.json` by removing server path aliases. Restored the `references` to `../server` because React Router resource routes and server actions in the client package directly depend on server services for business logic.

## Verification Status
- **Tech Integrity**: `npm run verify:tech-integrity` passed with minor non-critical warnings.
- **Typecheck**: `npm run typecheck` passed.
- **Lint**: Biome 2.3.10 enforced; multiple `export default` violations flagged in client components.
- **Security**: Passed `npm audit`; vulnerable allowlisted advisories tracked.

### MR-02: Comprehensive Monorepo & Shared Package Audit (2026-05-05)

#### MR-02.1: Workspace Configuration
- **Status**: ✅ PASS
- **Details**: Root `package.json` correctly defines workspaces (`client`, `server`, `shared`, `utils`, `scripts`). Node version `v24.15.0` is pinned in `.nvmrc` and consistent with `engines`. Major dependencies (React 19, TS 6, Vite 8, Biome 2.3.10) are correctly hoisted and managed via root overrides.

#### MR-02.2: @run-remix/shared Package Integrity
- **Status**: ✅ PASS
- **Boundary Violations**: Zero `client/`, `server/`, or `react` imports found in `shared/` via recursive grep.
- **Exports**: `shared/package.json` correctly utilizes `exports` map for root entry point. `shared/index.ts` exports all required Drizzle schemas, Zod viewmodels, and route constants.
- **Route Manifest**: `shared/route-manifest.ts` is present and synchronized with actual route structure.

#### MR-02.3: TypeScript Configuration (v6)
- **Status**: ✅ PASS
- **Details**: Root `tsconfig.base.json` correctly sets `ignoreDeprecations: "6.0"`. No `baseUrl` is used; all resolution is handled via `paths`.
- **Strictness**: `strict: true` and `noExplicitAny: "error"` (via Biome) are enforced.
- **Project References**: Workspace `tsconfig.json` files correctly use `references` to link dependencies (`client` -> `shared`, `client` -> `server`, `server` -> `shared`).

#### MR-02.4: Biome Configuration
- **Status**: ✅ PASS
- **Details**: Biome `2.3.10` is the single source of truth for linting and formatting. No conflicting `.eslintrc` or `.prettierrc` files exist in the repository.

#### MR-02.5: Turborepo Pipeline
- **Status**: ✅ PASS
- **Details**: `turbo.json` correctly defines task dependencies (`build` depends on `^build`) and specifies inputs/outputs for optimized caching.

#### MR-02.6: Forbidden Dependencies & Hygiene
- **Status**: ✅ PASS
- **Details**: `framer-motion`, `@react-three/fiber`, and `drei` are absent from all `package.json` files and source code.
- **Documentation Note**: `docs/core/sops/SOP_UI_UPGRADE.md` contains stale references to `framer-motion`. This is a non-runtime finding but should be updated for clarity.
- **Port Compliance**: All port-related logic deferred to `env.schema.ts` (Port 5002 invariant).

#### MR-02.7: Tech Integrity Report
- **Status**: ✅ PASS
- **knip**: Identified minor unused exports and duplicate types (e.g., `QuoteSubmissionSchema`). These do not affect system stability but should be cleaned up in a future maintenance sprint.
- **Audit**: Security audit passed with 0 critical/high vulnerabilities. Pinned `uuid` and `@google-cloud/storage` versions tracked.
- **SSR Invariants**: Vitest suite passed, confirming React 19 hydration and externalization invariants.
