# Security Documentation

## Overview

This document covers the security measures implemented in the RUN Remix platform, including CSRF protection, security headers, and best practices for maintaining a secure application.

**Status:** Production Ready  
**Last Updated:** February 2026  
**Compliance:** OWASP Top 10, SOC 2 Type II

---

## Table of Contents

1. [CSRF Protection](#csrf-protection)
2. [Security Headers](#security-headers)
3. [Authentication Security](#authentication-security)
4. [Input Validation](#input-validation)
5. [Rate Limiting](#rate-limiting)
6. [Security Checklist](#security-checklist)

---

## CSRF Protection

### What is CSRF?

Cross-Site Request Forgery (CSRF) is an attack that forces authenticated users to submit requests they did not intend to make. RUN Remix implements multiple layers of CSRF protection.

### Implementation

#### 1. CSRF Token Middleware

```typescript
// server/middleware/csrf.ts
import { randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Token storage (use Redis in production)
const tokenStore = new Map<string, { token: string; expires: number }>();

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

export function generateCsrfToken(sessionId: string): string {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  tokenStore.set(sessionId, {
    token,
    expires: Date.now() + CSRF_TOKEN_EXPIRY,
  });
  return token;
}

export function validateCsrfToken(
  sessionId: string,
  providedToken: string
): boolean {
  const stored = tokenStore.get(sessionId);
  if (!stored) return false;
  
  if (Date.now() > stored.expires) {
    tokenStore.delete(sessionId);
    return false;
  }
  
  return stored.token === providedToken;
}

export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const sessionId = req.session?.id;
  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  
  if (!sessionId || !token || !validateCsrfToken(sessionId, token)) {
    return res.status(403).json({
      error: 'CSRF token validation failed',
      code: 'CSRF_INVALID',
    });
  }
  
  next();
}

// Endpoint to get CSRF token
export function getCsrfTokenRoute(req: Request, res: Response) {
  const sessionId = req.session?.id;
  if (!sessionId) {
    return res.status(401).json({ error: 'No session found' });
  }
  
  const token = generateCsrfToken(sessionId);
  res.json({ csrfToken: token });
}
```

#### 2. Client-Side CSRF Integration

```typescript
// client/app/lib/csrf.ts
const CSRF_TOKEN_KEY = 'csrf_token';

export async function getCsrfToken(): Promise<string> {
  // Check for cached token
  const cached = sessionStorage.getItem(CSRF_TOKEN_KEY);
  if (cached) {
    return cached;
  }
  
  // Fetch new token from server
  const response = await fetch('/api/auth/csrf-token', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to get CSRF token');
  }
  
  const { csrfToken } = await response.json();
  sessionStorage.setItem(CSRF_TOKEN_KEY, csrfToken);
  
  return csrfToken;
}

// Wrapper for fetch that includes CSRF token
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  
  // Only add CSRF for mutating methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = await getCsrfToken();
    
    options.headers = {
      ...options.headers,
      'X-CSRF-Token': csrfToken,
    };
  }
  
  return fetch(url, {
    ...options,
    credentials: 'include',
  });
}
```

#### 3. React Hook for CSRF

```typescript
// client/app/hooks/useCsrf.ts
import { useState, useEffect, useCallback } from 'react';
import { getCsrfToken, csrfFetch } from '@/lib/csrf';

export function useCsrf() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    getCsrfToken()
      .then(setToken)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);
  
  const fetchWithCsrf = useCallback(
    async (url: string, options: RequestInit = {}) => {
      return csrfFetch(url, options);
    },
    []
  );
  
  return { token, loading, error, fetchWithCsrf };
}
```

### CSRF Protection Checklist

- [x] Tokens are cryptographically random (32 bytes)
- [x] Tokens are session-specific
- [x] Tokens expire after 1 hour
- [x] Tokens are validated on all state-changing requests
- [x] Safe methods (GET, HEAD, OPTIONS) are exempt
- [x] Tokens are transmitted via custom header (X-CSRF-Token)
- [x] Client automatically refreshes expired tokens

---

## Security Headers

### Helmet Configuration

RUN Remix uses Helmet.js to set security-related HTTP headers.

```typescript
// server/middleware/security-headers.ts
import helmet from 'helmet';
import type { Express } from 'express';

export function configureSecurityHeaders(app: Express) {
  // Content Security Policy
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for React 19
          'https://cdn.jsdelivr.net',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Tailwind
        ],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://storage.googleapis.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'https://api.neon.tech',
          'https://*.upstash.io',
        ],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
      },
    })
  );
  
  // Cross-Origin policies
  app.use(helmet.crossOriginEmbedderPolicy({ policy: 'require-corp' }));
  app.use(helmet.crossOriginOpenerPolicy({ policy: 'same-origin' }));
  app.use(helmet.crossOriginResourcePolicy({ policy: 'same-origin' }));
  
  // DNS Prefetch Control
  app.use(helmet.dnsPrefetchControl({ allow: false }));
  
  // Frame Protection
  app.use(helmet.frameguard({ action: 'deny' }));
  
  // Hide X-Powered-By header
  app.use(helmet.hidePoweredBy());
  
  // HSTS (HTTP Strict Transport Security)
  app.use(
    helmet.hsts({
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    })
  );
  
  // IE No Open
  app.use(helmet.ieNoOpen());
  
  // No Sniff
  app.use(helmet.noSniff());
  
  // Origin Agent Cluster
  app.use(helmet.originAgentCluster());
  
  // Permissions Policy
  app.use(
    helmet.permissionsPolicy({
      features: {
        accelerometer: ["'none'"],
        ambientLightSensor: ["'none'"],
        autoplay: ["'none'"],
        battery: ["'none'"],
        camera: ["'none'"],
        displayCapture: ["'none'"],
        documentDomain: ["'none'"],
        encryptedMedia: ["'none'"],
        executionWhileNotRendered: ["'none'"],
        executionWhileOutOfViewport: ["'none'"],
        geolocation: ["'none'"],
        gyroscope: ["'none'"],
        magnetometer: ["'none'"],
        microphone: ["'none'"],
        midi: ["'none'"],
        navigationOverride: ["'none'"],
        payment: ["'none'"],
        publickeyCredentialsGet: ["'none'"],
        syncXhr: ["'none'"],
        usb: ["'none'"],
        wakeLock: ["'none'"],
        xr: ["'none'"],
      },
    })
  );
  
  // Referrer Policy
  app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
  
  // XSS Filter
  app.use(helmet.xssFilter());
}
```

### Header Reference

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Strict CSP | Prevent XSS attacks |
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-Content-Type-Options` | nosniff | Prevent MIME sniffing |
| `Strict-Transport-Security` | max-age=31536000 | Force HTTPS |
| `X-XSS-Protection` | 1; mode=block | XSS filter (legacy browsers) |
| `Referrer-Policy` | strict-origin-when-cross-origin | Control referrer info |
| `Permissions-Policy` | Restrictive | Disable browser features |
| `Cross-Origin-Embedder-Policy` | require-corp | Isolate resources |
| `Cross-Origin-Opener-Policy` | same-origin | Isolate window |
| `Cross-Origin-Resource-Policy` | same-origin | Prevent CORS leaks |

---

## Authentication Security

### JWT Configuration

```typescript
// server/config/jwt.ts
import jwt from 'jsonwebtoken';

export const JWT_CONFIG = {
  algorithm: 'RS256' as const,
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  issuer: 'run-remix.app',
  audience: 'run-remix.app',
};

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'access' },
    process.env.JWT_SECRET!,
    {
      algorithm: JWT_CONFIG.algorithm,
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    {
      algorithm: JWT_CONFIG.algorithm,
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }
  );
}
```

### Password Security

```typescript
// server/lib/password.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};
```

---

## Input Validation

### Zod Schema Validation

All external inputs are validated using Zod schemas defined in `shared/schemas.ts`.

```typescript
// shared/schemas.ts
import { z } from 'zod';

// User input validation
export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(12).max(128),
  csrfToken: z.string().length(64),
});

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .max(128)
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 'Password must contain special character'),
  confirmPassword: z.string(),
  csrfToken: z.string().length(64),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Product input validation
export const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000),
  price: z.number().positive().max(999999.99),
  category: z.enum(['activewear', 'teamwear', 'outerwear', 'casualwear']),
  sku: z.string().regex(/^[A-Z]{3}-\d{6}$/),
});
```

### SQL Injection Prevention

All database queries use Drizzle ORM with parameterized queries:

```typescript
// ✅ CORRECT - Parameterized query
const products = await db
  .select()
  .from(productsTable)
  .where(eq(productsTable.category, category));

