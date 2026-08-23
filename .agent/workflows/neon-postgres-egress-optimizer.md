---
description: Diagnose and fix excessive Postgres egress, query overfetching, SELECT * anti-patterns, and database transfer costs.
---

# /neon-postgres-egress-optimizer

**Description:** Diagnose and fix excessive Postgres egress (network data transfer) in a codebase. Optimizes query overfetching, SELECT * clauses, pagination, and data serialization.

**Usage:** `/neon-postgres-egress-optimizer [audit | fix | analyze]`

## Agent Instructions

When the user invokes `/neon-postgres-egress-optimizer` or `/neon-egress`:
1. Read `.agent/skills/neon-postgres-egress-optimizer/SKILL.md` for egress diagnostics and optimization procedures.
2. Audit queries in `server/services/` and database repositories for overfetching, missing projections, unindexed scans, or unbounded transfers.
3. Optimize queries with strict column selection, efficient pagination, and stream buffering.
