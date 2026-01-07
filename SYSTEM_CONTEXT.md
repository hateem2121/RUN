# System Context 🌐

**Version:** 1.0.0  
**Last Updated:** January 7, 2026  
**Status:** Canonical Reference

This document provides the definitive technical context for the RUN-Remix platform. It is designed to be the first point of reference for both human developers and AI agents.

---

## 1. Ecosystem Overview

| Layer             | Component         | Implementation                       |
| :---------------- | :---------------- | :----------------------------------- |
| **Monorepo**      | NPM Workspaces    | `client/`, `server/`, `shared/`      |
| **Frontend**      | React 19 (Stable) | React Router 7 (Framework), Vite 6   |
| **Backend**       | Express 5.1       | Node 22, TypeScript                  |
| **Database**      | PostgreSQL        | Neon (Serverless), Drizzle ORM       |
| **Styling**       | Tailwind CSS v4   | CSS Variables, `@theme` syntax       |
| **Observability** | Sentry & OTel     | OpenTelemetry SDK, Pino Logging      |
| **Caching**       | Unified Cache     | L1 (LRU Memory) + L2 (Upstash Redis) |

---

## 2. Model Context Protocol (MCP)

The repository integrates with the following MCP servers for enhanced agentic capabilities:

- **mcp-server-neon**: Used for direct database management, schema migrations, and query tuning within the Neon ecosystem.
- **Sentry MCP**: Integrated for real-time error tracking and issue analysis directly via the agent interface.

---

## 3. Tooling & Extensions (VS Code)

### Required Extensions

See `.vscode/extensions.json` for the full list. Key recommendations:

- **Biome**: Linter and formatter (replaces ESLint/Prettier).
- **Drizzle Lab**: Visualizer for the database schema.
- **Vite/Vitest Explorer**: For managing build and test workflows.
- **Tailwind CSS v4**: Official IntelliSense for modern CSS syntax.

### Core Scripts

| Command                         | Action                                        |
| :------------------------------ | :-------------------------------------------- |
| `npm run dev`                   | Starts system with Vite HMR + Express server. |
| `npm run build`                 | Full production build (Frontend + Backend).   |
| `npm run check`                 | Typecheck and Biome lint.                     |
| `npm run verify:tech-integrity` | Comprehensive system health check.            |

---

## 4. Architecture & Structure

Detailed maps and deep-dives are located in the following directories:

- **[Architecture Deep-Dive](./docs/core/architecture.md)**: Visual diagrams and data flows.
- **[Directory Map](./docs/core/architecture.md#2-directory-map-the-why)**: Explanations of workspace responsibilities.
- **[Environment Setup](./docs/operations/environment.md)**: Configuration and `.env` standards.
- **[API Reference](./docs/api/endpoints.md)**: Endpoints, field counts, and authentication.

---

## 5. Agent Operational Mode

All AI agents should adhere to the following rules documented in **[AGENTS.md](./AGENTS.md)**:

1. **Source of Truth**: Always check `shared/schema.ts` for data shapes.
2. **Standard Ports**: Use `5001` for dev and `5000` for prod/docker.
3. **No Legacy**: Avoid using hardcoded ports or orphaned scripts in `scripts/legacy/`.

---

_This file is maintained as the primary technical baseline. Propose updates via PR when architecture or tooling changes._
