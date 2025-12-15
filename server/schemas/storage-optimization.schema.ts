import { z } from "zod";

export const cleanupOrphanedSchema = z.object({
  fileKeys: z.array(z.string()).min(1, 'fileKeys must contain at least one key')
});

export const mergeDuplicatesSchema = z.object({
  hash: z.string().min(1, 'hash is required'),
  keepId: z.number().int().positive('keepId must be a positive integer'),
  deleteIds: z.array(z.number().int().positive()).min(1, 'deleteIds must contain at least one ID')
});
