# System-Wide Audit: Phase 5 - Observability

## OBS-01: Suppressed error logs
- **Severity**: P2 (Minor/Major depending on context)
- **File Path**: Multiple (e.g., `client/app/components/admin/categories/category-management-simplified.tsx`, `client/app/lib/queryClient.ts:712`, `client/app/lib/sentry.ts:110`)
- **Grep Evidence**: `} catch (_error) {}`
- **Description**: Widespread usage of empty catch blocks that silently swallow exceptions. This hides underlying failures and makes debugging difficult, especially on critical client integrations and library boundaries.

## OBS-02: OTel spans
- **Severity**: P2 (Minor)
- **File Path**: `server/services/*.ts` (e.g., `ProductService`, `CategoryService`)
- **Grep Evidence**: Missing `import { trace } from "@opentelemetry/api";` and `tracer.startActiveSpan(...)`
- **Description**: Business logic methods inside `server/services/` are completely missing OpenTelemetry span instrumentation. While the cache and job queues use it, core domain services lack tracing, resulting in blind spots during request tracing and performance bottleneck identification.

## OBS-03: Pino vs console.log
- **Severity**: P3 (Cosmetic)
- **File Path**: `server/drizzle.config.ts`, `server/lib/api/openapi-generator.ts`, `server/scripts/migrate.ts`
- **Grep Evidence**: `console.warn("[Drizzle] ⚠️ DATABASE_URL is not set.");`
- **Description**: Minimal and non-production-critical files were found using `console.*` instead of the structured Pino logger. While absent in main business logic (which is good), standardizing across utility and config scripts is recommended.

## OBS-04: Prometheus metrics
- **Severity**: P1 (Major)
- **File Path**: `server/routes/resources/*.routes.ts`
- **Grep Evidence**: Lack of `prom-client` metrics recording (e.g., `httpRequestDuration.observe()`) in the resource routes.
- **Description**: While `prom-client` is set up and exported at `/api/metrics`, custom business metric instrumentation (like specific endpoint latencies or business-specific counter aggregations) is missing from the critical API routes handling the primary application domains.
