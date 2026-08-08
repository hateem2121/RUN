# Security Remediation Plan

## Executive Summary

This document provides a comprehensive, systematic plan to resolve all identified security vulnerabilities in the RUN Remix repository, prioritized by severity (Critical → Low). Each issue includes:
- **Description**: What the vulnerability is
- **Risk**: Why it matters
- **Location**: Where the issue exists
- **Fix**: Specific implementation steps
- **Priority**: P0 (Critical) to P3 (Low)
- **Estimated Effort**: Time to fix

---

## Phase 1: Critical Vulnerabilities (P0) - Fix Immediately

### SEC-CRIT-01: reCAPTCHA Secret Key Exposed in URL

**Severity**: Critical  
**Location**: `/workspace/server/lib/security/recaptcha-verify.ts` (line 40)  
**Risk**: Secret key leaked via browser history, proxy logs, referer headers  
**OWASP**: Sensitive Data Exposure  

**Current Code**:
```typescript
const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${token}`;
```

**Fix**:
```typescript
// Change from GET query params to POST body
const recaptchaRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    secret: recaptchaSecret,
    response: token,
  }),
});
```

**Steps**:
1. Modify `recaptcha-verify.ts` line 40-45
2. Update tests in `/workspace/tests/unit/server/lib/security/recaptcha-verify.test.ts`
3. Verify no regression in contact form submissions

**Effort**: 15 minutes

---

### SEC-CRIT-02: Global XSS Sanitization Disabled

**Severity**: Critical  
**Location**: `/workspace/server/middleware/sanitization.ts` (lines 9-14)  
**Risk**: XSS attacks possible if any service boundary fails validation  
**OWASP**: XSS (Cross-Site Scripting)  

**Current Code**:
```typescript
export function requestSanitization(_req: Request, _res: Response, next: NextFunction): void {
  // Global XSS Prevention removed to support TipTap payloads.
  // XSS sanitization must now be handled at the individual service boundary
  next();
}
```

**Fix**: Implement granular sanitization that preserves rich text fields while protecting standard inputs:

```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitizeValue(value: unknown, path: string): unknown {
  if (typeof value === 'string') {
    // Skip sanitization for known rich-text fields
    if (path.includes('content') || path.includes('description')) {
      return purify.sanitize(value, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
      });
    }
    // Standard field sanitization
    return value.replace(/[<>]/g, '');
  }
  if (Array.isArray(value)) {
    return value.map((item, idx) => sanitizeValue(item, `${path}[${idx}]`));
  }
  if (typeof value === 'object' && value !== null) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val, `${path}.${key}`);
    }
    return sanitized;
  }
  return value;
}

export function requestSanitization(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body, '');
  }
  next();
}
```

**Steps**:
1. Install dependencies: `npm install dompurify jsdom`
2. Replace entire `sanitization.ts` file
3. Add allowlist configuration for TipTap fields
4. Test with rich text payloads and XSS attack vectors

**Effort**: 2 hours

---

### SEC-CRIT-03: CSRF Token Security Weaknesses

**Severity**: Critical  
**Location**: `/workspace/server/middleware/csrf.ts` (lines 57-63)  
**Risk**: Session hijacking, CSRF attacks via non-httpOnly cookie access  
**OWASP**: CSRF (Cross-Site Request Forgery)  

**Issues**:
1. Cookie not httpOnly (line 58) - JavaScript can read it
2. 24-hour expiration too long (line 61)
3. No token rotation on use

**Fix**:
```typescript
res.cookie(CSRF_COOKIE_NAME, token, {
  httpOnly: false, // Must remain false for double-submit pattern
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 60 * 60 * 1000, // 1 hour (reduced from 24h)
  path: "/",
});

