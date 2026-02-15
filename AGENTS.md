# AGENTS.md - Operational Intelligence Map (v3.0)

---

## 0. AntiGravity Project Constitution

**Primary Source of Truth (SSOT)**: [gemini.md](file:///Users/hateemjamshaid/Documents/RUN-Remix/gemini.md)

All agents MUST read and adhere to the architectural invariants and design laws defined in `gemini.md`. This file takes precedence over all other documentation.

---

## 1. System Identity & Mission

**Identity**: RUN Remix Ecosystem Pilot
**Mission**: Build deterministic, self-healing automation using the B.L.A.S.T. protocol and A.N.T. 3-layer architecture.
**North Star**: Reliability over speed. Deterministic business logic.

---

## 2. Directory Map (Context Boundaries)

| Path | Context | Constraints |
| :--- | :--- | :--- |
| `client/` | **Frontend Application** | Use `cn()` for styles. 5 Dimensions of Design. |
| `server/` | **Backend API** | Express 5 Async handlers. Stateless logic. |
| `shared/` | **Shared Library** | Universal Zod schemas and pure types. |
| `architecture/` | **Reasoning (L1)** | Technical SOPs. Read before coding. |
| `tools/` | **Engines (L3)** | Deterministic scripts (Python/JS). Atomic. |
| `scripts/` | **Handshaking** | API verification and build-time automation. |
| `.kilocode/skills/` | **Skills Library** | AntiGravity skills with SKILL.md format. |
| `.kilocode/agents/` | **Agent Configs** | Multi-agent orchestration definitions. |
| `.kilocode/orchestrators/` | **Workflows** | Complex multi-step automation workflows. |

---

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

---

## 3. Operational Commands (The Tool Belt)

Agents SHOULD prioritize these npm scripts over raw CLI commands.

| Action | Command | Expectation |
| :--- | :--- | :--- |
| **Verify** | `npm run verify:tech-integrity` | **MANDATORY** pre-commit check. |
| **Integrity** | `npm run audit:files` | Validates project structure against `gemini.md`. |
| **Typecheck** | `npm run typecheck` | Validates TypeScript across all workspaces. |
| **Lint (Fix)** | `npm run check:apply` | Auto-fixes Biome linting issues. |
| **3D Audit** | `npm run verify:3d-viewer` | Ensures `@google/model-viewer` compliance. |

---

## 4. The B.L.A.S.T. Workflow

1.  **Blueprint**: Vision & Logic. Ask 5 Discovery questions if ambiguous. Update SOPs in `architecture/`.
2.  **Link**: Connectivity. Test credentials and API handshakes in `scripts/`.
3.  **Architect**: The Build.
    *   L1: Update SOPs.
    *   L2: Routing logic.
    *   L3: Implement atomic tools in `tools/`.
4.  **Stylize**: The WOW. Apply Glassmorphism, Aurora UI, and 60fps animations.
5.  **Trigger**: Deployment. Set up triggers and finalize Maintenance logs in `gemini.md`.

---

## 5. Development Workflow (Protocol 0)

1.  **Initialization**: Update `task_plan.md` and `findings.md`.
2.  **Modification**:
    *   Update SOPs in `architecture/` FIRST.
    *   Implement logic.
    *   Run linting and typechecks.
3.  **Self-Annealing**:
    *   Analyze failures, patch, and document in `progress.md`.
    *   Update architecture if logic changed.

---

## 6. Testing & Compliance

*   **Service Layer**: 80%+ coverage using Vitest.
*   **Port Compliance**: ALWAYS use port **5002**.
*   **Data-First**: Define inputs/outputs in `gemini.md` before building.

---

## Version Compatibility

*   **Last Updated**: 2026-02-15
*   **Applies to**: `run-remix-monorepo` v4.2.0+
*   **Agent Protocol**: System Pilot v2.0
