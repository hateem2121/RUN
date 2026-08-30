# ADR 0019: Zod v4 Nullish Standard over Chained Modifiers

**Status:** Accepted  
**Date:** 2026-08-25  
**Deciders:** RUN Remix Systems Architecture Team  

## Context

Data contract validation across `@run-remix/shared` schemas previously used legacy Zod v3 chaining patterns (`.nullable().optional()` or `.optional().nullable()`) for fields that may accept `null`, `undefined`, or absent object keys:
- Chaining `.nullable().optional()` generates redundant AST wrapper nodes in Zod runtime schema trees.
- Inconsistent ordering between `.nullable().optional()` and `.optional().nullable()` creates stylistic inconsistencies.
- Zod v4 provides first-class `.nullish()` modifier that accepts `T | null | undefined` with a single AST modifier.

## Decision

We enforce the canonical **Zod v4 `.nullish()` standard** across all shared schemas, API parameter validators, and form validation schemas.

## Rationale

1. **Schema AST Efficiency:** Eliminates duplicate schema wrapper instances.
2. **Readability & Consistency:** A single modifier conveys both `null` and `undefined` acceptance cleanly.
3. **Repository Invariant Alignment:** Aligns with rule §5.1 forbidden patterns in `gemini.md`.

## Consequences

### Positive

- Clean, concise schema declarations across `@run-remix/shared`.
- Eliminates linter and type-checking ambiguities in React 19 forms and Express 5 route validation.

### Negative

- Requires awareness from developers migrating legacy Zod v3 codebases.

## Implementation

```typescript
// shared/schemas/api/search.ts
import { z } from "zod";

export const searchItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullish(),
  categoryName: z.string().nullish(),
  technicalSummary: z.string().nullish(),
});
```
