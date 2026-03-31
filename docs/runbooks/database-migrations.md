# Drizzle Migration Runbook

This guide outlines the standard procedure for managing database schema changes in the **RUN APPAREL** platform.

## Architecture Guidelines

- **ORM**: Drizzle ORM
- **Database**: Neon (PostgreSQL)
- **Primary Method**: Standard SQL migrations (managed by `drizzle-kit`)

---

## 1. Local Development flow

### A. Generating Migrations

When you modify `server/db/schema.ts`, you must generate a new migration file.

```bash
cd server
npm run db:generate
```

This creates a new `.sql` file in `server/drizzle/`.

### B. Applying to Local/Dev DB

To apply changes to your current development database:

```bash
cd server
npm run db:push
```

> [!TIP]
> Use `db:push` for rapid prototyping. For shared environments, always use `db:migrate`.

---

## 2. Production Deployment flow

In production environments, we use the `db:migrate` script which executes the generated SQL files.

### Step 1: Verify Connections

Ensure `DATABASE_URL` is set to the **-pooler** endpoint in your secrets manager.

### Step 2: Run Migration

```bash
# Executed automatically during CI/CD rollout
npm run db:migrate
```

### Step 3: Verification

Verify the schema version in the database:

```sql
SELECT * FROM __drizzle_migrations;
```

---

## 3. Troubleshooting

### Conflict: Migration Drift

If the database state diverges from migration files:

1. Run `npm run db:pull` to inspect current DB state.
2. Resolve conflicts in `schema.ts`.
3. Re-generate migration with `--custom`.

### Neon Point-in-Time Recovery

If a migration fails catastrophically:

1. Access the Neon Console.
2. Use "Branched Recovery" to restore to the state immediately before the migration.
3. Fix the migration SQL and retry.

---

**Policy Note:** Never manually edit SQL files in `server/drizzle/` unless performing a complex data migration that cannot be expressed in TypeScript.
