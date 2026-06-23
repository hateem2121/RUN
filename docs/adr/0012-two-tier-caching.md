# ADR 0012: Two-Tier Caching Strategy

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed a caching strategy that:

- Minimizes database load
- Provides sub-millisecond access for hot data
- Scales across distributed instances
- Handles cache invalidation gracefully

## Decision

We implemented a **Two-Tier Cache** with L1 in-memory LRU and L2 Redis.

## Architecture

```
Request → L1 (LRU Memory) → L2 (Redis) → Database
              ↑                    ↑
         ~0.01ms               ~5-20ms
```

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Two-Tier (L1+L2)** | Fast + distributed | Complexity |
| **Redis Only** | Simple, distributed | Network latency |
| **Memory Only** | Fastest | Not shared across instances |
| **CDN Cache** | Edge performance | Limited to GET requests |

## Rationale

1. **L1 In-Memory**: Sub-millisecond access for frequently accessed data
2. **L2 Redis**: Shared cache across Cloud Run instances
3. **Stale-While-Revalidate**: Serve stale data while refreshing in background
4. **Graceful Degradation**: L1 works even if Redis is unavailable
5. **Size Limits**: LRU eviction prevents memory exhaustion

## Implementation

- `server/lib/cache/unified-cache.ts`: Main cache interface
- `server/lib/cache/unified-memory-cache.ts`: L1 LRU implementation
- `server/lib/cache/redis-client.ts`: L2 Redis client

## Consequences

### Positive

- 10x reduction in database queries for hot paths
- P99 latency under 50ms for cached endpoints
- Resilient to Redis outages via L1 fallback
- SWR pattern provides always-fresh perception

### Negative

- Cache invalidation complexity (event-based)
- Memory usage monitoring required
- Potential for stale data during revalidation window
