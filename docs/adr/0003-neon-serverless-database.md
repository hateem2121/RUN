# ADR 0003: Neon Serverless over Traditional PostgreSQL

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed a PostgreSQL database solution that:
- Scales automatically with traffic
- Minimizes cold start latency
- Integrates well with serverless infrastructure (Cloud Run)
- Provides cost-effective development environments

## Decision

We chose **Neon Serverless PostgreSQL** over traditional managed PostgreSQL (Cloud SQL, RDS).

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Neon** | True serverless, branching, HTTP driver | Newer platform, cold starts |
| **Cloud SQL** | GCP native, mature | Always-on costs, no auto-scaling |
| **Supabase** | Built-in auth, realtime | Heavier abstraction |
| **PlanetScale** | Great scaling | MySQL only |

## Rationale

1. **HTTP Driver**: `@neondatabase/serverless` uses HTTP, eliminating TCP connection pooling complexity
2. **Auto-suspend**: Scales to zero in development, reducing costs
3. **Branching**: Database branching for preview environments
4. **Global Reach**: Read replicas available in multiple regions
5. **Pooler Endpoint**: Connection pooling handled at infrastructure level

## Consequences

### Positive
- No connection pool management in application code
- Cost-effective for variable traffic patterns
- Database branching for safe migrations
- Drizzle ORM integration is excellent

### Negative
- Cold start latency (~200-500ms after suspend)
- Requires `-pooler` endpoint for best performance
- Newer platform with less track record
