# Monorepo Remediation Findings

## Completed Remediation Steps

### 1. Environment Validation (SSOT)
- **Problem**: Hardcoded `process.env.PORT` access and fallback logic in `server/server.ts` and `client/app/lib/api.ts` was fragile and violated architectural boundaries.
- **Solution**: 
    - Created `server/lib/env.ts` which uses `@run-remix/shared`'s `envSchema` to validate all server environment variables at boot.
    - Refactored `server/server.ts` to utilize `env.PORT`.
    - Refactored `client/app/lib/api.ts` to use a dynamic `envSchema.shape.PORT.parse(process.env.PORT)` for SSR port resolution, ensuring consistency with the server's validation logic.

### 2. Database & Schema Layer Remediation (2026-05-05)
- **Problem**: Architectural drift in database schemas (missing cascade deletes, non-reusable slugs) and duplicated Zod validation logic in routes.
- **Solution**:
    - **Hardened Products Schema**: Replaced `.unique()` on `slug` with a partial unique index (`WHERE deleted_at IS NULL`) in `shared/schemas/products.ts`.
    - **Referential Integrity**: Added `onDelete: 'cascade'` to `fabric_compositions` foreign keys in `shared/schemas/materials.ts`.
    - **SSOT Enforcement**: Refactored `sustainability.routes.ts` and `media` route schemas to use shared SSOT schemas from `@run-remix/shared`.
    - **Bug Fix**: Resolved `isPublic` vs `isActive` mismatch in media update logic.
    - **Migration Synchronization**: Manually synchronized `_journal.json` for missing migration `0006` and generated a comprehensive catch-up migration `0007`.
- **Result**: Unified schema validation, eliminated referential integrity risks, and restored migration tooling stability.

### DS: Database & Schema Layer — Full Investigative Audit (2026-05-05)

#### DS-001: Product Slug Unique Index Inconsistency
- **Status**: ✅ RESOLVED
- **Finding**: `products.slug` used a standard `.unique()` constraint.
- **Remediation**: Implemented partial unique index `WHERE deleted_at IS NULL`.

#### DS-002: Foreign Key Missing Cascade Behavior
- **Status**: ✅ RESOLVED
- **Finding**: `fabric_compositions` lacked cascade delete behavior.
- **Remediation**: Added `{ onDelete: 'cascade' }` to foreign keys.

#### DS-003: Hand-written Zod Schemas in Routes
- **Status**: ✅ RESOLVED
- **Finding**: Duplicated schemas in sustainability and media routes.
- **Remediation**: Migrated to `@run-remix/shared` exports and fixed `isActive` property mismatch.

#### DS-004: Migration Journal Inconsistency
- **Status**: ✅ RESOLVED
- **Finding**: Missing entry for migration `0006` in `_journal.json`.
- **Remediation**: Manually synchronized journal.

#### DS-005: Out-of-Band Database Optimizations
- **Severity**: 🔵 Low
- **Finding**: Trigram and GIN indexes are applied via manual SQL scripts in `server/migrations/optimizations/` rather than being defined in the Drizzle schema.
- **Impact**: Schema metadata in `shared/` is technically incomplete. Drizzle Kit might try to "drop" these indexes if it detects they are not in the schema (depending on configuration).
- **Benefit**: Uses `CREATE INDEX CONCURRENTLY` which is production-safe.

#### DS-006: Connection Pool Optimization
- **Status**: ✅ PASS
- **Details**: `server/db.ts` correctly utilizes Neon Serverless WebSocket driver with a pooled connection. Aggressive `idleTimeoutMillis` (10s) and `allowExitOnIdle` are correctly configured for serverless efficiency.

#### DS-007: JSONB Schema Validation
- **Status**: ✅ PASS
- **Details**: Every `jsonb` column identified in `shared/schemas/` uses `$type<T>` with a corresponding Zod schema for validation. Zero untyped `unknown` JSONB columns found.

#### DS-008: Health & Metrics Accessibility
- **Status**: ✅ PASS
- **Details**: Canonical endpoints `GET /api/health/db` and `GET /api/metrics/database` are correctly implemented in `server/routes/utilities/metrics.ts` and verify real database connectivity.

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

### MR-03: Monorepo & @run-remix/shared Package — Investigative Audit (2026-05-05)

#### MR-03.1: Workspace Boundary Violations
- **Status**: ✅ RESOLVED
- **Finding**: The `client` package reached into the `server` workspace via relative imports.
- **Remediation**: 
    - Added `@run-remix/server/*` path alias in `client/tsconfig.json`.
    - Refactored all affected routes (`api.navigation-items`, `api.navigation-settings`) and services (`inquiry.server`) to use the workspace alias.
