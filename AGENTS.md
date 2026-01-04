# AI Agent Operational Map

This file serves as the source of truth for AI agents operating on this repository.

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
- `server/`: Express 5 + Node 20 backend.
- `shared/`: Shared types and schemas.
- `docs/`: Project documentation.

## Critical Rules

1. **No ForwardRef:** Use props for refs (React 19).
2. **Tailwind v4:** Use modern syntax (e.g. `outline-hidden`, `bg-black/50`).
3. **Z-Index:** Use semantic tokens (e.g. `z-modal`) from `CONTRIBUTING.md`.

## Key References

- **Architecture:** `CODEMAP.md` (System Map) & `docs/architecture/antigravity_architecture_report.md` (Deep Dive)
- **Audits:** `docs/audits/` (Historical health checks)