// Add token rotation after successful validation
if (csrfError === null) {
  // Generate new token for next request
  const newToken = generateToken();
  res.cookie(CSRF_COOKIE_NAME, newToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000,
    path: "/",
  });
  res.locals.csrfToken = newToken;
}
```

**Steps**:
1. Update `csrfTokenGenerator` function (line 61: change 24h to 1h)
2. Add token rotation logic in `csrfValidator` after successful validation
3. Update client-side to handle token refresh
4. Test OAuth flows still work

**Effort**: 1 hour

---

### SEC-CRIT-04: Mock Admin Route Environment Check Bypass

**Severity**: Critical  
**Location**: `/workspace/server/routes/auth.ts` (line 21)  
**Risk**: Production admin access if `ENABLE_MOCK_ADMIN` set via config injection  
**OWASP**: Broken Access Control  

**Current Code**:
```typescript
if (env.NODE_ENV === "development" || env.VITEST || env.ENABLE_MOCK_ADMIN === "true") {
```

**Fix**:
```typescript
// STRICT: Mock login ONLY in development/test, NEVER in production
const isDevelopmentOrTest = 
  process.env.NODE_ENV === "development" || 
  process.env.NODE_ENV === "test" ||
  process.env.VITEST === "true";

// ENABLE_MOCK_ADMIN is IGNORED in production regardless of value
const isMockEnabled = process.env.ENABLE_MOCK_ADMIN === "true";

if (isDevelopmentOrTest && isMockEnabled) {
  router.get("/mock-login", async (req, res) => {
    // ... existing code
  });
}
```

**Steps**:
1. Refactor auth.ts lines 21-76
2. Add explicit production guard at route registration time
3. Add startup validation to reject mock config in production
4. Test deployment pipeline rejects mock-enabled configs

**Effort**: 45 minutes

---

## Phase 2: High Severity Issues (P1) - Fix Within 24 Hours

### SEC-HIGH-01: Session Secret Rotation Incomplete

**Severity**: High  
**Location**: `/workspace/server/services/auth-service.ts` (lines 78-87)  
**Risk**: Session invalidation during rotation, potential session fixation  
**OWASP**: Session Management  

**Issue**: Previous secret supported but no automated rotation mechanism documented or tested.

**Fix**:
```typescript
// Add rotation utility script
const currentSecret = getSecret("SESSION_SECRET") || process.env.SESSION_SECRET;
const previousSecret = process.env.SESSION_SECRET_PREVIOUS;

// Validate both secrets are 32+ bytes
if (currentSecret && currentSecret.length < 32) {
  logger.error("SESSION_SECRET must be at least 32 characters");
  process.exit(1);
}

// Support rolling rotation
const secrets = previousSecret ? [currentSecret, previousSecret] : currentSecret;
```

**Steps**:
1. Add secret length validation
2. Create rotation script: `/scripts/rotate-session-secret.ts`
3. Document rotation procedure in SECURITY.md
4. Add test for dual-secret validation

**Effort**: 2 hours

---

### SEC-HIGH-02: No Validation on Idempotency Keys

**Severity**: High  
**Location**: `/workspace/server/middleware/idempotency.ts` (lines 43-46)  
**Risk**: DoS via massive keys, cache poisoning, memory exhaustion  
**OWASP**: DoS (Denial of Service)  

**Current Code**:
```typescript
const key = req.headers["idempotency-key"];
if (!key || typeof key !== "string") {
  return next();
}
```

**Fix**:
```typescript
const key = req.headers["idempotency-key"];
if (!key || typeof key !== "string") {
  return next();
}

// Validate key format: alphanumeric, hyphens, underscores only
const KEY_PATTERN = /^[a-zA-Z0-9_-]{16,128}$/;
if (!KEY_PATTERN.test(key)) {
  logger.warn("[Idempotency] Invalid key format", { keyLength: key.length });
  return next(); // Proceed without idempotency rather than blocking
}

// Prevent cache key injection
const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
const cacheKey = `idempotency:${sanitizedKey}`;
```

**Steps**:
1. Add key validation in `idempotencyMiddleware`
2. Add length limits (16-128 chars)
3. Add pattern validation (alphanumeric + `-` `_`)
4. Test with malformed keys

**Effort**: 45 minutes

---

### SEC-HIGH-03: Rate Limiter Silent Degradation

**Severity**: High  
**Location**: `/workspace/server/middleware/rateLimiter.ts` (lines 126-151)  
**Risk**: Undetected DoS vulnerability when Redis fails  
**OWASP**: DoS (Denial of Service)  

**Issue**: Falls back to in-memory silently, losing distributed rate limiting.

**Fix**:
```typescript
async (error) => {
  logger.error("[RateLimiter] Redis failure - DEGRADED TO IN-MEMORY", {
    error: error.message,
    fallback: "memory-strict",
    alert: true, // Trigger monitoring alert
  });
  
  // Send alert to monitoring system
  if (process.env.ALERTING_WEBHOOK_URL) {
    fetch(process.env.ALERTING_WEBHOOK_URL, {
      method: "POST",
      body: JSON.stringify({
        severity: "high",
        service: "rate-limiter",
        message: "Redis fallback activated",
      }),
    }).catch(() => {});
  }
  
  // Continue with memory fallback (already implemented)
  await ResultAsync.fromSafePromise(/* ... */);
},
```

**Steps**:
1. Enhance error logging with alert flag
2. Add webhook notification for production
3. Configure Cloud Monitoring alert on log pattern
4. Test Redis failure scenario

**Effort**: 1.5 hours

---

### SEC-HIGH-04: Debug Routes Excluded from CSRF

**Severity**: High  
**Location**: `/workspace/server/middleware/csrf.ts` (lines 27-30)  
**Risk**: CSRF attacks on debug endpoints in production if accidentally enabled  
**OWASP**: CSRF, Security Misconfiguration  

**Issue**: Debug routes should never exist in production builds.

**Fix**:
```typescript
// Remove debug routes from exclusion list entirely
const EXCLUDED_ROUTES = [
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/health",
  "/api/health/detailed",
  "/api/docs",
  "/api-docs",
  "/api/webhooks",
  "/api/auth/mock-login", // Keep for dev-only route
  // Debug routes removed - they should not exist in production
];

// Add runtime check
if (process.env.NODE_ENV === "production") {
  // Verify debug routes don't exist
  if (app._router.stack.some((r: any) => r.route?.path?.includes('/debug'))) {
    logger.error("[Security] Debug routes detected in production!");
    process.exit(1);
  }
}
```

**Steps**:
1. Remove debug routes from EXCLUDED_ROUTES
2. Ensure debug routes are conditionally registered only in dev
3. Add production startup validation
4. Verify routes don't exist in production build

**Effort**: 1 hour

---

## Phase 3: Medium Severity Issues (P2) - Fix Within 1 Week

### SEC-MED-01: Weak Key Derivation (SHA-256 Instead of PBKDF2)

**Severity**: Medium  
**Location**: `/workspace/server/lib/encryption.ts` (lines 11-18)  
**Risk**: Faster brute-force attacks on encryption key  
**OWASP**: Cryptographic Failure  

**Current Code**:
```typescript
function getDerivedKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("ENCRYPTION_KEY is not defined");
  }
  return createHash("sha256").update(rawKey).digest();
}
```

**Fix**:
```typescript
import { pbkdf2Sync } from "node:crypto";

