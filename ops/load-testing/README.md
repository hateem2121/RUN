# Load Testing Guide

## Overview

This directory contains k6 load testing scripts for validating the RUN Apparel platform's performance characteristics.

## Prerequisites

```bash
# Install k6
brew install k6  # macOS
# or
sudo apt install k6  # Ubuntu
```

## Test Scripts

| Script | Purpose | Duration |
|--------|---------|----------|
| `baseline.js` | Normal load validation | ~16 minutes |
| `stress.js` | Breaking point identification | ~20 minutes |

## Running Tests

### Baseline Test (Recommended for CI)

```bash
# Against staging
k6 run --env BASE_URL=https://staging.runapparel.com ops/load-testing/baseline.js

# Against local
k6 run --env BASE_URL=http://localhost:5001 ops/load-testing/baseline.js
```

### Stress Test (Manual execution)

```bash
k6 run --env BASE_URL=https://staging.runapparel.com ops/load-testing/stress.js
```

### Cloud Execution (k6 Cloud)

```bash
k6 cloud ops/load-testing/baseline.js
```

## Thresholds (SLO-Aligned)

| Metric | Baseline Target | Stress Target |
|--------|-----------------|---------------|
| P95 Latency | < 200ms | < 500ms |
| P99 Latency | < 500ms | < 1000ms |
| Error Rate | < 1% | < 5% |

## Interpreting Results

### Healthy System
- ✅ All thresholds pass
- ✅ Error rate near 0%
- ✅ Latency stable under load

### Degraded System
- ⚠️ P99 above threshold
- ⚠️ Error rate 1-5%
- ⚠️ Latency increase under load

### Unhealthy System
- ❌ Thresholds failing
- ❌ Error rate > 5%
- ❌ Latency growing unbounded

## Integration with CI

Add to GitHub Actions:

```yaml
- name: Run Load Test
  run: |
    k6 run --env BASE_URL=${{ env.STAGING_URL }} ops/load-testing/baseline.js
```
