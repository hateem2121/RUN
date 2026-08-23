---
description: Start here for Neon architecture, cloud backend primitives, CLI/MCP setup, and skill routing across Postgres, Auth, Data API, Storage, Functions, and AI Gateway.
---

# /neon

**Description:** Overview and router for Neon cloud backend primitives. Guides routing to specific Neon skills, CLI and MCP server configuration, and branch-first development workflows.

**Usage:** `/neon [task]`

## Agent Instructions

When the user invokes `/neon`:
1. Read `.agent/skills/neon/SKILL.md` to understand the full capabilities and architectural primitives.
2. Route to the appropriate specialized sub-skill or workflow:
   - For database management, connections, and pooling: `/neon-postgres` (`.agent/skills/neon-postgres/SKILL.md`)
   - For branching workflows, migration testing, or PR previews: `/neon-postgres-branches` (`.agent/skills/neon-postgres-branches/SKILL.md`)
   - For instant disposable databases without credentials: `/claimable-postgres` (`.agent/skills/claimable-postgres/SKILL.md`)
   - For LLM routing, AI chat, and model proxying: `/neon-ai-gateway` (`.agent/skills/neon-ai-gateway/SKILL.md`)
   - For serverless background workloads, SSE, and APIs: `/neon-functions` (`.agent/skills/neon-functions/SKILL.md`)
   - For S3-compatible file/blob storage: `/neon-object-storage` (`.agent/skills/neon-object-storage/SKILL.md`)
   - For data transfer and query cost reduction: `/neon-postgres-egress-optimizer` (`.agent/skills/neon-postgres-egress-optimizer/SKILL.md`)
3. Utilize available `mcp-server-neon` tools or Neon CLI commands to inspect and interact with the Neon project.
