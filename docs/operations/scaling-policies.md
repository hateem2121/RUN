# Scaling Policies Documentation

**Last Updated:** January 2026  
**Platform:** Google Cloud Run  
**Status:** Production-Ready

---

## Overview

The RUN Apparel platform uses **Google Cloud Run** with automatic scaling. This document defines scaling policies, triggers, and operational procedures.

---

## Current Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Min Instances | 1 | Always-on for low latency |
| Max Instances | 10 | Cost control, can increase |
| CPU | 1 vCPU | Sufficient for web workloads |
| Memory | 1 GB | Handles SSR + API |
| Concurrency | 80 | Requests per instance |
| Timeout | 300s | For long uploads |

---

## Scaling Triggers

### Automatic (Cloud Run Default)

```yaml
# Cloud Run auto-scales based on:
- CPU utilization > 60%
- Request queue depth > 100
- Memory utilization > 80%
```

### Predictive Scaling

For known traffic patterns, pre-scale before demand:

| Pattern | Schedule | Min Instances |
|---------|----------|---------------|
| Business Hours | Mon-Fri 8AM-6PM UTC | 3 |
| Off-Peak | Mon-Fri 6PM-8AM UTC | 1 |
| Weekend | Sat-Sun | 1 |
| Sale Events | Manual trigger | 10 |

---

## Scaling Procedures

### 1. Before a Sale Event

```bash
# Increase min instances for expected traffic
gcloud run services update run-remix \
  --region us-central1 \
  --min-instances 10 \
  --max-instances 50

# Verify scaling
gcloud run services describe run-remix \
  --region us-central1 \
  --format 'value(spec.template.spec.containerConcurrency)'
```

### 2. Emergency Scale-Up

```bash
# If latency spikes, immediately increase capacity
gcloud run services update run-remix \
  --region us-central1 \
  --max-instances 100

# Monitor
watch -n 5 'gcloud run services describe run-remix --region us-central1 --format json | jq .status.traffic'
```

### 3. Post-Event Scale-Down

```bash
# Return to normal after 24 hours of stable traffic
gcloud run services update run-remix \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 10
```

---

## Multi-Region Configuration

| Region | Purpose | Priority |
|--------|---------|----------|
| us-central1 | Primary (Americas) | P0 |
| europe-west1 | EU traffic | P1 |
| asia-east1 | APAC traffic | P2 |

### Failover

Traffic automatically routes to healthy regions via Global Load Balancer. If a region fails:

1. GLB detects health check failure
2. Traffic rerouted to healthy regions
3. Alert sent to PagerDuty
4. On-call investigates

---

## Database Scaling (Neon)

Neon PostgreSQL is serverless and auto-scales:

| Metric | Limit | Action if Exceeded |
|--------|-------|-------------------|
| Compute | 4 CU | Auto-scale (paid) |
| Storage | 10 GB | Auto-expand |
| Connections | 100 | Use connection pooler (-pooler) |

```bash
# Check current usage
# Via Neon Console: https://console.neon.tech/
```

---

## Cache Scaling (Upstash Redis)

| Plan | Request Limit | Action |
|------|---------------|--------|
| Pay-as-you-go | Unlimited | Cost monitoring |
| Pro | 100K/day | Upgrade if exceeded |

---

## Cost Monitoring

### Budget Alerts

| Threshold | Action |
|-----------|--------|
| 50% budget | Email notification |
| 80% budget | Slack alert |
| 100% budget | PagerDuty + review |

### Cost Optimization

- Use min-instances=0 for dev/staging
- Enable Cloud Run concurrency optimization
- Use Committed Use Discounts for predictable workloads

---

## SLO Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Availability | 99.9% | < 99.5% |
| p95 Latency | < 200ms | > 500ms |
| Error Rate | < 0.1% | > 1% |

---

## Runbook Links

- [Incident Response](../runbooks/incident-response.md)
- [Database Outage](../runbooks/database-outage.md)
- [Rate Limit Surge](../runbooks/rate-limit-surge.md)
