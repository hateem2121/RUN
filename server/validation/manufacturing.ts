/**
 * MANUFACTURING VALIDATION MODULE
 *
 * Centralized Zod validation helpers for manufacturing endpoints
 * Provides consistent error formatting and reusable validation logic
 */

import { type ZodSchema, z } from "zod";
import {
  insertManufacturingCapabilitySchema,
  insertManufacturingCaseStudySchema,
  insertManufacturingHeroSchema,
  insertManufacturingProcessSchema,
  insertManufacturingQualitySchema,
} from "../../shared/index.js";

/**
 * Standard validation result type
 */
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string; details: z.ZodIssue[] } };

/**
 * Generic validation helper
 * Validates data against a Zod schema and returns standardized result
 */
function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    error: {
      message: "Validation failed",
      details: result.error.issues,
    },
  };
}

/**
 * Manufacturing Process validation
 */
export function validateManufacturingProcess(data: unknown) {
  return validate(insertManufacturingProcessSchema, data);
}

export function validateManufacturingProcessPartial(data: unknown) {
  return validate(insertManufacturingProcessSchema.partial(), data);
}

/**
 * Manufacturing Capability validation
 */
export function validateManufacturingCapability(data: unknown) {
  return validate(insertManufacturingCapabilitySchema, data);
}

export function validateManufacturingCapabilityPartial(data: unknown) {
  return validate(insertManufacturingCapabilitySchema.partial(), data);
}

/**
 * Manufacturing Quality validation
 */
export function validateManufacturingQuality(data: unknown) {
  return validate(insertManufacturingQualitySchema, data);
}

export function validateManufacturingQualityPartial(data: unknown) {
  return validate(insertManufacturingQualitySchema.partial(), data);
}

/**
 * Manufacturing Hero validation
 */
export function validateManufacturingHero(data: unknown) {
  return validate(insertManufacturingHeroSchema, data);
}

export function validateManufacturingHeroPartial(data: unknown) {
  return validate(insertManufacturingHeroSchema.partial(), data);
}

/**
 * Manufacturing Case Study validation
 */
export function validateManufacturingCaseStudy(data: unknown) {
  return validate(insertManufacturingCaseStudySchema, data);
}

export function validateManufacturingCaseStudyPartial(data: unknown) {
  return validate(insertManufacturingCaseStudySchema.partial(), data);
}

/**
 * Reorder validation schemas
 */
const reorderProcessesSchema = z.object({
  processes: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

const reorderCapabilitiesSchema = z.object({
  capabilities: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

const reorderQualitiesSchema = z.object({
  qualities: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

const reorderCaseStudiesSchema = z.object({
  caseStudies: z.array(
    z.object({
      id: z.number().int().positive(),
      position: z.number().int().min(0),
    }),
  ),
});

export function validateReorderProcesses(data: unknown) {
  return validate(reorderProcessesSchema, data);
}

export function validateReorderCapabilities(data: unknown) {
  return validate(reorderCapabilitiesSchema, data);
}

export function validateReorderQualities(data: unknown) {
  return validate(reorderQualitiesSchema, data);
}

export function validateReorderCaseStudies(data: unknown) {
  return validate(reorderCaseStudiesSchema, data);
}
