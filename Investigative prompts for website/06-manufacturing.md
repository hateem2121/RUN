# 🔍 INVESTIGATE: Manufacturing Page  🚨 HIGHEST PRIORITY
**Route**: `/manufacturing`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/manufacturing`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/mfgi/`
**Issue ID Prefix**: `MFGI-`

---
## Goal
Conduct a comprehensive deep investigation of `/manufacturing` and all five CMS modules that power it. This is the primary technical credibility page in RUN APPAREL's B2B buyer journey — any issue here directly impacts enterprise conversion. Identify and severity-score every bug across all axes. Do not fix anything; produce a complete findings report only.

---

## Context

### Source Files
| File | Role |
|------|------|
| `client/app/routes/manufacturing.tsx` | Page component — **no React Router loader**, all data client-side |
| `client/app/routes/_public.tsx` | Public shell (Footer + QuoteOverlay) |
| `client/app/root.tsx` | Root layout (FloatingDockHeader + ScrollProvider) |
| `server/routes/resources/manufacturing-*.routes.js` | CMS API handlers (`.js` — not `.ts`) |
| `@run-remix/shared` | Shared types and API constants |

### CMS API Endpoints
| Endpoint | Admin Module | Purpose |
|----------|-------------|---------|
| `GET /api/manufacturing-hero` | `admin/manufacturing-hero` | Page hero banner config |
| `GET /api/manufacturing-processes` | `admin/manufacturing-processes` | Production pipeline stages |
| `GET /api/manufacturing-capabilities` | `admin/manufacturing-capabilities` | Machinery details + counts |
| `GET /api/manufacturing-qualities` | `admin/manufacturing-qualities` | QC standards details |
| `GET /api/manufacturing-case-studies` | `admin/manufacturing-case-studies` | Client production showcases |

**Critical data-flow note**: No React Router loader = no SSR.
All 5 endpoints are fetched client-side on mount. Content is invisible to search crawlers.
Waterfall fetch risk: if sequential `await` is used instead of `Promise.all`, load time multiplies.

### Known Issues from Route Audit
- No React Router loader → zero SSR → content not indexed by crawlers (P1 SEO)
- Route files use `.js` extension (TypeScript coverage gap — P2)
- Unknown: whether `Promise.all` or sequential `await` is used
- Unknown: whether loading skeletons and error boundaries exist

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/manufacturing/protocol-0.txt`.
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

## Axis 1: Visual & UI Rendering

Navigate to `http://localhost:5002/manufacturing` using the built-in Antigravity browser.

**Desktop (1440px):**
- [ ] Hero banner renders: image, headline, sub-copy, CTA button all visible
- [ ] GSAP ScrollTrigger animations fire on scroll for all sections
- [ ] Manufacturing process pipeline renders without overflow or clipping
- [ ] Capabilities cards: correct grid, all images load, machinery counts visible
- [ ] Quality standards: all items visible, icons load
- [ ] Case studies: cards, metrics, and client names all render
- [ ] No console errors (`F12 → Console`) on load
- [ ] No React 19 hydration mismatch warnings
- [ ] No horizontal scrollbar

**Tablet (768px):** Columns reflow, process pipeline stacks, no text overflow

**Mobile (375px):** All sections stack, CTAs accessible, touch targets ≥ 44×44px, no horizontal scroll

📸 Screenshot all viewports → `findings/manufacturing/screenshots/`

---

## Axis 2: CMS Data Integrity

- [ ] Visit each admin module — verify it loads:
  - `http://localhost:5002/admin/manufacturing-hero`
  - `http://localhost:5002/admin/manufacturing-processes`
  - `http://localhost:5002/admin/manufacturing-capabilities`
  - `http://localhost:5002/admin/manufacturing-qualities`
  - `http://localhost:5002/admin/manufacturing-case-studies`
- [ ] Edit one field in admin → save → reload public page → verify change appears
- [ ] Test empty/null CMS state: does the page handle missing data without crashing?
- [ ] Full CRUD for each module: Create, Read, Update, Delete all functional
- [ ] Cross-check: API response fields vs what `manufacturing.tsx` actually renders
- [ ] Flag any fields in the API response that are never displayed (unused data)
- [ ] Zod v4 syntax in route files: `error:` param (not `message:` or `required_error:`)
- [ ] `neverthrow` Result types in service layer (no raw `throw`)
- [ ] `.js` extension on route files: document all 5 as TypeScript coverage gap (P2)

---

## Axis 3: API Health & Integration

```bash
for ep in manufacturing-hero manufacturing-processes manufacturing-capabilities manufacturing-qualities manufacturing-case-studies; do
  echo "=== $ep ===" >> findings/manufacturing/api-probe.json
  curl -s -w "\nHTTP: %{http_code}  Time: %{time_total}s\n"     http://localhost:5002/api/$ep >> findings/manufacturing/api-probe.json
done
```

- [ ] All 5 return HTTP 200
- [ ] Response time < 200ms each (L1/L2 cache should serve fast)
- [ ] Response bodies are valid JSON (not empty `{}` or `[]`)
- [ ] Response shapes match `@run-remix/shared` TypeScript types
- [ ] Read `manufacturing.tsx`: is `Promise.all([...])` used? Or sequential `await`? Document.
- [ ] Error boundary present: what renders if one API returns 500?
- [ ] Loading skeleton present: what shows while APIs resolve?
- [ ] Rate limiter: does rapid-refresh trigger 429? Does UI handle it?

---

## Axis 4: Performance & Web Vitals

