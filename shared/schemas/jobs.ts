import { z } from "zod";

/**
 * Schema for Email Notification Jobs (Inquiries)
 */
export const inquiryEmailJobSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().nullish(),
  phone: z.string().nullish(),
  country: z.string().nullish(),
  message: z.string().min(1),
  preferredPlatform: z.string().nullish(),
  submittedAt: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
  items: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number(),
        notes: z.string().nullish(),
      }),
    )
    .nullish(),
});

export type InquiryEmailJobData = z.infer<typeof inquiryEmailJobSchema>;

/**
 * Media processing operations
 */
export const mediaOperationSchema = z.enum([
  "optimize",
  "thumbnail",
  "webp",
  "avif",
  "gltf-optimize",
  "metadata",
]);

export type MediaOperation = z.infer<typeof mediaOperationSchema>;

/**
 * Schema for Media Processing Jobs (Cloud Tasks)
 */
export const mediaProcessingJobSchema = z.object({
  mediaId: z.string(),
  operation: mediaOperationSchema,
  options: z
    .object({
      width: z.number().optional(),
      height: z.number().optional(),
      quality: z.number().optional(),
      format: z.string().optional(),
    })
    .optional(),
  callbackUrl: z.string().optional(),
  retryCount: z.number().optional(),
});

export type MediaProcessingJobData = z.infer<typeof mediaProcessingJobSchema>;