function getDerivedKey(): Buffer {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("ENCRYPTION_KEY is not defined");
  }
  
  // Use a fixed salt (derived from service name) for deterministic derivation
  // The ENCRYPTION_KEY itself should be high-entropy (32+ random bytes)
  const salt = Buffer.from("run-remix-encryption-salt-v1");
  
  // PBKDF2 with 100,000 iterations
  return pbkdf2Sync(rawKey, salt, 100000, 32, "sha256");
}
```

**Steps**:
1. Update `encryption.ts` getDerivedKey function
2. Create migration script to re-encrypt existing data (if needed)
3. Test decryption of existing records
4. Document key requirements (must be 32+ random bytes)

**Effort**: 2 hours

---

### SEC-MED-02: PII Logged in Audit Events Despite Redaction

**Severity**: Medium  
**Location**: `/workspace/server/lib/sanitize-for-logging.ts` (lines 6-25)  
**Risk**: PII exposure in logs, GDPR violation  
**OWASP**: Sensitive Data Exposure  

**Issue**: Current redaction catches common patterns but may miss nested PII or custom fields.

**Fix**:
```typescript
// Enhanced sensitive keys list
const SENSITIVE_KEYS = [
  // Existing keys...
  "password", "token", "secret", "email", "phone", "ssn",
  "creditcard", "cardnumber", "cvv", "address", "name",
  "birth", "license", "citizen", "accountnumber", "routingnumber",
  "passport", "taxid",
  // Additions
  "apikey", "api_key", "access_token", "refresh_token",
  "authorization", "cookie", "session", "userid", "user_id",
  "customerid", "order_id", "ip", "ipaddress", "useragent"
];

