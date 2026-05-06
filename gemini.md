# Constitution: AntiGravity System Invariants (v4.1.0)

## 1. System Identity

- **Identity**: RUN Remix — The Agentic Sportswear Factory
- **Mission**: Orchestrate a high-performance virtual engineering team to build deterministic, self-healing automation using the B.L.A.S.T. protocol.
- **Focus**: Premium 3D Sportswear Configurator & Manufacturing Platform.
- **North Star**: Heritage Craftsmanship meets Advanced Agentic Engineering.

## 2. Technical Stack (Non-Negotiable)

- **Frontend**: React 19, Vite 8 (Rolldown), Tailwind v4.2, TypeScript 6 (Strict).
- **Backend**: Express 5.2 (Async Native), Node.js 24.15+.
- **Data**: Neon Serverless Postgres via Drizzle ORM.
- **3D**: `@google/model-viewer` ONLY (LazyUnifiedModelViewer required).
- **Port**: **5002** (Exclusively for ALL services).

## 3. The 8-Step Agentic Sprint

All development follows the `gstack` high-performance cycle:

1. **Think**: Deep exploration via `/office-hours` and `/brainstorming`.
2. **Plan**: Architecture reviews via `/plan-ceo-review` and `/plan-eng-review`.
3. **Build**: Execution using B.L.A.S.T. protocol layers.
4. **Review**: Automated and manual forensics via `/review`.
5. **Test**: Comprehensive verification using Vitest and `/qa`.
6. **Ship**: Atomic deployment via `/ship` and `/land-and-deploy`.
7. **Reflect**: Retrospective analysis via `/retro`.
8. **Evolve**: Self-annealing of SOPs and tools.

## 4. The B.L.A.S.T. Protocol

- **Blueprint**: VISION FIRST. Define schemas in `shared/` and SOPs in `docs/core/sops/` before scripting.
  - `shared/` intentionally has three runtime deps: `drizzle-orm`, `drizzle-zod`, `zod` — required for Drizzle table definitions and schema generation. This is by design, not an oversight.
- **Link**: HANDSHAKE. Verify APIs and `.env` via atomic scripts.
- **Architect**: THE BUILD (A.N.T. Layers).
  - **L1 Architecture**: Markdown SOPs in `docs/core/sops/`.
  - **L2 Navigation**: Route-level logic.
  - **L3 Tools**: Deterministic services in `server/services/`.
- **Stylize**: THE WOW. Apply the 5 Dimensions of Design (Skeleton, Skin, Palette, Voice, Soul).
- **Trigger**: DEPLOY. Automation via GitHub Actions v4.

## 5. System Health & Integrity

- **Architecture Health Score**: **100/100** (Verified May 2026).
- **Accessibility**: WCAG 2.1 AA compliant (Automated baseline in `client/tests/accessibility.test.tsx`).
- **Performance**: Real-time Web Vitals monitoring active. LCP < 2.5s, FID < 100ms, CLS < 0.1.
- **Security**: Double-Submit Cookie CSRF protection, Strict CSP, and zero-trust RBAC.
- **Resiliency**: RPO < 1 min, RTO < 15 min (Multi-region strategy active).

## 6. Operational Invariants

- **Protocol 0**: Every task MUST start with updating `task_plan.md` and `findings.md`.
- **Self-Annealing**: Patch scripts, test, and update SOPs so errors NEVER repeat.
- **Memory**: `gemini.md` is LAW. Doc files are the shared consciousness.
- **Validation**: `npm run verify:tech-integrity` is mandatory before completion.
