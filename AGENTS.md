# AI Agent Operational Map

**Last Verified:** 2026-01-05

This file serves as the operational map for AI agents. For detailed technical specifications (tools, extensions, MCP), see **[SYSTEM_CONTEXT.md](./SYSTEM_CONTEXT.md)**.

## Canonical Commands

- **Technical Integrity Check:** `npm run verify:tech-integrity`
  - Runs build, typecheck, and audit. Use this before committing.
- **Development Server:** `npm run dev`
  - Starts the development server. **Note:** The `client` workspace does not have a `dev` script; the Express server (`@run-remix/server`) handles Vite middleware.
- **Production Start:** `npm run start` (or `npm start` in `server/`)
  - Starts the compiled production server.
- **Test Runner:** `npm test` or `npm run test:e2e`

## Directory Structure

- `client/`: React 19 + Vite 6 frontend.
- `server/`: Express 5 + Node 22 backend.
- `shared/`: Shared types and schemas.
- `docs/`: Project documentation (Structured by core, operations, development).
- `scripts/`: Operational and setup scripts.

## Critical Rules

1. **No ForwardRef:** Use props for refs (React 19).
2. **Tailwind v4:** Use modern syntax (e.g. `outline-hidden`, `bg-black/50`).
3. **Z-Index:** Use semantic tokens (e.g. `z-modal`) from `docs/development/styling.md`.

## Key References

- **Architecture:** `docs/core/architecture.md` (System Map & Deep Dive)
- **Environment:** `docs/operations/environment.md`
- **Audits:** `docs/audits/` (Historical health checks)
