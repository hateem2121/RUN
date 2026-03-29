# SOP_MIGRATE — Database Migration Process

**Owner:** M. Hateem Jamshaid (Business Development Director)
**Last Updated:** 2026-03-28
**Applies To:** All Drizzle ORM schema changes against Neon Serverless PostgreSQL

---

## Rule: Every Schema Change Requires a Migration File

All schema changes MUST be captured as versioned migration files in `server/migrations/` and committed to git. No direct schema modifications to production without a tracked migration.

---

## Step 1: Make Schema Changes in Shared Package

All table definitions live in `shared/schemas/`. Edit the relevant schema file:

```bash
# Example: adding a column to products
# Edit: shared/schemas/catalog.ts (or relevant file)
# Add the new column to the Drizzle table definition
```

---

## Step 2: Generate Migration File

```bash
# From monorepo root
npm run --workspace=@run-remix/server db:generate

# OR using drizzle-kit directly
cd server && npx drizzle-kit generate

# This creates a new file in server/migrations/<timestamp>_<description>.sql
```

**Review the generated SQL before applying:**
```bash
cat server/migrations/<latest>.sql
# Confirm: only the expected changes are present
# Confirm: no DROP TABLE or DROP COLUMN unless intentional
```

---

## Step 3: Apply to Neon Staging Branch First

```bash
# Create a Neon staging branch if one doesn't exist
neon branches create --name=staging --project=<PROJECT_ID>

# Set DATABASE_URL to staging branch connection string
export DATABASE_URL="<staging-branch-url>"

# Apply migration
npm run --workspace=@run-remix/server db:push

# Verify migration applied
npm run verify:neon
```

---

## Step 4: Test Against Staging Branch

```bash
# Run full test suite against staging DB
DATABASE_URL="<staging-branch-url>" npm run test

# Run E2E tests
DATABASE_URL="<staging-branch-url>" npm run test:e2e

# All must pass before proceeding to production
```

---

## Step 5: Apply to Production

```bash
# Reset DATABASE_URL to production Neon connection
export DATABASE_URL="<production-url>"

# Apply migration
npm run --workspace=@run-remix/server db:push

# Verify
npm run verify:neon
curl https://wear-run.com/api/health
```

---

## Step 6: Commit Migration Files

```bash
# Always commit migration files alongside the code that requires them
git add server/migrations/
git add shared/schemas/      # The schema change
git commit -m "feat: <description of schema change>

Adds/modifies <table>.<column> to support <feature>.
Migration: server/migrations/<filename>.sql"
```

---

## Rollback

If the migration causes issues, see `SOP_ROLLBACK.md` for Neon point-in-time restore and down-migration procedures.

---

## Anti-Patterns (Never Do)

- ❌ Never use `drizzle-kit push` directly against production without a staging test
- ❌ Never modify Neon schema through the Neon Console directly — use Drizzle migrations
- ❌ Never commit code that depends on a schema change without also committing the migration file
- ❌ Never delete migration files from `server/migrations/` — they are the audit trail
