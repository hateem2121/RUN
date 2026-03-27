# RUN Remix Ecosystem — Claude Code Project Constitution

> **This file is the authoritative context for every Claude Code session on this project.**
> It supersedes any other instructions. When in doubt, refer here first.

---

## 1. Identity

- **Project:** RUN Remix Ecosystem Pilot (v3.0.0)
- **Company:** RUN APPAREL (PVT) LTD — B2B sustainable sportswear manufacturer, Sialkot, Pakistan (subsidiary of Durus Industries, est. 1889)
- **Product:** Premium 3D Sportswear Configurator & Manufacturing Platform
- **Developer:** M. Hateem Jamshaid (Business Development Director)
- **Mission:** Heritage craftsmanship meets advanced agentic engineering. Build deterministic, self-healing automation using the B.L.A.S.T. protocol.

---

## 2. Non-Negotiable Tech Stack

| Layer | Technology | Constraint |
|-------|-----------|-----------|
| Frontend | React **19.2.4** | Functional components only. NO `forwardRef` — use raw ref prop. Named exports only. |
| Build | Vite **7** | Port **5002** exclusively. No other ports ever. |
| Styling | Tailwind CSS **V4** | `@utility` syntax for custom CSS. NO arbitrary values in JSX (`w-[342px]` is forbidden). CVA + `cn()` for variants. |
| Language | TypeScript strict | NO `any` types. Ever. Explicit return types on all functions. |
| Backend | Express **5.1.0** | Async-native handlers. **NO try/catch in route handlers** — Express 5 handles errors automatically. |
| Runtime | Node.js **≥24** | |
| ORM | Drizzle ORM **0.45.1** | Neon serverless HTTP driver only (no `pg` module for queries). |
| Database | Neon Serverless PostgreSQL | Use `@neondatabase/serverless` HTTP driver. |
| Cache | Upstash Redis (serverless) | Two-tier L1 (lru-cache) + L2 (Upstash). |
| 3D | `@google/model-viewer` **ONLY** | Always use `LazyUnifiedModelViewer`. **NEVER** `@react-three/fiber`, `@react-three/drei`, or `useGLTF` — this breaks the entire pipeline. |
| Testing | Vitest | NOT Jest. 80%+ coverage on services. |
| Linting | Biome | NOT ESLint or Prettier. Run: `npm run check:apply` |
| Icons | Lucide React | Only. |
| Forms | React Hook Form + Zod | Always validate with Zod schemas. |
| Port | **5002** | ALL services. Hard-coded. Enforced by CI. |

---

## 3. Protocol 0 (Mandatory)

**Every task — no exceptions — must:**
1. Start by updating `task_plan.md` with the plan
2. End by updating `findings.md` with what was done, discovered, and any follow-ups
3. Run `npm run verify:tech-integrity` before declaring done (must exit 0)

---

## 4. B.L.A.S.T. Protocol

The project build methodology:
- **Blueprint** — Define schemas in `shared/` and SOPs in `docs/core/sops/` first
- **Link** — Verify APIs and `.env` via `scripts/` atomics. No broken links.
- **Architect** — A.N.T. Layers: L1 SOPs (docs/), L2 Navigation (routes), L3 Tools (services)
- **Stylize** — 5D Design: Skeleton, Skin (glassmorphism), Palette (violets/blues), Voice (Inter/JetBrains Mono), Soul (60fps animations)
- **Trigger** — Deploy via CI/CD automation

---

## 5. Project Structure

