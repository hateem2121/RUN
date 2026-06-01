# 🧠 MASTER ORCHESTRATOR — RUN Remix Full-Site Investigation
**Agent Host**: Antigravity 2.0 Desktop · Agent Teams Panel
**Orchestrator Model**: `@claude-opus-4-6`
**Crawl Models**: `@gemini-3.5-flash` (all 26 page sub-agents)
**Environment**: `http://localhost:5002`
**Scope**: Read-only — do NOT modify any source files
**Orchestration Pattern**: Hierarchical Fan-Out / Fan-In (June 2026 best practice)

---

## Why This Pattern?

Research consensus as of June 2026 (Princeton NLP, Microsoft Azure Architecture Center, Beam AI, Google Antigravity 2.0 docs):
- **Fan-out / fan-in** is the production-proven standard for independent parallel investigation tasks
- Each page investigation has **zero inter-agent dependencies** → full parallelism safe
- `@claude-opus-4-6` as orchestrator + final synthesizer; `@gemini-3.5-flash` for all crawling
  (4× faster throughput, lower cost, purpose-built for repetitive inspection across many pages)
- **Failure strategy**: Best-effort (continue if any branch fails; log all failures as findings)
- **Convergence trigger**: Synthesizer waits for ALL 26 branches before generating master report

---

## Pre-flight: Protocol 0 (Run ONCE Before Spawning Any Agents)

```bash
npm run verify:tech-integrity   # 8-point integrity gate
npm run check                   # Biome 2.4.10 + TypeScript 6.0.3
npm run build                   # Zero-error build confirmation
git status                      # Confirm clean working tree
```

Log full output to `findings/system/protocol-0.txt`.
Do not fix errors — all failures become findings in the master report.

---

## AGENTS.md — Shared Context for All Sub-Agents

Ensure the following block is present in `AGENTS.md` at the project root before spawning.
All 26 sub-agents inherit these constraints automatically:

```markdown
# RUN Remix — Site Investigation Rules

## Environment
- Server port: 5002 (never 3000)
- Base URL: http://localhost:5002
- Mode: Read-only investigation — never write to source files

## Scope
- Do NOT create, edit, or delete files in client/, server/, or shared/
- All output goes exclusively to findings/[page-name]/ directories
- Run: git diff --name-only after completion to verify source is clean

## Browser Viewports
- Mobile:  375px
- Tablet:  768px
- Desktop: 1440px
- Wide:    1920px (check max-width constraints)

## Severity Scoring
- P0: Critical — broken, crash, security issue, data missing
- P1: Major — feature broken, SEO invisible, significant a11y failure
- P2: Minor — layout issue, slow endpoint, non-critical warning
- P3: Cosmetic — visual polish, minor inconsistency

## Model Routing
- Crawling, screenshots, API probing: @gemini-3.5-flash
- Report synthesis, pattern analysis: @claude-opus-4-6

## Tech Stack Hard Rules (for TypeScript/Biome/animation checks)
- React 19.2.6: no forwardRef, named exports, form action= not onSubmit
- Tailwind 4.3.0: @theme + @utility syntax, no arbitrary values
- Zod 4.4.3: error: param only (not message:, required_error:)
- Biome 2.4.10: noExplicitAny + noMisusedPromises active
- GSAP only: zero framer-motion imports allowed (hard rule)
- Single scroll library: never dual-instantiate lenis + locomotive-scroll
- sonner ^2.0.7: no custom toast implementations
- neverthrow Result types in service layer: no raw throw statements
- Port: 5002 always — never 3000
```

---

## Fan-Out: 26 Page Sub-Agents (All Run in Parallel)

Open Agent Teams panel. Assign `@gemini-3.5-flash` to each agent.
Paste the corresponding prompt file as its instructions.

