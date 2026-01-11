/**
 * Telemetry Configuration - OpenTelemetry with Cloud Trace
 * Phase 2: Observability & SLO Foundation
 *
 * This module integrates OpenTelemetry with Google Cloud Trace
 * for distributed tracing across all services.
 */

import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { SimpleSpanProcessor, BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { TraceExporter } from "@google-cloud/opentelemetry-cloud-trace-exporter";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { logger } from "../lib/monitoring/logger.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Initialize OpenTelemetry with Cloud Trace exporter
 * Must be called before any other imports in the application
 */
export function initTelemetry(): void {
  // Create resource identifying this service
  const resource = new Resource({
    [ATTR_SERVICE_NAME]: "run-remix-api",
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || "1.0.0",
    "environment": process.env.NODE_ENV || "development",
    "cloud.provider": "gcp",
    "cloud.region": process.env.GOOGLE_CLOUD_REGION || "us-central1",
  });

  // Create tracer provider
  const provider = new NodeTracerProvider({ resource });

  // Configure exporter based on environment
  if (isProduction) {
    // Use Cloud Trace exporter in production
    try {
      const exporter = new TraceExporter({
        // Credentials are automatically discovered from environment
        // or service account when running on Cloud Run
      });

      // Use BatchSpanProcessor for production (better performance)
      provider.addSpanProcessor(new BatchSpanProcessor(exporter, {
        maxQueueSize: 1000,
        maxExportBatchSize: 100,
        scheduledDelayMillis: 5000,
      }));

      logger.info("[Telemetry] ✅ Cloud Trace exporter initialized");
    } catch (error) {
      logger.warn("[Telemetry] ⚠️ Cloud Trace exporter failed, using console", error);
      // Fallback to console exporter for debugging
      const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");
      provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
    }
  } else {
    // In development, optionally log traces to console
    if (process.env.TRACE_DEBUG === "true") {
      const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");
      provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
      logger.info("[Telemetry] 🔍 Console trace exporter enabled (dev mode)");
    } else {
      logger.info("[Telemetry] ⏸️ Tracing disabled in development (set TRACE_DEBUG=true to enable)");
    }
  }

  // Register the provider
  provider.register();

  // Register auto-instrumentations
  registerInstrumentations({
    instrumentations: [
      // HTTP instrumentation for outgoing requests
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => {
          // Ignore health check endpoints to reduce noise
          const url = request.url || "";
          return url.includes("/health") || url.includes("/metrics");
        },
        requestHook: (span, request) => {
          // Add custom attributes
          span.setAttribute("http.request_id", request.headers?.["x-request-id"] || "unknown");
        },
      }),

      // Express instrumentation for routes
      new ExpressInstrumentation({
        ignoreLayersType: ["middleware"], // Reduce noise from middleware spans
      }),

      // PostgreSQL instrumentation for database queries
      new PgInstrumentation({
        enhancedDatabaseReporting: true,
      }),
    ],
  });

  logger.info("[Telemetry] ✅ OpenTelemetry initialized with HTTP, Express, and pg instrumentations");
}

/**
 * Get current trace context for logging correlation
 */
export function getTraceContext(): { traceId: string; spanId: string } | null {
  const { trace, context } = require("@opentelemetry/api");
  const span = trace.getSpan(context.active());

  if (!span) {
    return null;
  }

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

/**
 * Create a custom span for business operations
 */
export function createSpan(name: string): any {
  const { trace } = require("@opentelemetry/api");
  const tracer = trace.getTracer("run-remix-api");
  return tracer.startSpan(name);
}

/**
 * Wrap an async function with tracing
 */
export async function withTrace<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const { trace, SpanStatusCode } = require("@opentelemetry/api");
  const tracer = trace.getTracer("run-remix-api");

  return tracer.startActiveSpan(name, async (span: any) => {
    try {
      // Add custom attributes
      if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
          span.setAttribute(key, value);
        }
      }

      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
