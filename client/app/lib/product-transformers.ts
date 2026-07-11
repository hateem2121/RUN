import type {
  Category,
  Certificate,
  Fabric,
  MediaAsset,
  Product,
  ProductSummary,
} from "@shared/index";
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
  media: Array<{ id: number; type: "image" | "video"; url?: string }>;
}

type MinimalCategory = Pick<Category, "id" | "name" | "slug"> & {
  parentId?: number | null | undefined;
};

interface TransformContext {
  categories: MinimalCategory[];
  fabrics: Fabric[];
  certificates: Certificate[];
  mediaAssets: MediaAsset[];
  mediaContentMap: Map<number, string>;
}

/**
 * Transform database product to component format
 */
function transformProduct(product: ProductSummary, context: TransformContext): TransformedProduct {
  // Find category
  const category = context.categories.find((c) => c.id === product.categoryId);
  const categoryName = category?.name || "Uncategorized";

  // Find fabric
  const fabric = product.fabricId ? context.fabrics.find((f) => f.id === product.fabricId) : null;
  const fabricName = fabric?.name || "Standard Fabric";

  // Extract weight (GSM) - prioritize product's customWeight over fabric weight
  let weightValue = 150; // default
  // Cast to Partial<Product> to safely access fields that might exist at runtime (e.g. if passed a full Product)
  const fullProduct = product as Partial<Product>;

  // First check if product has customWeight
  if (fullProduct.customWeight) {
    const match = fullProduct.customWeight.match(/(\d+)/);
    if (match?.[1]) {
      weightValue = parseInt(match[1], 10);
    }
  }
  // Fall back to fabric weight if no customWeight
  else {
    const fabricWeight: string = fabric?.weight ?? "";
    if (fabricWeight) {
      const match = fabricWeight.match(/(\d+)/);
      if (match?.[1]) {
        weightValue = parseInt(match[1], 10);
      }
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
  if (product.imageIds && Array.isArray(product.imageIds) && product.imageIds.length > 0) {
    const firstImageId = product.imageIds[0];
    if (typeof firstImageId === "number") {
      hoverImageId = firstImageId;
      hoverImageUrl =
        context.mediaContentMap.get(firstImageId) || `/api/media/${firstImageId}/content`;
    }
  }

  // Map certificate IDs to certification names
  const certifications: Array<"GOTS" | "OEKO-TEX" | "RCS"> = [];
  if (product.certificateIds && Array.isArray(product.certificateIds)) {
    product.certificateIds.forEach((certId) => {
      const cert = context.certificates.find((c) => c.id === certId);
      if (cert) {
        const certName = cert.name.toUpperCase();
        if (certName.includes("GOTS")) {
          certifications.push("GOTS");
        } else if (certName.includes("OEKO") || certName.includes("TEX")) {
          certifications.push("OEKO-TEX");
        } else if (certName.includes("RCS")) {
          certifications.push("RCS");
        }
      }
    });
  }

  // Build specifications object
  // Extract fit
  const rawFit = fullProduct.customFit || fullProduct.technicalSpecs?.fit;
  const fit = typeof rawFit === "string" ? rawFit : "Standard Fit";

  // Extract care instructions from the careInstructions array
  const careInstructions =
    Array.isArray(fullProduct.careInstructions) && fullProduct.careInstructions.length > 0
      ? fullProduct.careInstructions.join(". ")
      : "Machine wash cold, tumble dry low.";

  // Extract fabric composition
  let fabricComposition = "See product details";
  if (typeof fullProduct.fiberComposition === "string") {
    fabricComposition = fullProduct.fiberComposition;
  } else if (
    fullProduct.fiberComposition &&
    typeof fullProduct.fiberComposition === "object" &&
    !Array.isArray(fullProduct.fiberComposition)
  ) {
    // Check if it's the { selected: "name" } format or { fiber: percentage } format
    const fiberObj = fullProduct.fiberComposition as Record<string, unknown>;
    if ("selected" in fiberObj && typeof fiberObj.selected === "string") {
      fabricComposition = fiberObj.selected;
    } else {
      // Try to format fiber: percentage object
      fabricComposition = Object.entries(fiberObj)
        .map(([fiber, percentage]) => `${percentage}% ${fiber}`)
        .join(", ");
    }
  } else if (fabric?.properties?.compositions && Array.isArray(fabric.properties.compositions)) {
    // Define interfaces for fabric properties
    interface FabricFiber {
      fiberId?: number | null;
      name?: string;
      percentage: string | number;
    }

    interface FabricComposition {
      name: string;
      isDefault: boolean;
      fibers: FabricFiber[];
    }

    // Fallback to fabric compositions
    const composition =
      (fabric.properties.compositions as FabricComposition[]).find((c) => c.isDefault) ||
      (fabric.properties.compositions as FabricComposition[])[0];

    if (composition?.fibers && Array.isArray(composition.fibers)) {
      fabricComposition = (composition.fibers as FabricFiber[])
        .map((f) => `${f.percentage}% ${f.name || "Unknown Fiber"}`)
        .join(", ");
    }
  }

  // Extract features from specifications or tags
  const features =
    Array.isArray(fullProduct.specifications) && fullProduct.specifications.length > 0
      ? fullProduct.specifications
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
  const productSlug = product.slug;

  // PRIORITY 2: Construct from category path if no canonical URL
  if (!detailUrl && category && productSlug) {
    // Build category path by traversing up the category tree
    const categoryPath: string[] = [];
    let currentCat: MinimalCategory | undefined = category;
    const visitedIds = new Set<number>();

    while (currentCat) {
      if (visitedIds.has(currentCat.id)) {
        break;
      }
      visitedIds.add(currentCat.id);

      if (currentCat.slug) {
        categoryPath.unshift(currentCat.slug);
      }

      if (currentCat.parentId) {
        currentCat = context.categories.find((c) => c.id === currentCat?.parentId);
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
    ...(hoverImageUrl ? { hoverImageUrl } : {}),
    ...(product.primaryImageId ? { imageId: product.primaryImageId } : {}),
    ...(hoverImageId ? { hoverImageId } : {}),
    fabric: fabricName,
    weight: { value: weightValue, unit: "GSM" },
    moq: product.minimumOrderQuantity || 100,
    leadTime: fullProduct.leadTime || "30-45 days",
    certifications,
    specifications,
    isFeatured: product.isFeatured || false,
    detailUrl,
    media: buildProductMediaItems(product).map((item) => ({
      id: item.id,
      type: item.type === "video" ? ("video" as const) : ("image" as const),
      url: item.url,
    })),
  };
}

/**
 * Transform multiple products with batched data
 */
export function transformProducts(
  products: ProductSummary[],
  context: TransformContext,
): TransformedProduct[] {
  return products.filter((p) => p.isActive).map((p) => transformProduct(p, context));
}

/**
 * Group products by category
 */
/** @public */ export function groupProductsByCategory(
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
/** @public */ export function buildProductUrl(
  product: Product,
  categories: MinimalCategory[],
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
  let currentCat: MinimalCategory | undefined = category;
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
      const parent = categories.find((c) => c.id === currentCat?.parentId);
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
function buildProductMediaItems(product: ProductSummary | Product): ProductMediaItem[] {
  const mediaItems: ProductMediaItem[] = [];

  // 1. Add primary image first (highest priority)
  if (product.primaryImageId) {
    const primaryImageUrl = MediaUrlBuilder.buildUrlSafe(product.primaryImageId);
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
        (id: unknown): id is number => typeof id === "number" && id !== product.primaryImageId,
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
    const primaryVideoUrl = MediaUrlBuilder.buildUrlSafe(product.primaryVideoId);
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

  // 5. Add 3D Model (modelFileId is only in full Product/ProductDetail, not Summary)
  const modelFileId = (product as Partial<Product>).modelFileId;
  if (modelFileId) {
    const modelUrl = MediaUrlBuilder.buildUrlSafe(modelFileId);
    if (modelUrl) {
      mediaItems.push({
        id: modelFileId,
        url: modelUrl,
        type: "image" as const,
        alt: `${product.name} 3D Model`,
      });
    }
  }

  return mediaItems;
}
