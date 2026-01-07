# Service Level Objectives (SLOs)

**Service:** RUN-Remix API

## 1. Availability

**Goal:** The service should be reachable and respond with non-5xx errors.

| Metric     | SLO Target  | Window  | Measurement                            |
| :--------- | :---------- | :------ | :------------------------------------- |
| **Uptime** | **99.9%**   | 30 Days | `(Total Reqs - 5xx Reqs) / Total Reqs` |
| **Budget** | 43m / month |         | Allowed downtime per month.            |

### Alerting Thresholds

| Alert Level       | Condition                  | Window   | Action                                                                   |
| :---------------- | :------------------------- | :------- | :----------------------------------------------------------------------- |
| **P0 (Critical)** | >2% error budget consumed  | 1 hour   | Page on-call, check [Runbook: High Error Rate](#runbook-high-error-rate) |
| **P1 (Warning)**  | >5% error budget consumed  | 6 hours  | Notify team, investigate within 4h                                       |
| **P2 (Info)**     | >10% error budget consumed | 24 hours | Schedule investigation                                                   |

## 2. Latency

**Goal:** The service should respond quickly to maintain user flow.

| Metric                | SLO Target  | Window | Measurement                               |
| :-------------------- | :---------- | :----- | :---------------------------------------- |
| **API Latency (p95)** | **< 500ms** | 7 Days | 95% of requests complete in under 500ms.  |
| **SSR Latency (p95)** | **< 800ms** | 7 Days | 95% of SSR pages render under 800ms.      |
| **Static Assets**     | **< 100ms** | 7 Days | Cached assets should allow instant paint. |

### Alerting Thresholds

| Alert Level       | Condition    | Window | Action                                                             |
| :---------------- | :----------- | :----- | :----------------------------------------------------------------- |
| **P0 (Critical)** | p95 > 2000ms | 5 min  | Page on-call, check [Runbook: High Latency](#runbook-high-latency) |
| **P1 (Warning)**  | p95 > 800ms  | 15 min | Notify team, check database performance                            |
| **P2 (Info)**     | p95 > 500ms  | 1 hour | Monitor trend                                                      |

## 3. Correctness

**Goal:** The service should behave as expected.

| Metric                | SLO Target | Window  | Measurement                              |
| :-------------------- | :--------- | :------ | :--------------------------------------- |
| **Critical Flows**    | **99.99%** | 30 Days | Auth/Checkout must virtually never fail. |
| **Validation Errors** | N/A        |         | 400s are expected behavior (user error). |

---

## Runbook: High Error Rate

1. **Check Infrastructure**
   - Cloud Run console: instance health, scaling status
   - Check circuit breaker states: `/api/health/circuits`

2. **Check Dependencies**
   - Neon database: connection pool, query latency
   - Upstash Redis: connection status
   - Object Storage: availability

3. **Recent Deployments**
   - Check last deployment time in Cloud Build history
   - Consider rollback if error rate correlates with deploy

4. **Escalation**
   - If unresolved in 15min, escalate to engineering lead

---

## Runbook: High Latency

1. **Check Database**
   - Neon console: query performance, cold starts
   - Check `db:concurrent-queries` metric

2. **Check Cache**
   - Cache hit rate: should be >80%
   - L2 (Redis) connection health

3. **Check External Services**
   - Object Storage read latency
   - Any external API calls

4. **Escalation**
   - If p95 > 2s for 10min, escalate immediately

---

## Implementation

SLO alerting is implemented in:

- [`server/lib/monitoring/slo-alerts.ts`](file:///Users/hateemjamshaid/Downloads/RUN-Remix/server/lib/monitoring/slo-alerts.ts) - Sentry integration
- [`server/lib/monitoring/http-metrics.ts`](file:///Users/hateemjamshaid/Downloads/RUN-Remix/server/lib/monitoring/http-metrics.ts) - Request tracking

Synthetic monitoring:

- [`.github/workflows/synthetic-monitoring.yml`](file:///Users/hateemjamshaid/Downloads/RUN-Remix/.github/workflows/synthetic-monitoring.yml)
