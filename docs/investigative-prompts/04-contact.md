# 🔍 INVESTIGATE: Contact Page
**Route**: `/contact`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/contact`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/cont/`
**Issue ID Prefix**: `CONT-`

---
## Goal
Investigate `/contact` for all visual, CMS, API, performance, SEO, accessibility, animation, and TypeScript issues. Produce a severity-scored findings report without modifying any source files.

---

## Context
**Source File**: `client/app/routes/contact.tsx`
**Description**: Inquiry form + company contact info + office/factory locations. No loader. Form submits via fetch to POST /api/contact.

### CMS API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /api/contact-info` | Company contact metadata |
| `GET /api/locations` | Office/factory location data |

### Known Issues
- No React Router loader → no SSR
- Form submits via client-side fetch — verify server-side validation, error handling, rate limit response
- Newsletter: POST /api/newsletter/subscribe — verify it works and handles errors
- Rate limiter on POST /api/contact — UI must handle 429 gracefully

---
## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/cont/protocol-0.txt`.
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
  - [ ] `http://localhost:5002/admin/contact-info`
  - [ ] `http://localhost:5002/admin/locations`
- [ ] Admin changes reflect on public page within one reload
- [ ] Empty/null CMS data: page degrades gracefully (no crash)
- [ ] No hardcoded content bypassing CMS

### 3. API Health
```bash
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/contact-info
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/locations
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

### CONTACT-SPECIFIC: Form Submission Audit

```bash
# Test contact form submission
curl -X POST http://localhost:5002/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test inquiry","company":"Test Co"}'

# Test newsletter subscribe
curl -X POST http://localhost:5002/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test rate limit (run 10x rapid)
for i in $(seq 1 10); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5002/api/contact -H "Content-Type: application/json" -d '{"name":"T","email":"t@t.com","message":"test","company":"T"}'; done
```

- [ ] Contact form: client-side + server-side validation present
- [ ] Success state: visible confirmation after submission
- [ ] Error state: visible error if API fails
- [ ] Rate limit (429): UI shows friendly message, not raw JSON error
- [ ] Email sending: routed through Google Cloud Tasks worker (POST /api/worker/send-email), not inline
- [ ] Map embed (if present): renders, not broken iframe
- [ ] Zod v4 validation in `contact.routes.ts`: `error:` param syntax only

---
## Artifacts to Produce

```
findings/cont/
├── findings.md            ← Severity-scored report (P0/P1/P2/P3)
├── protocol-0.txt         ← verify:tech-integrity output
├── api-probe.json         ← Raw endpoint responses
└── screenshots/
    ├── desktop-1440px.png
    ├── tablet-768px.png
    ├── mobile-375px.png
    ├── admin-contact-info.png
    ├── admin-locations.png
```

Issue format in `findings.md`:
```
## P0 — Critical
### CONT-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 2 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] Admin module verified: `http://localhost:5002/admin/contact-info`
- [ ] Admin module verified: `http://localhost:5002/admin/locations`
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
