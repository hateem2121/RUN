---
description: Guide and best practices for Neon Lakebase Postgres (connection methods, pooling, autoscaling, migrations, scale-to-zero, restore).
---

# /neon-postgres

**Description:** Guides and best practices for working with Lakebase Postgres, the database behind Neon. Covers connection methods and drivers, pooled vs direct connections, schema migrations, autoscaling, scale-to-zero, instant restore, read replicas, and connection pooling.

**Usage:** `/neon-postgres [subcommand or query]`

## Agent Instructions

When the user invokes `/neon-postgres` or `/postgres`:
1. Read `.agent/skills/neon-postgres/SKILL.md` for Lakebase Postgres specifications and best practices.
2. Use `mcp-server-neon` tools (`describe_project`, `get_database_tables`, `describe_table_schema`, `run_sql`, `run_sql_transaction`, `list_slow_queries`, `inspect_database`) to manage and inspect the database.
3. Enforce the repository's database architectural rules:
   - Neon serverless connection string patterns
   - Connection pooling with PgBouncer
   - Cold-start minimization and Drizzle ORM schema conventions