```
/
├── client/                   # React 19 + Vite + Tailwind V4
│   └── app/
│       ├── routes/           # File-based routing (35+ routes)
│       ├── components/
│       │   ├── ui/           # Generic reusable (Radix-based)
│       │   ├── admin/        # Admin-only (21 subdirs)
│       │   └── [domain]/     # Domain-specific (products/, categories/)
│       ├── hooks/            # Custom React hooks
│       ├── stores/           # Zustand state
│       └── services/         # API clients
├── server/                   # Express 5 + Node 24
│   ├── routes/               # THIN — only call services, return responses
│   ├── services/             # THICK — all business logic lives here
│   ├── lib/
│   │   ├── db/repositories/  # Data access layer
│   │   ├── cache/            # L1/L2 cache implementation
│   │   ├── resilience/       # Circuit breakers, rate limiting
│   │   └── monitoring/       # OTel, Sentry, Prometheus
│   └── middleware/           # Express middleware (30+ files)
├── shared/                   # Shared TypeScript types & constants
├── docs/
│   ├── core/sops/            # L1 Architecture SOPs (read before implementing)
│   └── adr/                  # 15 Architecture Decision Records
├── .agent/
│   ├── skills/               # 21 Claude Code skills (SKILL.md format)
│   ├── rules/                # 5 always-on rule files
│   └── workflows/            # 3 workflow guides
├── gemini.md                 # Project constitution (SSOT — this file extends it)
├── task_plan.md              # Active task memory (update every task)
└── findings.md               # Active findings memory (update every task)
```

**Key rules:**
- Routes stay THIN — only call services and return responses
- ALL business logic lives in `services/` (makes testing easier)
- Components in `ui/` MUST be generic and reusable
- Domain-specific components go in named folders

---

## 6. Key Commands

```bash
npm run check:apply          # Biome format + lint (run after edits)
npm run typecheck            # TypeScript strict check
npm run verify:tech-integrity # Full system verification (mandatory pre-completion)
npm run verify:neon          # Neon database connection check
npm run verify:connect       # Neon + Upstash + Email verification
npm run build                # Turborepo production build
npm run test                 # Vitest unit/integration tests
npm run test:coverage        # Coverage report (target: 80%+ on services)
npm run test:e2e             # Playwright E2E tests
npm run dev:server           # Full stack dev server on port 5002
```

---

## 7. Available Skills (21 total)

Skills live in `.agent/skills/*/SKILL.md`. Claude Code loads them automatically.

| Skill | Triggers |
|-------|---------|
| `tech-integrity-validator` | "verify integrity", "run checks", "pre-completion" |
| `port-5002-compliance` | "check port", "port compliance", any server config change |
| `express-5-async-patterns` | "backend route", "Express handler", "API endpoint" |
| `neon-drizzle-edge-sql` | "database query", "migration", "schema change" |
| `react-19-optimistic-ui` | "optimistic update", "useActionState", "form submission" |
| `tailwind-v4-oxide-engine` | "styling", "CSS class", "Tailwind" |
| `playwright-visual-regression` | "E2E test", "visual test", "screenshot baseline" |
| `gsap-3-13-react-integration` | "animation", "scroll effect", "GSAP" |
| `test-driven-development` | "write tests", "TDD", "failing test first" |
| `systematic-debugging` | "debug", "investigate bug", "root cause" |
| `advanced-debugging` | "performance profiling", "memory leak", "security audit" |
| `brainstorming` | "design feature", "plan", "ideate" — ⚠️ HARD-GATE: no code before design approval |
| `agent-teams` | "parallel work", "multiple tasks", "team of agents" |
| `dispatching-parallel-agents` | "run in parallel", "independent subtasks" |
| `subagent-driven-development` | "complex feature", "large implementation" |
| `executing-plans` | "execute plan", "implement steps", "run the plan" |
| `using-git-worktrees` | "isolated branch", "parallel development", "worktree" |
| `development-workflow` | "how to develop", "workflow question" |
| `production-standards` | "production ready", "deploy checklist", "performance" |
| `project-standards` | "project structure", "A.N.T. layers", "B.L.A.S.T." |
| `core-identity` | "what is this project", "tech stack overview" |

---

## 8. Always-On Rules

Read these files before any implementation. They are always in effect:

