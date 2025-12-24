# Incident Response Process

## 1. Detection

- Alerts from Alertmanager (Discord/Slack/Email).
- Customer reports.
- Observation of anomaly in Grafana dashboards.

## 2. Triaging

- **Severity 1**: Site is down / Core flow (checkout, product view) is broken.
- **Severity 2**: Degraded performance / Minor feature broken.
- **Severity 3**: Non-user-facing issue (e.g., background job delay).

## 3. Communication

- Post to `#incidents` channel.
- Update Status Page (if available).

## 4. Mitigation

- Refer to specific runbooks in `docs/runbooks/`.
- Goal: Restore service ASAP, even if via suboptimal means (e.g., disabling a feature).

## 5. Resolution & Postmortem

- Confirm fix with metrics.
- Create a postmortem using the template in `docs/POSTMORTEM_TEMPLATE.md`.