| # | Agent | Route(s) | Prompt File | Priority |
|---|-------|----------|-------------|----------|
| 01 | Homepage | `/` | `01-homepage.md` | High |
| 02 | About | `/about` | `02-about.md` | Standard |
| 03 | Services | `/services` | `03-services.md` | Standard |
| 04 | Contact | `/contact` | `04-contact.md` | High |
| 05 | Sustainability | `/sustainability` | `05-sustainability.md` | Standard |
| 06 | **Manufacturing** | `/manufacturing` | `06-manufacturing.md` | **🚨 HIGHEST** |
| 07 | Technology | `/technology` | `07-technology.md` | Standard |
| 08 | Products | `/products` | `08-products.md` | High |
| 09 | Categories | `/categories` + sub-routes | `09-categories.md` | High |
| 10 | Resources Hub | `/resources` | `10-resources-hub.md` | Standard |
| 11 | Certifications | `/certifications` | `11-certifications.md` | Standard |
| 12 | Fabrics | `/fabrics` | `12-fabrics.md` | Standard |
| 13 | Fibers | `/fibers` | `13-fibers.md` | Standard |
| 14 | Accessories | `/accessories` | `14-accessories.md` | Standard |
| 15 | Size Charts | `/size-charts` | `15-size-charts.md` | Standard |
| 16 | Developer Portal | `/developer` + sub-routes | `16-developer-portal.md` | Standard |
| 17 | Dashboard | `/dashboard` | `17-dashboard.md` | High |
| 18 | Analytics | `/analytics` | `18-analytics.md` | Standard |
| 19 | Legal Pages | `/privacy` + `/terms` | `19-legal-pages.md` | Standard |
| 20 | 404 Catch-All | `/*` | `20-404-catchall.md` | Standard |
| 21 | Admin Console | `/admin` + `/admin/:module/*` | `21-admin-console.md` | High |
| 22 | Global Shell | `root.tsx` + `_public.tsx` | `22-global-shell.md` | High |
| 23 | API Endpoints | All `/api/*` | `23-api-endpoints.md` | High |
| 24 | Missing Routes | `/blog`, `/gallery`, `/collections` | `24-missing-routes.md` | High |
| 25 | SSR Cache | `route-manifest.ts` discrepancies | `25-route-manifest-ssr.md` | **🚨 CRITICAL** |
| 26 | System Integrity | Biome, TS, Protocol 0, debt | `26-system-integrity.md` | High |

---

## Fan-In: Synthesis Pass (@claude-opus-4-6)

After ALL 26 agents complete (or 45-minute timeout), run synthesis:

```
Read every file matching: findings/*/findings.md

1. Deduplicate cross-cutting issues (same bug on multiple pages → one finding, list affected pages)
2. Rank all unique issues: P0 → P1 → P2 → P3
3. Categorize each: Visual | CMS | Performance | SEO | Accessibility | API | Animation | TypeScript | Routing | Security
4. Identify systemic patterns (e.g. "no React Router loader on 7 pages" = one systemic finding)
5. Generate findings/master-report.md with the structure below
```

### master-report.md Structure

```markdown
# RUN Remix — Full-Site Investigation Master Report
Date: [Date] | Agents: 26 | Crawl: Gemini 3.5 Flash | Synthesis: Claude Opus 4.6

## Executive Summary
| Severity | Count | Pages Affected |
|----------|-------|----------------|
| P0 Critical | N | list |
| P1 Major | N | list |
| P2 Minor | N | list |
| P3 Cosmetic | N | list |

## Critical Path (P0 — Fix Immediately)
...

## Systemic Issues (Cross-Cutting Patterns)
...

## Full Issue Register
[All findings with ID, severity, page, file path]

## Recommended Fix Sequence (Dependency-Aware)
...

## Protocol 0 Summary
[8-point check results]

## API Health Matrix
[All endpoints: status, response time, shape OK]
```

---

## Master Artifacts Tree

```
findings/
├── task_plan.md              ← Agent spawn log + pre-flight output
├── master-report.md          ← @claude-opus-4-6 synthesis
├── system/
│   ├── protocol-0.txt
│   ├── biome-report.txt
│   └── typescript-errors.txt
├── homepage/
├── about/
├── services/
├── contact/
├── sustainability/
├── manufacturing/            ← Priority
├── technology/
├── products/
├── categories/
├── resources-hub/
├── certifications/
├── fabrics/
├── fibers/
├── accessories/
├── size-charts/
├── developer-portal/
├── dashboard/
├── analytics/
├── legal/
├── 404/
├── admin/
├── global-shell/
├── api-endpoints/
├── missing-routes/
├── route-manifest-ssr/
└── system-integrity/
```

---

## Master Success Criteria

- [ ] All 26 sub-agents complete (failures logged in `task_plan.md`)
- [ ] All `findings/[page]/findings.md` files exist
- [ ] `findings/master-report.md` generated by `@claude-opus-4-6`
- [ ] Every issue has a severity score (P0/P1/P2/P3) and unique ID
- [ ] `git diff --name-only` confirms zero source modifications
- [ ] `findings/system/protocol-0.txt` contains full Protocol 0 output