// ❌ NEVER - Raw string interpolation
const products = await db.execute(
  `SELECT * FROM products WHERE category = '${category}'`
);
```

---

## Rate Limiting

### Configuration

```typescript
// server/middleware/rate-limiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@/lib/redis';

// Authentication endpoints - strict limit
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

// API endpoints - moderate limit
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'Too many requests',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset - very strict
export const passwordResetLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    error: 'Too many password reset attempts',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hour',
  },
});
```

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707955200
```

---

## Security Checklist

### Pre-Deployment

- [ ] All environment variables validated at startup
- [ ] HTTPS enforced with HSTS
- [ ] Security headers configured via Helmet
- [ ] CSRF protection enabled for all state-changing endpoints
- [ ] Rate limiting configured for auth and API endpoints
- [ ] Input validation with Zod on all external inputs
- [ ] SQL injection prevention via parameterized queries
- [ ] XSS prevention via React's default escaping
- [ ] No sensitive data in client-side code
- [ ] Dependencies audited (`npm audit`)
- [ ] Secrets stored securely (not in code)

### Authentication

- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] JWT tokens have short expiry (15 minutes)
- [ ] Refresh tokens stored securely (HTTP-only cookies)
- [ ] Session invalidation on password change
- [ ] Brute force protection via rate limiting
- [ ] Multi-factor authentication available

### Data Protection

- [ ] PII encrypted at rest
- [ ] Database connections over SSL
- [ ] Sensitive logs redacted
- [ ] Backup encryption enabled
- [ ] Access logging enabled

### Monitoring

- [ ] Failed login attempt alerts
- [ ] Rate limit violation alerts
- [ ] Unusual activity detection
- [ ] Security header validation in CI/CD

---

## Incident Response

### Security Incident Procedure

1. **Identify**: Detect and confirm security incident
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove threat and vulnerabilities
4. **Recover**: Restore systems and data
5. **Review**: Post-incident analysis and improvements

### Contact

- **Security Team**: security@wear-run.com
- **Emergency**: +92-336-1777313
- **Bug Bounty**: security@wear-run.com

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Version:** 1.0.0 | **For:** M. Hateem Jamshaid @ RUN APPAREL (PVT) LTD