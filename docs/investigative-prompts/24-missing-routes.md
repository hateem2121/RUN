# 🔍 INVESTIGATE: Missing Public Routes
**Route**: `/blog, /gallery, /collections`
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Crawl Model**: `@gemini-3.5-flash`
**Synthesis Model**: `@claude-opus-4-6`
**Environment**: `http://localhost:5002/blog, /gallery, /collections`
**Scope**: Read-only · Do NOT modify source files
**Output**: `findings/miss/`
**Issue ID Prefix**: `MISS-`

---
## Goal
Investigate the three routes confirmed absent from `routes.ts` but present in CMS schema or `ROUTE_MAPPING.md`. Assess business impact, DB readiness, and implementation effort for each.

---

## Context
**Confirmed Missing Routes**:
- `/blog` + `/blog/:slug` — DB schema exists, admin module exists, no public route
- `/gallery` — Listed in `ROUTE_MAPPING.md`, no public route component
- `/collections` — Referenced in B2B requirements, no schema or route

---

## Pre-flight: Protocol 0

Run once before beginning. Log all output to `findings/missing-routes/protocol-0.txt`.
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

### 1. Confirm Route Absence
```bash
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/blog
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/gallery
curl -sw "\nHTTP: %{http_code}\n" http://localhost:5002/collections
```
- [ ] All three return 404 (confirm absence — expected)
- [ ] Read `client/app/routes.ts`: confirm none registered
- [ ] Read `shared/route-manifest.ts`: any entries for these?

### 2. Blog — DB + Admin Readiness
- [ ] Find blog DB schema: `grep -r "blog" shared/ --include="*.ts"` (schema files)
- [ ] Document all blog schema fields: `id`, `title`, `slug`, `content`, `publishedAt`, etc.
- [ ] Visit `/admin/blog` (or check admin nav): does admin CRUD work?
- [ ] Count blog posts in DB (via admin UI)
- [ ] Search for blog API endpoint: `grep -r "blog" server/routes/ --include="*.ts" --include="*.js"`
- [ ] Readiness: "Ready to implement" / "Needs API" / "Needs schema"

### 3. Gallery — Media System Assessment
- [ ] Visit `/admin/media/gallery`: admin gallery module loads?
- [ ] What does it contain? (product images, marketing assets, factory photos?)
- [ ] Search: `grep -r "gallery" server/routes/ --include="*.ts"` — any API endpoint?
- [ ] Media storage: local disk or cloud (GCS/S3)?

### 4. Collections — Requirements Gap
- [ ] `grep -r "collections" shared/ server/ client/ --include="*.ts" --include="*.tsx"` — any refs?
- [ ] DB schema for collections: exists or not?
- [ ] B2B storefront need: would `/collections` map to category groups or product bundles?
- [ ] Verdict: "Not started" / "Schema only" / "API ready"

### 5. Impact Assessment
- [ ] SEO: are any missing routes linked from existing pages? (`grep -r '"/blog"\|"/gallery"\|"/collections"' client/`)
- [ ] Navigation: do `/api/navigation-items` include these routes? (broken nav links)
- [ ] Business: blog posts created in admin — can they be published currently? (No = P1)

---
## Artifacts to Produce

```
findings/miss/
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
### MISS-001: [Title]
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
