# ADR 0018: Google Cloud Tasks and HTTP Workers over PG-Boss

**Status:** Accepted  
**Date:** 2026-08-25  
**Deciders:** RUN Remix Systems Architecture Team  

## Context

Background job processing and asynchronous workflows (order notifications, webhook dispatches, PDF spec sheet generation) require reliable queuing:
- **PG-Boss (PostgreSQL-based queue):** Stored queue state in PostgreSQL schema tables (`pgboss.*`), creating database table lock overhead, connection pooling friction with Neon Serverless autoscaling, and requiring continuous polling workers.
- **BullMQ (Redis-based queue):** Requires dedicated Redis cluster or persistent Redis instance, violating the serverless zero-idle-cost architecture.
- **Google Cloud Tasks + Express HTTP Worker:** Fully managed HTTP task queuing natively integrated with Google Cloud Platform, executing authenticated webhook calls to dedicated `/api/tasks/*` HTTP endpoints with automatic backoff retries.

## Decision

We standardize on **Google Cloud Tasks + HTTP Workers** for all asynchronous and background task execution, and cleanly drop all legacy `pgboss.*` schema tables from Neon PostgreSQL.

## Rationale

1. **Serverless Scale-to-Zero Compatibility:** Eliminates background polling threads that prevent Neon Serverless database compute from scaling to zero during idle periods.
2. **Operational Simplicity:** Avoids maintaining dedicated database queue tables or external Redis clusters.
3. **Native GCP Security:** Authenticated via OIDC tokens validated by Express middleware on `/api/tasks/*` endpoints.
4. **Reliable Retry Mechanism:** Cloud Tasks handles exponential backoff, rate limiting, and dead-letter queues out of the box.

## Consequences

### Positive

- Zero polling load on Neon PostgreSQL database.
- Complete database schema cleanliness (legacy `pgboss` schema dropped with `CASCADE`).
- Linear scaling of HTTP worker tasks in Google Cloud Run.

### Negative

- Requires Google Cloud SDK emulation or mock worker interfaces during offline local development.

## Implementation

Task dispatch helper in `server/services/`:

```typescript
import { CloudTasksClient } from "@google-cloud/tasks";

export const taskClient = new CloudTasksClient();

export async function enqueueTask(queueName: string, payload: unknown): Promise<void> {
  const parent = taskClient.queuePath(PROJECT_ID, LOCATION, queueName);
  await taskClient.createTask({
    parent,
    task: {
      httpRequest: {
        httpMethod: "POST",
        url: `${WORKER_BASE_URL}/api/tasks/process`,
        headers: { "Content-Type": "application/json" },
        body: Buffer.from(JSON.stringify(payload)).toString("base64"),
      },
    },
  });
}
```
