import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

import * as schemas from "@run-remix/shared";

export const registry = new OpenAPIRegistry();

// Add Security Schemes
registry.registerComponent("securitySchemes", "sessionAuth", {
  type: "apiKey",
  in: "cookie",
  name: "connect.sid",
  description: "Session-based authentication via cookie",
});

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT Bearer token authentication for API access",
});

// Register shared schemas
// We'll iterate through exported schemas and register those that are Zod schemas
for (const [name, schema] of Object.entries(schemas)) {
  if (schema instanceof z.ZodType) {
    try {
      registry.register(name, schema);
    } catch (_e) {
      // Ignore Zod extension errors to allow server to start
      // console.warn("Failed to register schema in OpenAPI:", name);
    }
  }
}

/**
 * Helper to define a standard JSON response wrapper
 */
export function jsonResponse(schema: z.ZodType, description: string) {
  return {
    description,
    content: {
      "application/json": {
        schema: z.object({
          success: z.boolean(),
          data: schema,
        }),
      },
    },
  };
}

let cachedSpec: ReturnType<OpenApiGeneratorV31["generateDocument"]> | null = null;

/**
 * Generates the full OpenAPI 3.1 specification
 */
export function generateOpenApiSpec() {
  if (cachedSpec && process.env.NODE_ENV === "production") {
    return cachedSpec;
  }

  const generator = new OpenApiGeneratorV31(registry.definitions);

  cachedSpec = generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "RUN Remix CMS API",
      version: "1.0.0",
      description:
        "RESTful API for RUN APPAREL's B2B content management system. Manage products, media, categories, and more programmatically.",
      contact: {
        name: "RUN APPAREL API Support",
        email: "team@wear-run.com",
      },
      license: {
        name: "Proprietary",
      },
    },
    servers: [
      { url: "/api", description: "Default relative API path" },
      { url: "https://cms.wear-run.com/api", description: "Production" },
      { url: "http://localhost:5002/api", description: "Local Development" },
    ],
  });

  return cachedSpec;
}
