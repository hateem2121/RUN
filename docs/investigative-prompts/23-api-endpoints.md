# 🔍 INVESTIGATE: Full API Endpoints Health Audit
**Route**: `/api/* (all endpoints)`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/api/* (all endpoints)`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/apix/`
**Issue ID Prefix**: `APIX-`

---
## Goal
Run a comprehensive health check on every documented REST API endpoint. Log HTTP status, response time, response shape, caching headers, and security headers.

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/api-endpoints/protocol-0.txt`.
Continue regardless of failures — every failure is itself a finding.

```bash
npm run verify:tech-integrity   # 8-point integrity gate
npm run check                   # Biome 2.4.10 lint + TypeScript 6.0.3
npm run build                   # Zero-error production build
git diff --name-only            # Confirm no source files modified
```

---
## Agent Team Configuration (Antigravity 2.0 — Agent Teams Panel)

| Sub-Agent | Model | Responsibility |
|-----------|-------|----------------|
| Visual Crawler | `@gemini-3.5-flash` | Browser screenshots 375/768/1440px, layout, animation |
| CMS + API Auditor | `@gemini-3.5-flash` | Schema, endpoint probe, admin→frontend data flow |
| Perf + SEO + a11y | `@gemini-3.5-flash` | Web Vitals, metadata, Biome, accessibility |
| **Synthesizer** | **`@claude-opus-4-6`** | **Aggregates all output → `findings.md`** |

All three crawl agents run in **parallel**. Synthesizer runs after all complete (fan-in).

---

## Full Endpoint Probe

Run each group and log all results to `findings/api-endpoints/api-probe.json`:

### Group A — Homepage
```bash
for ep in homepage-batch homepage-hero homepage-slogans homepage-sections homepage-featured-products-settings homepage-process-cards; do
  echo "=== $ep ===" && curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/$ep
done
```

### Group B — About
```bash
for ep in about-hero about-timeline about-locations about-sections about-statistics about-team-message; do
  echo "=== $ep ===" && curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/$ep
done
```

### Group C — Sustainability
```bash
for ep in sustainability sustainability-metrics sustainability-initiatives sustainability-goals; do
  echo "=== $ep ===" && curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/$ep
done
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/sustainability/batch
```

### Group D — Manufacturing (Priority)
```bash
for ep in manufacturing-hero manufacturing-processes manufacturing-capabilities manufacturing-qualities manufacturing-case-studies; do
  echo "=== $ep ===" && curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/$ep
done
```

### Group E — Technology
```bash
for ep in technology-hero technology-innovations technology-equipment technology-research technology-roadmap technology-cta technology-gradient-settings; do
  echo "=== $ep ===" && curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/$ep
done
```

### Group F — Navigation, Footer, Contact, Resources
```bash
for ep in navigation-items navigation-settings footer contact-info locations resources/batch; do
  echo "=== $ep ===" && curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/$ep
done
```

### Group G — Catalog
```bash
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" "http://localhost:5002/api/products?page=1&limit=5"
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/categories
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/categories/by-slug/activewear
```

### Group H — Health & Observability
```bash
for ep in health health/live health/ready health/deep; do
  echo "=== $ep ===" && curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/$ep
done
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/worker/health
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/media/health-scan
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/media/rate-limiter/health
```

### Group I — Security (Unauthenticated)
```bash
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/auth/user         # Expect 401
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/analytics/vitals  # Expect 401
```

---

## Evaluation Criteria (For Every Endpoint)

- [ ] HTTP 200 for all public data endpoints
- [ ] Response time < 200ms (< 500ms for batch); document all outliers
- [ ] `Content-Type: application/json` header present
- [ ] Response body is valid, non-empty JSON
- [ ] Response shape matches `@run-remix/shared` TypeScript types
- [ ] `X-RateLimit-*` headers on rate-limited endpoints
- [ ] No sensitive data (PII, tokens, internal IDs) in public responses
- [ ] Security headers present: `X-Content-Type-Options`, `X-Frame-Options`

## Special Findings
- [ ] Any endpoint returning > 500ms → P2 (caching may be broken)
- [ ] Any endpoint returning HTML instead of JSON → P0
- [ ] Any unauthenticated endpoint returning admin data → P0 security
- [ ] Document all endpoints using `.js` route handler files (vs `.ts`)

---
## Artifacts to Produce

```
findings/apix/
├── findings.md            ← Severity-scored report (P0/P1/P2/P3)
├── protocol-0.txt         ← verify:tech-integrity output
├── api-probe.json         ← Raw endpoint responses
└── screenshots/
    ├── desktop-1440px.png
    ├── tablet-768px.png
    ├── mobile-375px.png
```

Issue format in `findings.md`:
```
## P0 — Critical
### APIX-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 45 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
