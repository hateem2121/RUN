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

## Monorepo & Shared Package Audit Findings (MR-01)

### MR-01.1: Workspace Configuration
- **Status**: ✅ PASS
- **Details**: `package.json` root workspaces correctly list `client`, `server`, `shared`, `utils`, `scripts`. Node version pinned to `v24.15.0` in `.nvmrc` and consistent with `engines`. Major dependencies (React 19.2.4, TypeScript 6.0.3, Vite 8.0.10) are correctly hoisted and deduped.

### MR-01.2: @run-remix/shared Package Integrity
- **Status**: ✅ PASS
- **Boundary Violations**: Zero client/server/react imports found in `shared/`.
- **Exports**: `shared/package.json` exports map is restrictive (root only). All Drizzle schemas and Zod viewmodels are correctly exported from `shared/index.ts`.
- **Finding**: Unused export `QuoteSubmissionSchema` found in `shared/validation/contact.ts`.

### MR-01.3: TypeScript Configuration (v6)
- [x] Status: ✅ PASS
- [x] Standard: `ignoreDeprecations: "6.0"` present; no `baseUrl` used (paths only).
- [x] Remediation: Removed `noUnusedLocals: false` and `noUnusedParameters: false` from `server/tsconfig.json` to inherit strictness from base.
- [x] Remediation: Resolved all 40+ TypeScript errors across `server/` and `client/` packages, including unused variables and path resolution issues.

### MR-01.4: Biome Configuration
- **Status**: ✅ PASS
- **Details**: Biome `2.3.10` correctly configured as SSOT. No conflicting ESLint/Prettier files found. `noExplicitAny` enforced as error.

### MR-01.5: Forbidden Dependencies
- **Status**: ✅ PASS
- **Details**: `framer-motion`, `@react-three/fiber`, and `drei` are completely absent from `package.json`. Documentation references remain but do not reflect runtime state.
- **Finding**: Hardcoded PORT fallback patterns are absent from code, correctly deferred to `env.schema.ts` (Port 5002 invariant).

### MR-01.6: Dead Code (knip) & Dependency Hygiene
- **Status**: ✅ PASS
- **Remediation**: Surgically removed 38 unused scripts and middleware files identified by `knip`.
- **Remediation**: Corrected `server/package.json` dependencies (added `vite` for SSR).
- **Status**: All non-critical warnings resolved.

### MR-01.7: gstack Version Check
- **Status**: 🔴 FAIL
- **Details**: `cat .claude/skills/gstack/VERSION` reports `1.15.0.0`. User requested ≥ `1.20.0.0`. `/gstack-upgrade` not available in this environment.
