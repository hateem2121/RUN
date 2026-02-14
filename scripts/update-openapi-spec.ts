import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateOpenApiSpec } from "../server/lib/api/openapi-generator.js";

// Import routers to trigger OpenAPI registration
import "../server/routes/v1/core.js";
import "../server/routes/v1/media.js";
import "../server/routes/v1/admin.js";
import "../server/routes/v1/webhooks.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function generate() {
  try {
    console.log("Generating OpenAPI specification...");
    const spec = generateOpenApiSpec();
    const outputPath = resolve(__dirname, "../openapi-spec.json");

    writeFileSync(outputPath, JSON.stringify(spec, null, 2));
    console.log(`OpenAPI specification saved to ${outputPath}`);
  } catch (error) {
    console.error("Failed to generate OpenAPI specification:", error);
    process.exit(1);
  }
}

generate();
