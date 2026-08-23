---
description: Provision instant temporary Postgres databases via Claimable Postgres (neon.new) with no signup or credit card for testing and prototyping.
---

# /claimable-postgres

**Description:** Provision instant temporary Postgres databases via Claimable Postgres by Neon (neon.new) with no login, signup, or credit card. Supports REST API, CLI, and SDK.

**Usage:** `/claimable-postgres [create | claim | status]`

## Agent Instructions

When the user invokes `/claimable-postgres` or `/neon-new`:
1. Read `.agent/skills/claimable-postgres/SKILL.md` to review the Claimable Postgres API and CLI flows.
2. If requested to create a quick database, generate an instant throwaway PostgreSQL instance using `npx neon-new` or the Claimable Postgres REST API.
3. Return the generated `DATABASE_URL` and claim link to the user.
