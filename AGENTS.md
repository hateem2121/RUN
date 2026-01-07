# AGENTS.md - Operational Intelligence Map

> **Context Injection for AI Agents**: This file is the primary entry point for AI agents working on the RUN-Remix repository. It defines technical constraints, architectural boundaries, and operational commands.

---

## 1. System Identity & Stack

**Identity**: `run-remix-monorepo`
**Core Stack**:
- **Frontend**: React 19 (Stable), Vite 6, Tailwind CSS v4.
- **Backend**: Express 5 (Stable), Node.js 22 (LTS).
- **Data**: Neon Serverless Postgres (HTTP Driver via `drizzle-orm`).
- **State**: TanStack Query v5 + Upstash Redis (L2 Cache).
- **Architecture**: Monorepo using NPM Workspaces + TurboRepo.

## 2. Directory Map (Context Boundaries)

| Path | Context | Constraints |
| :--- | :--- | :--- |
| `client/` | **Frontend Application** | Use `cn()` for styles. No raw colors. |
| `server/` | **Backend API** | Stateless interactions only. No sticky sessions. |
| `shared/` | **Shared Library** | Zero dependencies. Pure types/schemas only. |
| `docs/` | **Knowledge Base** | `docs/overview.md` is the Single Source of Truth. |
| `scripts/` | **Automation** | Use `tsx` for execution. |

## 3. Operational Commands (The Tool Belt)

Agrents SHOULD prioritize these npm scripts over raw CLI commands.

| Action | Command | Expectation |
| :--- | :--- | :--- |
| **Verify** | `npm run verify:tech-integrity` | **MANDATORY** pre-commit check. |
| **Start Dev** | `npm run dev` | Starts Backend (5001) + Frontend Proxy. |
| **Typecheck** | `npm run typecheck` | Validates TypeScript across all workspaces. |
| **Lint (Fix)** | `npm run check:apply` | Auto-fixes Biome linting issues. |
| **Docs** | `npm run docs:generate` | Refreshes `docs/overview.md` (Manual). |
| **DB Push** | `npm run db:push` | Syncs Drizzle schema to Neon DB. |

## 4. Architectural Rules (Strict Invariants)

### A. Frontend (React 19)
1.  **Ref Pattern**: DO NOT use `forwardRef`. Use `ref` as a standard prop.
2.  **Form Actions**: Use `useActionState` and `<form action={fn}>` for mutations.
3.  **Styles**: Use semantic `@theme` tokens (e.g., `bg-card`) from `client/index.css`. **BANNED**: Raw hex codes or `text-gray-500`.

### B. Backend (Express 5)
1.  **Async Handlers**: Express 5 supports async natively. DO NOT wrap in `try/catch` boilerplate; let the global error handler catch rejected promises.
2.  **Database**: Use `server/db.ts`. It implements the Neon HTTP driver. **DO NOT** create new connection pools manually.

### C. Monorepo
1.  **Shared Code**: All shared Zod schemas MUST live in `shared/schema.ts`.
2.  **Imports**: Use workspace aliases (`@run-remix/shared`) instead of relative paths for cross-package imports.

## 5. Development Workflow

1.  **Exploration**: Read `SYSTEM_ARCHITECTURE_REPORT.md` for high-level understanding.
2.  **Modification**:
    *   Edit files.
    *   Run `npm run check:apply` to format.
    *   Run `npm run typecheck` to verify safety.
3.  **Verification**:
    *   Always run `npm run verify:tech-integrity` before declaring task complete.

## 6. Common Pitfalls (AI Memory Bank)

*   **Port Conflicts**: If port 5001 is busy, use `npm run kill:all` to clear zombie Node processes.
*   **Vite HMR**: If HMR fails, ensure `client/vite.config.ts` has `server.hmr.clientPort` set to 5001.
*   **Neon Cold Starts**: The DB sleeps after inactivity. The first request may take 3-5s. `server/db.ts` handles the wakeup via `wakeupDatabase()`.

---

**End of Context**
