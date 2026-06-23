# ADR 0008: [SUPERSEDED] Upstash Redis over ElastiCache
> **Note:** This ADR is superseded. Upstash has been removed in favor of `RedisSessionStore` with standard `ioredis` in v4.1.2.

**Status**: Accepted  
**Date**: 2026-01-13  
**Deciders**: Platform Team

## Context

We needed a Redis solution for:

- L2 distributed caching
- Rate limiting state
- Session storage (optional)
- Serverless-compatible access patterns

## Decision

We chose **Upstash Redis** over ElastiCache or self-managed Redis.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Upstash** | Serverless, HTTP API, global | Per-request pricing |
| **ElastiCache** | AWS managed, high perf | VPC required, always-on |
| **Redis Cloud** | Managed, multi-cloud | Higher cost |
| **Momento** | Serverless cache | Less Redis-compatible |

## Rationale

1. **HTTP API**: REST-based access from serverless environments
2. **Global Replication**: Multi-region for low-latency access
3. **Pay-per-Request**: Cost-effective for variable workloads
4. **No VPC Required**: Accessible from Cloud Run without VPC connector
5. **Edge Compatible**: Works from edge functions if needed

## Consequences

### Positive

- Zero infrastructure management
- Works seamlessly with serverless architecture
- Built-in rate limiting support
- Global edge caching available

### Negative

- Higher per-operation cost at scale
- HTTP latency vs TCP (minimal impact)
- Less Redis feature parity (acceptable trade-off)
