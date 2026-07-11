# SOP_ROLLBACK — Rollback Procedure

**Owner:** M. Hateem Jamshaid (Business Development Director)
**Last Updated:** 2026-03-28
**Applies To:** All production rollback scenarios for RUN Remix v3+

---

## Trigger Criteria

Initiate rollback if ANY of the following during or after a deployment:

- Sentry error rate > 1% sustained for 5+ minutes
- `/api/health` returning non-200 for > 30 seconds
- P99 response latency > 3 seconds
- Customer-impacting data corruption detected
- Critical security vulnerability discovered in new revision

---

## Step 1: Immediate Traffic Rollback (Cloud Run)

```bash
# Find the previous stable revision
gcloud run revisions list --service=run-remix --region=us-central1

# Route 100% traffic back to previous stable revision
# Replace PREV_REVISION with the actual revision name (e.g., run-remix-00042-xyz)
gcloud run services update-traffic run-remix \
  --to-revisions=PREV_REVISION=100 --region=us-central1

# Verify
curl https://wear-run.com/api/health
```

---

## Step 2: Database Schema Rollback (if migration was applied)

### Option A: Neon PITR (Primary Method)

Neon preserves point-in-time restore for 7 days (Pro) or 24 hours (Free). This is the preferred method as it requires no pre-created backup branches.

```bash
# Create restore branch from pre-migration timestamp
# Use Neon Console → Branches → Restore Point

# Or via neon CLI:
neon branches create --name=rollback-$(date +%Y%m%d) \
  --project=<PROJECT_ID> \
  --parent=main \
  --parent-timestamp=<ISO_TIMESTAMP_BEFORE_MIGRATION>
```

### Option B: Drizzle Down Migration

```bash
# If a down migration exists in server/migrations/
npm run --workspace=@run-remix/server db:push -- --force-reset

# WARNING: Only use if migration is reversible and no data has been written
# to new columns/tables
```

### Option C: Manual DDL Reversal

For simple column additions:

```sql
-- Example: drop a column added in bad migration
ALTER TABLE products DROP COLUMN IF EXISTS bad_column;
```

---

## Step 3: Cache Invalidation

After rollback, flush all caches to prevent stale data from new schema serving old code:

```bash
# Via API (requires admin auth)
curl -X POST https://wear-run.com/api/admin/cache/flush \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

---

## Step 4: Verification

```bash
# 1. Health endpoint
curl https://wear-run.com/api/health

# 2. Critical data endpoints
curl https://wear-run.com/api/products | jq '.length'
curl https://wear-run.com/api/categories | jq '.length'

# 3. Check Sentry — error rate should return to baseline
# 4. Check Prometheus — latency should normalize
```

---

## Step 5: Post-Rollback Actions

- [ ] File incident report in Sentry
- [ ] Update `findings.md` with root cause and impact
- [ ] Open GitHub issue for the regression
- [ ] Schedule post-mortem within 24 hours
- [ ] Block the failed revision: `gcloud run revisions delete FAILED_REVISION --region=us-central1`
