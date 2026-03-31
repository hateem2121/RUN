# Database Recovery & Business Continuity

**Status**: Active  
**Version**: 1.0  
**Last Updated**: January 2026

---

## Recovery Objectives

| Metric | Target | Definition |
|--------|--------|------------|
| **RTO** | < 30 minutes | Recovery Time Objective - Maximum acceptable downtime |
| **RPO** | < 5 minutes | Recovery Point Objective - Maximum acceptable data loss |

---

## Neon PostgreSQL Capabilities

### Automatic Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Point-in-Time Recovery** | Restore to any point in last 7 days (Pro) / 30 days (Scale) | ✅ Enabled |
| **Branching** | Instant database clones for testing | ✅ Available |
| **Auto-Suspend** | Scales to zero when idle | ✅ Configured |
| **Connection Pooling** | Via `-pooler` endpoint | ✅ In use |

### Backup Schedule

| Type | Frequency | Retention |
|------|-----------|-----------|
| Continuous WAL | Real-time | 7-30 days |
| Logical Backups | On-demand via branching | Unlimited |

---

## Recovery Procedures

### Scenario 1: Point-in-Time Recovery

**When**: Data corruption, accidental deletion, or need to restore to specific point.

**Steps**:

1. Log into [Neon Console](https://console.neon.tech)
2. Navigate to your project → **Branches**
3. Click **Restore** on the main branch
4. Select target timestamp (within retention window)
5. Confirm restoration
6. Verify data integrity with health check: `GET /api/health/db`

**Estimated Time**: 5-15 minutes

---

### Scenario 2: Branch-Based Recovery

**When**: Need to test recovery or create parallel environment.

**Steps**:

```bash
# Using Neon CLI
neon branches create --project-id $NEON_PROJECT_ID \
  --name recovery-test-$(date +%Y%m%d) \
  --parent main \
  --point-in-time "2026-01-10T12:00:00Z"

# Get connection string
neon connection-string recovery-test-$(date +%Y%m%d)
```

**Estimated Time**: < 1 minute (instant branching)

---

### Scenario 3: Complete Database Failure

**When**: Primary database unreachable, Neon regional outage.

**Steps**:

1. **Immediate**: Activate maintenance page (Cloud Run traffic to static page)
2. **Assessment**: Check [Neon Status Page](https://status.neon.tech)
3. **If Neon outage**: Wait for provider resolution, monitor status
4. **If configuration issue**:
   - Verify `DATABASE_URL` in Secret Manager
   - Check connection string includes `-pooler` suffix
   - Review Cloud Run service logs
5. **Verify recovery**: Run health checks, verify data consistency
6. **Post-incident**: Create incident report, update runbook if needed

**Estimated Time**: 15-60 minutes (depending on root cause)

---

## Quarterly Restore Test Procedure

Run quarterly to verify recovery capabilities.

### Test Checklist

- [ ] Create test branch from production at specific timestamp
- [ ] Connect application to test branch
- [ ] Run smoke tests against test branch
- [ ] Verify data integrity (sample record checks)
- [ ] Measure actual recovery time
- [ ] Document results in `docs/operations/restore-test-log.md`
- [ ] Delete test branch after verification

### Test Command Sequence

```bash
# 1. Create test branch (1 hour ago)
neon branches create \
  --project-id $NEON_PROJECT_ID \
  --name restore-test-q1-2026 \
  --parent main \
  --point-in-time "$(date -u -d '1 hour ago' +'%Y-%m-%dT%H:%M:%SZ')"

# 2. Get connection string and test
export TEST_DB_URL=$(neon connection-string restore-test-q1-2026 --pooled)
DATABASE_URL=$TEST_DB_URL npm run test:integration

# 3. Cleanup
neon branches delete restore-test-q1-2026 --project-id $NEON_PROJECT_ID
```

---

## Contacts & Escalation

| Level | Contact | Response Time |
|-------|---------|---------------|
| L1 | On-call engineer (PagerDuty) | < 15 minutes |
| L2 | Platform team lead | < 1 hour |
| L3 | Neon support (if provider issue) | Per SLA |

---

## Related Documentation

- [Incident Response Runbook](../runbooks/incident-response.md)
- [Database Outage Runbook](../runbooks/database-outage.md)
- [SLO Definitions](./slos.md)
- [Neon Documentation](https://neon.tech/docs)

---

*This document is tested quarterly and reviewed after any database incident.*
