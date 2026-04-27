# System Overview & Architecture

**Scope:** Full Stack Audit  
**Repo:** `run-remix-monorepo`  
**Status:** Canonical Source of Truth

> [!IMPORTANT]
> This document is the **Single Source of Truth** for version numbers.  
> Other documentation should link here rather than duplicate version info.

---

## 1. Platform & Runtime

| Component | Policy / Version | Provenance |
| :--- | :--- | :--- |
| **OS** | Linux (Alpine) in Prod; Mac/Linux for Dev | `Dockerfile` (node:24-alpine), User Agent |
| **Node.js** | **v24** (Strict) | `Dockerfile`, `docs/AGENT_INSTRUCTIONS.md` |
| **Package Manager** | **npm 10.9.2** | `package.json` (packageManager field) |
| **Workspace Tool** | npm workspaces + Turbo Repo | `package.json`, `turbo.json` |

### Reproducing the Environment

```bash
# 1. Install correct Node version
nvm install 24
nvm use 24

# 2. Install dependencies
npm ci
```

---

## 2. Stack & Critical Versions

### Frontend (`@run-remix/client`)

| Technology | Version | Purpose | Provenance |
| :--- | :--- | :--- | :--- |
| **React** | `19.2.4` | UI Framework | `client/package.json` |
| **Vite** | `7.0.0` | Build Tool / Bundler | `client/package.json` |
| **React Router** | `7.11.0` | Routing (Client & SSR) | `client/package.json` |
| **Tailwind CSS** | `4.0.0` | Styling Engine | `client/package.json` |
| **TanStack Query** | `^5.90.12` | Server State Management | `client/package.json` |
| **Three.js** | `^0.181.0` | 3D Visualization | `client/package.json` |

### Backend (`@run-remix/server`)

| Technology | Version | Purpose | Provenance |
| :--- | :--- | :--- | :--- |
| **Express** | `^5.1.0` | Web Framework | `server/package.json` |
| **Node.js** | `24` | Runtime | `Dockerfile` |
| **Drizzle ORM** | `^0.45.1` | Database ORM | `server/package.json` |
| **PostgreSQL** | `pg` (Neon) | Database Driver | `server/package.json` |
| **Redis** | `Upstash` | Session & L2 Cache | `server/package.json` |
| **Tini** | (Alpine Pkg) | Init Process | `Dockerfile` |

### Operations & Tooling

| Tool | Version | Config Source |
| :--- | :--- | :--- |
| **Biome** | `2.3.10` | `biome.json` (Lint/Format) |
| **Vitest** | `^4.0.6` | `vitest.config.ts` |
| **Playwright** | `^1.57.0` | `playwright.config.ts` |
| **Turbo** | `^2.7.2` | `turbo.json` |

---

## 3. Architecture & Boundaries

### Repo Map

```text
/
├── client/ (@run-remix/client)   # React 19 SPA/SSR Application
│   ├── app/                      # Source Code (Remix Standard)
│   │   ├── components/ui/        # Atomic Design System (shadcn/ui)
│   │   ├── components/admin/     # Admin Domain
│   │   │   └── media-library/    # Media Library Module (Decomposed Session 8)
│   │   │       ├── hooks/        # useMediaFilters, useMediaSelection, useMediaUrlSync, useMediaGridQuery
│   │   │       ├── upload/       # upload-utilities.ts, UploadItem.tsx
│   │   │       └── components/   # MediaGridItem, MediaGridPagination, MediaGridToolbar, MediaBulkOperations
│   │   └── lib/                  # Tokens & Utils
│   └── vite.config.ts            # Vite 7 Config
│
├── server/ (@run-remix/server)   # Express 5 API
│   ├── boot/                     # App Startup
│   ├── routes/                   # API Endpoints
│   ├── services/                 # Business Logic
│   ├── lib/db/repositories/      # Data Access Layer
│   │   ├── page-content/         # Domain Repositories (Session 8)
│   │   │   ├── homepage.repository.ts
│   │   │   ├── about.repository.ts
│   │   │   ├── sustainability.repository.ts
│   │   │   ├── manufacturing.repository.ts
│   │   │   └── technology.repository.ts
│   │   └── index.ts              # Re-exports all repositories
│   └── db.ts                     # Drizzle Instance
│
└── shared/ (@run-remix/shared)   # Zod Schemas & Contracts
    └── schema.ts                 # Database & Validation Types
```

### Dependency Rules

- **Client** depends on **Shared**.
- **Server** depends on **Shared**.
- **Client** does NOT depend on Server (loose coupling via API).
- **Shared** is a pure library (no side effects).

