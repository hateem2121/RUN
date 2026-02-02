# Service Level Objectives (SLOs)

**Status**: Active  
**Version**: 2.0  
**Last Updated**: February 2026  
**Review Cadence**: Quarterly

---

## Overview

This document defines Service Level Objectives (SLOs) for the RUN Apparel B2B Platform. SLOs are internal targets used to measure and improve service reliability for our B2B customers.

---

## Core SLO Definitions

### 1. Availability SLO

| Metric | Target | Error Budget |
|--------|--------|--------------|
| **Service Availability** | 99.9% | 43.8 min/month |

**Definition**: Percentage of successful HTTP requests (status < 500) over total requests.

```
Availability = (Total Requests - 5xx Errors) / Total Requests × 100
```

**Exclusions**:
- Scheduled maintenance windows (announced 48h in advance)
- Requests to `/api/health` endpoints

### 2. Latency SLO

| Percentile | Target | Measurement Window |
|------------|--------|-------------------|
| **P50** | < 100ms | Rolling 5-minute |
| **P95** | < 200ms | Rolling 5-minute |
| **P99** | < 500ms | Rolling 5-minute |

**Scope**: All API endpoints except media uploads and batch processing.

### 3. Error Rate SLO

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Error Rate** | < 0.1% | Rolling 1-hour |

---

## API Endpoint SLOs

### Critical Endpoints

| Endpoint | Metric | Target | Measurement |
|----------|--------|--------|-------------|
| `GET /api/health` | Availability | 99.9% | Uptime Robot |
| `GET /api/products` | P99 Latency | < 200ms | OpenTelemetry |
| `GET /api/products/:id` | P99 Latency | < 100ms | OpenTelemetry |
| `GET /api/categories` | P99 Latency | < 150ms | OpenTelemetry |
| `POST /api/contact` | Success Rate | 99.5% | Sentry |

### Media & Auth Endpoints

| Endpoint | Metric | Target |
|----------|--------|--------|
| `POST /api/media/upload` | Success Rate | 99.5% |
| `POST /api/media/upload` | P95 Response | < 5s (< 10MB) |
| `GET /auth/google/callback` | Success Rate | 99.9% |

---

## SSR Performance SLOs

| Page Type | TTFB Target | Measurement |
|-----------|-------------|-------------|
| Homepage | < 100ms | Lighthouse CI |
| Product Detail | < 150ms | Lighthouse CI |
| Category Page | < 150ms | Lighthouse CI |
| Admin Dashboard | < 200ms | Lighthouse CI |

---

## Infrastructure SLOs

| Service | Availability Target | Error Budget |
|---------|---------------------|--------------|
| Cloud Run | 99.9% | 43.8 min/month |
| Neon PostgreSQL | 99.95% | 21.9 min/month |
| Upstash Redis | 99.9% | 43.8 min/month |
| Cloud CDN | 99.9% | 43.8 min/month |

---

## Performance Budget

| Metric | Budget | Current |
|--------|--------|---------|
| JavaScript Bundle | < 150KB gzipped | ~140KB |
| CSS Bundle | < 50KB gzipped | ~35KB |
| Lighthouse Performance | ≥ 90 | 92 |
| Core Web Vitals - LCP | < 2.5s | ~1.8s |
| Core Web Vitals - FID | < 100ms | ~50ms |
| Core Web Vitals - CLS | < 0.1 | < 0.1 |

---

## Service Level Indicators (SLIs)

| SLI | Data Source | Query/Metric |
|-----|-------------|--------------|
| Availability | Cloud Run | `cloud.googleapis.com/run/request_count` |
| Latency P95 | Cloud Trace | `cloud.googleapis.com/run/request_latencies` |
| Error Rate | Cloud Logging | Status code aggregation |
| Cache Hit Rate | Custom | `unified_cache_hit_rate` |

---

## Alerting Thresholds

### Standard Alerts

| Alert | Trigger | Severity |
|-------|---------|----------|
| API Latency | P99 > 500ms for 5 min | Warning |
| API Latency | P99 > 1000ms for 5 min | Critical |
| Error Rate | 5xx > 1% for 5 min | Warning |
| Error Rate | 5xx > 5% for 2 min | Critical |
| Availability | Down > 1 min | Critical |

### Burn Rate Alerts

| Alert | Condition | Urgency |
|-------|-----------|---------|
| Page | 14.4x burn rate over 1 hour | Immediate |
| Ticket | 6x burn rate over 6 hours | Next business day |
| Warning | 3x burn rate over 1 day | Investigation |

### Response Channels

| Severity | Channel | Response Time |
|----------|---------|---------------|
| Critical | PagerDuty | < 15 minutes |
| High | Slack #alerts | < 1 hour |
| Medium | Email | < 4 hours |

---

## Error Budget Policy

### Calculation

```
Error Budget = 100% - SLO Target
Monthly Budget = Error Budget × 30 × 24 × 60 minutes
```

Example: 99.9% availability = 0.1% error budget = 43.8 minutes/month

### Budget Actions

| Budget Remaining | Action |
|------------------|--------|
| > 50% | Normal operations |
| 25-50% | Increased monitoring, no risky deploys |
| 10-25% | Feature freeze, focus on reliability |
| < 10% | All hands on reliability, rollback recent changes |

**Budget Reset**: 1st of each calendar month.

---

## Monitoring & Reporting

### Tools

- **OpenTelemetry**: Distributed tracing
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards
- **Sentry**: Error tracking
- **Lighthouse CI**: Performance

### Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|----------|
| SLO Dashboard | Real-time | Engineering |
| Weekly Summary | Weekly | Engineering Lead |
| Monthly Review | Monthly | Leadership |

---

## Appendix: Monitoring Queries

### Availability Query
```sql
SELECT ROUND(
  (SUM(IF(response_code < 500, 1, 0)) / COUNT(*)) * 100, 2
) AS availability_percent
FROM cloud_run_requests
WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
```

### P95 Latency Query
```sql
SELECT APPROX_QUANTILES(latency_ms, 100)[OFFSET(95)] AS p95_latency
FROM cloud_run_requests
WHERE timestamp > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 5 MINUTE)
```

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-02 | 2.0 | Consolidated from slo-definitions.md |
| 2026-01-13 | 1.0 | Initial SLO documentation |
