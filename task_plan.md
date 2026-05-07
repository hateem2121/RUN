# Task Plan — Monorepo Remediation — Phase 2

## Session: 2026-05-05 (Investigative Audit)

### Objective
Perform a fresh, comprehensive investigative audit of the monorepo architecture and `@run-remix/shared` package to ensure foundational stability and compliance with RUN Remix standards.

### Protocol 0 — Session Bookends
- [x] START: Read and update `task_plan.md`
- [x] END: Update `findings.md` and run `npm run verify:tech-integrity`

### Audit Scope

#### 1. Workspace Configuration
- [x] Verify `package.json` (root) workspaces.
- [x] Each workspace has its own `package.json` with correct `name`.
- [x] `@run-remix/shared` referenced correctly as workspace dependency.
- [x] Root `node_modules` hoisting and deduplication.
- [x] `engines.node` and `.nvmrc` consistency.

#### 2. @run-remix/shared Integrity
- [x] Audit `shared/package.json` exports map.
- [x] Check for boundary violations (client/server imports in shared).
- [x] Verify all Drizzle schemas and Zod viewmodels are exported.
- [x] Audit route constants and manifest.

#### 3. TypeScript & Biome Configuration
- [x] Verify TS v6 configuration (ignoreDeprecations, paths, no baseUrl).
- [x] Check project references and strict mode enforcement.
- [x] Verify Biome v2.3.10 config and absence of ESLint/Prettier.

#### 4. Turborepo & Dependency Hygiene
- [x] Review `turbo.json` pipeline and caching.
- [x] Run `knip` via `verify:tech-integrity`.
- [x] Audit for forbidden dependencies (framer-motion, @react-three/fiber).
- [x] Verify Port 5002 compliance via env schema.

### Status: [x] AUDIT COMPLETE (MR-03 Findings recorded in findings.md)

## Session: 2026-05-05 (Read-Only Investigative Audit)

### Objective
Complete a deep-dive audit of the monorepo architecture and `@run-remix/shared` package to identify architectural regressions and dependency hygiene issues.

### Protocol 0 — Session Bookends
- [x] START: Read and update `task_plan.md`
- [x] END: Update `findings.md` and run `npm run verify:tech-integrity`

### Status: [x] AUDIT COMPLETE

## Session: 2026-05-05 (Database & Schema Layer — Full Investigative Audit)

### Objective
Complete a comprehensive audit of the Drizzle ORM schema, migrations, connection pool, and Zod generation contract.

### Protocol 0 — Session Bookends
- [x] START: Read and update `task_plan.md`
- [x] END: Update `findings.md` and run `npm run verify:tech-integrity`

### B.L.A.S.T. Steps
- [x] **Blueprint**: Audit `shared/schemas/` and build schema map.
- [x] **Link**: Verify Zod re-exports from `@run-remix/shared`.
- [x] **Architect**: Review `drizzle.config.ts`, migrations, and connection pool in `server/db/`.
- [x] **Stylize**: N/A.
- [x] **Trigger**: Compile findings and halt.

### Status: [x] AUDIT COMPLETE (DS-001 through DS-008 recorded in findings.md)

## Session: 2026-05-06 (Monorepo A11Y & Schema Remediation)

### Objective
Systematically resolve Biome A11Y diagnostics, prune unused code via Knip, and consolidate redundant schemas to achieve 100/100 Technical Integrity.

### Protocol 0 — Session Bookends
- [x] START: Read and update `task_plan.md`
- [x] END: Update `findings.md` and run `npm run verify:tech-integrity`

### Accomplishments
- [x] **Phase 1: Investigative Audit** (MR-04 recorded in findings.md)
- [x] **Phase 2: A11Y Remediation**
  - [x] Refactored `sustainability.tsx` landmarks (header/main).
  - [x] Fixed `products.tsx` semantic elements (section, output).
  - [x] Hardened `developer.playground.tsx` form controls and labels.
  - [x] Standardized `button` types in production and test suites.
  - [x] Fixed media accessibility (track elements for videos).
- [x] **Phase 3: Knip Pruning**
  - [x] Deleted 57 unused files identified by Knip.
  - [x] Pruned unused dependencies.
- [x] **Phase 4: Schema Consolidation**
  - [x] Merged `QuoteSubmissionSchema` and `inquiryFormSchema` in `@run-remix/shared`.
  - [x] Updated all references in client and server.
- [x] **Phase 5: Final Verification**
  - [x] Resolved TS ref type mismatch in `custom-select.tsx`.
  - [x] Verified 0 Biome diagnostics.
  - [x] **Tech Integrity Score: 100/100**

### Status: [x] ALL REMEDIATION PHASES COMPLETE

## Session: 2026-05-06 (Database & Schema Layer — Full Investigative Audit)

### Objective
Complete a comprehensive audit of the Drizzle ORM schema, Neon Serverless PostgreSQL connection, migrations, indexes, FK integrity, and Zod generation contract.

### Protocol 0 — Session Bookends
- [x] START: Read and update `task_plan.md`
- [x] END: Update `findings.md` and run `npm run verify:tech-integrity`

### B.L.A.S.T. Execution Order
- [x] **Blueprint**: List files in `shared/schemas/`. Read every Drizzle table definition. Build a complete schema map.
- [x] **Link**: Verify `drizzle-zod` generated schema re-exports from `@run-remix/shared`. Check for locally-defined schemas in `server/` and `client/`.
- [x] **Architect**: Read `drizzle.config.ts`. Verify migrations and connection pool settings in `server/db/`.
- [x] **Stylize**: N/A.
- [x] **Trigger**: Compile findings and halt.

### Investigation Scope
- [x] 1. Schema Completeness & Correctness (Types, NOT NULL, PKs, Timestamps, Soft-delete)
- [x] 2. Foreign Key Integrity (Definitions, onDelete behavior, Orphans)
- [x] 3. Indexes (WHERE clauses, Unique slugs, Composite, Slow queries)
- [x] 4. Drizzle-Zod Generation (Insert/Select schemas, No hand-written Zod, Centralized exports)
- [x] 5. Migrations (Directory, Dialect, Sequential, Committed, No manual SQL)
- [x] 6. Connection Pool (HTTP/WebSocket, Env vars, Pool size, Error handling, Health status)
- [x] 7. JSONB & Complex Types (Zod validation, No untyped jsonb, Arrays)
- [x] 8. Data Consistency (Soft-delete exclusion, DB defaults, UUIDs)
- [x] 9. Query Health (Connection count, Latency, N+1 check)

### Status: [x] REMEDIATION COMPLETE (2026-05-06)

## Phase 6: Database & Schema Layer Remediation

- [x] **Step B: Blueprint - Schema Hardening**
  - [x] Fix missing FK references (DS-002).
  - [x] Standardize `onDelete` behaviors (DS-003).
  - [x] Resolve type inconsistencies (`isActive`) (DS-004).
- [x] **Step L: Link - SSOT Implementation**
  - [x] Migrate local Zod schemas to `@run-remix/shared` (DS-005).
  - [x] Standardize content property naming (DS-008).
- [x] **Step A: Architect - Migration Lifecycle**
  - [x] Generate and verify Drizzle migrations.
  - [x] Consolidate manual optimizations (DS-007).
- [x] **Step S: Stylize - Final Verification**
  - [x] Run `verify:tech-integrity`.
  - [x] Update `findings.md` to mark DS issues as RESOLVED.
- [x] **Step T: Trigger - Landing & Deploy**
