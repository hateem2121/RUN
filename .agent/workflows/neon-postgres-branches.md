---
description: Choose and create Neon branches (child branches, schema-only, time travel, ephemeral preview branches, branch-per-PR).
---

# /neon-postgres-branches

**Description:** Choose and create the right Neon branch type for testing and development. Covers migration testing with real data, isolated test environments, schema-only branches for sensitive data, and CI/CD branch lifecycles.

**Usage:** `/neon-postgres-branches [create | reset | list | delete]`

## Agent Instructions

When the user invokes `/neon-postgres-branches` or `/neon-branches`:
1. Read `.agent/skills/neon-postgres-branches/SKILL.md` for branching strategies, parent-child inheritance, and lifecycle management.
2. Use `mcp-server-neon` tools (`create_branch`, `describe_branch`, `delete_branch`, `reset_from_parent`, `prepare_database_migration`, `complete_database_migration`) to execute branch operations safely.
