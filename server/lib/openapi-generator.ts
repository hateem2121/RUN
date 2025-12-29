import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
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

// Register shared schemas
// We'll iterate through exported schemas and register those that are Zod schemas
for (const [name, schema] of Object.entries(schemas)) {
  if (schema instanceof z.ZodType) {
    registry.register(name, schema);
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

/**
 * Generates the full OpenAPI 3.0 specification
 */
export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "RUN Remix API",
      version: "1.0.0",
      description: "Comprehensive API documentation for the RUN Remix application",
    },
    servers: [{ url: "/api" }],
  });
}
