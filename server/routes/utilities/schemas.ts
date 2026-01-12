import { z } from "zod";

/**
 * Utility Schemas
 * Validation for metrics, resources, and feature flag endpoints
 */

export const MetricsErrorsQuerySchema = z.object({
  type: z.string().optional(),
  severity: z.string().optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const MetricsAlertsQuerySchema = z.object({
  type: z.enum(["slow_query", "error_rate", "http_error_rate", "circuit_breaker"]).optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const FeatureFlagsQuerySchema = z.object({
  limit: z.coerce.number().min(0).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export const FeatureFlagParamSchema = z.object({
  flag: z.string().min(1),
});

export const FeatureFlagUpdateBodySchema = z.object({
  enabled: z.boolean(),
});

export const ResourcesBatchQuerySchema = z.object({
  types: z.string().optional().default("all"),
  active: z.enum(["true", "false"]).optional(),
});

export const CacheInvalidationQuerySchema = z.object({
  pattern: z.string().min(1),
});
