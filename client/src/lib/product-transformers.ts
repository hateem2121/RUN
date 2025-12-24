import type {
	Category,
	Certificate,
	Fabric,
	MediaAsset,
	Product,
	ProductSummary,
} from "@shared/schema";
import type { ProductMediaItem } from "@shared/types/homepage";
import { MediaUrlBuilder } from "@/lib/media-url-builder";

// Types matching the attached component design
export interface TransformedProduct {
	id: string;
	name: string;
	sku: string;
	category: string;
	categoryId: number;
	imageUrl: string;
	hoverImageUrl?: string;
	imageId?: number;
	hoverImageId?: number;
	fabric: string;
	weight: { value: number; unit: "GSM" };
	moq: number;
	leadTime: string;
	certifications: Array<"GOTS" | "OEKO-TEX" | "RCS">;
	specifications: {
		fit: string;
		careInstructions: string;
		fabricComposition: string;
		features: string[];
	};
	isFeatured: boolean;
	detailUrl: string;
}

export interface TransformContext {
	categories: Category[];
	fabrics: Fabric[];
	certificates: Certificate[];
	mediaAssets: MediaAsset[];
	mediaContentMap: Map<number, string>;
}

/**
 * Transform database product to component format
 */
export function transformProduct(
	product: ProductSummary,
	context: TransformContext,
): TransformedProduct {
	// Find category
	const category = context.categories.find((c) => c.id === product.categoryId);
	const categoryName = category?.name || "Uncategorized";

	// Find fabric
	const fabric = product.fabricId
		? context.fabrics.find((f) => f.id === product.fabricId)
		: null;
	const fabricName = fabric?.name || "Standard Fabric";

	// Extract weight (GSM) - prioritize product's customWeight over fabric weight
	let weightValue = 150; // default
	const productAnyForWeight = product as any;

	// First check if product has customWeight
	if (productAnyForWeight.customWeight) {
		const match = productAnyForWeight.customWeight.match(/(\d+)/);
		if (match && match[1]) {
			weightValue = parseInt(match[1], 10);
		}
	}
	// Fall back to fabric weight if no customWeight
	else {
		const fabricWeight: string = fabric?.weight ?? "";
		if (fabricWeight) {
			const match = fabricWeight.match(/(\d+)/);
			if (match && match[1]) weightValue = parseInt(match[1], 10);
		}
	}

	// Get primary image URL
	const primaryImageUrl = product.primaryImageId
		? context.mediaContentMap.get(product.primaryImageId) ||
			`/api/media/${product.primaryImageId}/content`
		: "https://placehold.co/600x800?text=No+Image";

	// Get hover image (use first imageId if available)
	let hoverImageUrl: string | undefined;
	let hoverImageId: number | undefined;
	if (
		product.imageIds &&
		Array.isArray(product.imageIds) &&
		product.imageIds.length > 0
	) {
		const firstImageId = product.imageIds[0];
		if (typeof firstImageId === "number") {
			hoverImageId = firstImageId;
			hoverImageUrl =
				context.mediaContentMap.get(firstImageId) ||
				`/api/media/${firstImageId}/content`;
		}
	}

	// Map certificate IDs to certification names
	const certifications: Array<"GOTS" | "OEKO-TEX" | "RCS"> = [];
	if (product.certificateIds && Array.isArray(product.certificateIds)) {
		product.certificateIds.forEach((certId) => {
			const cert = context.certificates.find((c) => c.id === certId);
			if (cert) {
				const certName = cert.name.toUpperCase();
				if (certName.includes("GOTS")) certifications.push("GOTS");
				else if (certName.includes("OEKO") || certName.includes("TEX"))
					certifications.push("OEKO-TEX");
				else if (certName.includes("RCS")) certifications.push("RCS");
			}
		});
	}

	// Build specifications object
	const productAny = product as any;

	// Extract fit
	const fit =
		productAny.customFit || productAny.technicalSpecs?.fit || "Standard Fit";

	// Extract care instructions from the careInstructions array
	const careInstructions =
		Array.isArray(productAny.careInstructions) &&
		productAny.careInstructions.length > 0
			? productAny.careInstructions.join(". ")
			: "Machine wash cold, tumble dry low.";

	// Extract fabric composition
	let fabricComposition = "See product details";
	if (productAny.fiberComposition) {
		// Try to format fiberComposition object
		fabricComposition = Object.entries(productAny.fiberComposition)
			.map(([fiber, percentage]) => `${percentage}% ${fiber}`)
			.join(", ");
	} else if (
		fabric?.properties?.compositions &&
		Array.isArray(fabric.properties.compositions)
	) {
		// Fallback to fabric compositions
		const composition =
			fabric.properties.compositions.find((c: any) => c.isDefault) ||
			fabric.properties.compositions[0];
		if (composition?.fibers && Array.isArray(composition.fibers)) {
			fabricComposition = composition.fibers
				.map((f: any) => `${f.percentage}% ${f.name}`)
				.join(", ");
		}
	}

	// Extract features from specifications or tags
	const features =
		Array.isArray(productAny.specifications) &&
		productAny.specifications.length > 0
			? productAny.specifications
			: Array.isArray(product.tags)
				? product.tags
				: [];

	const specifications = {
		fit,
		careInstructions,
		fabricComposition,
		features,
	};

	// Build product detail URL
	// PRIORITY 1: Use canonical urlPath from database (prevents 404s)
	let detailUrl = product.urlPath || "";
	const productSlug = productAny.slug;

	// PRIORITY 2: Construct from category path if no canonical URL
	if (!detailUrl && category && productSlug) {
		// Build category path by traversing up the category tree
		const categoryPath: string[] = [];
		let currentCat: Category | undefined = category;
		const visitedIds = new Set<number>();

		while (currentCat) {
			if (visitedIds.has(currentCat.id)) break;
			visitedIds.add(currentCat.id);

			if (currentCat.slug) {
				categoryPath.unshift(currentCat.slug);
			}

			if (currentCat.parentId) {
				currentCat = context.categories.find(
					(c) => c.id === currentCat!.parentId,
				);
			} else {
				currentCat = undefined;
			}
		}

		// Build final URL: /categories/{category-path}/{product-slug}
		if (categoryPath.length > 0) {
			detailUrl = `/categories/${categoryPath.join("/")}/${productSlug}`;
		}
	}

	// Fallback
	if (!detailUrl) {
		detailUrl = "/products";
	}

	return {
		id: String(product.id),
		name: product.name,
		sku: product.sku,
		category: categoryName,
		categoryId: product.categoryId,
		imageUrl: primaryImageUrl,
		hoverImageUrl,
		imageId: product.primaryImageId ?? undefined,
		hoverImageId,
		fabric: fabricName,
		weight: { value: weightValue, unit: "GSM" },
		moq: product.minimumOrderQuantity || 100,
		leadTime: (product as any).leadTime || "30-45 days",
		certifications,
		specifications,
		isFeatured: product.isFeatured || false,
		detailUrl,
	};
}

