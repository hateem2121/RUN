import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { APP_VERSION } from "../utilities/version.js";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    // Resource is used as type internally by NodeSDK
    [SemanticResourceAttributes.SERVICE_NAME]: "api-server",
    [SemanticResourceAttributes.SERVICE_VERSION]: APP_VERSION,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "development",
  }),
  traceExporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      })
    : new ConsoleSpanExporter(), // Fallback to console if no endpoint configured
  instrumentations: [
    getNodeAutoInstrumentations(),
    new PinoInstrumentation({
      logHook: (span, record: Record<string, unknown>) => {
        const ctx = span.spanContext();
        record.trace_id = ctx.traceId;
        record.span_id = ctx.spanId;
        record["service.name"] = "api-server";
      },
    }),
  ],
});

export const startOtel = () => {
  if (process.env.ENABLE_OTEL === "true" || process.env.NODE_ENV === "production") {
    sdk.start();

    process.on("SIGTERM", () => {
      sdk
        .shutdown()
        .then(() => {})
        .catch((_error: unknown) => {})
        .finally(() => process.exit(0));
    });
  }
};
