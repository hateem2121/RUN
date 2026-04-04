import { z } from "zod";

/**
 * API Response Envelope Schemas
 *
 * Generic factories for wrapping API response payloads in a consistent shape.
 * Centralised here so that both the client (for response validation) and
 * server (for response typing) share the same envelope structure.
 */

export function createSuccessEnvelopeSchema<T>(schema: z.ZodType<T>) {
  return z.object({
    data: schema,
  });
}
