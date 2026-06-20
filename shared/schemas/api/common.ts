import { z } from "zod";

const baseReorderItem = z.object({
  id: z.number().int().positive(),
  sortOrder: z.number().int().min(0).default(0),
  position: z.number().int().min(0).default(0),
});

export const reorderEntriesSchema = z.object({ entries: z.array(baseReorderItem) });
export const reorderGoalsSchema = z.object({ goals: z.array(baseReorderItem) });
export const reorderInitiativesSchema = z.object({ initiatives: z.array(baseReorderItem) });
export const reorderMetricsSchema = z.object({ metrics: z.array(baseReorderItem) });
export const reorderEquipmentSchema = z.object({ equipment: z.array(baseReorderItem) });
export const reorderInnovationsSchema = z.object({ innovations: z.array(baseReorderItem) });
export const reorderResearchSchema = z.object({ research: z.array(baseReorderItem) });
export const reorderRoadmapSchema = z.object({ roadmap: z.array(baseReorderItem) });

export const WebVitalSchema = z.object({
  name: z.string(),
  value: z.number(),
  delta: z.number(),
  id: z.string(),
});

export const ClientErrorSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  componentStack: z.string().optional(),
  level: z.enum(["error", "warn", "info"]),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
  isRetry: z.boolean().optional(),
  retryCount: z.number().optional(),
});
