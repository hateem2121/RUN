# ADR-0002: Observability Pipeline

**Status**: Accepted  
**Date**: 2026-01-12  
**Decision Makers**: Architecture Team

## Context

Production visibility requires:

1. Request tracing across distributed services
2. Structured, searchable logs
3. Error tracking with stack trace symbolication
4. Performance metrics and alerting
5. Correlation between logs, traces, and errors

## Decision

### Dual Observability Stack

We implement **OpenTelemetry + Sentry** for comprehensive observability:

| Layer | Technology | Purpose |
|-------|------------|---------|
| Tracing | OpenTelemetry | Distributed request tracing |
| Logging | Pino (JSON) | Structured logs with correlation |
| Error Tracking | Sentry | Real-time error monitoring |
| Metrics | Prometheus | Performance and health metrics |

### Correlation ID Propagation

Every request receives a unique correlation ID:

1. **Generation**: UUID via `crypto.randomUUID()`
2. **Storage**: `AsyncLocalStorage` for thread-safe isolation
3. **Headers**: 
   - Response: `X-Correlation-ID`
   - W3C: `traceparent` (when OTel active)
4. **Logs**: Auto-injected via Pino mixin

```typescript
// Correlation ID automatically appears in all logs
logger.info("Order created", { orderId: 123 });
// Output: { correlationId: "abc-123", msg: "Order created", orderId: 123 }
```

### Sensitive Data Redaction

Pino redacts 30+ sensitive field patterns:

- Authentication: `password`, `token`, `authorization`, `bearer`
- API Keys: `api_key`, `apikey`, `secret`, `oauth_secret`
- Database: `database_url`, `connection_string`
- Headers: `req.headers['authorization']`, `req.headers['cookie']`

### OpenTelemetry Configuration

```typescript
// Auto-instrumentation for:
// - HTTP requests (inbound/outbound)
// - Express middleware
// - Database queries (via Drizzle)
// - Pino logs (trace_id injection)
```

Traces export to configured OTLP endpoint or console in development.

### Sentry Integration

- **Backend**: `@sentry/node` with Express integration
- **Frontend**: `@sentry/react` with error boundaries
- **Source Maps**: Uploaded during CI build

## Consequences

### Positive

- End-to-end request tracing
- Searchable structured logs
- Proactive error alerting
- Performance visibility

### Negative

- Additional infrastructure dependencies
- Vendor lock-in (Sentry) for error tracking
- Trace sampling may miss rare issues

## Implementation

- Correlation: `server/middleware/correlation-id.ts`
- Logging: `server/lib/monitoring/logger.ts`
- OpenTelemetry: `server/lib/monitoring/otel.ts`
- Sentry: `server/lib/monitoring/sentry.ts`
- Prometheus: `server/lib/monitoring/prometheus.ts`

## Related ADRs

- [ADR-0001: Error Handling Architecture](./0001-error-handling-architecture.md)
