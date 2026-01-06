import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
// import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

export function initTelemetry() {
  if (process.env.ENABLE_OTEL !== "true") {
    return;
  }

  const sdk = new NodeSDK({
    // resource: new Resource({
    //   [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "run-remix-api",
    // }),
    traceExporter: new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
        "http://localhost:4318/v1/traces",
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    sdk.start();
    console.log("[Telemetry] ✅ OpenTelemetry SDK started");

    // Graceful shutdown
    process.on("SIGTERM", () => {
      sdk
        .shutdown()
        .then(() => console.log("[Telemetry] SDK shut down successfully"))
        .catch((error) =>
          console.log("[Telemetry] Error shutting down SDK", error),
        )
        .finally(() => process.exit(0));
    });
  } catch (error) {
    console.warn("[Telemetry] Failed to start OpenTelemetry SDK", error);
  }
}
