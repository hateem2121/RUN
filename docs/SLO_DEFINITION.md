# Service Level Objectives (SLOs)

**Service:** RUN-Remix API

## 1. Availability

**Goal:** The service should be reachable and respond with non-5xx errors.

| Metric     | SLO Target  | Window  | Measurement                            |
| :--------- | :---------- | :------ | :------------------------------------- |
| **Uptime** | **99.9%**   | 30 Days | `(Total Reqs - 5xx Reqs) / Total Reqs` |
| **Budget** | 43m / month |         | Allowed downtime per month.            |

## 2. Latency

**Goal:** The service should respond quickly to maintain user flow.

| Metric                | SLO Target  | Window | Measurement                               |
| :-------------------- | :---------- | :----- | :---------------------------------------- |
| **API Latency (p95)** | **< 500ms** | 7 Days | 95% of requests complete in under 500ms.  |
| **Static Assets**     | **< 100ms** | 7 Days | Cached assets should allow instant paint. |

## 3. Correctness

**Goal:** The service should behave as expected.

| Metric                | SLO Target | Window  | Measurement                              |
| :-------------------- | :--------- | :------ | :--------------------------------------- |
| **Critical Flows**    | **99.99%** | 30 Days | Auth/Checkout must virtually never fail. |
| **Validation Errors** | N/A        |         | 400s are expected behavior (user error). |

## Alerting Policy

- **Burn Rate (Fast):** Alert if we consume 2% of Error Budget in 1 hour (P0).
- **Burn Rate (Slow):** Alert if we consume 5% of Error Budget in 6 hours (P1).
