import { insertCategorySchema } from "@shared/schema";
import { z } from "zod";

// Base Category Schema (Reading)
// We extend the insert schema to include ID and timestamps which are present in reads
export const categorySchema = insertCategorySchema.extend({
	id: z.number(),
	createdAt: z
		.string()
		.or(z.date())
		.transform((val) => new Date(val)),
	updatedAt: z
		.string()
		.or(z.date())
		.transform((val) => new Date(val)),
	description: z.string().nullable().optional(),
	parentId: z.number().nullable().optional(),
	primaryImageId: z.number().nullable().optional(),

	// Missing fields for full compatibility with Shared Schema
	level: z.number().default(0),
	sortOrder: z.number().default(0),
	isActive: z.boolean().default(true),
	fullPath: z.string().nullable().optional(),
	metaTitle: z.string().nullable().optional(),
	metaDescription: z.string().nullable().optional(),
	featuredOnHomepage: z.boolean().default(false),
	gridPosition: z.number().default(0),
	displayOrder: z.number().default(0),
	featuredContent: z.record(z.string(), z.any()).nullable().optional(),
	bannerUrl: z.string().nullable().optional(),
	imageUrl: z.string().nullable().optional(),
	deletedAt: z
		.string()
		.or(z.date())
		.nullable()
		.optional()
		.transform((val) => (val ? new Date(val) : null)),
	version: z.number().default(1),
});

export type Category = z.infer<typeof categorySchema>;

export const categoriesResponseSchema = z.array(categorySchema);
