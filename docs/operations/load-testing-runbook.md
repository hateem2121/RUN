# Load Testing Runbook

**Purpose:** Comprehensive guide for load testing the RUN Apparel platform  
**Last Updated:** January 2026  
**Tool:** k6 (Grafana Labs)

---

## Quick Start

```bash
# Install k6
brew install k6

# Run baseline test
k6 run --env BASE_URL=http://localhost:5001 ops/load-testing/baseline.js

# Run with cloud output (Grafana Cloud)
k6 cloud ops/load-testing/baseline.js
```

---

## Test Scenarios

### 1. Baseline Test (Daily)
- **File:** `ops/load-testing/baseline.js`
- **Duration:** 5 minutes
- **VUs:** 10-50 ramping
- **Purpose:** Establish performance baseline

### 2. Peak Load Test (Weekly)
- **File:** `ops/load-testing/peak.js`
- **Duration:** 15 minutes
- **VUs:** 100-500 ramping
- **Purpose:** Verify peak traffic handling

### 3. Soak Test (Monthly)
- **File:** `ops/load-testing/soak.js`
- **Duration:** 1 hour
- **VUs:** 50 constant
- **Purpose:** Detect memory leaks, connection pool exhaustion

### 4. Spike Test (Quarterly)
- **File:** `ops/load-testing/spike.js`
- **Duration:** 10 minutes
- **VUs:** 50 → 500 → 50 (sudden spike)
- **Purpose:** Verify auto-scaling behavior

---

## SLO Thresholds

| Metric | Target | Critical |
|--------|--------|----------|
| **p95 Response Time** | < 200ms | < 500ms |
| **p99 Response Time** | < 500ms | < 1000ms |
| **Error Rate** | < 0.1% | < 1% |
| **Throughput** | > 500 RPS | > 200 RPS |
| **Availability** | 99.9% | 99% |

---

## k6 Configuration

```javascript
// SLO thresholds for baseline.js
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.001'],
    http_reqs: ['rate>100'],
  },
  scenarios: {
    baseline: {
      executor: 'ramping-vus',
      stages: [
        { duration: '30s', target: 10 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 0 },
      ],
    },
  },
};
```

---

## Endpoints to Test

| Priority | Endpoint | Method | Expected p95 |
|----------|----------|--------|--------------|
| P0 | `/api/health` | GET | < 10ms |
| P0 | `/api/products` | GET | < 100ms |
| P0 | `/api/categories` | GET | < 50ms |
| P1 | `/api/products/:id` | GET | < 150ms |
| P1 | `/api/media/:id` | GET | < 200ms |
| P2 | `/api/products` (filter) | GET | < 300ms |

---

## Pre-Test Checklist

- [ ] Notify on-call team
- [ ] Verify staging environment is isolated
- [ ] Check database connection pool settings
- [ ] Confirm auto-scaling is enabled
- [ ] Set up monitoring dashboards
- [ ] Prepare rollback plan if testing production

---

## Post-Test Analysis

1. **Export Results:** `k6 run --out json=results.json`
2. **Review Metrics:** Check Grafana Cloud or local export
3. **Identify Bottlenecks:** Slow queries, memory, CPU
4. **Document Findings:** Update this runbook
5. **Create Issues:** For any regressions found

---

## Environment-Specific Settings

| Environment | BASE_URL | Max VUs | Duration |
|-------------|----------|---------|----------|
| Local | `http://localhost:5001` | 50 | 5min |
| Staging | `https://staging.runapparel.com` | 200 | 15min |
| Production | `https://runapparel.com` | 100 | 5min (off-peak only) |

---

## Alerts & Escalation

If load test reveals critical issues:

1. **< 500ms p99:** Document and prioritize optimization
2. **> 1s p99:** Create HIGH priority ticket
3. **> 5% error rate:** Escalate to engineering lead
4. **Service unavailable:** Trigger incident response
