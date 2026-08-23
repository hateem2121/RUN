---
description: Alias for /neon-postgres-egress-optimizer — Optimize Postgres queries to reduce egress and data transfer costs.
---

# /neon-egress

**Description:** Alias for `/neon-postgres-egress-optimizer`. Diagnose and fix excessive Postgres egress and query overfetching.

**Usage:** `/neon-egress [audit | fix | analyze]`

## Agent Instructions

When the user invokes `/neon-egress`, execute the `/neon-postgres-egress-optimizer` workflow defined in `.agent/workflows/neon-postgres-egress-optimizer.md` and consult `.agent/skills/neon-postgres-egress-optimizer/SKILL.md`.
