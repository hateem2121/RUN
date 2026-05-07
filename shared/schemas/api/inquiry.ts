import { z } from "zod";

/**
 * Schema for adding a log entry to an inquiry.
 * Migrated from inquiry-admin.ts to centralize API contract.
 */
export const addInquiryLogSchema = z.object({
  action: z.string().min(1).max(100),
  note: z.string().min(1).max(2000),
});

export type AddInquiryLogData = z.infer<typeof addInquiryLogSchema>;
