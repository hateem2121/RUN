# RUN Apparel B2B - Server Application (v4.0.3)

This directory contains the backend REST API for the RUN Apparel B2B Platform.

## 🛠️ Backend Tech Stack
- **Runtime**: Node.js v24.15+
- **Framework**: Express 5.1.0 (Async-native handlers, NO `try/catch` in routes)
- **Database**: Neon Serverless Postgres (HTTP Driver)
- **ORM / Validation**: Drizzle ORM 0.45.1 & Zod v4 (from `@run-remix/shared`)
- **Background Jobs**: Google Cloud Tasks (HTTP Workers via `server/routes/worker.ts` + `verifyCloudTaskToken`)
- **External API Resilience**: `opossum` Circuit Breaker
- **Session / Cache**: `ioredis` 5.10.1 (NO `connect-redis` or `@upstash/redis`)
- **Observability**: OTel + Pino structured logging (NO Sentry)

## ⚠️ Important Note
Please refer to the [Root README](../README.md) for full project documentation and installation instructions. All operational scripts (e.g. `npm run dev`) must be run from the root monorepo directory.
