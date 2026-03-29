# Sentry Alert Triage Runbook

## Symptoms
- Sentry notification: new error or error spike
- Increased error count in Sentry dashboard
- Users reporting issues matching error pattern

## Impact
- Varies by error type and frequency
- Check affected users count in Sentry issue details

## Diagnosis

### 1. Open Sentry Issue
1. Go to Sentry Dashboard
2. Find the issue from the alert
3. Note: error message, frequency, affected users

### 2. Check Error Details
Key fields to examine:
- **Stack trace**: Identify source file and line
- **Request ID**: Find in `requestId` tag for correlation
- **User context**: Which users are affected
- **Breadcrumbs**: What happened before the error

### 3. Correlate with Logs
Use the request ID from Sentry:
```bash
grep "requestId: <REQUEST_ID>" /var/log/app/*.log
```

### 4. Check for Deployment Correlation
- When did the error first occur?
- Was there a recent deployment?
- Check Git history for related changes

## Resolution

### Severity Assessment

| Severity | Criteria | Action |
|----------|----------|--------|
| Critical | >100 users, core feature broken | Immediate rollback |
| High | >10 users, data integrity risk | Hotfix within 1 hour |
| Medium | <10 users, workaround exists | Fix in next release |
| Low | Edge case, single user | Backlog |

### Step 1: Acknowledge in Sentry
- Assign to yourself
- Update status to "In Progress"

### Step 2: Reproduce Locally
```bash
# Use error details to reproduce
npm run dev
# Hit the affected endpoint with same parameters
```

### Step 3: Fix and Deploy
```bash
git checkout -b fix/sentry-<ISSUE_ID>
# Make fix
git commit -m "fix: resolve <error> reported in Sentry #<ISSUE_ID>"
```

### Step 4: Verify in Sentry
- Mark issue as resolved
- Set "Resolve in next release" if applicable
- Monitor for regressions

## Prevention
- Add regression test for the fixed bug
- Review error patterns weekly
- Set up smart alerts for new error types
- Enable source maps for readable stack traces
