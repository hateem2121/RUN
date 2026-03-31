# Threat Model - RUN Apparel B2B Platform

**Status**: Active  
**Version**: 1.0  
**Last Updated**: January 2026  
**Methodology**: STRIDE

---

## System Overview

The RUN Apparel platform is a B2B e-commerce system consisting of:

- React 19 frontend (SSR via React Router 7)
- Express 5 API backend
- PostgreSQL database (Neon serverless)
- Redis cache (Upstash)
- Google Cloud Run hosting

---

## STRIDE Analysis

### 1. Spoofing

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| Session hijacking | HIGH | UA binding, 15-min rotation | ✅ |
| OAuth token theft | MEDIUM | Secure cookies, short-lived tokens | ✅ |
| API key impersonation | MEDIUM | Key validation, rate limiting | ✅ |
| Admin impersonation | HIGH | RBAC, audit logging | ✅ |

#### Controls Implemented

- Google OAuth 2.0 for authentication
- Session ID rotation every 15 minutes
- User-Agent binding to detect hijacked sessions
- Secure, HttpOnly, SameSite cookies

### 2. Tampering

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| Request modification | MEDIUM | HTTPS/TLS only | ✅ |
| Database injection | HIGH | Parameterized queries (Drizzle ORM) | ✅ |
| Cache poisoning | MEDIUM | Cache key validation | ✅ |
| Config tampering | LOW | Secret Manager, env validation | ✅ |

#### Controls Implemented

- Zod schema validation on all inputs
- Drizzle ORM parameterizes all queries
- CSRF protection on state-changing operations
- Immutable infrastructure (container-based)

### 3. Repudiation

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| Admin action denial | MEDIUM | Audit logging | ✅ |
| Transaction disputes | MEDIUM | Request logging | ✅ |
| Access denial | LOW | Cloud Audit Logs | ✅ |

#### Controls Implemented

- All admin mutations logged to `audit_logs` table
- Request correlation IDs for traceability
- Cloud Audit Logs for infrastructure access
- Structured logging with timestamps

### 4. Information Disclosure

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| Source map exposure | HIGH | Blocked in production | ✅ |
| Error message leakage | MEDIUM | Production error handler | ✅ |
| Database credentials | HIGH | Secret Manager | ✅ |
| Session data exposure | MEDIUM | Redis encryption | ✅ |

#### Controls Implemented

- Source maps blocked via security middleware
- Generic error messages in production
- Secrets loaded from Google Secret Manager
- Encryption at rest for all data stores

### 5. Denial of Service

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| API abuse | HIGH | Rate limiting | ✅ |
| Resource exhaustion | MEDIUM | Request timeout, limits | ✅ |
| Cache stampede | MEDIUM | SWR pattern, circuit breaker | ✅ |
| Database overload | MEDIUM | Connection pooling, caching | ✅ |

#### Controls Implemented

- Redis-backed rate limiting (fail-open)
- Request size limits (configurable)
- Request timeout middleware
- Circuit breakers for Redis/DB operations
- LRU cache with size limits

### 6. Elevation of Privilege

| Threat | Risk | Mitigation | Status |
|--------|------|------------|--------|
| User to Admin | HIGH | RBAC, db-backed roles | ✅ |
| Anonymous to User | MEDIUM | Authentication required | ✅ |
| API key escalation | MEDIUM | Separate key scopes | ✅ |

#### Controls Implemented

- Role-based access control (Admin/User)
- Admin status verified from database
- Admin cache with short TTL
- Separate API keys for different scopes

---

## Attack Surface

### External Entry Points

| Entry Point | Protection |
|-------------|------------|
| HTTPS Load Balancer | TLS 1.3, HSTS |
| `/api/*` endpoints | Rate limiting, validation |
| OAuth callback | State parameter, HTTPS only |
| Media upload | File type/size validation |

### Internal Boundaries

| Boundary | Protection |
|----------|------------|
| Server → Database | TLS, connection pooling |
| Server → Redis | TLS, authentication |
| Server → GCS | Service account, signed URLs |

---

## Risk Matrix

| Impact ↓ / Likelihood → | Rare | Unlikely | Possible | Likely |
|-------------------------|------|----------|----------|--------|
| **Critical** | Monitor | Mitigate | Mitigate | Urgent |
| **High** | Monitor | Mitigate | Mitigate | Urgent |
| **Medium** | Accept | Monitor | Mitigate | Mitigate |
| **Low** | Accept | Accept | Monitor | Monitor |

### Current Residual Risks

| Risk | Likelihood | Impact | Status |
|------|------------|--------|--------|
| DDoS attack | Possible | High | Monitored (Cloud Run scaling) |
| Zero-day vulnerability | Unlikely | Critical | Monitored (dependency scanning) |
| Insider threat | Rare | High | Mitigated (audit logs, RBAC) |

---

## Review Schedule

| Activity | Frequency |
|----------|-----------|
| Threat model review | Quarterly |
| Penetration testing | Annually |
| Vulnerability scanning | Weekly (automated) |
| Dependency audit | Each deployment |

---

*This document follows OWASP Threat Modeling guidelines.*
