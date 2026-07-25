# RUN Remix Session Plan

**Goal**: Configure Recommended MCP Servers
**Date**: July 25, 2026
**Status**: Completed.

## Outcome
- Installed 4 global MCP server packages via NPM (`npm install -g`):
  - `@modelcontextprotocol/server-github@2025.4.8`
  - `@modelcontextprotocol/server-postgres@0.6.2`
  - `@upstash/context7-mcp@3.2.5`
  - `@executeautomation/playwright-mcp-server@1.0.12`
- User opted to *only* use the NEON Postgres database to avoid using paid third-party tokens (Context7 API key).
- Injected the read-only NEON Postgres connection URL (from `.env`) into `~/.gemini/settings.json` and `~/.claude/.mcp.json`.
- Registered `github` and `playwright` servers in the configurations without explicit credentials.
- All technical integrity and Definition of Done checks successfully passed.

## Tasks
- [x] Phase 1: Investigate current state (`npm list -g` & `npm view`).
- [x] Phase 1: Generate `implementation_plan.md` requesting credentials.
- [x] Phase 1: Halt and obtain user approval/credentials (User specified NEON only).
- [x] Phase 2: Install MCP server packages globally (`npm install -g @latest`).
- [x] Phase 2: Configure `~/.gemini/settings.json` and `~/.claude/.mcp.json` with Postgres URL.
- [x] Definition of Done: `npm run verify:tech-integrity` (Passed).
- [x] Definition of Done: `npm run check` (Passed).
- [x] Definition of Done: `npm run build` (Passed).
- [x] Definition of Done: `npm run verify-port` (Passed).
- [x] Definition of Done: `npm list -g --depth=0` shows all 4 packages (Passed).
- [x] Definition of Done: `git diff --name-only` shows only in-scope files (Passed).
- [x] Protocol 0 end bookends: Updated `task_plan.md` and `findings.md`.

## Next Steps
The MCP servers for Postgres, GitHub, Context7, and Playwright are now installed globally. You can now use tools from the Postgres server against your Neon database securely using the standard agent interfaces.