// Add deep nesting protection
export function sanitizeForLogging(obj: unknown, depth = 0): unknown {
  if (depth > 10) {
    return "[MAX_DEPTH_REDACTED]"; // Prevent prototype pollution attacks
  }
  // ... rest of existing logic with depth parameter
}
```

**Steps**:
1. Expand SENSITIVE_KEYS list
2. Add depth limiting to prevent circular references
3. Add test cases for nested PII
4. Audit all logger.info calls in admin routes

**Effort**: 1.5 hours

---

### SEC-MED-03: Overly Permissive CORS in Development

**Severity**: Medium  
**Location**: `/workspace/server/boot/middleware.ts` (lines 103-127)  
**Risk**: Development misconfigurations leaking to production  
**OWASP**: Security Misconfiguration  

**Current Code**:
```typescript
} else {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
}
```

**Fix**:
```typescript
function createCorsMiddleware(): RequestHandler {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    // Always validate origin, even in development
    const allowedOrigins = process.env.NODE_ENV === "production"
      ? (process.env.STRICT_ALLOWED_ORIGINS || "https://wear-run.com").split(",")
      : ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"];
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else if (process.env.NODE_ENV !== "production") {
      // Only allow wildcard in dev if no origin provided
      if (!origin) {
        res.setHeader("Access-Control-Allow-Origin", "*");
      }
    }
    
    // ... rest unchanged
  };
}
```

**Steps**:
1. Update CORS middleware
2. Define explicit dev allowlist
3. Remove wildcard fallback
4. Test local development still works

**Effort**: 45 minutes

---

### SEC-MED-04: Missing Account Lockout Enforcement

**Severity**: Medium  
**Location**: `/workspace/server/services/auth-service.ts` (lines 395-455)  
**Risk**: Brute force attacks possible if lockout not enforced at all entry points  
**OWASP**: Broken Authentication  

**Issue**: Lockout logic exists but may not be called consistently across all auth entry points.

**Fix**:
1. Verify all authentication entry points call `recordFailedLogin`:
   - Google OAuth callback failures
   - Session validation failures
   - API token validation
   
2. Add centralized auth attempt tracking:
```typescript
// Add to auth-service.ts
public async trackAuthAttempt(
  identifier: string,
  success: boolean,
  source: string
): Promise<void> {
  if (!success) {
    await this.recordFailedLogin(identifier);
    logger.warn("[Auth] Failed authentication attempt", {
      identifier,
      source,
      attempts: await this.getFailedAttempts(identifier),
    });
  } else {
    await this.recordSuccessfulLogin(identifier);
  }
}
```

**Steps**:
1. Audit all auth entry points
2. Centralize failed login tracking
3. Add monitoring alerts for lockout events
4. Test lockout triggers correctly

**Effort**: 3 hours

---

## Phase 4: Low Severity Issues (P3) - Fix Within 2 Weeks

### SEC-LOW-01: Missing Security Headers on Error Responses

**Severity**: Low  
**Location**: `/workspace/server/middleware/production-error-handler.ts`  
**Risk**: Information disclosure via error pages  
**OWASP**: Security Misconfiguration  

**Fix**: Ensure error handler applies Helmet headers before sending response.

**Effort**: 30 minutes

---

### SEC-LOW-02: Verbose Error Messages in Development Leaking to Logs

**Severity**: Low  
**Location**: Multiple locations  
**Risk**: Stack traces in logs could aid attackers with log access  
**OWASP**: Information Disclosure  

**Fix**: Implement structured error logging that separates user-facing messages from debug info.

**Effort**: 1 hour

---

### SEC-LOW-03: No Rate Limiting on Health Endpoints

**Severity**: Low  
**Location**: `/api/health` endpoints  
**Risk**: Minor DoS vector  
**OWASP**: DoS  

**Fix**: Add lightweight rate limiting to health endpoints (100 req/min per IP).

**Effort**: 30 minutes

---

### SEC-LOW-04: Missing Content-Type Validation

**Severity**: Low  
**Location**: Body parser middleware  
**Risk**: Potential content-type confusion attacks  
**OWASP**: Input Validation  

**Fix**: Validate Content-Type header matches actual payload format.

**Effort**: 45 minutes

---

### SEC-LOW-05: Session Cookie Path Too Broad

**Severity**: Low  
**Location**: `/workspace/server/services/auth-service.ts` (line 101)  
**Risk**: Minor cookie scope issue  
**OWASP**: Session Management  

**Current**: `path: "/"`  
**Fix**: Consider `path: "/api"` if sessions only used for API auth.

**Effort**: 15 minutes

---

## Implementation Timeline

| Phase | Priority | Issues | Target | Owner |
|-------|----------|--------|--------|-------|
| 1 | P0 | 4 Critical | Immediate (Day 1) | Security Team |
| 2 | P1 | 4 High | 24 hours | Backend Team |
| 3 | P2 | 4 Medium | 1 week | Backend Team |
| 4 | P3 | 5 Low | 2 weeks | Maintenance |

---

## Verification & Testing

### Pre-Deployment Checklist
- [ ] All unit tests pass
- [ ] Integration tests cover security scenarios
- [ ] E2E tests verify user flows unchanged
- [ ] Penetration testing scheduled
- [ ] Security scan (Snyk/npm audit) clean

### Post-Deployment Monitoring
1. Set up alerts for:
   - CSRF validation failures spike
   - Rate limiter fallback activations
   - Account lockout events
   - reCAPTCHA verification failures

2. Monitor logs for:
   - Unusual authentication patterns
   - Input validation errors
   - Circuit breaker trips

---

## Documentation Updates Required

1. **SECURITY.md**: Add vulnerability disclosure process
2. **CONTRIBUTING.md**: Security coding guidelines
3. **docs/security/**: Architecture decision records for each fix
4. **Runbooks**: Incident response for security events
5. **Onboarding**: Security training checklist

---

## Success Metrics

- Zero critical/high vulnerabilities in production scans
- 100% of auth endpoints enforce lockout
- < 1% false positive rate in input validation
- All security headers present on 100% of responses
- Mean time to patch critical vulnerabilities < 24 hours

---

*Generated: $(date)*  
*Review Cycle: Quarterly*  
*Next Review: Q3 2026*
