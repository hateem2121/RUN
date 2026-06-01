# 🔍 INVESTIGATE: Categories Pages
**Route**: `/categories + sub-routes`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/categories + sub-routes`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/cate/`
**Issue ID Prefix**: `CATE-`

---
## Goal
Investigate all four category route variants for correct rendering, routing logic, SSR, and API data integrity.

---

## Context
**Source Files**:
- `client/app/routes/categories._index.tsx` — All categories list (loader)
- `client/app/routes/categories.$slug.tsx` — Category detail (loader)
- `client/app/routes/categories.$slug.products.tsx` — Products by category (loader)
- `client/app/routes/categories.$.tsx` — Deep nested catch-all (loader)

All four have React Router loaders (SSR-eligible).

### CMS API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /api/categories` | Full category list |
| `GET /api/categories/by-slug/:slug` | Single category by slug |
| `GET /api/categories/:id` | Single category by numeric ID |

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/categories/protocol-0.txt`.
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

### 1. Visual & UI (All 4 Routes)
- [ ] `/categories`: grid renders, all images load, correct counts
- [ ] `/categories/activewear` (use a real slug from `GET /api/categories`): header + product grid load
- [ ] `/categories/activewear/products`: distinct from `/categories/activewear` or duplicate layout?
- [ ] `/categories/activewear/tops` (deep nested): catch-all parses splat correctly
- [ ] No 404 on any valid category slug
- [ ] Empty category: graceful empty state

### 2. Routing Correctness (Critical)
```bash
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/categories
# Note the first real slug, then test:
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/categories/[real-slug]
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/categories/fakeslug-nonexistent
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/categories/[real-slug]/products
```
- [ ] Valid slug → 200; Non-existent slug → 404 or error state (not crash)
- [ ] No routing conflict between `categories.$slug.tsx` and `categories.$.tsx`
- [ ] Deep path (`/categories/activewear/tops`): splat parameter parsed correctly

### 3. API Health
```bash
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/categories
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/categories/by-slug/activewear
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/categories/1
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/api/categories/by-slug/fake-nonexistent
```
- [ ] Non-existent slug: 404 (not 500)
- [ ] Category hierarchy: parent-child relationships correct

### 4. SEO & SSR (Loader Present)
```bash
curl http://localhost:5002/categories | grep -i "<title\|category"
```
- [ ] Initial HTML contains category data (loader = SSR)
- [ ] Each category page: unique `<title>` and `<meta description>` (CMS-driven?)
- [ ] Breadcrumb structured data (JSON-LD) for nested paths

### 5–10. Standard Axes
Apply standard axes 5–10.

---
## Artifacts to Produce

```
findings/cate/
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
### CATE-001: [Title]
- **Axis**: [axis]  **File**: `path/to/file.tsx:Lnn`
- **Description**: What is wrong
- **Evidence**: screenshot ref | console error | curl output
- **Fix Direction**: Suggested approach only — no implementation
```

---
## Success Criteria

- [ ] `npm run verify:tech-integrity` output logged
- [ ] All 4 API endpoint(s) probed and logged in `api-probe.json`
- [ ] Screenshots captured at 375px, 768px, 1440px
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
