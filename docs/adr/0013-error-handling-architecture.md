# ADR 0013: Error Handling Architecture

**Status**: Accepted  
**Date**: 2026-01-12  
**Decision Makers**: Architecture Team

## Context

As a B2B SaaS platform, we need a consistent, production-grade error handling strategy that:

1. Provides actionable error information to API consumers
2. Prevents information leakage in production
3. Enables effective debugging and incident response
4. Supports retry patterns for resilient clients

## Decision

### RFC 9457 Problem Details Standard

We adopt [RFC 9457 Problem Details for HTTP APIs](https://datatracker.ietf.org/doc/html/rfc9457) as our error response format.

**Response structure**:

```json
{
  "type": "https://api.run-remix.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "The request parameters failed validation",
  "instance": "/api/products",
  "requestId": "req_abc123",
  "code": "VALIDATION_ERROR",
  "invalid-params": { "name": ["Required"] }
}
```

**Content-Type**: `application/problem+json`

### Centralized Error Classes

All errors inherit from a single `AppError` base class in `server/lib/errors.ts`:

| Error Class | HTTP Status | Error Code | Retryable |
|-------------|-------------|------------|-----------|
| `ValidationError` | 400 | `VALIDATION_ERROR` | ❌ |
| `BadRequestError` | 400 | `BAD_REQUEST` | ❌ |
| `AuthenticationError` | 401 | `AUTH_INVALID_TOKEN` | ❌ |
| `ForbiddenError` | 403 | `AUTH_FORBIDDEN` | ❌ |
| `NotFoundError` | 404 | `RESOURCE_NOT_FOUND` | ❌ |
| `ConflictError` | 409 | `CONFLICT_ERROR` | ❌ |
| `RateLimitError` | 429 | `RATE_LIMIT_EXCEEDED` | ✅ |
| `DatabaseError` | 503 | `DB_CONNECTION_ERROR` | ✅ |
| `DatabaseTimeoutError` | 504 | `DB_TIMEOUT` | ✅ |
| `DatabaseDeadlockError` | 409 | `DB_DEADLOCK` | ✅ |
| `InternalError` | 500 | `INTERNAL_ERROR` | ❌ |

### Error Classification

Errors are classified by:

1. **Type**: validation, authentication, authorization, not_found, rate_limit, database, external_service, internal
2. **Severity**: low, medium, high, critical
3. **isOperational**: true = expected errors, false = programmer errors

## Consequences

### Positive

- Consistent error responses across all endpoints
- Type-safe error handling in frontend via `TypedProblemDetails`
- Clear retry guidance via Retry-After headers
- Structured logging enables efficient debugging

### Negative

- Migration effort for legacy endpoints
- Slightly larger response payloads vs minimal errors

### Risks

- Must ensure no sensitive data leaks in `detail` field

## Implementation

- Global error middleware: `server/middleware/production-error-handler.ts`
- Error classes: `server/lib/errors.ts`
- Shared types: `shared/errors.ts`
- Documentation: `docs/api/ERROR_CODES.md`
