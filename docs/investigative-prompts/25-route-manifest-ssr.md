# 🔍 INVESTIGATE: Route Manifest & SSR Cache Mismatches
**Route**: `shared/route-manifest.ts`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002shared/route-manifest.ts`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/ssrc/`
**Issue ID Prefix**: `SSRC-`

---
## Goal
Reproduce all three confirmed routing discrepancies between `route-manifest.ts` and `routes.ts`, measure their real-world impact, and produce a complete discrepancy matrix of every mismatch — not just the three known ones.

---

## Context
**Files**:
- `shared/route-manifest.ts` — SSR cache key definitions
- `client/app/routes.ts` — React Router client-side route definitions
- `server/routes/index.ts` — Express SSR cache middleware

**Confirmed Mismatches from Route Audit**:
1. Manifest: `/resources/certifications` → Router: `/certifications` (+ 4 other resource paths)
2. Manifest: `/developer/guides` (static) → Router: `/developer/guides/:slug` (dynamic)
3. `GEMINI.md` documentation: claims `/resources/*` nesting (wrong) + missing routes

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/route-manifest-ssr/protocol-0.txt`.
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

### 1. Reproduce Mismatch 1 — Resource Sub-Paths
```bash
# These SHOULD 404 (manifest wrong, router maps to root):
for path in certifications fabrics accessories size-charts fibers; do
  echo "=== /resources/$path ===" && curl -sw "HTTP: %{http_code}\n" http://localhost:5002/resources/$path
done

# These SHOULD 200 (actual router paths):
for path in certifications fabrics accessories size-charts fibers; do
  echo "=== /$path ===" && curl -sw "HTTP: %{http_code}\n" http://localhost:5002/$path
done
```
Document actual HTTP codes for all 10 requests.

### 2. Reproduce Mismatch 2 — Developer Guides Cache Bypass
```bash
# Get a real slug first
curl -s http://localhost:5002/api/developer-guides 2>/dev/null || echo "Endpoint unknown — investigate"
# Test guide detail
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/developer/guides/getting-started
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/developer/guides
```
- [ ] Guide detail loads (loader works)
- [ ] But SSR cache bypassed — document TTFB difference (cached vs uncached)
- [ ] `/developer/guides` (no slug): 404 or redirect?

### 3. Full Discrepancy Matrix (Read Both Files)
- [ ] Read `shared/route-manifest.ts` in full — list every cache key
- [ ] Read `client/app/routes.ts` in full — list every route
- [ ] For every manifest key: does a matching route exist in `routes.ts`?
- [ ] For every route: does a matching cache key exist in the manifest?
- [ ] Produce `findings/route-manifest-ssr/discrepancy-matrix.md`
- [ ] Are `/services`, `/resources`, `/developer` in the manifest?

### 4. GEMINI.md Documentation Audit
- [ ] Read `GEMINI.md` at project root
- [ ] List all routes documented in GEMINI.md
- [ ] Compare against actual `routes.ts` — all discrepancies are P3 documentation debt

### 5. Impact Assessment (Per Mismatch)
For each of the 3+ confirmed mismatches:
- [ ] SEO impact: external marketing links pointing to wrong paths?
- [ ] Performance impact: pages that should be SSR-cached but aren't
- [ ] UX impact: 404s for valid-looking URLs
- [ ] Dev impact: `GEMINI.md` misleads future developers

---
## Artifacts to Produce

```
findings/ssrc/
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
### SSRC-001: [Title]
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
