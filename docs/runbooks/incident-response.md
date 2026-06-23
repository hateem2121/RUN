# Incident Response Runbook

> **Critical**: This document defines the standard operating procedures for handling production incidents in the RUN Remix platform.

## 🚨 Emergency Contacts

| Role | Contact | Phone / Slack |
|------|---------|---------------|
| **Incident Commander** | On-Call Pager | `#incident-response` (Slack) |
| **Engineering Lead** | Hateem (User) | `@hateem` |
| **Infrastructure** | DevOps Team | `#infra-alerts` |

---

## 🚦 Severity Levels

| Level | Definition | Response Time (SLA) | Example |
|-------|------------|---------------------|---------|
| **SEV-1 (Critical)** | Core business function down. Data loss risk. Security breach. | **15 mins** | Database unreachble. Checkout broken. 3D Viewer crashing for all users. |
| **SEV-2 (High)** | Major feature degraded. High error rates (>5%). | **1 hour** | Email notifications failing. Search slow (>2s). |
| **SEV-3 (Medium)** | Minor feature broken. workaround available. | **4 hours** | Admin dashboard formatting issue. |
| **SEV-4 (Low)** | Cosmetic issue. Development blocked. | **Next Business Day** | Typos. Internal tool glitch. |

---

## 🔄 Response Process

1. **ACKNOWLEDGE**: Reply to the alert (PagerDuty/Slack) to claim ownership.
2. **ASSESS**: Verify user impact. Determine Severity.
3. **COMMUNICATE**: Post in `#incident-response`:
    > "Investigating SEV-1: High Error Rate on API. IC: @user"
4. **MITIGATE**: Focus on restoring service first, root cause later. (e.g., Rollback, Scale Up, Toggle Feature Flag).
5. **RESOLVE**: Verify system health.
6. **POST-MORTEM**: Schedule review within 24 hours for SEV-1/2.

---

## 📖 Specific Runbooks

### 1. High API Error Rate / 5xx Spikes

**Trigger**: GCP Error Logs > 5% Error Rate OR 500 status codes spike.

**Investigation**:

1. Check **GCP Error Reporting** for new issues. Is it a specific endpoint?
2. Check **Database Metrics** (`/admin/metrics` or logs):
    - Are connections maxed outs? (`currentConcurrentQueries` > `peakConcurrentQueries`)
    - Is latency high?
3. Check **Deployment History**: Was there a release in the last hour?

**Mitigation**:

- **If Deployment related**: Revert to previous stable commit immediately.
- **If Database related**: Check `db-metrics`. If overwhelmed, scale up Neon compute or enable connection pooling.
- **If Traffic related**: Enable Rate Limiting (`server/middleware/rateLimiter.ts`).

### 2. Database Connection Failures

**Trigger**: "Database health check failed" logs or `ETIMEDOUT`.

**Investigation**:

1. Verify Neon Status (console.neon.tech).
2. Check `server/db.ts` logs for `[Database] Wakeup failed`.
3. Check if `DATABASE_URL` is correct and credentials are valid.

**Mitigation**:

- **Transient**: The `wakeupDatabase` function should handle cold starts. If stuck, restart the Node.js service to clear bad connections.
- **Outage**: Switch to Read Replica if available (not currently configured).
- **Pool Exhaustion**: Restart service to clear "zombie" connections.

### 3. 3D Viewer Crashing (WebGL Context Lost)

**Trigger**: Client-side feedback or GCP Error Reporting "Context Lost" spikes.

**Investigation**:

1. Check if specific models are causing crashes (large textures/geometry).
2. Review `client/app/components/viewer/UnifiedModelViewer.tsx` error logs.

**Mitigation**:

- The viewer has auto-recovery. If loop continues, disable `useWasm` or specific high-res features via Feature Flags.

---

## 🛡️ Escalation Matrix

If the incident is not resolved within the SLA:

1. **T+30m (SEV-1)**: Page Engineering Manager.
2. **T+1h**: Notify CTO / Stakeholders.
3. **T+2h**: Assemble "War Room" (Video Call).

---

## 🔗 Quick Links

- [GCP Error Reporting](https://console.cloud.google.com/errors)
- [Neon Console](https://console.neon.tech)
- [Vercel Deployment](https://vercel.com)
