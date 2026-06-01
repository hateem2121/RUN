# 🔍 INVESTIGATE: 404 Catch-All Page
**Route**: `/* (unmatched routes)`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/* (unmatched routes)`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/e404/`
**Issue ID Prefix**: `E404-`

---
## Goal
Investigate the 404 catch-all for correct HTTP status codes, helpful UX, and as a tool to reproduce the confirmed SSR cache mismatch (resource sub-paths → 404).

---

## Context
**Source File**: `client/app/routes/$.tsx`
**No loader, no CMS APIs** — renders for all unmatched client-side routes.

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/404/protocol-0.txt`.
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

## Investigation Axes

### 1. Trigger & Render (Multiple Paths)
```bash
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/fake-route-xyz
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/resources/certifications
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/resources/fabrics
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/resources/accessories
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/resources/size-charts
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/resources/fibers
```
- [ ] All above return HTTP **404** (not 200!) — if 200: **P0 finding** (bad for SEO)
- [ ] 404 page renders with clear, brand-consistent messaging
- [ ] Helpful navigation links back to homepage and main sections

### 2. HTTP Status Code (Critical)
- [ ] Server returns `404` status code (not `200 OK` for missing routes)
- [ ] React Router catch-all must not override Express 404 handling

### 3. Navigation Recovery
- [ ] "Back to Homepage" link works
- [ ] Main navigation accessible from 404 page
- [ ] QuoteOverlay CTA still accessible (part of `_public.tsx`)

### 4. SSR Cache Mismatch — Reproduce Confirmed Bugs
- [ ] Navigate browser to `http://localhost:5002/resources/certifications`
  - Confirm: 404 page renders (not certifications content)
  - Document: this is the active SSR cache/routing mismatch bug
- [ ] Same for `/resources/fabrics`, `/resources/fibers`, `/resources/accessories`, `/resources/size-charts`

### 5. SEO
- [ ] `<title>`: "404" or "Page Not Found" (not misleading)
- [ ] No `<meta name="robots" content="noindex">` — let 404 HTTP status handle indexing signals
- [ ] `robots.txt`: `/*` not blocked

### 6. Error Boundary vs 404
- [ ] Separate React error boundary for JS runtime errors (not caught by catch-all)
- [ ] 404 (not found) vs 500 (server error): each has appropriate handler

### 7–10. Standard Axes
Mobile, a11y, animation, TypeScript/Biome.

---
## Artifacts to Produce

```
findings/e404/
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
### E404-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 0 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
