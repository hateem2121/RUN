# Observability Runbook

> **Stack:** OpenTelemetry, Jaeger, Prometheus, Grafana, Loki

## Local Setup

1. **Start Stack:**

   ```bash
   docker-compose -f docker-compose.observability.yml up -d
   ```

2. **Access Dashboards:**
   - **Grafana:** <http://localhost:3000> (admin/admin)
   - **Jaeger UI:** <http://localhost:16686>
   - **Prometheus:** <http://localhost:9090>

3. **Verify Traces:**
   - Make a request: `curl http://localhost:5002/api/health`
   - Check Jaeger for trace ending in `/api/health`

## Production

- **Tracing:** Sent to Google Cloud Trace via OTel Collector.
- **Logging:** JSON logs to Cloud Logging.
- **Errors:** Sentry.
