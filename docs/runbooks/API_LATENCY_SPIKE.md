# Runbook: API Latency Spike

## Symptoms

- Alert: `High_P95_Latency` triggered.
- Users report sluggishness or 504 Gateway Timeouts.
- High request duration in Grafana dashboard.

## Verification

1. **Check Grafana**: Look at "API Performance" dashboard to confirm which endpoints are slow.
2. **Check Logs (Loki)**:
   - Query: `{app="api", level="error"}`
   - Look for `DB_QUERY_TIMEOUT` or `CACHE_STAMPEDE`.
3. **Trace (Tempo)**:
   - Find a slow `requestId` and view the trace to see if the delay is in DB, Cache, or external API.

## Immediate Mitigations

1. **Check DB Load**: If DB is hot, consider scaling Neon compute or checking for missing indexes.
2. **Clear Cache**: If a corrupt key or stampede is suspected:
   ```bash
   curl -X POST http://api/admin/cache/clear # If implemented
   ```
3. **Scale Web**: Increase replicas if CPU/Memory pressure is high.

## Longer-term Fixes

- Optimize slow SQL queries identified in Tempo.
- Increase cache TTL for hot static keys.