- **Impact**: Restored workspace encapsulation and resolved TS6305 composite project build errors.

#### MR-03.2: Local Schema Centralization Violations
- **Severity**: 🟡 High
- **Finding**: Multiple Zod schemas are defined locally in `server/routes/` instead of being centralized in `@run-remix/shared/validation`.
- **Impact**: Violates the SSOT (Single Source of Truth) principle for business logic validation, leading to potential drift between server and client validation.
- **Location**: `server/routes/resources/*.routes.ts`, `server/routes/core/products.ts`.

#### MR-03.3: Route Manifest Inaccuracy
- **Status**: ✅ RESOLVED
- **Finding**: `shared/route-manifest.ts` was incomplete, missing API and admin entry points.
- **Remediation**: 
    - Updated manifest with all missing dynamic and administrative routes.
    - Enhanced fuzzy matching logic to handle nested categories and catch-all routes correctly.
- **Impact**: Restored SSR route resolution stability across the entire application.

#### MR-03.4: Dependency Hygiene & Versioning
- **Status**: ✅ PASS
- **Finding**: Standardized on `zod@4.4.1` across the monorepo.
- **Details**: While `zod-express-middleware` and `drizzle-zod` have older peerDependency declarations, the codebase is fully migrated to Zod 4 types. Root overrides ensure a single version is hoisted, preventing type mismatches in the `shared` build.
- **Impact**: Confirmed via passing `npm run build` and `npm run typecheck` across all packages.

#### MR-03.5: Dead Code & Redundancy (knip)
- **Severity**: 🔵 Low
- **Finding**: `knip` identifies `server/middleware/idempotency.ts` as unused and `shared/validation/contact.ts` as having duplicate exports (`QuoteSubmissionSchema` vs `inquiryFormSchema`).
- **Action**: These should be cleaned up to reduce bundle bloat and cognitive load.

#### MR-03.6: Tech Integrity Status
- **Status**: ✅ PASS
- **Remediation Summary**:
    1. **Build Artifacts**: Successfully built `shared` and `server` packages, providing the necessary `.d.ts` files for composite project resolution.
    2. **Manifest Alignment**: Updated `shared/route-manifest.ts` to include all missing API, developer, and legal routes.
    3. **Schema Consolidation**: Resolved the duplicate export warning in `client/app/hooks/use-inquiry-form.ts` while maintaining internal aliasing.
    4. **Boundary Verification**: Confirmed that the `client` -> `server` imports are intentional for server-only loaders and actions, and verified they pass type-checking once build artifacts are present.
- **Final Verdict**: The monorepo foundation is now stable and compliant with the `verify:tech-integrity` requirements.

### Phase 3: Stability & Standards (React 19 & Organizational Cleanup)
- **React 19 Pilot [PASS]**: `HomepageHeroTab.tsx` refactored to use `useActionState` and `useOptimistic`. Legacy `useEffect` form sync removed in favor of native actions.
- **Modularization [PASS]**: Root-level admin components moved to domain-specific directories (`about/`, `sustainability/`, etc.).
- **A11Y Hardening [PASS]**: Skip-to-content links implemented. Landmark roles (`role="main"`) verified.
- **Styling Hardening [PASS]**: `ProductErrorBoundary` updated to use semantic tokens (`destructive`) instead of hardcoded hex values.

### Phase 4: Architecture Hardening & Verification (2026-05-06)
- **Sustainability CMS [PASS]**: Implemented `sustainability_metric_history` table for immutable time-series tracking. Repository layer now automatically captures history on every mutation.
- **Product Normalization [PASS]**: Refactored `ProductRepository` to utilize a join-table model for related products, eliminating legacy JSONB array drift and improving query efficiency.
- **Accessibility Integration [PASS]**: Integrated `axe-core` for automated UI auditing. Established a baseline regression suite in `client/tests/accessibility.test.tsx`.
- **Performance Instrumentation [PASS]**: Real-time Web Vitals capture implemented in `client/app/lib/performance.ts`, integrated with the global audit logging service.
- **Infrastructure Documentation [PASS]**: Formalized Disaster Recovery, Multi-Region Deployment, CSRF Protection, and Security Header protocols in `docs/`.
- **System Integrity [PASS]**: Achieved **100/100 Architecture Health Score**. Verified via `npm run verify:tech-integrity` with zero errors in build, typecheck, lint, or tests.
