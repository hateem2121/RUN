# Design Document: ProductCreateEditModal Refactor

**Date:** 2026-04-27
**Topic:** Refactoring `ProductCreateEditModal.tsx` (~1,235 LOC) into a Provider Pattern

## Current State & Problem
`client/app/components/admin/product-management-unified/admin/ProductCreateEditModal.tsx` is currently a monolithic file handling:
1. Orchestration of 8+ `useQuery` API lookups.
2. Form state management via `useProductForm`.
3. Auto-save and Keyboard shortcut workflow logic.
4. Custom 300+ line validation engine.
5. Mutations (`createProductMutation`, `updateProductMutation`) and manual cache invalidation.
6. Render heavy UI: Header, Footer, Progress Bar, Status Indicators.

## Chosen Architecture: Hybrid Provider Pattern
We are adopting a hybrid context-driven approach to separate the "Engine" (state/logic) from the "Skin" (UI). 

### 1. The Engine (State & Logic)
- **ProductFormContext (`state/ProductFormContext.tsx`)**: Wraps the form and provides all data, queries, mutations, and validation errors via `useProductContext()`.
- **Zod Validation (`schema/product-validation.schema.ts`)**: Replaces the custom `validateField` with a native `z.object` schema mapped to `InsertProduct`, enforcing the B.L.A.S.T. Link protocol on the frontend.
- **Specialized Hooks (`hooks/useProductQueries.ts`, `hooks/useProductMutations.ts`)**: Encapsulates the heavy React Query logic.

### 2. The Skin (UI Components)
- **Extracted Components**: `ProductFormHeader`, `ProductFormProgress`, and `ProductFormFooter` will be moved into `admin/components/`. They will consume state directly from `useProductContext()`, eliminating prop-drilling.
- **Clean Shell**: The `ProductCreateEditModal` will be reduced to a lightweight `Dialog` shell (~150 LOC) that initializes the provider and orchestrates the lazy-loaded layout.

## Advantages
- **DX**: Completely removes prop-drilling into the 6 lazy-loaded form sections.
- **Performance**: Prevents full modal re-renders when a specific contextual state changes.
- **Maintainability**: Replaces 300 lines of custom validation with a standard Zod schema.

## Execution
This design will be executed via an implementation plan, ensuring test coverage and protocol compliance.
