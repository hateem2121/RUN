import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";

export function initTelemetry() {
  if (process.env.ENABLE_OTEL !== "true") {
    return;
  }

  const sdk = new NodeSDK({
    // resource: new Resource({
    //   [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "run-remix-api",
    // }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    sdk.start();

    // Graceful shutdown
    process.on("SIGTERM", () => {
      sdk
        .shutdown()
        .then(() => {})
        .catch((_error) => {})
        .finally(() => process.exit(0));
    });
  } catch (_error) {}
}
