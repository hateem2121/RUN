# On-Call Protocol & Incident Management

**Status**: Draft
**Rotation**: Weekly (Starts Monday 12:00 PM)

---

## 1. Responsibilities

The **On-Call Engineer** is responsible for:

1.  **Acknowledging Alerts** within the SLO time (15m for Critical).
2.  **Triaging Issues** to determine impact (P0 vs P3).
3.  **Customer Communication** (via Status Page updates).
4.  **Escalation** if the issue is beyond their expertise.

---

## 2. Issue Severity Levels

| Level                | Definition                                                                 | Response SLA          | Example                                                         |
| :------------------- | :------------------------------------------------------------------------- | :-------------------- | :-------------------------------------------------------------- |
| **SEV-1 (Critical)** | Core functionality down (Checkout, Login). Data loss risk.                 | **15 mins**           | Database unreachable. 500 errors > 5%. payment gateway failing. |
| **SEV-2 (High)**     | Major feature broken but workaround exists. Performance severely degraded. | **1 hour**            | Search is slow (>2s). Admin export fails. Emails delayed.       |
| **SEV-3 (Medium)**   | Minor bug, cosmetic issue, or edge case.                                   | **Next Business Day** | Typos. Layout shift. 1% of users seeing error.                  |
| **SEV-4 (Low)**      | Feature request or minor annoyance.                                        | **Backlog**           | Dark mode color contrast.                                       |

---

## 3. Incident Workflow

### Step 1: Detect & Acknowledge

- **Alert fires** (PagerDuty/Slack).
- Mark as **"Acknowledged"** to stop the pager from escalating.

### Step 2: Investigation (Triage)

- Check **Grafana Dashboards**: Is it a spike looking weird?
- Check **Cloud Logging**: Filter `severity >= ERROR`.
- **Reproduce**: Can you trigger it in Prod? Staging?

### Step 3: Mitigate (Stop the Bleeding)

- **Rollback**: If caused by a recent deploy, revert immediately. `gcloud run services update-traffic --to-latest-revision=false ...`
- **Scale Up**: If load related, increase max instances.
- **Feature Flag**: Disable the broken feature if possible.

### Step 4: Resolve & Post-Mortem

- Once stable, merge a proper fix.
- Write a **Post-Mortem** (Incident Report) for any SEV-1/SEV-2.
  - _Root Cause?_
  - _How was it detected?_
  - _How to prevent recurrence?_

---

## 4. Key Contacts

| Role                    | Contact          |
| :---------------------- | :--------------- |
| **Engineering Manager** | @EM (Slack)      |
| **Infra Lead**          | @DevOps (Slack)  |
| **Security**            | @SecTeam (Slack) |

---

## 5. Useful Commands

**Check Cloud Run Status**:

```bash
gcloud run services describe run-remix --region us-central1
```

**View Recent Logs Tail**:

```bash
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit 10
```
