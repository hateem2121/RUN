# System Error Codes

> Auto-generated error code table from source code. Runbooks maintained manually.

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

### INVALID_INPUT / BAD_REQUEST (400)

**Symptoms:** User sees validation errors, API returns 400.

**Diagnostic Steps:**
1. Check `invalid-params` field in response body for field-level errors
2. Review request payload against Zod schema in route
3. Check `X-Request-ID` header and search logs for correlation

**Resolution:**
- Client-side: update form validation to match server schema
- Server-side: if schema is too strict, update in `server/schemas/`
- If field name mismatch: check Zod schema `transform` or `coerce` usage

---

### UNAUTHORIZED (401)

**Symptoms:** User redirected to login, API returns 401.

**Diagnostic Steps:**
1. Check if `Authorization` header is present
2. Verify token expiry via JWT debugger
3. Check if session cookie is being sent

**Resolution:**
- 401 on expired token: prompt re-authentication
- 401 on missing token: check auth middleware order
- Ensure `credentials: include` in fetch requests

---

### FORBIDDEN (403)

**Symptoms:** Authenticated user denied access, API returns 403.

**Diagnostic Steps:**
1. Get user ID from token
2. Query user roles in database
3. Check route's required roles in middleware

**Resolution:**
- If role missing: update user's role in database
- If role check wrong: update middleware configuration
- Log and alert if suspicious access patterns

---

### RESOURCE_NOT_FOUND (404)

**Symptoms:** Page/API returns "not found".

**Diagnostic Steps:**
1. Verify resource exists in database
2. Check if slug/ID format is correct
3. Review route registration order (catch-all routes)

**Resolution:**
- If resource deleted: return appropriate message
- If route shadowed: reorder routes in `boot/routes.ts`
- If ID format wrong: update validation schema

---

### CONFLICT (409)

**Symptoms:** Create/update fails with "already exists".

**Diagnostic Steps:**
1. Check `constraint` field in error details
2. Query database for existing record with same unique field
3. Review concurrent request patterns

**Resolution:**
- If duplicate entry: inform user to use different value
- If race condition: implement idempotency key pattern
- Add `Idempotency-Key` header for retryable operations

---

### RATE_LIMIT_EXCEEDED (429)

**Symptoms:** User sees "Too many requests", API returns 429.

**Diagnostic Steps:**
1. Check `Retry-After` header for wait time
2. Review IP patterns in logs for abuse: `grep "429" /var/log/api.log`
3. Check rate limiter health: `GET /api/diagnostics/rate-limiter`

**Resolution:**
- If legitimate traffic spike: temporarily increase limits in `rateLimiter.ts`
- If abuse: add IP to blocklist or enable stricter CAPTCHA
- Client-side: respect `Retry-After` header before retrying

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
