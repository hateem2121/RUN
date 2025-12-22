# Error Handling & Observability Guide

## 1. Error Handling Architecture

### Frontend (React 19)

- **Global Boundary**: `AppErrorBoundary` wraps the entire app. It catches render errors and shows a user-friendly fallback.
- **Async Errors**: `QueryClient` (React Query) handles API failures globally. It automatically retries idempotent requests (up to 2 times) and suppresses retries for 4xx errors.
- **Filtering**: We explicitly filter "noise" (like `AbortError` or extension errors) to prevent console spam using the `useGlobalErrorFilter` hook.

### Backend (Express 5)

- **Process Stability**: We enforce a "Crash-Only" policy for `uncaughtException` and `unhandledRejection` in production. The process exits with code 1 to allow the orchestrator (Cloud Run) to restart it cleanly.
- **Structured Logging**: All logs are JSON structured (via Pino) with correlation IDs (`req.id`) traceable across the stack.

## 2. Production Debugging

### Source Maps

- **Production Setting**: `sourcemap: "hidden"`.
- **Workflow**:
  1. `.map` files are generated in `dist/` but are NOT referenced in the `.js` bundle (preventing public access).
  2. To debug a minified stack trace:
     - Download the `.map` file from the CI artifact or secure storage.
     - Use a tool like `mozilla/source-map` or VS Code to symbolize the stack trace.
     - Alternatively, upload them to Sentry (GlitchTip) if configured securely.

### Logging

- **Format**: JSON lines (NDJSON).
- **Destination**: `stdout` (captured by Cloud Run / Docker).
- **Levels**:
  - `info`: Normal operations.
  - `warn`: Handled errors, slow queries (>1s).
  - `error`: Unhandled exceptions, critical failures.

### Runbook: Tracing a Request

To investigate an issue using Correlation IDs:

1. **Find the Log**: Search logging system (Loki) for the error.
   ```json
   {
     "level": "error",
     "time": 1678900000000,
     "msg": "Payment failed",
     "correlationId": "req-123abc456",  <-- COPY THIS
     "err": { ... }
   }
   ```
2. **Filter by ID**: Query all logs/traces with `correlationId="req-123abc456"`.
3. **Analyze Flow**: You will see the sequence:
   - `Incoming request GET /api/pay`
   - `Starting DB transaction`
   - `[Slow Query] ...`
   - `Payment failed`
   - `Request completed 500`

## 3. Dashboards & Alerts

### Grafana Dashboards

Provisioned in `ops/dashboards/`:

- **Node.js Application** (`nodejs-app.json`):
  - **RPS**: Throughput per route.
  - **Latency**: P95/P99 duration.
  - **Error Rate**: % of 5xx responses.
- **PostgreSQL** (`postgresql.json`): Connection pool depth and query duration.

### Alert Response (Runbook)

#### 1. High Error Rate (>1%)

- **Trigger**: `rate(http_requests_total{status=~"5.."}[5m]) > 0.01`
- **Action**:
  1. Check `nodejs-app` dashboard for spiking endpoints.
  2. Filter logs for `level="error"` in the last 15 minutes.
  3. Identify if error is DB-related (connection timeout) or App-related (bug).
  4. If "Out of Memory", checks pod restarts.

#### 2. High Latency (P95 > 500ms)

- **Trigger**: `histogram_quantile(0.95, http_request_duration_seconds_bucket)`
- **Action**:
  1. Check `[Slow Query]` warnings in logs.
  2. If DB is healthy, check for CPU throttling.

#### 3. Container Restarts

- **Trigger**: `kube_pod_container_status_restarts_total > 0`
- **Action**:
  1. Check logs for **"Critical: Exiting process"**.
  2. This indicates an `uncaughtException` or `unhandledRejection`.
  3. Fix the crashing bug or revert recent deployment.