- [ ] Lighthouse audit at `http://localhost:5002/manufacturing`:
  - LCP target: < 2.5s | INP target: < 200ms | CLS target: < 0.1
- [ ] Hero image: `fetchpriority="high"` + `loading="eager"` (above fold)
- [ ] Below-fold images: `loading="lazy"`
- [ ] Images correctly sized (no 2000px image scaled down in CSS to 300px)
- [ ] TTFB: document server response time for this route
- [ ] All 5 API calls in `Promise.all` (parallel)? Confirm and log.
- [ ] Any heavy import that could be lazy-loaded?
- [ ] No `console.time()` debug calls in production code path

---

## Axis 5: SEO & Metadata

- [ ] `curl http://localhost:5002/manufacturing | grep -i "<title\|description\|og:"` — is content in initial HTML?
  - **Expected finding**: empty shell (no loader = no SSR). Document as P1.
- [ ] `<title>`: present, CMS-driven or hardcoded?
- [ ] `<meta name="description">`: present, under 160 chars?
- [ ] Open Graph: `og:title`, `og:description`, `og:image` — all present?
- [ ] Canonical URL: `<link rel="canonical">` present?
- [ ] `robots.txt`: is `/manufacturing` blocked?
- [ ] Single `<h1>`, logical heading hierarchy (h1→h2→h3, no skips)
- [ ] All images: non-empty, descriptive `alt` attributes
- [ ] Structured data (JSON-LD): any `Organization` or manufacturing schema?

---

## Axis 6: Broken Links & Assets

- [ ] Network tab: zero 404 asset requests on load
- [ ] All CTA links (e.g., to `/contact`, `/products`) navigate correctly
- [ ] External links: `target="_blank"` + `rel="noopener noreferrer"`
- [ ] No `href="#"` placeholder links
- [ ] All image `src` attributes resolve
- [ ] Any `.glb`/`.gltf` 3D model references: do they load?

---

## Axis 7: Mobile Responsiveness

- [ ] `viewport` meta tag present in `<head>`
- [ ] No fixed-pixel-width elements wider than 375px
- [ ] Images use responsive sizing (`max-width: 100%` or Tailwind `w-full`)
- [ ] Typography scales correctly — no unreadable text at 375px
- [ ] Process pipeline: horizontal scroll or vertical stack on mobile?
- [ ] Tailwind v4 responsive prefixes only (`sm:`, `md:`, `lg:`) — no `min-[700px]:` patterns
- [ ] Touch targets: all CTAs ≥ 44×44px

---

## Axis 8: Accessibility (WCAG AA)

- [ ] All `<button>` and `<a>` elements have `aria-label` (zero tolerance)
- [ ] All `<dialog>` / modals have `role="dialog"` + `aria-modal="true"` + `aria-label`
- [ ] Color contrast ratio ≥ 4.5:1 on all text (including hero overlay)
- [ ] Focus ring visible on all interactive elements (keyboard nav)
- [ ] Tab order follows logical reading order
- [ ] GSAP animations: `prefers-reduced-motion` respected
- [ ] No content accessible only via hover (inaccessible to touch/keyboard users)
- [ ] Run axe-core if available; log all violations

---

## Axis 9: Animation & Motion (GSAP)

- [ ] `manufacturing.tsx`: zero `framer-motion` imports (hard rule)
- [ ] Single scroll library: lenis OR locomotive-scroll — never both instantiated
- [ ] `ScrollTrigger.refresh()` called after images/content loads
- [ ] No GSAP-animated elements also have CSS `transition` (conflict)
- [ ] No dropped frames during scroll (check FPS meter in DevTools)
- [ ] All GSAP contexts + tweens cleaned up in `useEffect` return
- [ ] `gsap.context()` used for scoped selectors (React 19 + GSAP best practice)

---

## Axis 10: TypeScript & Biome 2.4.10

```bash
npx biome check client/app/routes/manufacturing.tsx --reporter=json
```

- [ ] Zero `noExplicitAny` violations (log all instances with line numbers)
- [ ] Zero `noMisusedPromises` violations
- [ ] No `as any` casts in the component
- [ ] API response types imported from `@run-remix/shared`
- [ ] No hardcoded API route strings (must use `api-constants.ts`)
- [ ] React 19 patterns: no `forwardRef`, named exports, `action={fn}` not `onSubmit`
- [ ] `sonner` for toasts — no custom notification components
- [ ] CMS route files (`manufacturing-*.routes.js`): flag all 5 as `.js` (P2 tech debt)

---

## Artifacts to Produce

```
findings/mfgi/
├── findings.md            ← Severity-scored report (P0/P1/P2/P3)
├── protocol-0.txt         ← verify:tech-integrity output
├── api-probe.json         ← Raw endpoint responses
└── screenshots/
    ├── desktop-1440px.png
    ├── tablet-768px.png
    ├── mobile-375px.png
    ├── admin-manufacturing-hero.png
    ├── admin-manufacturing-processes.png
    ├── admin-manufacturing-capabilities.png
    ├── admin-manufacturing-qualities.png
    ├── admin-manufacturing-case-studies.png
```

Issue format in `findings.md`:
```
## P0 — Critical
### MFGI-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---

## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 5 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] Admin module verified: `http://localhost:5002/admin/manufacturing-hero`
- [ ] Admin module verified: `http://localhost:5002/admin/manufacturing-processes`
- [ ] Admin module verified: `http://localhost:5002/admin/manufacturing-capabilities`
- [ ] Admin module verified: `http://localhost:5002/admin/manufacturing-qualities`
- [ ] Admin module verified: `http://localhost:5002/admin/manufacturing-case-studies`
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
