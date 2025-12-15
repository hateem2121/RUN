import { z } from "zod";

export const syncAutoFixSchema = z.object({
  dryRun: z.boolean().default(false)
});
