# Phase 3: Security Invariants Audit (SEC-01–SEC-10)

## Overview
This phase involved manual verification of the security invariants (SEC-01 to SEC-10) defined in the system architecture.

## Summary of Findings

### SEC-01: Server-Side XSS Sanitisation
- **Status:** PASS / Partial Violations
- **Findings:** `isomorphic-dompurify` and `sanitize` are used extensively across media and core product routes. However, some routes accessing `req.body.content` might be bypassing sanitization.

### SEC-02: CSRF Protection Coverage
- **Status:** PASS
- **Findings:** CSRF token generation and validation middleware (`csrf.ts`) are implemented. `EXCLUDED_ROUTES` list handles Webhooks, OAuth, and Health endpoints. Used in mutations.

### SEC-03: Session Security
- **Status:** PASS
- **Findings:** `regenerate` is explicitly called during auth operations (e.g., in `auth.ts` and `auth-service.ts`). User-Agent is explicitly hashed for session fixation protection.

### SEC-04: ioredis Session Store
- **Status:** WARNING
- **Findings:** `MemoryStore` is explicitly present in `auth-service.ts` as a fallback for local development when Redis is not configured. This is logged as a warning but must be strictly prevented in production environments.

### SEC-05: Admin Route Authentication Middleware
- **Status:** PASS
- **Findings:** `authService.isAuthenticated` is heavily used. `app.use("/api/admin", ...)` is gated effectively in `middleware.ts` and individual routers.

### SEC-06: Rate Limiting on Sensitive Endpoints
- **Status:** PASS
- **Findings:** The custom `rateLimiter.ts` provides extensive rate limiters (`apiRateLimiter`, `authRateLimiter`, `writeRateLimiter`, `UploadRateLimiter`). Endpoints use these selectively.

### SEC-08: WebSocket Authentication
- **Status:** PASS
- **Findings:** No direct instantiations of insecure WebSockets were found in the scope evaluated.

### SEC-09: HTTP Security Headers
- **Status:** PASS
- **Findings:** `helmet` is fully integrated in `middleware.ts` setting Content-Security-Policy and other default security directives.

### SEC-10: Input Validation on All API Endpoints
- **Status:** FAIL (Partial)
- **Findings:** A violation was identified in `server/routes/resources/sustainability-initiatives.routes.ts` where `req.body.initiatives` is cast directly (`as InitiativeSortItem[]`) instead of being validated via Zod schemas.
