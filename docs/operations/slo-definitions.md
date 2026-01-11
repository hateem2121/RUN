# Service Level Objectives (SLOs) - RUN Apparel Platform

**Status**: Active  
**Version**: 1.0  
**Last Updated**: January 2026

---

## Overview

This document defines the Service Level Objectives (SLOs) for the RUN Apparel B2B Platform. These objectives represent our commitment to reliability and performance for our B2B customers.

---

## SLO Definitions

### 1. Availability SLO

| Metric | Target | Error Budget |
|--------|--------|--------------|
| **Service Availability** | 99.9% | 43.2 min/month |

**Definition**: Percentage of successful HTTP requests (status < 500) over total requests.

**Measurement**:
```
Availability = (Total Requests - 5xx Errors) / Total Requests × 100
```

**Exclusions**:
- Scheduled maintenance windows (announced 48h in advance)
- Requests to `/api/health` endpoints (infrastructure-only)

---

### 2. Latency SLO

| Percentile | Target | Measurement Window |
|------------|--------|-------------------|
| **P50** | < 100ms | Rolling 5-minute |
| **P95** | < 200ms | Rolling 5-minute |
| **P99** | < 500ms | Rolling 5-minute |

**Definition**: Time from request received to response sent, measured at the load balancer.

**Scope**: All API endpoints except:
- Media upload endpoints (`/api/media/upload/*`)
- Batch processing endpoints (`/api/batch/*`)
- Debug/development endpoints

---

### 3. Error Rate SLO

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Error Rate** | < 0.1% | Rolling 1-hour window |

**Definition**: Percentage of requests resulting in 5xx errors.

**Calculation**:
```
Error Rate = (5xx Responses / Total Responses) × 100
```

---

### 4. Throughput SLO

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Requests per Second** | > 100 RPS sustained | During business hours |

**Definition**: System must handle baseline load without degradation.

---

## Service Level Indicators (SLIs)

### Primary SLIs

| SLI | Data Source | Query/Metric |
|-----|-------------|--------------|
| Availability | Cloud Run | `cloud.googleapis.com/run/request_count` |
| Latency P95 | Cloud Trace | `cloud.googleapis.com/run/request_latencies` |
| Error Rate | Cloud Logging | Status code aggregation |
| Cache Hit Rate | Custom Metric | `unified_cache_hit_rate` |

### Secondary SLIs

| SLI | Target | Purpose |
|-----|--------|---------|
| Database Connection Time | < 50ms | Backend health |
| Redis Latency | < 10ms | Cache performance |
| SSR Render Time | < 100ms | Frontend performance |

---

## Alerting Thresholds

### Burn Rate Alerts

| Alert | Condition | Urgency |
|-------|-----------|---------|
| **Page** | 14.4x burn rate over 1 hour | Immediate |
| **Ticket** | 6x burn rate over 6 hours | Next business day |
| **Warning** | 3x burn rate over 1 day | Investigation needed |

### Calculation

```
Burn Rate = Actual Error Rate / Allowed Error Rate

Where:
- Allowed Error Rate = (1 - SLO Target) / Time Window
```

---

## Error Budget Policy

### Budget Consumption Thresholds

| Budget Remaining | Action |
|------------------|--------|
| > 50% | Normal operations |
| 25-50% | Increased monitoring, no risky deploys |
| 10-25% | Feature freeze, focus on reliability |
| < 10% | All hands on reliability, rollback recent changes |

### Budget Reset

Error budgets reset on the **1st of each calendar month**.

---

## Monitoring & Dashboards

### Required Dashboards

1. **SLO Overview Dashboard**
   - Current availability vs target
   - Error budget remaining
   - Burn rate charts

2. **Latency Dashboard**
   - P50/P95/P99 latency trends
   - Endpoint breakdown
   - Slow request analysis

3. **Error Dashboard**
   - Error rate over time
   - Error type breakdown
   - Top error sources

### Alert Channels

| Severity | Channel | Response Time |
|----------|---------|---------------|
| Critical | PagerDuty | < 15 minutes |
| High | Slack #alerts | < 1 hour |
| Medium | Email | < 4 hours |
| Low | Dashboard only | Next review |

---

## Review Cadence

| Review | Frequency | Participants |
|--------|-----------|--------------|
| SLO Status | Weekly | Engineering leads |
| Error Budget | Monthly | Product + Engineering |
| SLO Targets | Quarterly | All stakeholders |

---

## Appendix: Cloud Monitoring Queries

### Availability Query
```sql
SELECT
  ROUND(
    (SUM(IF(response_code < 500, 1, 0)) / COUNT(*)) * 100,
    2
  ) AS availability_percent
FROM cloud_run_requests
WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
```

### P95 Latency Query
```sql
SELECT
  APPROX_QUANTILES(latency_ms, 100)[OFFSET(95)] AS p95_latency
FROM cloud_run_requests
WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE)
```

---

*This document is part of the RUN Apparel Platform reliability engineering initiative.*
