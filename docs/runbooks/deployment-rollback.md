# Deployment Rollback Runbook

## Symptoms

- Critical bug discovered after deployment
- Significant error rate increase
- Core functionality broken
- Data integrity at risk

## Impact

- **Critical**: Production users affected
- Rollback minimizes exposure time

## Diagnosis

### 1. Confirm the Issue

```bash
# Check error rate spike
curl -H "X-Metrics-Key: $SECRET" https://your-domain.com/metrics | grep error

# Check Sentry for new errors
# Check health endpoint
curl https://your-domain.com/health
```

### 2. Identify the Problematic Deployment

```bash
# Get current deployed commit
echo $DEPLOYED_COMMIT

# Check recent deployments (Cloud Run)
gcloud run revisions list --service=run-remix --region=us-central1
```

## Resolution

### Google Cloud Run Rollback

#### Step 1: List Available Revisions

```bash
gcloud run revisions list --service=run-remix --region=us-central1 --limit=5
```

#### Step 2: Route Traffic to Previous Revision

```bash
gcloud run services update-traffic run-remix \
  --region=us-central1 \
  --to-revisions=run-remix-00042-abc=100
```

#### Step 3: Verify Rollback

```bash
curl https://your-domain.com/health
curl https://your-domain.com/api/products
```

### Docker/Manual Rollback

#### Step 1: Pull Previous Image

```bash
docker pull gcr.io/your-project/run-remix:previous-tag
```

#### Step 2: Deploy Previous Version

```bash
docker stop run-remix
docker run -d --name run-remix gcr.io/your-project/run-remix:previous-tag
```

### Database Migration Rollback

> [!CAUTION]
> Database rollbacks can cause data loss. Only proceed if absolutely necessary.

```bash
# Check migration history
npm run drizzle:status

# Rollback last migration (if supported)
npm run drizzle:rollback
```

## Post-Rollback

### 1. Communicate

- Notify team in #incidents channel
- Update status page if applicable

### 2. Investigate Root Cause

- Review the problematic commit
- Identify what testing missed
- Create postmortem document

### 3. Fix Forward

```bash
git revert <problematic-commit>
# Add tests for the bug
# Re-deploy with fix
```

## Prevention

- Require staging environment testing
- Use feature flags for risky changes
- Implement canary deployments
- Add automated smoke tests in CI/CD