- `.agent/rules/core-identity-tech-stack.md` — Business context, tech stack, 3D critical directive
- `.agent/rules/code-standards-patterns.md` — TypeScript, React 19, Express 5, Tailwind V4 patterns
- `.agent/rules/development-workflow-testing.md` — Simple vs complex tasks, Vitest patterns, uncertainty protocol
- `.agent/rules/performance-security-accessibility.md` — WCAG AA, security, performance budgets
- `.agent/rules/stitch.md` — React Router v7, TanStack Query v5, GSAP, brand typography, dark mode

---

## 9. Workflow Guides

- `.agent/workflows/feature-development-bug-fixing.md` — Feature and bug workflows
- `.agent/workflows/component-api-creation.md` — Component + API creation patterns
- `.agent/workflows/3d-integration.md` — 3D model integration (CRITICAL: model-viewer only)

---

## 10. Hard Constraints (Never Violate)

1. **Port 5002** — Every service, every time. No exceptions.
2. **`@google/model-viewer` only** — Never import `@react-three/fiber`, `@react-three/drei`, or `useGLTF`.
3. **No `any` in TypeScript** — Use proper types or `unknown` with type guards.
4. **No `forwardRef`** — React 19 uses raw ref props.
5. **No `try/catch` in Express 5 route handlers** — Express 5 handles async errors natively.
6. **No arbitrary Tailwind values in JSX** — Define custom values in `@utility` layer.
7. **No business logic in routes** — Routes call services, services have the logic.
8. **No Jest** — Use Vitest.
9. **No ESLint/Prettier** — Use Biome (`npm run check:apply`).
10. **`npm run verify:tech-integrity` must exit 0** before any task is declared complete.

---

## 11. Uncertainty Protocol

When unsure about file locations, architecture, or business logic:
- List 2–3 options with trade-offs
- Ask M. Hateem for direction
- **Never implement based on assumptions for breaking changes**

---

## 12. MCP Servers (Configured in `.mcp.json`)

| Server | Purpose |
|--------|---------|
| `neon` | DB branching, migrations, slow query analysis |
| `context7` | Version-exact docs for React 19, Express 5, Drizzle, Tailwind V4 |
| `playwright` | E2E test authoring and visual regression debugging |
| `sentry` | Error and trace queries |
| `github` | PR/issue management, CI workflow triggers |
| `grafana` | Prometheus metrics, Loki logs, Tempo traces |
| `gcloud` | Cloud Run deployments, GCS, Secret Manager |
| `argocd` | GitOps deployment visibility and rollbacks |
| `memory` | Persistent knowledge graph across sessions |

---

## 13. Environment Variables (Key)

```
PORT=5002                          # MANDATORY
DATABASE_URL=...                   # Neon serverless PostgreSQL
DIRECT_DATABASE_URL=...            # Neon direct (for LISTEN/NOTIFY)
UPSTASH_REDIS_REST_URL=...         # Upstash Redis
UPSTASH_REDIS_REST_TOKEN=...       # Upstash auth
GOOGLE_CLIENT_ID/SECRET=...        # OAuth2
SESSION_SECRET=...                 # Session signing
SENTRY_DSN=...                     # Error tracking
OTEL_EXPORTER_OTLP_ENDPOINT=...    # Distributed tracing
OTEL_SERVICE_NAME=run-remix        # Service name
```

See `.env.example` for the full list.

---

## 14. CI/CD Quick Reference

- **19 GitHub Actions workflows** in `.github/workflows/`
- Key gates: `ci.yml` → lint, typecheck, Neon branch, migration, coverage (40% min)
- `cloudbuild.yaml` → Docker build → GCR → Cloud Run canary (0% → 10% → 50% → 100%)
- `quality-gate.yml` → CSS lint, npm audit, Trivy, React Scan, Lighthouse CI
- Visual regression: `visual-regression.yml` (Playwright baselines)
- Chaos testing: `chaos-testing.yml`

---

*Last updated: 2026-03-27 | Constitution source: `gemini.md` + `.agent/rules/`*
