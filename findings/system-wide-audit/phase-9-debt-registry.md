# Phase 9: Debt Registry Findings

*(Note: Counts successfully exclude `node_modules`, `dist`, `build`, `.vite`, and generated folders like `+types`)*

## D01: TODO / FIXME count
**Severity:** Info
**Grep evidence:** `grep -rnIE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=.vite --exclude-dir=\+types "TODO|FIXME" client/ server/ shared/`
**Count:** 2 occurrences
**Description:** There are 2 outstanding TODO/FIXME comments in the codebase (located in `shared/schemas/products.ts` and `shared/schemas/categories.ts`).

## D02: ts-ignore / @ts-expect-error count
**Severity:** P2 Minor
**Grep evidence:** `grep -rnIE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=.vite --exclude-dir=\+types "ts-ignore|@ts-expect-error" client/ server/ shared/`
**Count:** 4 occurrences
**Description:** There are 4 instances circumventing TypeScript strict type checking (`client/app/components/admin/product-management-unified/admin/ProductCreateEditModal.tsx`, two in `client/app/root.tsx`, and one in `server/services/__tests__/auth-service.test.ts`).

## D03: eslint-disable count
**Severity:** Info
**Grep evidence:** `grep -rnIE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=.vite --exclude-dir=\+types "eslint-disable" client/ server/ shared/`
**Count:** 1 occurrence
**Description:** A single instance of ESLint bypass was located in `server/lib/db/repositories/misc-repository.ts` which uses `@typescript-eslint/no-unused-vars` suppression.

## D04: biome-ignore count
**Severity:** P2 Minor
**Grep evidence:** `grep -rnIE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=.vite --exclude-dir=\+types "biome-ignore" client/ server/ shared/`
**Count:** 40 occurrences
**Description:** The codebase has 40 occurrences of `biome-ignore` suppressing linter/formatter rules across various files.
