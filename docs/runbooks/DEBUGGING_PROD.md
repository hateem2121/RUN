# Debugging Production Issues (Runbook)

**Target Audience**: On-Call Engineers, Developers.
**Purpose**: Step-by-step guide to identifying, diagnosing, and resolving production incidents in RUN-Remix.

---

## 1. Quick Triage Flow

1.  **Is it a Critical Incident?** (Site down, white screen, 500 error rate > 1%)
    - -> Ack PagerDuty/Alert immediately.
    - -> Check `Cloud Logging` first.
2.  **Is it a Visual Bug?**
    - -> Check `Error Boundary` reports.
    - -> Verify visual regression dashboards.
3.  **Is it a Latency Spike?**
    - -> Check `/metrics` via Grafana.
    - -> Look for database lock contention or slow queries.

---

## 2. Using Cloud Logging (Pino)

RUN-Remix uses structured **JSON logging** (Pino).

**Key Fields**:

- `level`: Severity (30=Info, 40=Warn, 50=Error).
- `correlationId`: **Crucial** unique ID for tracing a request across services.
- `req.url`: HTTP Endpoint.
- `err.message` / `err.stack`: Serialization of exception.

### Finding a Specific Request

If a user reports an issue, ask for the **Request ID** (captured in their error UI) or their **User ID**.

**Filter Query (Google Cloud Logging):**

```text
jsonPayload.correlationId="abc-123-xyz" OR jsonPayload.req.headers.x-user-id="user_456"
```

### Investigating 500 Errors

Filter for errors excluding 404s:

```text
severity>=ERROR
NOT jsonPayload.res.statusCode=404
```

---

## 3. Debugging Frontend Crashes (Source Maps)

Production client code is minified. We enable **Secure Source Maps** to decode strack traces.

### Scenario: Admin reports "White Screen"

1.  **Locate the Error Log**:

    - Look for client-side error reports (if log forwarding is enabled) or check the user's console screenshot.
    - Example Stack: `at e.handle (index.ab12.js:1:502)`

2.  **Retrieve Source Map**:

    - Identify the build version/deployment ID.
    - Download the matching `.map` file from our private artifacts bucket (e.g., `gs://run-remix-sourcemaps/v1.2.3/index.ab12.js.map`).
    - _Note: Never expose .map files publicly._

3.  **Symbolicate**:
    - Use `source-map-cli` or drag-and-drop into Chrome DevTools (Sources -> Load Source Map) to see the original TypeScript.
    - **Root Cause**: Often a `null` check missing on a nested prop.

---

## 4. Common Failure Modes & Fixes

| Symptom                   | Probable Cause                | Investigation Step                                         | Remediation                                                  |
| :------------------------ | :---------------------------- | :--------------------------------------------------------- | :----------------------------------------------------------- |
| **500 on /api/products**  | Database Connection / Timeout | Check `Cloud Logging` for `DB_CONNECTION_ERROR`.           | Check Neon status. Restart Cloud Run revision if pool stuck. |
| **Slow Dashboard**        | N+1 Query                     | Check `/metrics` for high `http_request_duration_seconds`. | Run `EXPLAIN ANALYZE` on suspect query.                      |
| **"Network Error" Toast** | Client Offline / CORS         | Check browser Network Tab.                                 | If CORS, verify `origin` header matches allowed list.        |
| **Infinite Loader**       | Suspense Boundary Stuck       | Check `e2e/failure` tests locally.                         | Force a boundary reset or update loading skeleton logic.     |

---

## 5. Escalation Policy

If the issue cannot be resolved within **30 minutes**:

1.  Post in `#engineering-incidents`.
2.  Tag the **Tech Lead** (@Lead).
3.  If data corruption is suspected, **Enable Maintenance Mode** immediately.
