import { z } from "zod";

/**
 * Validation schema for public inquiry submissions.
 * Centralized in shared for use by both server (validation) and client (forms).
 */
export const createInquirySchema = z.object({
  contact: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    company: z.string().optional(),
    phone: z.string().optional(),
    country: z.string().optional(),
    message: z.string().min(1, "Message is required"),
  }),
  items: z
    .array(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        notes: z.string().optional(),
      }),
    )
    .optional(),
  source: z.string().default("contact_page"),
});

export type CreateInquiryData = z.infer<typeof createInquirySchema>;
