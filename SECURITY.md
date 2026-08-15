# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 4.x (current) | Yes |
| < 4.0 | No |

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

### Private Disclosure (Preferred)

Use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability) directly in this repository.

### Email Disclosure

If private reporting is unavailable, send a detailed PGP/encrypted report to the maintainer:  
**M. Hateem Jamshaid** (`hateem@runapparel.com`) — Business Development Director, RUN APPAREL (PVT) LTD.

Include in your report:
- Vulnerability description (e.g., OWASP category / CWE ID)
- Affected component, route, or file path
- Step-by-step reproduction instructions or proof-of-concept
- Potential impact assessment
- Proposed remediation or patch (if available)

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
- `client/` — React 19 frontend, form handling, CSP nonce protection, data exposure
- `shared/` — Zod schemas, TypeScript types, route manifests
- Authentication & Sessions — Google OAuth 2.0 flow, `DrizzleSessionStore` (Neon PostgreSQL)
- Database access — Parameterized Drizzle ORM queries
- Admin panel (`/admin/*`) — RBAC, session integrity, audit logging

### Out of Scope

- Third-party upstream dependencies (report directly to upstream maintainers)
- Social engineering, phishing, or physical attacks
- Distributed Denial-of-Service (DDoS) against cloud infrastructure
- Attacks requiring physical access to an unlocked developer workstation

---

## Security Architecture & Defences

The platform implements multi-layer defense-in-depth:

| Layer / Control | Implementation |
|-----------------|----------------|
| **Authentication** | Google OAuth 2.0 (no plaintext passwords stored) |
| **Sessions** | `DrizzleSessionStore` (Neon PostgreSQL), 15-minute rotation, HttpOnly + SameSite cookies |
| **Rate Limiting** | Redis-backed sliding-window rate limiter via `ioredis` |
| **Circuit Breakers** | `opossum` for external API and database operations |
| **Input Validation** | Strict Zod v4 schemas on all request payloads |
| **SQL Injection** | Drizzle ORM parameterized queries (zero raw SQL queries) |
| **Secret Scanning** | Automated GitHub secret scanning + custom regex patterns |
| **Supply Chain** | Dependabot automated security alerts + OpenSSF Scorecards + GitHub Dependency Review |
| **Static Analysis** | GitHub CodeQL (SAST) + Biome strict linting |
| **Container & DAST** | Trivy container and filesystem scans in CI |
| **Security Headers** | Helmet middleware + strict Content Security Policy (CSP) with per-request nonces |

Full threat model: [`docs/security/threat-model.md`](./docs/security/threat-model.md)

---

## Disclosure Policy

We adhere to coordinated responsible disclosure. Once a remediation is deployed, we will:
1. Credit the security researcher in release notes and security advisories (with permission).
2. Publish a GitHub Security Advisory (GHSA) and request a CVE identifier if applicable.
3. Update relevant documentation and regression test suites.

Thank you for helping keep RUN APPAREL's open-source ecosystem secure.
