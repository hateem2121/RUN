# 🔍 INVESTIGATE: Products Catalog Page
**Route**: `/products`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/products`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/prod/`
**Issue ID Prefix**: `PROD-`

---
## Goal
Investigate the main product catalog page — the only catalog route with a React Router loader (SSR-eligible). Focus on SSR confirmation, filtering, pagination, API layer, and the known slug-checker TODO.

---

## Context
**Source File**: `client/app/routes/products.tsx`
**Loader**: YES — React Router loader present (SSR eligible — verify it works)

### CMS API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /api/products` | Paginated catalog with filters: `category`, `tag`, `search`, `featured` |
| `GET /api/products/by-path` | Resolves URL paths to product IDs |
| `GET /api/products/:id` | Full product specifications |
| `GET /api/products/:id/3d-model` | GLB/GLTF model metadata |

### Known Issues
- `useProductForm.ts` has active TODO for slug-checker API (`GET /api/v1/admin/products/check-slug`) — not wired up (P1)
- Pagination handling: must not cause layout shift (CLS)

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/products/protocol-0.txt`.
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

### 1. Visual & UI
- [ ] Product grid: correct column layout at 1440px / 768px / 375px
- [ ] Product cards: image, title, category badge, CTA all visible
- [ ] Filter/sort UI: populates from API (not hardcoded)
- [ ] Pagination or infinite scroll: works without layout shift
- [ ] Loading state: skeleton or spinner shown while products load
- [ ] Empty state: renders when no products match filter (not blank/crash)
- [ ] No console errors or React 19 hydration warnings

### 2. CMS & Data Integrity
- [ ] `GET /api/products`: valid paginated shape `{data: [], pagination: {page, limit, total}}`
- [ ] Product images: all resolve (no broken images in grid)
- [ ] Admin (`http://localhost:5002/admin/products`): product list loads
- [ ] **Known P1 TODO**: Test duplicate slug on product create — does UI prevent it?
  - Expected: no slug check runs (wired TODO). Document as P1.
- [ ] Check `useProductForm.ts` for the TODO comment — screenshot and log

### 3. API Health
```bash
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" "http://localhost:5002/api/products?page=1&limit=12"
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" "http://localhost:5002/api/products?category=activewear"
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" "http://localhost:5002/api/products?search=jersey&page=1"
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" "http://localhost:5002/api/products?featured=true"
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" "http://localhost:5002/api/products/1"
curl -sw "\nHTTP: %{http_code} Time: %{time_total}s\n" "http://localhost:5002/api/products/1/3d-model"
```
- [ ] All filters return correct subsets
- [ ] Invalid product ID (e.g., `/api/products/99999`): returns 404 (not 500)
- [ ] 3D model endpoint: returns metadata or 404 if no model (not crash)

### 4. SSR Confirmation (Loader Present)
```bash
curl http://localhost:5002/products | grep -i "product\|<title"
```
- [ ] Initial HTML contains product data (loader = SSR should work)
- [ ] If content missing from initial HTML: P1 finding (loader not SSR-rendering correctly)

### 5–10. Standard Axes
Apply standard axes 5–10: SEO (unique title/desc per page), broken links, mobile (single-column at 375px), a11y (product cards keyboard-navigable), animation (card hover: CSS permitted for simple hover), TypeScript/Biome.

---
## Artifacts to Produce

```
findings/prod/
├── findings.md            ← Severity-scored report (P0/P1/P2/P3)
├── protocol-0.txt         ← verify:tech-integrity output
├── api-probe.json         ← Raw endpoint responses
└── screenshots/
    ├── desktop-1440px.png
    ├── tablet-768px.png
    ├── mobile-375px.png
    ├── admin-products.png
```

Issue format in `findings.md`:
```
## P0 — Critical
### PROD-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 6 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] Admin module verified: `http://localhost:5002/admin/products`
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
