# 🔍 INVESTIGATE: Resources Hub
**Route**: `/resources`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/resources`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/rsrc/`
**Issue ID Prefix**: `RSRC-`

---
## Goal
Investigate `/resources` for all visual, CMS, API, performance, SEO, accessibility, animation, and TypeScript issues. Produce a severity-scored findings report without modifying any source files.

---

## Context
**Source File**: `client/app/routes/resources.tsx`
**Description**: Materials hub landing page. Has React Router loader. Links to certifications, fabrics, fibers, accessories, size-charts.

### CMS API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /api/resources/batch` | Aggregates all 5 sub-resources: certifications, accessories, sizeCharts, fabrics, fibers |

### Known Issues
- SSR CACHE MISMATCH: route-manifest.ts expects `/resources/certifications` but router maps `/certifications` — do NOT fix, document only
- Navigation links on hub: do they point to `/certifications` (correct) or `/resources/certifications` (404)?
- Batch endpoint aggregates 5 sub-resources — test partial failure handling
- Loader present → SSR eligible: verify content appears in initial HTML

---
## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/rsrc/protocol-0.txt`.
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

### 1. Visual & UI Rendering (375px / 768px / 1440px)
- [ ] All sections render without error or missing content
- [ ] GSAP scroll-reveal animations fire correctly
- [ ] No console errors or React 19 hydration warnings
- [ ] No horizontal overflow at any viewport
- [ ] Hero banner (if present): image, headline, CTA all visible
- [ ] All images load without broken `<img>` tags
- [ ] Section spacing and typography consistent

### 2. CMS Data Integrity
- [ ] All CMS endpoints return expected data shape (not `null` or `[]`)
- [ ] Admin modules accessible and CRUD functional:
  - [ ] `http://localhost:5002/admin/resources`
- [ ] Admin changes reflect on public page within one reload
- [ ] Empty/null CMS data: page degrades gracefully (no crash)
- [ ] No hardcoded content bypassing CMS

### 3. API Health
```bash
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/resources/batch
```
- [ ] All endpoints return HTTP 200
- [ ] Response time < 200ms
- [ ] Response shapes match `@run-remix/shared` TypeScript types
- [ ] Error boundary exists for failed fetches

### 4. Performance (LCP <2.5s · INP <200ms · CLS <0.1)
- [ ] Lighthouse audit — document LCP, INP, CLS
- [ ] Hero image: `fetchpriority="high"`, `loading="eager"`
- [ ] Below-fold images: `loading="lazy"`
- [ ] API calls fired in parallel `Promise.all`, not sequential waterfall
- [ ] No unnecessary re-renders or heavy client-side computation on load

### 5. SEO & Metadata
- [ ] View page source — is content in initial HTML? (no loader = no SSR)
- [ ] `<title>`, `<meta name="description">`, Open Graph tags all present
- [ ] Single `<h1>`, logical heading hierarchy (h1 → h2 → h3)
- [ ] All images have non-empty, descriptive `alt` attributes
- [ ] `robots.txt`: route not blocked

### 6. Broken Links & Assets
- [ ] Network tab: zero 404 asset requests on page load
- [ ] All internal links navigate to valid routes
- [ ] External links: `target="_blank"` + `rel="noopener noreferrer"`
- [ ] No `href="#"` placeholder links

### 7. Mobile Responsiveness
- [ ] No fixed-width elements wider than 375px
- [ ] Typography readable at 375px (no overflow or truncation)
- [ ] Touch targets ≥ 44×44px on all interactive elements
- [ ] `viewport` meta tag in `<head>`
- [ ] Tailwind responsive prefixes only (no arbitrary breakpoints)

### 8. Accessibility (WCAG AA)
- [ ] All `<button>` + `<a>` have `aria-label` (zero tolerance)
- [ ] Color contrast ≥ 4.5:1 on all text
- [ ] Focus ring visible for keyboard navigation
- [ ] GSAP animations respect `prefers-reduced-motion`
- [ ] Form elements (if any) have associated `<label>` elements

### 9. Animation & Motion (GSAP)
- [ ] Zero `framer-motion` imports in component
- [ ] Single scroll library (lenis OR locomotive-scroll — never both)
- [ ] `ScrollTrigger.refresh()` called after dynamic content loads
- [ ] GSAP contexts cleaned up in `useEffect` return / unmount
- [ ] No CSS `transition` on GSAP-animated elements (conflicts)

### 10. TypeScript & Biome 2.4.10
```bash
npx biome check {source_file}
```
- [ ] Zero violations (log all `noExplicitAny` + `noMisusedPromises`)
- [ ] All types from `@run-remix/shared` (no local re-definitions)
- [ ] No hardcoded API strings (use `@run-remix/shared/api-constants.ts`)
- [ ] Zod v4 `error:` param syntax throughout
- [ ] `neverthrow` Result types in server service layer

### RESOURCES-SPECIFIC: Batch Endpoint + SSR Audit
```bash
curl -s http://localhost:5002/api/resources/batch | python3 -m json.tool | head -40
curl http://localhost:5002/resources | grep -i "certif\|fabric\|fiber"
```
- [ ] Batch response contains all 5 keys: `certifications`, `accessories`, `sizeCharts`, `fabrics`, `fibers`
- [ ] Each sub-key has correct array structure (not `null`)
- [ ] Partial failure test: if fibers sub-resource fails, does batch return partial data or full 500?
- [ ] Navigation links on hub → confirm they use `/certifications` not `/resources/certifications`
  - If links use `/resources/certifications`: P0 finding (all hub navigation leads to 404)

---
## Artifacts to Produce

```
findings/rsrc/
├── findings.md            ← Severity-scored report (P0/P1/P2/P3)
├── protocol-0.txt         ← verify:tech-integrity output
├── api-probe.json         ← Raw endpoint responses
└── screenshots/
    ├── desktop-1440px.png
    ├── tablet-768px.png
    ├── mobile-375px.png
    ├── admin-resources.png
```

Issue format in `findings.md`:
```
## P0 — Critical
### RSRC-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 1 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] Admin module verified: `http://localhost:5002/admin/resources`
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
