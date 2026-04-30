# RUN Remix 2026 Onboarding Guide

Welcome to the **RUN Remix** ecosystem. This guide provides a rapid bridge between initial setup and your first production-ready contribution, centered around the **2026 Baseline Standards**.

## 1. Prerequisites & Environment

Ensure your local environment matches the production runtime precisely.

- **Node.js**: v24.x (Strict) — use `nvm use 24`.
- **Package Manager**: npm 10.9.2.
- **Port Compliance**: Everything runs on **Port 5002**. This is non-negotiable.

## 2. Quick Start

```bash
# 1. Clone & Setup
git clone https://github.com/hateem2121/RUN.git
cd RUN
npm ci

# 2. Port Verification
npm run verify:tech-integrity

# 3. Start Development
npm run dev
```

Navigate to [http://localhost:5002](http://localhost:5002).

## 3. Core Architecture

- **Monorepo**: Powered by npm workspaces (`client/`, `server/`, `shared/`).
- **SSOT**: `overview.md` for versions and `core/tech-stack.md` for architecture.
- **Frontend**: React 19 (no `forwardRef`), Vite 8 (Rolldown), Tailwind v4.2, TypeScript 6.
- **Backend**: Express 5.2 (Async native), Node.js v24.15+, Neon Serverless Postgres.
- **3D**: Google Model Viewer ONLY.
- **Styling**: Tailwind v4 Oxide Engine (no arbitrary values).
- **Tooling**: Biome (Linter), Vitest (Unit), Playwright (E2E), Turbo (Monorepo).
- **Port**: **5002** (Strict enforcement).r deviate from Port 5002 for any service or configuration.
- **Verification**: Run `npm run verify:tech-integrity` before any commit.
- **Coding Standards**: See `.agent/rules/code-standards-patterns.md`.

## 5. Documentation Map

- **[System Overview](overview.md)**: Versions, scripts, and environment.
- **[Tech Stack](core/tech-stack.md)**: Detailed architectural constraints.
- **[Development Workflow](DEVELOPMENT_WORKFLOW.md)**: Day-to-day coding protocols.
- **[Agent Instructions](AGENT_INSTRUCTIONS.md)**: Working alongside AI agents.

---
**Standard**: RUN Remix 2026 | **Governance**: M. Hateem Jamshaid
