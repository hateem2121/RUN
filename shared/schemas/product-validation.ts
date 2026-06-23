import { z } from "zod";

export const productValidationSchema = z
  .object({
    // Basic Information
    name: z
      .string()
      .min(3, "Product name must be at least 3 characters long")
      .max(100, "Product name cannot exceed 100 characters"),
    sku: z
      .string()
      .min(1, "SKU is required for inventory management")
      .regex(/^[A-Z0-9-_]+$/i, "SKU can only contain letters, numbers, hyphens, and underscores"),
    description: z
      .string()
      .min(
        20,
        "Product description must be at least 20 characters for better customer understanding",
      ),
    shortDescription: z.string().nullish(),
    slug: z.string().min(1, "Slug is required"),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),

    // Category & Fabric
    categoryId: z.number().min(1, "Product category is required for proper organization"),
    fabricId: z.number().nullish(),
    sizeChartId: z.number().nullish(),
    selectedFiberComposition: z.string().nullish().default(null),

    // Media Assets
    primaryImageId: z.number().nullish(),
    primaryVideoId: z.number().nullish(),
    imageIds: z.array(z.number()).default([]),
    videos: z.array(z.number()).default([]),
    modelFileId: z.number().nullish(),

    // Specifications & Features
    specifications: z.array(z.string()).default([]),
    technicalSpecs: z.record(z.string(), z.any()).default({}),
    tags: z.array(z.string()).default([]),
    careInstructions: z.array(z.string()).default([]),

    // B2B Details
    minimumOrderQuantity: z
      .string()
      .refine((val) => !val || (Number(val) > 0 && !Number.isNaN(Number(val))), {
        message: "Minimum order quantity must be a positive number",
      })
      .default(""),
    leadTime: z
      .string()
      .refine((val) => !val || val.trim().length >= 3, {
        message: 'Lead time description should be more detailed (e.g., "2-3 weeks")',
      })
      .default(""),
    customWeight: z.string().default(""),
    customFit: z.string().default(""),
    customizationOptions: z.array(z.string()).default([]),

    // Relationships
    certificateIds: z.array(z.number()).default([]),
    accessoryIds: z.array(z.number()).default([]),
    relatedProductIds: z.array(z.number()).default([]),

    // SEO & Marketing
    metaTitle: z.string().default(""),
    metaDescription: z.string().default(""),
  })
  .superRefine((data, ctx) => {
    // Cross-field validations
    if (
      data.fabricId &&
      (!data.selectedFiberComposition || data.selectedFiberComposition.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fiber composition must be selected when fabric is chosen",
        path: ["selectedFiberComposition"],
      });
    }

    if (data.imageIds.length === 0 && !data.primaryImageId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one product image is required",
        path: ["images"],
      });
    }
  });

// Zod schema for warnings (fields that are recommended but not strictly required)
export const productWarningSchema = z.object({
  certificateIds: z
    .array(z.number())
    .min(1, "Consider adding sustainability certificates for B2B credibility"),
  technicalSpecs: z
    .record(z.string(), z.any())
    .refine(
      (val) => Object.keys(val).length > 0,
      "Technical specifications help B2B customers make informed decisions",
    ),
});

export type ProductFormValues = z.infer<typeof productValidationSchema>;
