# RUN Remix — The Agentic Sportswear Factory (v4.0.0)

> **This file is the authoritative context for every Claude Code session on this project.**
> It supersedes any other instructions. When in doubt, refer here first.

---

## 1. Identity

- **Identity:** RUN Remix — The Agentic Sportswear Factory
- **Company:** RUN APPAREL (PVT) LTD — B2B sustainable sportswear manufacturer, Sialkot, Pakistan (subsidiary of Durus Industries, est. 1889)
- **Product:** Premium 3D Sportswear Configurator & Manufacturing Platform
- **Mission:** Orchestrate a high-performance virtual engineering team to build deterministic, self-healing automation using the B.L.A.S.T. protocol.

---

## 2. The 8-Step Agentic Sprint

All work must follow this cycle:

1. **Think**: `/office-hours`, `/brainstorming`
2. **Plan**: `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`
3. **Build**: Execution via B.L.A.S.T. protocol
4. **Review**: `/review`
5. **Test**: Vitest, `/qa`, `/qa-only`
6. **Ship**: `/ship`, `/land-and-deploy`
7. **Reflect**: `/retro`
8. **Evolve**: Update SOPs in `docs/core/sops/`

---

## 3. Non-Negotiable Tech Stack

| Layer | Technology | Constraint |
|-------|-----------|-----------|
| Frontend | React **19.2.4** | Functional only. NO `forwardRef`. Named exports only. |
| Build | Vite **7** | Port **5002** exclusively. |
| Styling | Tailwind CSS **V4** | `@utility` syntax. NO arbitrary values in JSX. |
| Language | TypeScript strict | NO `any` types. Explicit return types. |
| Backend | Express **5.1.0** | Async-native. NO `try/catch` in route handlers. |
| 3D | `@google/model-viewer` | `LazyUnifiedModelViewer` ONLY. NO R3F. |
| Database | Neon Serverless | `@neondatabase/serverless` HTTP driver. |
| Testing | Vitest | 80%+ coverage on services. |
| Linting | Biome | Run: `npm run check:apply` |

---

## 4. gstack Slash Commands

Use the `/browse` skill from gstack for all web browsing. **Never use `mcp__claude-in-chrome__*` tools directly.**

| Command | Role | Purpose |
|---------|------|---------|
| `/office-hours` | CEO / Founder | High-level strategy and product vision. |
| `/plan-ceo-review` | CEO | Review feature plans for business alignment. |
| `/plan-eng-review` | Eng Manager | Review architecture and technical feasibility. |
| `/plan-design-review` | Design Lead | Review UI/UX for "The Wow" factor. |
| `/review` | Senior Reviewer | Holistic code review and bug hunting. |
| `/qa` | QA Lead | Automated browser testing on staging/dev. |
| `/ship` | Release Eng | Final verification and PR creation. |
| `/land-and-deploy` | Release Eng | Merge and trigger deployment. |
| `/retro` | Team Lead | Sprint retrospective and findings log. |
| `/browse` | Researcher | High-performance web research. |
| `/investigate` | Forensics | Deep-dive into complex bugs or legacy code. |

---

## 5. Protocol 0 (Mandatory)

1. Start by updating `task_plan.md`
2. End by updating `findings.md`
3. Run `npm run verify:tech-integrity` before completion

---

## 6. Project Structure

```
/
├── client/                   # React 19 + Vite + Tailwind V4
├── server/                   # Express 5 + Node 24
├── shared/                   # Shared TypeScript types & constants
├── docs/                     # Documentation Hub
│   ├── core/
│   │   ├── sops/            # L1 Architecture SOPs (READ FIRST)
│   │   ├── ETHOS.md         # Factory Manifesto
│   │   └── AGENTS.md        # Agent Role Directory
│   └── adr/                  # Architecture Decision Records
├── .agent/                   # Agentic Configuration
│   ├── skills/               # 31+ Agent skills (gstack + custom)
│   ├── rules/                # Project invariants
│   └── workflows/            # Workflow guides
├── gemini.md                 # Project Constitution (SSOT)
├── task_plan.md              # Active task memory
└── findings.md               # Active findings memory
```

---

*Last updated: 2026-03-31 | Identity: Agentic Software Factory v4.0.0*

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
