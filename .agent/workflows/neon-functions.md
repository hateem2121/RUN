---
description: Deploy long-running, serverless Node.js HTTP functions onto Neon branches with automatic DATABASE_URL injection (APIs, SSE, WebSockets, streaming agents, MCP servers).
---

# /neon-functions

**Description:** Long-running, serverless Node.js HTTP functions deployed onto your Neon branch, with `DATABASE_URL` injected automatically and compute running next to your data.

**Usage:** `/neon-functions [deploy | logs | dev]`

## Agent Instructions

When the user invokes `/neon-functions` or `/functions`:
1. Read `.agent/skills/neon-functions/SKILL.md` and relevant reference docs in `.agent/skills/neon-functions/references/` (e.g. `ai-sdk.md`, `mcp.md`, `sse.md`, `mastra-studio.md`, `sentry.md`).
2. Follow Neon Functions development guidelines for Node.js workloads, streaming responses, and branch-aware deployments.
