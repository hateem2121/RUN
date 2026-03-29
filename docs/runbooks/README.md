# Production Runbooks

This directory contains operational runbooks for common incidents. Each runbook follows a standard format.

## Runbook Index

| Runbook | When to Use |
|---------|-------------|
| [Database Outage](./database-outage.md) | Neon connection failures, 503 errors from DB |
| [Rate Limit Surge](./rate-limit-surge.md) | Spike in 429 responses, suspected abuse |
| [Circuit Breaker Trip](./circuit-breaker-trip.md) | Service degradation, OPEN circuit state |
| [Sentry Alert Triage](./sentry-alert-triage.md) | New error spike in Sentry dashboard |
| [Deployment Rollback](./deployment-rollback.md) | Critical bug after deployment |

## Runbook Template

Each runbook follows this structure:

1. **Symptoms** - How to recognize the incident
2. **Impact** - Who/what is affected
3. **Diagnosis** - Commands to run, logs to check
4. **Resolution** - Step-by-step fix
5. **Prevention** - Long-term improvements

## Quick Reference

### Health Check Endpoints
```bash
# Quick health (public)
curl https://your-domain.com/health

# Detailed health (requires secret)
curl -H "X-Health-Check-Key: YOUR_SECRET" https://your-domain.com/health/detailed
```

### Key Environment Variables
- `HEALTH_CHECK_SECRET` - Auth for detailed health endpoint
- `METRICS_SECRET` - Auth for Prometheus metrics
- `SENTRY_DSN` - Sentry error tracking
- `ENABLE_OTEL` - OpenTelemetry tracing
