import { z } from "zod";

// Standard API Response Envelope
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.any().optional(),
        requestId: z.string().optional(),
      })
      .optional(),
    timestamp: z.string().datetime().optional(),
  });

export type ApiResponse<T> = z.infer<ReturnType<typeof apiResponseSchema<z.ZodType<T>>>>;
