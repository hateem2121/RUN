# Service Level Objectives (SLOs)

**Status**: Active  
**Last Updated**: January 2026  
**Review Cadence**: Quarterly

---

## Overview

This document defines Service Level Objectives (SLOs) for the RUN-Remix platform. SLOs are internal targets used to measure and improve service reliability.

---

## API Endpoint SLOs

### Critical Endpoints

| Endpoint | Metric | Target | Error Budget | Measurement |
|----------|--------|--------|--------------|-------------|
| `GET /api/health` | Availability | 99.9% | 43.8 min/month | Uptime Robot |
| `GET /api/products` | P99 Latency | < 200ms | 0.5% | OpenTelemetry |
| `GET /api/products/:id` | P99 Latency | < 100ms | 0.5% | OpenTelemetry |
| `GET /api/categories` | P99 Latency | < 150ms | 0.5% | OpenTelemetry |
| `POST /api/contact` | Success Rate | 99.5% | 0.5% | Sentry |

### Media Endpoints

| Endpoint | Metric | Target | Error Budget | Measurement |
|----------|--------|--------|--------------|-------------|
| `POST /api/media/upload` | Success Rate | 99.5% | 0.5% | Prometheus |
| `POST /api/media/upload` | P95 Response | < 5s (< 10MB) | 1% | OpenTelemetry |
| `GET /api/media/:id` | P99 Latency | < 50ms | 0.5% | CDN Logs |

### Authentication Endpoints

| Endpoint | Metric | Target | Error Budget | Measurement |
|----------|--------|--------|--------------|-------------|
| `GET /auth/google/callback` | Success Rate | 99.9% | 0.1% | Sentry |
| `POST /auth/logout` | P99 Latency | < 100ms | 0.5% | OpenTelemetry |

---

## SSR Performance SLOs

| Page Type | Metric | Target | Measurement |
|-----------|--------|--------|-------------|
| Homepage | TTFB | < 100ms | Lighthouse CI |
| Product Detail | TTFB | < 150ms | Lighthouse CI |
| Category Page | TTFB | < 150ms | Lighthouse CI |
| Admin Dashboard | TTFB | < 200ms | Lighthouse CI |

---

## Infrastructure SLOs

| Service | Metric | Target | Error Budget |
|---------|--------|--------|--------------|
| Cloud Run | Availability | 99.9% | 43.8 min/month |
| Neon PostgreSQL | Availability | 99.95% | 21.9 min/month |
| Upstash Redis | Availability | 99.9% | 43.8 min/month |
| Cloud CDN | Availability | 99.9% | 43.8 min/month |

---

## Error Rate SLOs

| Category | Metric | Target |
|----------|--------|--------|
| 5xx Errors | Rate | < 0.1% of requests |
| 4xx Errors | Rate | < 5% of requests |
| Unhandled Exceptions | Count | < 10/day |
| Database Errors | Rate | < 0.01% of queries |

---

## Performance Budget

| Metric | Budget | Current |
|--------|--------|---------|
| **JavaScript Bundle** | < 150KB gzipped | ~140KB |
| **CSS Bundle** | < 50KB gzipped | ~35KB |
| **Lighthouse Performance** | ≥ 90 | 92 |
| **Core Web Vitals - LCP** | < 2.5s | ~1.8s |
| **Core Web Vitals - FID** | < 100ms | ~50ms |
| **Core Web Vitals - CLS** | < 0.1 | < 0.1 |

---

## Alerting Thresholds

Based on SLOs, alerts are configured at:

| Alert | Trigger | Severity |
|-------|---------|----------|
| API Latency | P99 > 500ms for 5 min | Warning |
| API Latency | P99 > 1000ms for 5 min | Critical |
| Error Rate | 5xx > 1% for 5 min | Warning |
| Error Rate | 5xx > 5% for 2 min | Critical |
| Availability | Down > 1 min | Critical |
| Database | Query time > 5s | Warning |

---

## Error Budget Policy

### Budget Calculation

```
Error Budget = 100% - SLO Target
Monthly Budget = Error Budget × 30 days × 24 hours × 60 minutes
```

Example: 99.9% availability = 0.1% error budget = 43.8 minutes/month

### Budget Exhaustion Actions

| Budget Remaining | Action |
|------------------|--------|
| > 50% | Normal development velocity |
| 25-50% | Prioritize reliability work |
| < 25% | Feature freeze, focus on stability |
| Exhausted | Incident review, root cause analysis |

---

## Measurement & Reporting

### Tools

- **OpenTelemetry**: Distributed tracing and metrics
- **Prometheus**: Metrics collection
- **Grafana**: Dashboards and visualization
- **Sentry**: Error tracking and alerting
- **Lighthouse CI**: Performance monitoring

### Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|----------|
| SLO Dashboard | Real-time | Engineering |
| Weekly Summary | Weekly | Engineering Lead |
| Monthly Review | Monthly | Leadership |
| Quarterly Review | Quarterly | All Stakeholders |

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-13 | 1.0 | Initial SLO documentation |
