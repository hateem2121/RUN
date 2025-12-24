import { selectCategorySchema, selectProductSchema } from "@shared/schema";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

// Extend shared schemas for API responses which might include relations or extra fields
// We strictly validate the core fields against the DB schema
const apiProductSchema = selectProductSchema
	.extend({
		// Handle JSON date strings
		createdAt: z.coerce.date(),
		updatedAt: z.coerce.date().optional().nullable(),
		deletedAt: z.coerce.date().optional().nullable(),

		// Relations or joined fields
		category: selectCategorySchema.pick({ name: true }).optional().nullable(),
		primaryImage: z
			.object({ url: z.string().optional().nullable() })
			.optional()
			.nullable(),

		// Make fields optional that are missing from the summary response
		shortDescription: z.string().optional().nullable(),
		modelFileId: z.number().optional().nullable(),
		urlPath: z.string().optional().nullable(),
		customWeight: z.number().optional().nullable(),
		customizationOptions: z.any().optional().nullable(),
		relatedProductIds: z.array(z.number()).optional().nullable(),
		metaTitle: z.string().optional().nullable(),
		metaDescription: z.string().optional().nullable(),
		metadata: z.any().optional().nullable(),
	})
	.passthrough();

const apiCategorySchema = selectCategorySchema
	.extend({
		// Handle JSON date strings
		createdAt: z.coerce.date(),
		updatedAt: z.coerce.date(),
		deletedAt: z.coerce.date().nullable(),
		imageUrl: z.string().optional().nullable(),
	})
	.passthrough();

const featuredProductsResponseSchema = z.array(apiProductSchema);
const categoriesResponseSchema = z.array(apiCategorySchema);

const productsApiResponseSchema = z.object({
	data: z.array(apiProductSchema),
	pagination: z.any().optional(), // We don't need strict validation on pagination here
});

// SSR-safe fetch helper
const getBaseUrl = () => {
	if (typeof window !== "undefined") return ""; // Browser: use relative URLs
	// Server: use absolute URL with port
	const port = process.env.PORT || 5000;
	return `http://localhost:${port}`;
};

export function useFeaturedProducts() {
	const { data: featuredProducts } = useSuspenseQuery<
		z.infer<typeof featuredProductsResponseSchema>
	>({
		queryKey: ["/api/products", { featured: true }],
		queryFn: async () => {
			const res = await fetch(`${getBaseUrl()}/api/products?featured=true`);
			if (!res.ok) throw new Error("Failed to fetch featured products");
			const json = await res.json();
			const result = productsApiResponseSchema.parse(json);
			return result.data;
		},
	});

	return featuredProducts.map((p: z.infer<typeof apiProductSchema>) => ({
		id: p.id.toString(),
		name: p.name,
		category: p.category?.name || "Uncategorized",
		price: p.minimumOrderQuantity ? `MOQ ${p.minimumOrderQuantity}` : "MOQ N/A",
		image:
			p.primaryImage?.url ||
			"https://images.unsplash.com/photo-1556906781-9a412961d289?auto=format&fit=crop&q=80&w=600",
	}));
}

export function useCategories() {
	const { data: categories } = useSuspenseQuery<
		z.infer<typeof categoriesResponseSchema>
	>({
		queryKey: ["/api/categories"],
		queryFn: async () => {
			const res = await fetch(`${getBaseUrl()}/api/categories`);
			if (!res.ok) throw new Error("Failed to fetch categories");
			const json = await res.json();
			return categoriesResponseSchema.parse(json);
		},
	});

	return categories.map((c: z.infer<typeof apiCategorySchema>) => ({
		id: c.id.toString(),
		name: c.name,
		image:
			c.imageUrl ||
			"https://images.unsplash.com/photo-1529139574466-a302d27f6054?auto=format&fit=crop&q=80&w=600",
	}));
}

export function useHomepageData() {
	return {
		featuredProducts: useFeaturedProducts(),
		categories: useCategories(),
	};
}
