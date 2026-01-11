# System Error Codes

> Auto-generated from source code. Do not edit manually.

| Error Code | Status | Class Name | Description |
| :--- | :--- | :--- | :--- |
| **INVALID_INPUT** | 400 | `ValidationError` | Validation Failed |
| **BAD_REQUEST** | 400 | `BadRequestError` | Bad Request |
| **UNAUTHORIZED** | 401 | `UnauthorizedError` | Unauthorized |
| **FORBIDDEN** | 403 | `ForbiddenError` | Forbidden |
| **RESOURCE_NOT_FOUND** | 404 | `NotFoundError` | Resource Not Found |
| **CONFLICT** | 409 | `ConflictError` | Resource Conflict |
| **DB_DEADLOCK** | 409 | `AppError` | Database deadlock, retryable |
| **RATE_LIMIT_EXCEEDED** | 429 | `RateLimitError` | Too many requests, please try again later. |
| **INTERNAL_ERROR** | 500 | `InternalError` | Internal Server Error |
| **DB_CONNECTION_ERROR** | 503 | `DatabaseError` | Database unavailable |
| **DB_TIMEOUT** | 504 | `AppError` | Query timeout |

---

## Implementation Guide

Use these error classes in your controllers:

```typescript
import { NotFoundError, ValidationError } from '../errors/AppError';

// throw new NotFoundError("Product not found");
```

---

## Production Runbooks

### RATE_LIMIT_EXCEEDED (429)

**Symptoms:** User sees "Too many requests", API returns 429.

**Diagnostic Steps:**
1. Check rate limiter health: `GET /api/media/rate-limiter/health`
2. Review IP patterns in logs for abuse: `grep "429" /var/log/api.log`
3. Check error aggregator: `GET /api/diagnostics/errors?type=rate_limit`

**Resolution:**
- If legitimate traffic spike: temporarily increase limits in `rate-limiter.ts`
- If abuse: add IP to blocklist or enable stricter CAPTCHA
- Consider adding Retry-After header check on client

---

### DB_CONNECTION_ERROR (503)

**Symptoms:** API returns "Service unavailable", health check shows DB unhealthy.

**Diagnostic Steps:**
1. Check detailed health: `GET /health/detailed` (requires `X-Health-Check-Key`)
2. Verify Neon dashboard for connection pool exhaustion
3. Check circuit breaker state in health endpoint

**Resolution:**
- If circuit is OPEN: wait for half-open transition (default 30s)
- If connection limit hit: increase `NEON_POOL_SIZE` or reduce idle timeout
- For cold start issues: enable connection pool warmup in startup

---

### INTERNAL_ERROR (500)

**Symptoms:** Generic server error, no specific error code.

**Diagnostic Steps:**
1. Get `X-Error-ID` from response headers
2. Search logs: `correlationId: "<error-id>"`
3. Check Sentry for full stack trace
4. Review recent deployments for regression

**Resolution:**
- If new error pattern: rollback recent deployment
- If recurring: add specific AppError class for the case
- If transient: add retry logic or circuit breaker

---

### UNAUTHORIZED (401) vs FORBIDDEN (403)

**When to investigate:**
- 401 is expected for unauthenticated requests
- 403 for missing permissions

**Diagnostic Steps:**
1. Check if token is present in request headers
2. Verify token expiry via JWT debugger
3. Check user roles in database

**Resolution:**
- 401: prompt user to re-authenticate
- 403: verify user has required role for resource

---

### DB_DEADLOCK (409)

**Symptoms:** Intermittent 409 errors on concurrent writes.

**Diagnostic Steps:**
1. Check logs for `DB_DEADLOCK` entries
2. Review transaction patterns in affected routes
3. Check for missing indexes causing table scans

**Resolution:**
- Add retry logic with exponential backoff (already in `db-circuit-breaker.ts`)
- Reorder transaction operations to reduce lock contention
- Add indexes on frequently-queried columns

---

### DB_TIMEOUT (504)

**Symptoms:** Slow queries timing out.

**Diagnostic Steps:**
1. Check `[Slow Query]` warnings in logs
2. Review query analyzer in Neon dashboard
3. Check for missing indexes

**Resolution:**
- Add appropriate indexes
- Implement query pagination
- Increase timeout for known slow operations

