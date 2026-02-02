# Load Testing Baseline

**Last Updated**: January 2026  
**Test Environment**: Staging (Cloud Run, 2 instances)  
**Tool**: k6

---

## Performance Thresholds (SLO-Aligned)

| Metric | Threshold | Target | Status |
|--------|-----------|--------|--------|
| **P95 Latency** | < 200ms | API responses | ✅ Defined |
| **P99 Latency** | < 500ms | Includes SSR | ✅ Defined |
| **Error Rate** | < 1% | All endpoints | ✅ Defined |
| **Homepage P95** | < 300ms | With SSR | ✅ Defined |
| **API P95** | < 150ms | JSON responses | ✅ Defined |

---

## Running Baseline Tests

### Prerequisites

```bash
# Install k6 (macOS)
brew install k6

# Or Ubuntu
sudo apt install k6
```

### Execute Tests

```bash
# Against staging
k6 run --env BASE_URL=https://staging.runapparel.com ops/load-testing/baseline.js

# Against local development
k6 run --env BASE_URL=http://localhost:5002 ops/load-testing/baseline.js

# With JSON output for CI
k6 run --out json=results.json --env BASE_URL=http://localhost:5002 ops/load-testing/baseline.js
```

---

## Test Configuration

The baseline test simulates realistic user load:

| Stage | Duration | Virtual Users |
|-------|----------|---------------|
| Ramp-up | 2 min | 0 → 50 |
| Steady State | 5 min | 50 |
| Ramp-up | 2 min | 50 → 100 |
| Steady State | 5 min | 100 |
| Ramp-down | 2 min | 100 → 0 |

**Total Duration**: ~16 minutes

---

## Test Scenarios

| Scenario | Endpoint | Success Criteria |
|----------|----------|-----------------|
| Homepage Load | `GET /` | Status 200, Body > 1KB, < 500ms |
| Health Check | `GET /api/health` | Status 200, < 50ms |
| Product Catalog | `GET /api/products` | Status 200, Valid JSON, < 200ms |
| Categories | `GET /api/categories` | Status 200, < 150ms |
| Static Assets | `GET /favicon.ico` | Status 200/304, < 100ms |

---

## Regression Definition

A **performance regression** is triggered when:

- P95 latency increases > 20% from baseline
- Error rate increases > 0.5%
- Any threshold fails

---

## CI Integration

Add to GitHub Actions workflow:

```yaml
- name: Run Load Test
  run: |
    k6 run --env BASE_URL=${{ env.STAGING_URL }} ops/load-testing/baseline.js
```

Or add as Cloud Build step:

```yaml
- name: 'grafana/k6'
  args: ['run', '--env', 'BASE_URL=https://staging.runapparel.com', 'ops/load-testing/baseline.js']
```

---

## Related Documentation

- [k6 Scripts](../../ops/load-testing/README.md)
- [SLO Definitions](./slo-definitions.md)
- [Incident Response](../runbooks/incident-response.md)

---

## Schedule

| Activity | Frequency |
|----------|-----------|
| Baseline Test | Monthly |
| Stress Test | Quarterly |
| Post-Release Test | Each major release |