/**
 * Transform multiple products with batched data
 */
export function transformProducts(
	products: ProductSummary[],
	context: TransformContext,
): TransformedProduct[] {
	return products
		.filter((p) => p.isActive)
		.map((p) => transformProduct(p, context));
}

/**
 * Group products by category
 */
export function groupProductsByCategory(
	products: TransformedProduct[],
): Record<string, TransformedProduct[]> {
	return products.reduce(
		(acc, product) => {
			const categoryName = product.category;
			if (!acc[categoryName]) {
				acc[categoryName] = [];
			}
			acc[categoryName].push(product);
			return acc;
		},
		{} as Record<string, TransformedProduct[]>,
	);
}

/**
 * Build hierarchical product URL from category path and product slug
 * Handles nested categories and prevents circular reference loops
 */
export function buildProductUrl(
	product: Product,
	categories: Category[],
): string {
	// PRIORITY 1: Use canonical urlPath if available
	if (product.urlPath) {
		return product.urlPath;
	}

	const category = categories.find((c) => c.id === product.categoryId);

	if (!category || !product.slug) {
		return `/products`;
	}

	// Build category path (handle hierarchical categories)
	const categoryPath: string[] = [];
	let currentCat: Category | undefined = category;
	const visitedIds = new Set<number>(); // Prevent infinite loops from circular references

	// Traverse up the category tree to build the full path
	while (currentCat) {
		// Prevent infinite loops
		if (visitedIds.has(currentCat.id)) {
			break;
		}
		visitedIds.add(currentCat.id);

		if (currentCat.slug) {
			categoryPath.unshift(currentCat.slug);
		}
		// Find parent category if exists
		if (currentCat.parentId) {
			const parent = categories.find((c) => c.id === currentCat!.parentId);
			currentCat = parent;
		} else {
			currentCat = undefined;
		}
	}

	// Build final URL: /categories/{category-path}/{product-slug}
	return `/categories/${categoryPath.join("/")}/${product.slug}`;
}

/**
 * Build product media items array with proper priority ordering
 * Priority: Primary Image > Other Images > Primary Video > Other Videos > 3D Model
 */
export function buildProductMediaItems(product: Product): ProductMediaItem[] {
	const mediaItems: ProductMediaItem[] = [];

	// 1. Add primary image first (highest priority)
	if (product.primaryImageId) {
		const primaryImageUrl = MediaUrlBuilder.buildUrlSafe(
			product.primaryImageId,
		);
		if (primaryImageUrl) {
			mediaItems.push({
				id: product.primaryImageId,
				url: primaryImageUrl,
				type: "image" as const,
				alt: product.name,
			});
		}
	}

	// 2. Add other images (excluding primary to avoid duplicates)
	if (product.imageIds && Array.isArray(product.imageIds)) {
		const otherImageItems = product.imageIds
			.filter(
				(id: unknown): id is number =>
					typeof id === "number" && id !== product.primaryImageId,
			)
			.map(
				(id: number): ProductMediaItem => ({
					id,
					url: MediaUrlBuilder.buildUrlSafe(id) || "",
					type: "image" as const,
					alt: product.name,
				}),
			)
			.filter((item: ProductMediaItem) => item.url);

		mediaItems.push(...otherImageItems);
	}

	// 3. Add primary video
	if (product.primaryVideoId) {
		const primaryVideoUrl = MediaUrlBuilder.buildUrlSafe(
			product.primaryVideoId,
		);
		if (primaryVideoUrl) {
			mediaItems.push({
				id: product.primaryVideoId,
				url: primaryVideoUrl,
				type: "video" as const,
				alt: product.name,
			});
		}
	}

	// 4. Add other videos (excluding primary to avoid duplicates)
	if (product.videos && Array.isArray(product.videos)) {
		for (const videoId of product.videos) {
			if (typeof videoId === "number" && videoId !== product.primaryVideoId) {
				const videoUrl = MediaUrlBuilder.buildUrlSafe(videoId);
				if (videoUrl) {
					mediaItems.push({
						id: videoId,
						url: videoUrl,
						type: "video" as const,
						alt: product.name,
					});
				}
			}
		}
	}

	// 5. Add 3D Model
	if (product.modelFileId) {
		const modelUrl = MediaUrlBuilder.buildUrlSafe(product.modelFileId);
		if (modelUrl) {
			mediaItems.push({
				id: product.modelFileId,
				url: modelUrl,
				type: "image" as const,
				alt: `${product.name} 3D Model`,
			});
		}
	}

	return mediaItems;
}
