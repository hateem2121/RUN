import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { APP_VERSION } from "./version.js";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    // Resource is used as type internally by NodeSDK
    [SemanticResourceAttributes.SERVICE_NAME]: "api-server",
    [SemanticResourceAttributes.SERVICE_VERSION]: APP_VERSION,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "development",
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
  }),
  instrumentations: [
    getNodeAutoInstrumentations(),
    new PinoInstrumentation({
      logHook: (span: any, record: any) => {
        record["trace_id"] = span.traceId;
        record["span_id"] = span.spanId;
        record["service.name"] = "api-server";
      },
    }),
  ],
});

export const startOtel = () => {
  if (process.env.ENABLE_OTEL === "true" || process.env.NODE_ENV === "production") {
    console.log("[OTel] Starting OpenTelemetry SDK...");
    sdk.start();

    process.on("SIGTERM", () => {
      sdk
        .shutdown()
        .then(() => console.log("[OTel] SDK shut down successfully"))
        .catch((error: any) =>
          console.error("[OTel] Error shutting down OpenTelemetry SDK:", error),
        )
        .finally(() => process.exit(0));
    });
  }
};
