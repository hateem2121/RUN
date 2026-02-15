# Constitution: AntiGravity System Invariants

## 1. System Identity
- **Name**: RUN Remix AntiGravity Ecosystem
- **Focus**: Premium 3D Sportswear Configurator & Manufacturing Platform
- **North Star**: Heritage Craftsmanship meets Advanced Agentic Engineering

## 2. Technical Stack (Non-Negotiable)
- **Frontend**: React 19, Vite 7, Tailwind V4, TypeScript (Strict).
- **Backend**: Express 5 (Async Native), Node.js 24+.
- **Database**: Neon Serverless Postgres via Drizzle ORM.
- **Cache**: Upstash Redis (L2) + In-memory (L1).
- **3D**: `@google/model-viewer` ONLY (LazyUnifiedModelViewer required).
- **Port**: **5002** (Exclusively for ALL services).

## 3. Architectural Rules (B.L.A.S.T.)
- **B**: Blueprint first. Define schemas in `shared/` before scripting.
- **L**: Link connections. Verify APIs via atomic scripts in `scripts/`.
- **A**: Architect layers. Update SOPs in `architecture/` before code.
- **S**: Self-anneal. Document errors in `progress.md` and update `gemini.md` if invariant changes.
- **T**: Tool Atomic. Keep `tools/` and `scripts/` single-purpose.

## 4. Design Invariants (WOW Factor)
- **Aesthetic**: Dark Mode (Default), Linear/Vercel styling.
- **Glassmorphism**: Use `glass-premium` utility (blur 12px, saturate 180%).
- **Layout**: Bento Grid for dashboards and complex content displays.
- **Motion**: Every interactive element MUST have a subtle hover/active micro-animation.
- **Typography**: Inter (Sans), JetBrains Mono (Technical).

## 5. Agent Protocol
- **Entry**: `AGENTS.md` is the operational map.
- **Protocol 0**: Every task MUST start with updating `task_plan.md` and `findings.md`.
- **Validation**: `npm run verify-port` and `npm run build` are mandatory before completion.
