# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.x (current) | Yes |
| < 3.0 | No |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

### Private Disclosure (Preferred)

Use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) for this repository.

### Email

Send a report to the maintainer: **M. Hateem Jamshaid** — Business Development Director, RUN APPAREL (PVT) LTD.

Include in your report:

- Vulnerability type (e.g., OWASP category)
- Affected component and version
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response SLA

| Severity | Acknowledgment | Target Patch |
|----------|---------------|-------------|
| Critical | 24 hours | 7 days |
| High | 48 hours | 14 days |
| Medium | 5 business days | 30 days |
| Low | 10 business days | Next release |

---

## Scope

### In Scope

- `server/` — Express 5 API routes, services, middleware, authentication
- `client/` — React 19 frontend, form handling, data exposure
- `shared/` — Zod schemas, TypeScript types
- Authentication — Google OAuth 2.0 flow, session management
- Database access — Neon PostgreSQL query patterns
- Admin panel (`/admin/*`) — RBAC, access control

### Out of Scope

- Third-party dependencies (report upstream)
- Social engineering attacks
- Physical access attacks
- Denial-of-service attacks
- Issues requiring non-standard hardware

---

## Security Architecture

The platform implements defence-in-depth:

| Control | Implementation |
|---------|---------------|
| Authentication | Google OAuth 2.0, no email/password |
| Sessions | Upstash Redis, 15-min rotation, HttpOnly + SameSite cookies |
| Rate Limiting | Redis-backed sliding-window rate limiter |
| Circuit Breakers | `opossum` for DB and Redis operations |
| Input Validation | Zod schemas on all external inputs |
| SQL Injection | Drizzle ORM parameterized queries (no raw SQL) |
| Secrets | Never committed — scanned by `secret-scanning.yml` |
| Dependencies | Weekly Dependabot updates + `npm audit` in CI |
| Container | Trivy vulnerability scanning in `security-scanning.yml` |
| Runtime | DAST scanning in `dast-scan.yml` |
| Headers | Helmet middleware on all Express responses |

Full threat model: [`docs/security/threat-model.md`](./docs/security/threat-model.md)

---

## Security Tools in CI

- **`secret-scanning.yml`** — GitHub secret scanning + custom patterns
- **`security-scanning.yml`** — Trivy container and filesystem scan
- **`security-check.yml`** — `npm audit`, dependency audit
- **`dast-scan.yml`** — Dynamic Application Security Testing

---

## Disclosure Policy

We follow responsible disclosure. Once a fix is deployed, we will:

1. Acknowledge the reporter (with permission)
2. Publish a security advisory on GitHub
3. Update this document if policies change

Thank you for helping keep RUN APPAREL's platform secure.
