# ADR 0005: Drizzle ORM over Prisma

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed an ORM/query builder that:

- Provides end-to-end type safety
- Has minimal runtime overhead
- Supports PostgreSQL with HTTP drivers
- Generates efficient SQL queries

## Decision

We chose **Drizzle ORM** over Prisma.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Drizzle** | SQL-like, lightweight, HTTP driver support | Newer, less tooling |
| **Prisma** | Great DX, visual studio, migrations | Heavy runtime, no HTTP driver |
| **Kysely** | Type-safe query builder | No schema definition |
| **Raw SQL** | Full control | No type safety |

## Rationale

1. **HTTP Driver Compatibility**: Drizzle works with `@neondatabase/serverless` HTTP driver
2. **SQL-like Syntax**: Queries map closely to SQL, reducing abstraction leakage
3. **Lightweight**: No query engine binary, minimal bundle impact
4. **Zod Integration**: `drizzle-zod` generates validators from schema
5. **Schema as Code**: TypeScript schema doubles as documentation

## Consequences

### Positive

- Type-safe queries with excellent inference
- Shared schema between client/server via `@run-remix/shared`
- Efficient SQL generation
- Zero runtime dependencies beyond pg driver

### Negative

- Less mature migration tooling than Prisma
- Fewer learning resources available
- Studio/visualization tools less polished
