# SOP_DEPLOY — Deployment Checklist

**Owner:** M. Hateem Jamshaid (Business Development Director)
**Last Updated:** 2026-04-04
**Applies To:** All production deployments of RUN Remix v3+

---

## Pre-Deployment Gates (Must All Pass)

### 1. Local Verification

```bash
# Run in order — all must exit 0
npm run verify-port              # Port 5002 Law — zero tolerance
npm run verify:tech-integrity    # Full system integrity check
npm run lint                     # Biome — zero violations
npm run typecheck                # TypeScript strict — zero errors
npm run test                     # Vitest — 80%+ coverage on services
npm run build                    # Turborepo production build
```

### 2. CI Gates (GitHub Actions)

Confirm these workflows are green before promoting:

- `ci.yml` — lint, typecheck, Neon branch, migration, coverage (40% min)
- `quality-gate.yml` — CSS lint, npm audit, Trivy, React Scan, Lighthouse CI
- `e2e.yml` — Playwright E2E on port 5002

### 3. Database Migrations

```bash
# Generate migration from schema changes
npm run --workspace=@run-remix/server db:generate

# Review generated migration SQL before applying
cat drizzle/migrations/<latest>.sql

# Apply to staging branch first
npm run --workspace=@run-remix/server db:push

# Verify application against staging
npm run verify:neon
```

---

## Deployment Steps (Cloud Run Canary)

### Step 1: Tag the release

```bash
git tag v$(date +%Y%m%d-%H%M) -m "Release: <brief description>"
git push origin --tags
```

### Step 2: Cloud Build triggers automatically

`cloudbuild.yaml` handles:

1. `npm ci` — install deps
2. `npm run verify:tech-integrity` — pre-build gate
3. `docker build` → push to GCR
4. Cloud Run deploy as new revision (0% traffic)

### Step 3: Canary promotion

```bash
# Route 10% of traffic to new revision
gcloud run services update-traffic run-remix \
  --to-revisions=LATEST=10 --region=us-central1

# Monitor for 10 minutes — check error rates in Sentry + GCP logs
# If clean, promote to 50%
gcloud run services update-traffic run-remix \
  --to-revisions=LATEST=50 --region=us-central1

# Monitor for 10 minutes — promote to 100%
gcloud run services update-traffic run-remix \
  --to-revisions=LATEST=100 --region=us-central1
```

### Step 4: Health check gate

```bash
curl https://wear-run.com/api/health
# Must return: { "status": "UP" }
```

---

## Rollback Trigger Criteria

Immediately rollback if ANY of the following:

- Error rate in Sentry exceeds 1% within 5 minutes of promotion
- `/api/health` returns non-200 for more than 30 seconds
- P99 latency exceeds 3 seconds
- Any Critical or High Sentry alert fires

**Rollback command:**

```bash
# See SOP_ROLLBACK.md
```

---

## Post-Deployment

- [ ] Confirm `/api/health` returns `{ status: "UP" }`
- [ ] Verify Sentry shows no new issues
- [ ] Check Prometheus metrics are flowing
- [ ] Update `findings.md` with deployment notes
- [ ] Tag release in GitHub as `v<YYYYMMDD-HHMM>`