---

## 4. Scripts & Operational Commands

| Context | Command | Description | Ports/Vars |
| :--- | :--- | :--- | :--- |
| **Root** | `npm run dev` | Starts Turbo Dev Pipeline | Opens port 5002 |
| **Root** | `npm run build` | Builds Client & Server | Outs: `dist/` |
| **Root** | `npm run verify:tech-integrity` | **CRITICAL**: Full check (Types, Lint, Audit) | |
| **Root** | `npm test` | Runs Unit Tests (Vitest) | |
| **Server** | `npm run db:migrate` | Runs Drizzle Migrations | Needs `DATABASE_URL` |
| **Server** | `npm run db:push` | Pushes schema to DB (Dev only) | Needs `DATABASE_URL` |

> **Note**: The client workspace uses `vite` directly for development. The root `turbo run dev` command coordinates both client and server.

---

## 5. Environment Variables

**Schema Source:** `server/env.schema.ts`

| Variable | Required | Format | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | `dev`\|`prod`\|`test` | Runtime mode |
| `PORT` | No | Number | Defaults to `5002` |
| `DATABASE_URL` | **Yes** | Postgres URL | Must use `-pooler` endpoint for Neon |
| `GOOGLE_CLIENT_ID` | **Yes** | String | OAuth Auth |
| `GOOGLE_CLIENT_SECRET` | **Yes** | String | OAuth Secrets |
| `SESSION_SECRET` | **Yes** | String (>32 chars) | Session signing |
| `INITIAL_ADMIN_EMAIL` | No | Email | Auto-grants admin on signup |
| `SENTRY_DSN` | No | URL | Err tracking (Req for Prod) |
| `UPSTASH_REDIS_REST_URL`| No | URL | L2 Cache (Req for Prod) |
| `UPSTASH_REDIS_REST_TOKEN`| No | String | L2 Cache Auth |

---

## 6. Testing Strategy

**Source Guide:** `docs/development/testing.md`

| Layer | Tool | Command | Scope |
| :--- | :--- | :--- | :--- |
| **Unit** | Vitest | `npm run test` | Pure functions, components |
| **Integration** | Vitest | `npm run test:integration` | API handlers, DB services |
| **E2E** | Playwright | `npm run test:e2e` | Critical user flows |
| **Visual** | Playwright | `npm run test:e2e:visual` | Regression guardrails |

### Core Invariants

- **SSR Hydration**: Verified via `tests/unit/ssr/invariants.test.ts`.
- **Z-Index Tokens**: Enforced by Biome and visual regression.
- **Router Purity**: Verified by `npm run check:router`.

---

## 7. Infrastructure & Deployment

| Feature | Strategy | Provenance |
| :--- | :--- | :--- |
| **Container** | Multi-stage Docker build (Alpine) | `Dockerfile` |
| **Orchestration** | Cloud Run (Managed) | `cloudbuild.yaml` |
| **Rollout** | Canary (0% → 10% → 50% → 100%) | `cloudbuild.yaml` |
| **Health Check** | `wget` to `/api/health` | `Dockerfile` |
| **Process Mgr** | `tini` (prevents zombie processes) | `Dockerfile` |
| **Assets** | Uploaded to GCSCDN | `cloudbuild.yaml` |

---

## 7. Extensions & AI Context

### IDE Extensions (VS Code)

**Source:** `.vscode/extensions.json`

- **Essential**: `biomejs.biome` (Linting), `bradlc.vscode-tailwindcss` (Styles).
- **Database**: `rphlmr.drizzle-lab`, `ckolkman.vscode-postgres`.
- **React**: `dsznajder.es7-react-js-snippets`, `mattpocock.ts-error-translator`.

### MCP (Model Context Protocol)

**Status:** ✅ **ACTIVE**  
**Source:** `mcp.json`

| Server | Type | Description |
| :--- | :--- | :--- |
| `filesystem` | `@modelcontextprotocol/server-filesystem` | Direct file access |
| `git` | `@modelcontextprotocol/server-git` | Git repository awareness |
| `postgres` | `@modelcontextprotocol/server-postgres` | Direct Neon DB context |

### AI Agent Tools

- **Operational Map:** See `docs/AGENT_INSTRUCTIONS.md`.
- **Scripts:** Agents are expected to use `npm run verify:tech-integrity` to validate changes.
- **Context:** `docs/core/tech-stack.md` provides definitions for AI decision making.

---
**Version**: 1.3.0 | **Audit Status**: Verified | **Last Remediated**: 2026-04-27
