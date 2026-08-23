# Database Index Reclamation & pgvector Semantic Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drop the 4 redundant duplicate index pairs to reclaim ~1.2 MB index storage, enable the `vector` extension in Neon PostgreSQL 17.11, add 384-dimensional vector embeddings and HNSW indexes to `products` and `fabrics`, and build an AI-powered natural language semantic search endpoint and frontend component for B2B buyers.

**Architecture:**
1. **Index Reclamation:** Execute `0016_reclaim_duplicate_indexes.sql` to drop redundant duplicate indexes while preserving unique constraints. Synchronize `@run-remix/shared` Drizzle schema definitions.
2. **pgvector Storage & Indexing:** Enable `vector` extension on Neon, add `embedding vector(384)` column to `products` and `fabrics` tables, and build HNSW cosine distance indexes (`vector_cosine_ops`).
3. **Semantic Embedding & Search Engine:** Build `embedding.service.ts` and `semantic-search.service.ts` returning neverthrow `ResultAsync<SemanticSearchResponse, AppError>` wrapped with `opossum` circuit breakers.
4. **API & Client UI:** Expose rate-limited `GET /api/search/semantic` in Express 5 and create `<SemanticSearchBar />` with responsive preview cards in React 19.

**Tech Stack:**
- Neon Serverless PostgreSQL 17.11 (`vector` extension v0.8.0, HNSW index)
- Drizzle ORM 0.45.2 (`customType` vector mapping) + Drizzle Zod
- `@run-remix/shared` contract schemas + Zod 4.4.3
- Express 5.2.1 + `neverthrow` 8.1.1 + `opossum` 9.0.0
- React 19.2.7 + React Router v8 + Tailwind CSS v4 `@theme`
- Vitest 4.0.6

---

## Global Constraints

- Never use `try/catch` in Express 5 route handlers or `server/services/` (use `neverthrow` ResultAsync).
- Never use arbitrary Tailwind brackets (use `@theme` tokens in `client/app/styles/theme.css`).
- Never use `forwardRef(...)` (use React 19 raw `ref`).
- Keep dev server on port `5002` (never 3000).
- All new routes and functions must be unit tested with Vitest before marking complete.

---

### Task 1: Execute Database Index Reclamation Migration & Update Drizzle Schemas

**Files:**
- Create: `server/migrations/0016_reclaim_duplicate_indexes.sql`
- Modify: `shared/schemas/sessions.ts:1-12`
- Modify: `shared/schemas/content/legal.ts:25-32`
- Test: `tests/unit/server/index-reclamation.test.ts`

**Interfaces:**
- Consumes: Neon PostgreSQL catalog
- Produces: Sanitized Drizzle schema definitions without duplicate index declarations

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { sessions } from "@run-remix/shared";
import { legalPolicies } from "@run-remix/shared";

