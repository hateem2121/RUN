---
description: Alias for /neon-postgres-branches — Manage Neon database branches, migrations, and previews.
---

# /neon-branches

**Description:** Alias for `/neon-postgres-branches`. Choose and create the right Neon branch type for testing and development.

**Usage:** `/neon-branches [create | reset | list | delete]`

## Agent Instructions

When the user invokes `/neon-branches`, execute the `/neon-postgres-branches` workflow defined in `.agent/workflows/neon-postgres-branches.md` and consult `.agent/skills/neon-postgres-branches/SKILL.md`.
