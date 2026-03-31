# Local Observability Stack

This folder contains a pre-configured observability stack using Open-Source (OSS) tools.

## Included Services

- **Prometheus** (Metrics Storage & Alerting)
- **Grafana** (Visualization)
- **Loki** (Log Aggregation)
- **Tempo** (Distributed Tracing)
- **Alertmanager** (Alert Routing)
- **Promtail** (Log Agent)

## Quick Start

1. **Ensure Docker is running.**
2. **Start the stack:**

   ```bash
   cd ops/observability
   docker-compose up -d
   ```

3. **Verify services are up:**
   - Grafana: [http://localhost:3000](http://localhost:3000) (User: `admin`, Pass: `admin`)
   - Prometheus: [http://localhost:9090](http://localhost:9090)
   - Alertmanager: [http://localhost:9093](http://localhost:9093)

## Verification Checklist

### 1. Metrics (Prometheus)

- Check **Status -> Targets**. The `api-server` should be `UP`.
- Try querying `http_requests_total`.

### 2. Logs (Loki)

- In Grafana, go to **Explore** and select the **Loki** datasource.
- Run a query: `{app="api"}`.

### 3. Tracing (Tempo)

- In Grafana, select the **Tempo** datasource.
- Search for traces or click on a Trace ID from a Loki log line (correlation integrated).

### 4. Alerting

- Alerts are defined in `prometheus/alert_rules.yml`.
- You can trigger a `High_5xx_Rate` alert by hitting an endpoint that throws 500s repeatedly.
