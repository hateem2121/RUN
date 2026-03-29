import { z } from "zod";

export function createSuccessEnvelopeSchema<T>(schema: z.ZodType<T>) {
  return z.object({
    data: schema,
  });
}
