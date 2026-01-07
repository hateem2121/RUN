# Runbook: [Incident Name]

**Status:** [Draft/Active/Deprecated]
**Owner:** [Team/Person]
**Last Updated:** [Date]

## 1. Triggers

- **Alert:** `[Alert Name]` (e.g., "High Error Rate > 5%")
- **Metric:** `[Metric Name]` (e.g., `http_requests_total{status="500"}`)
- **Threshold:** `[Value]` (e.g., > 10 per minute)

## 2. Impact Analysis

- **User Impact:** [Describe what the user sees. e.g., "Checkout fails with 500 error"]
- **Severity:** [P0/P1/P2]

## 3. Triage & Verification

How to confirm this is a real issue and not noise?

1.  Check Logs: `url:https://glitchtip... query:"status:500"`
2.  Check Graphs: `url:https://grafana...`
3.  Reproduce:
    ```bash
    curl -v https://api.production.com/health
    ```

## 4. Mitigation (Stop the Bleeding)

- [ ] **Option A (Rollback):** If this started after a deploy, revert to previous SHA.
- [ ] **Option B (Feature Flag):** Disable the broken feature via env var `ENABLE_FEATURE_X=false`.
- [ ] **Option C (Restart):** If memory leak suspected, restart the service.

## 5. Escalation

If mitigation fails within **15 minutes**, escalate to:

- **Primary:** [Name/Phone]
- **Secondary:** [Name/Phone]

## 6. Post-Mortem

- [Link to POst-Mortem Template]
