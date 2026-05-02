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
- **Tech Integrity**: `npm run verify:tech-integrity` passed.
- **Typecheck**: `npm run typecheck` passed after building the `shared` package to update type definitions.
- **Lint**: `npm run lint` identifies pre-existing a11y and formatting issues, but no new architectural violations were introduced.
- **Security**: `npm audit fix` was executed; remaining moderate vulnerabilities are tracked in `@google-cloud/storage` dependencies.
