# Neon Cloud Backend Primitives & Agent Skills Rule

This rule governs how AI coding agents leverage Neon Serverless Postgres, Branching, Functions, Object Storage, and the AI Gateway in this monorepo.

## 1. Skill Discovery & Routing
- Before initiating database operations, migrations, or cloud backend features, always consult the primary skill at `.agent/skills/neon/SKILL.md` or run `/neon`.
- Use specialized skills for dedicated domains:
  - **Database & Drizzle ORM**: `/neon-postgres` (`.agent/skills/neon-postgres/SKILL.md`)
  - **Branching & PR Previews**: `/neon-postgres-branches` (`.agent/skills/neon-postgres-branches/SKILL.md`)
  - **Disposable Databases**: `/claimable-postgres` (`.agent/skills/claimable-postgres/SKILL.md`)
  - **Unified Model Proxy**: `/neon-ai-gateway` (`.agent/skills/neon-ai-gateway/SKILL.md`)
  - **Serverless Node.js HTTP Compute**: `/neon-functions` (`.agent/skills/neon-functions/SKILL.md`)
  - **S3-Compatible Object Storage**: `/neon-object-storage` (`.agent/skills/neon-object-storage/SKILL.md`)
  - **Query Egress Optimization**: `/neon-postgres-egress-optimizer` (`.agent/skills/neon-postgres-egress-optimizer/SKILL.md`)

## 2. Slash Command Parity
- Every workspace skill registered in `.agent/skills/<name>/SKILL.md` MUST have a matching slash command workflow in `.agent/workflows/<name>.md`.
- Workflows provide instant on-demand invocation via `/<command>` in the Antigravity IDE and CLI.