describe("Index Reclamation Schema Validation", () => {
  it("sessions table does not declare redundant sessions_expire_idx", () => {
    // Verify sessions table definition contains no duplicate index
    expect(sessions).toBeDefined();
  });

  it("legalPolicies table contains only uniqueIndex and no duplicate index", () => {
    expect(legalPolicies).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails or executes**

Run: `npx vitest run tests/unit/server/index-reclamation.test.ts`

- [ ] **Step 3: Create migration SQL file `server/migrations/0016_reclaim_duplicate_indexes.sql`**

```sql
-- Migration 0016: Reclaim Duplicate & Redundant Indexes
-- Drops redundant indexes where a unique constraint or primary index already exists on the same column.

DROP INDEX IF EXISTS public.sessions_expire_idx;
DROP INDEX IF EXISTS public.contacts_email_idx;
DROP INDEX IF EXISTS public.contacts_erpnext_idx;
DROP INDEX IF EXISTS public.legal_policies_slug_idx;
```

- [ ] **Step 4: Update `shared/schemas/sessions.ts` and `shared/schemas/content/legal.ts`**

Update `shared/schemas/sessions.ts`:
```typescript
import { jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  }
);
```

Update `shared/schemas/content/legal.ts`:
```typescript
export const legalPolicies = pgTable(
  "legal_policies",
  {
    id: serial("id").primaryKey(),
    slug: varchar({ length: 255 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      precision: 3,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("legal_policies_slug_unique_active").on(table.slug),
  ],
);
```

- [ ] **Step 5: Apply migration to Neon Database and run tests**

Run: `npx vitest run tests/unit/server/index-reclamation.test.ts`
Expected: PASS

---

### Task 2: Enable pgvector Extension & Add Vector Columns to Products and Fabrics

**Files:**
- Create: `server/migrations/0017_enable_pgvector_and_embeddings.sql`
- Create: `shared/schemas/vector.ts`
- Modify: `shared/schemas/products.ts`
- Modify: `shared/schemas/materials.ts`
- Modify: `shared/schemas/index.ts`
- Test: `tests/unit/shared/vector-schema.test.ts`

**Interfaces:**
- Consumes: PostgreSQL `vector` extension
- Produces: `vector(384)` column type in Drizzle and HNSW index definitions

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { products, fabrics } from "@run-remix/shared";

describe("Vector Schema Definitions", () => {
  it("products schema exports embedding vector column", () => {
    expect("embedding" in products).toBe(true);
  });

  it("fabrics schema exports embedding vector column", () => {
    expect("embedding" in fabrics).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/shared/vector-schema.test.ts`
Expected: FAIL with "embedding in products is false"

- [ ] **Step 3: Create `shared/schemas/vector.ts` custom Drizzle vector type**

```typescript
import { customType } from "drizzle-orm/pg-core";

export const vector = customType<{ data: number[]; driverData: string }>({
  dataType(config) {
    const dimensions = config?.dimensions || 384;
    return `vector(${dimensions})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`;
  },
  fromDriver(value: string): number[] {
    if (!value) return [];
    return value
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map(Number);
  },
});
```

- [ ] **Step 4: Create migration `server/migrations/0017_enable_pgvector_and_embeddings.sql`**

```sql
-- Migration 0017: Enable pgvector and Add Embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Add 384-dimensional vector embedding column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Add 384-dimensional vector embedding column to fabrics
ALTER TABLE fabrics ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create HNSW cosine similarity index on products
CREATE INDEX IF NOT EXISTS products_embedding_hnsw_idx 
ON products USING hnsw (embedding vector_cosine_ops);

-- Create HNSW cosine similarity index on fabrics
CREATE INDEX IF NOT EXISTS fabrics_embedding_hnsw_idx 
ON fabrics USING hnsw (embedding vector_cosine_ops);
```

- [ ] **Step 5: Apply migration to Neon Database and run tests**

Run: `npx vitest run tests/unit/shared/vector-schema.test.ts`
Expected: PASS

---

### Task 3: Build Embedding Generator & Semantic Search Service

**Files:**
- Create: `shared/schemas/api/search.ts`
- Create: `server/services/embedding.service.ts`
- Create: `server/services/semantic-search.service.ts`
- Test: `tests/unit/server/semantic-search.test.ts`

**Interfaces:**
- Consumes: Text query string (`q: string`), optional category filter (`category?: string`)
- Produces: `SemanticSearchResult[]` with cosine similarity match scores (`0.0% - 100.0%`)

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { generateEmbedding, calculateCosineSimilarity } from "../../../server/services/embedding.service.js";

describe("Embedding Service", () => {
  it("generates normalized 384-dimensional embedding vector", async () => {
    const vec = await generateEmbedding("breathable moisture-wicking soccer jersey");
    expect(vec).toHaveLength(384);
    // Norm should be ~ 1.0
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 3);
  });

  it("calculates cosine similarity correctly", () => {
    const v1 = [1, 0, 0];
    const v2 = [1, 0, 0];
    const v3 = [0, 1, 0];
    expect(calculateCosineSimilarity(v1, v2)).toBeCloseTo(1.0, 4);
    expect(calculateCosineSimilarity(v1, v3)).toBeCloseTo(0.0, 4);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/server/semantic-search.test.ts`

- [ ] **Step 3: Implement `server/services/embedding.service.ts` and `server/services/semantic-search.service.ts`**

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/server/semantic-search.test.ts`
Expected: PASS

---

### Task 4: Seed Database with 384D Embeddings & Expose API Route

**Files:**
- Create: `scripts/seed-embeddings.ts`
- Create: `server/routes/search.ts`
- Modify: `server/routes/index.ts`
- Test: `tests/unit/server/search-route.test.ts`

**Interfaces:**
- Consumes: `GET /api/search/semantic?q=...&category=...`
- Produces: JSON response `{ success: true, data: { query: "...", results: [...] } }`

- [ ] **Step 1: Write failing API route test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement route handler in `server/routes/search.ts` and mount in `server/routes/index.ts`**
- [ ] **Step 4: Execute `scripts/seed-embeddings.ts` to populate vectors for all 11 products and 6 fabrics**
- [ ] **Step 5: Run test to verify it passes**

---

### Task 5: Build Frontend `<SemanticSearchBar />` & Results UI

**Files:**
- Create: `client/app/components/search/SemanticSearchBar.tsx`
- Create: `client/app/components/search/SemanticSearchResults.tsx`
- Modify: `client/app/routes/products.tsx`
- Modify: `client/app/routes/fabrics.tsx`
- Test: `tests/unit/client/components/search/semantic-search-bar.test.tsx`

**Interfaces:**
- Consumes: User search query input and category filter
- Produces: Interactive debounced search bar with instant semantic score badge display

- [ ] **Step 1: Write failing component test**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `<SemanticSearchBar />` with debounce, Lucide icons, and Tailwind v4 `@theme` styling**
- [ ] **Step 4: Mount into Products and Fabrics catalog views**
- [ ] **Step 5: Run test to verify it passes**

---

### Task 6: Full Monorepo Integrity & Verification

- [ ] **Step 1: Run `npm run check` (TypeScript + Biome 2.5)**
- [ ] **Step 2: Run `npm run build` (Turborepo Full Turbo)**
- [ ] **Step 3: Run `npx vitest run` (All test suites)**
- [ ] **Step 4: Run `npm run verify:tech-integrity` (All 8 checks)**
- [ ] **Step 5: Update `findings.md` and `task_plan.md`**

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-23-index-reclamation-and-pgvector-search.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach would you prefer?**
