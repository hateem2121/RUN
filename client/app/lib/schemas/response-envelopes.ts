import { z } from "zod";

/**
 * Standard Success Envelope Schema Factory
 * @param dataSchema Zod schema for the expected data type
 */
export const createSuccessEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z
      .object({
        requestId: z.string(),
        timestamp: z.number(),
      })
      .passthrough()
      .optional(),
  });

/**
 * Standard Error Envelope Schema
 */
export const errorEnvelopeSchema = z.object({
  success: z.literal(false),
  error: z.object({
    type: z.string(),
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.union([z.array(z.string()), z.string()])).optional(),
    requestId: z.string(),
    timestamp: z.number(),
  }),
});

export type SuccessEnvelopeSchema<T> = z.infer<
  ReturnType<typeof createSuccessEnvelopeSchema<z.ZodType<T>>>
>;
export type ErrorEnvelopeSchema = z.infer<typeof errorEnvelopeSchema>;
