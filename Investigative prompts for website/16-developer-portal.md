# 🔍 INVESTIGATE: Developer Portal
**Route**: `/developer + sub-routes`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/developer + sub-routes`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/devp/`
**Issue ID Prefix**: `DEVP-`

---
## Goal
Investigate the developer portal and its sub-routes with a critical focus on the confirmed SSR cache mismatch for `/developer/guides/:slug`.

---

## Context
**Source Files**:
- `client/app/routes/developer.tsx` — Layout wrapper
- `client/app/routes/developer._index.tsx` — Portal home (no loader)
- `client/app/routes/developer.playground.tsx` — Component sandbox (no loader)
- `client/app/routes/developer.guides.$slug.tsx` — Guide detail (has loader)

**Known Critical Issue**: `route-manifest.ts` maps `/developer/guides` (static) but router maps `/developer/guides/:slug` (dynamic). SSR cache middleware misses all guide detail pages — they are never server-side cached.

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/developer-portal/protocol-0.txt`.
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

### 1. Visual & UI (All Sub-Routes)
- [ ] `/developer`: portal home renders, sub-route navigation works
- [ ] `/developer/playground`: component sandbox loads, all components render
- [ ] `/developer/guides/[slug]` (use a real slug from admin or DB): guide renders
- [ ] Layout wrapper (`developer.tsx`): shared nav elements on all sub-routes

### 2. SSR Cache Mismatch (Critical — Reproduce It)
```bash
# Find a real guide slug
curl -s http://localhost:5002/api/[guides-endpoint] | python3 -m json.tool | grep slug | head -3

# Test SSR on guide detail (should have content in initial HTML due to loader)
curl http://localhost:5002/developer/guides/getting-started | grep -i "<title\|<h1\|guide"

# Test non-existent path (no slug)
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/developer/guides
```
- [ ] Guide page loads correctly (loader works)
- [ ] BUT: is it SSR-cached? (Expected: NO — document as P1 performance/caching finding)
- [ ] `/developer/guides` (no slug): 404 or redirect? Document behavior.
- [ ] Non-existent slug: correct error state rendered

### 3. Guide Content
- [ ] Identify the API endpoint called by the guide loader (search in `developer.guides.$slug.tsx`)
- [ ] Probe the endpoint directly with curl
- [ ] Markdown/rich text renders correctly
- [ ] No hardcoded guide content in JSX

### 4. Performance
- [ ] Playground: heavy component imports lazy-loaded?
- [ ] Guide pages: document TTFB (SSR cache bypass = slower cold requests)

### 5–10. Standard Axes
Apply standard axes 5–10: SEO (unique title per guide), broken links, mobile, a11y, animation, TypeScript/Biome.

---
## Artifacts to Produce

```
findings/devp/
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
### DEVP-001: [Title]
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
- [ ] All 10 investigation axes completed
- [ ] `findings.md` produced with P0/P1/P2/P3 scoring
- [ ] `git diff --name-only` is clean (no source modifications)
