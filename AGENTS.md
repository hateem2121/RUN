# AGENTS.md - Operational Intelligence Map

> **Context Injection for AI Agents**: This file is the primary entry point for AI agents working on the RUN-Remix repository. It defines technical constraints, architectural boundaries, and operational commands.

---

## 1. System Identity & Stack

**Identity**: `run-remix-monorepo`
**Core Stack**:
- **Frontend**: React 19 (Stable), Vite 7, Tailwind CSS v4, React Router 7 (Convergence).
- **Backend**: Express 5 (Stable), Node.js 24.
- **Data**: Neon Serverless Postgres (HTTP Driver via `drizzle-orm`).
- **State**: TanStack Query v5 + Upstash Redis (L2 Cache).
- **Architecture**: Monorepo using NPM Workspaces + TurboRepo.

## 2. Directory Map (Context Boundaries)

| Path | Context | Constraints |
| :--- | :--- | :--- |
| `client/` | **Frontend Application** | Use `cn()` for styles. No raw colors. |
| `server/` | **Backend API** | Stateless interactions only. No sticky sessions. |
| `shared/` | **Shared Library** | Zero dependencies. Pure types/schemas only. |
| `docs/` | **Knowledge Base** | `docs/overview.md` is the **SSOT**. |
| `scripts/` | **Automation** | Use `tsx` for execution. |

## 2.1. Canonical Documentation Sources

| Topic | Primary Source (SSOT) |
| :--- | :--- |
| **Versions / Stack** | `docs/overview.md` |
| **Architecture** | `docs/core/architecture.md` |
| **SDK Package** | `docs/core/sdk-workspace.md` |
| **Styles / UI** | `docs/development/styling.md` |
| **Testing** | `docs/development/testing.md` |
| **API Endpoints** | `docs/api/endpoints.md` |
| **3D Assets** | `docs/development/3d-pipeline.md` |
| **Developer Workflow** | `docs/guides/developer-workflow.md` |

## 2.2. Legacy Mapping (IGNORE THESE)

| Legacy Path (DO NOT USE) | Modern Equivalent |
| :--- | :--- |
| `client/src/` | `client/app/` |
| `scripts/testing/` | `tests/` (Vitest/Playwright) |

## 3. Operational Commands (The Tool Belt)

Agrents SHOULD prioritize these npm scripts over raw CLI commands.

| Action | Command | Expectation |
| :--- | :--- | :--- |
| **Verify** | `npm run verify:tech-integrity` | **MANDATORY** pre-commit check. |
| **Start Dev** | `npm run dev` | Starts Backend (5002) + Frontend Proxy. |
| **Typecheck** | `npm run typecheck` | Validates TypeScript across all workspaces. |
| **Lint (Fix)** | `npm run check:apply` | Auto-fixes Biome linting issues. |
| **Test (All)** | `npm run test` | Runs all unit and integration tests. |
| **Test (V2)** | `npm run test tests/v2` | Runs the preferred stateful integration suites. |
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

1.  **Exploration**: Read `docs/overview.md` for high-level understanding.
2.  **Modification**:
    *   Edit files.
    *   Run `npm run check:apply` to format.
    *   Run `npm run typecheck` to verify safety.
3.  **Verification**:
    *   Always run `npm run verify:tech-integrity` before declaring task complete.
4.  **Performance**:
    *   Do NOT revert `tsconfig.base.json` watcher to `dynamicprioritypolling` (causes high CPU). Keep `useFsEvents`.
    *   Use `VITE_INSPECT=true` only when actively debugging build pipelines.
    *   **System Load**: `ENABLE_PERFORMANCE_MONITORING`, `ENABLE_CACHE_WARMING`, and `ENABLE_REACT_SCAN` should be `false` in `.env` for local development.
    *   **Watch Scope**: Ensure `server/package.json` ignores `../client` to prevent cross-workspace restart loops.

## 6. Common Pitfalls (AI Memory Bank)

*   **Port Conflicts**: If port 5002 is busy, use `npm run kill:all` to clear zombie Node processes.
*   **Vite HMR**: If HMR fails, ensure `client/vite.config.ts` has `server.hmr.clientPort` set to 5002.
*   **Neon Cold Starts**: The DB sleeps after inactivity. The first request may take 3-5s. `server/db.ts` handles the wakeup via `wakeupDatabase()`.

## 7. Testing Patterns (Critical Capability)

Future agents SHOULD follow these patterns to maintain 2026 testing standards:

### A. Integration Testing (`MemoryStorage`)
Use `server/tests/memory-storage.ts` for stateful integration tests. It mocks the `IStorage` interface, allowing you to test complex sequences (e.g., product creation + retrieval) without a real database.

### B. RBAC Verification
Always verify Role-Based Access Control using the `createMockSessionUser` utility from `server/tests/test-utils.ts`:
1.  **Admin Case**: Set `isAdmin: true` and verify `200/201` status.
2.  **Unauthorized Case**: Set `isAdmin: false` and verify `403 Forbidden`.

### C. Service Coverage
Aim for **80%+ coverage** in the service layer (`server/services/`). Tests should be written in `server/services/*.test.ts` using Vitest.

---

**End of Context**

## Version Compatibility
- **Last Updated**: 2026-02-04
- **Applies to**: `run-remix-monorepo` v4.1.0+
- **Agent Protocol**: v1.5

