# 🔍 INVESTIGATE: Global Layout Shell
**Route**: `root.tsx + _public.tsx (all routes)`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002root.tsx + _public.tsx (all routes)`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/glbl/`
**Issue ID Prefix**: `GLBL-`

---
## Goal
Investigate the global layout shell that wraps every public page. Bugs here affect the entire site simultaneously — highest blast radius of any finding category.

---

## Context
**Source Files**:
- `client/app/root.tsx` — Root: FloatingDockHeader, ScrollProvider
- `client/app/routes/_public.tsx` — Public shell: Footer, QuoteOverlay

### CMS API Endpoints (Load on Every Public Page)
| Endpoint | Purpose |
|----------|---------|
| `GET /api/navigation-items` | Hierarchical items for FloatingDockHeader |
| `GET /api/navigation-settings` | Styling (glassmorphism, colors) |
| `GET /api/footer` | Dynamic footer menu structure |

Any failure in these endpoints breaks all public pages simultaneously.

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/global-shell/protocol-0.txt`.
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

### 1. FloatingDockHeader (Navigation)
- [ ] Header renders on `/`, `/manufacturing`, `/about` — all consistent
- [ ] Navigation items from `/api/navigation-items` (not hardcoded)
- [ ] Active route highlighted correctly as user navigates
- [ ] Dropdown/mega-menu: renders, closes on outside click + Escape key
- [ ] Sticky/float behavior: correct position on scroll
- [ ] Glassmorphism from `/api/navigation-settings`: applied correctly
- [ ] Mobile: hamburger opens/closes, all nav items accessible

### 2. Footer
- [ ] Footer renders on all public pages
- [ ] Footer columns/links from `/api/footer`: correct structure
- [ ] All footer links valid (zero 404s):
  ```bash
  curl -s http://localhost:5002/api/footer | python3 -m json.tool | grep '"url"' | while read line; do
    url=$(echo $line | cut -d'"' -f4)
    [[ $url == /* ]] && curl -sw "$url -> %{http_code}\n" -o /dev/null "http://localhost:5002$url"
  done
  ```
- [ ] External footer links: `target="_blank"` + `rel="noopener noreferrer"`

### 3. QuoteOverlay
- [ ] Trigger button visible and accessible on all public pages
- [ ] Overlay opens correctly (animation smooth)
- [ ] Overlay form: all fields render, validation works
- [ ] Closes on Escape key + outside click
- [ ] `aria-label` on trigger; `role="dialog"` + `aria-modal="true"` on overlay
- [ ] Focus trap inside overlay when open

### 4. ScrollProvider (Scroll Library — Critical Single-Library Rule)
- [ ] Identify active library: `lenis` OR `locomotive-scroll`
- [ ] **Hard rule**: confirm ONLY ONE is instantiated — never both
- [ ] Smooth scroll behavior, no jank
- [ ] `ScrollTrigger.refresh()` called after route navigation
- [ ] Scroll position resets correctly on route change

### 5. API Health (Navigation + Footer)
```bash
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/navigation-items
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/navigation-settings
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" http://localhost:5002/api/footer
```
- [ ] All 3 return 200 with valid shapes
- [ ] What happens if `/api/navigation-items` returns 500? Does the entire site break?
- [ ] Are navigation API calls cached (repeated requests fast)?

### 6–10. Standard Axes
Performance (header bundle weight), a11y (skip-to-main link, `<nav aria-label>`), animation, TypeScript/Biome.

---
## Artifacts to Produce

```
findings/glbl/
├── findings.md            ← Severity-scored report (P0/P1/P2/P3)
├── protocol-0.txt         ← verify:tech-integrity output
├── api-probe.json         ← Raw endpoint responses
└── screenshots/
    ├── desktop-1440px.png
    ├── tablet-768px.png
    ├── mobile-375px.png
    ├── admin-navigation.png
    ├── admin-footer.png
```

Issue format in `findings.md`:
```
## P0 — Critical
### GLBL-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 3 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] Admin module verified: `http://localhost:5002/admin/navigation`
- [ ] Admin module verified: `http://localhost:5002/admin/footer`
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
