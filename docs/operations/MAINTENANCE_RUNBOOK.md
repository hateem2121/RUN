# Maintenance Runbook

This document outlines recurring maintenance tasks to keep the RUN Apparel B2B Platform healthy.

---

## Weekly Tasks

### 1. Review SLO Metrics

**When:** Monday morning

**Steps:**

1. Check Sentry for SLO violation alerts from the past week
2. Review availability: target 99.9%, budget ~43 min/month
3. Review p95 latency: target <500ms
4. If budget burn rate >10%, investigate and create ticket

**Dashboard:** Sentry → Performance → Web Vitals

---

### 2. Review Synthetic Monitoring

**When:** Monday morning

**Steps:**

1. Go to Actions → Synthetic Monitoring
2. Check for any failed runs in the past week
3. Investigate any failures (may indicate intermittent issues)
4. Verify Slack notifications were sent for failures (if configured)

---

### 3. Review Dependabot PRs

**When:** Monday afternoon

**Steps:**

1. Check open Dependabot PRs
2. Review grouped updates (production, dev-tools, testing)
3. Check CI passes on each PR
4. Merge patch/minor updates after CI passes
5. For major updates: create separate review ticket

**Note:** Major version updates are ignored by Dependabot and need manual review.

---

## Monthly Tasks

### 1. Security Audit

**When:** First Monday of month

**Steps:**

```bash
npm audit
npm audit --audit-level=moderate

# Check for outdated packages
npm outdated

# Update all patch versions
npm update
```

**If vulnerabilities found:**

1. Check if they affect production code
2. Create ticket for remediation
3. If critical, fix immediately

---

### 2. Bundle Size Review

**When:** First Monday of month

**Steps:**

```bash
npm run build
npm run check:bundle
```

**Check:**

- Has total bundle size increased >10%?
- Any single chunk >250KB gzipped?
- Review largest chunks with: `npx vite-bundle-analyzer`

---

### 3. Cache Health Check

**When:** First Monday of month

**Steps:**

1. Check Redis memory usage in Upstash console
2. Review cache hit rate (target >80%)
3. Check L1 cache memory usage in Cloud Run metrics
4. Adjust TTLs if hit rate is low

---

### 4. Database Health Check

**When:** First Monday of month

**Steps:**

1. Check Neon console for:
   - Query performance (slow queries)
   - Connection pool utilization
   - Storage usage
2. Review circuit breaker logs for DB failures
3. Check database cold start metrics

---

## Quarterly Tasks

### 1. Dependency Major Version Updates

**When:** First week of quarter

**Steps:**

1. Review all dependencies with major updates available
2. Read changelogs for breaking changes
3. Update in staging first
4. Run full E2E test suite
5. Monitor for 1 week before production

---

### 2. Performance Baseline Review

**When:** First week of quarter

**Steps:**

1. Run Lighthouse audit on key pages
2. Compare against previous quarter
3. Update SLO targets if needed
4. Create tickets for any regressions

---

### 3. Security Review

**When:** First week of quarter

**Steps:**

1. Review authentication flows
2. Check CSP headers are up to date
3. Review rate limiting effectiveness
4. Run OWASP dependency check
5. Review admin access logs

---

## Emergency Procedures

### High Error Rate (>1%)

1. Check Cloud Run console for instance issues
2. Check circuit breaker states: `GET /api/health/circuits`
3. Check recent deployments - consider rollback
4. Check external dependencies (Neon, Redis, Object Storage)
5. If unresolved in 15min, escalate

### High Latency (p95 >2s)

1. Check database query performance
2. Check cache hit rate
3. Check for traffic spikes
4. Scale up instances if needed
5. If unresolved in 10min, escalate

### Complete Outage

1. Check Cloud Run console
2. Verify DNS resolution
3. Check for GCP incidents
4. If infrastructure is healthy, rollback to last known good deployment
5. Escalate immediately

---

## Contacts

| Role             | Contact   | Escalation Time |
| ---------------- | --------- | --------------- |
| On-call Engineer | @oncall   | Immediate       |
| Engineering Lead | @lead     | 15 minutes      |
| Platform Team    | @platform | 30 minutes      |

---

## References

- [SLO Definitions](./slos.md)
- [Horizontal Scaling](../core/HORIZONTAL_SCALING.md)
- [Visual Governance / Styling](../development/styling.md)
