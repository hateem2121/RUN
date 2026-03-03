import type {
  Accessory,
  Category,
  Certificate,
  Fabric,
  ProductSummary,
  SizeChart,
} from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  type TransformContext,
  type TransformedProduct,
  transformProducts,
} from "@/lib/product-transformers";
import { batchFetchMediaContent } from "@/lib/queryClient";

export interface ProductFilters {
  fabrics: number[];
  certificates: number[];
  sizeCharts: number[];
  accessories: number[];
  tags: string[];
  moqRange: [number, number];
}

interface UseProductsPageDataProps {
  activeTab: string;
  selectedFilters: ProductFilters;
  searchQuery: string;
}

interface UseProductsPageDataReturn {
  displayedProducts: TransformedProduct[];
  featuredProducts: TransformedProduct[];
  gearProducts: TransformedProduct[];
  categoryTabs: Array<{ name: string; label: string }>;
  availableTags: string[];
  fabrics: Fabric[];
  certificates: Certificate[];
  sizeCharts: SizeChart[];
  accessories: Accessory[];
  isLoading: boolean;
}

export function useProductsPageData({
  activeTab,
  selectedFilters,
  searchQuery,
}: UseProductsPageDataProps): UseProductsPageDataReturn {
  const [mediaContentMap, setMediaContentMap] = useState<Map<number, string>>(new Map());
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Queries
  // ─────────────────────────────────────────────────────────────────────────

  const { data: productsData, isLoading: productsLoading } = useQuery<{
    data: ProductSummary[];
  }>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: fabrics = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const { data: sizeCharts = [] } = useQuery<SizeChart[]>({
    queryKey: ["/api/size-charts"],
  });

  const { data: accessories = [] } = useQuery<Accessory[]>({
    queryKey: ["/api/accessories"],
  });

  const products = Array.isArray(productsData?.data) ? productsData.data : [];

  // ─────────────────────────────────────────────────────────────────────────
  // Media Asset Fetching
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (products.length === 0) {
      return;
    }

    const mediaIds = new Set<number>();
    products.forEach((product) => {
      if (product.primaryImageId) {
        mediaIds.add(product.primaryImageId);
      }
      if (Array.isArray(product.imageIds)) {
        product.imageIds.forEach((id) => {
          if (typeof id === "number") {
            mediaIds.add(id);
          }
        });
      }
    });

    const fetchMedia = async () => {
      setIsLoadingMedia(true);
      try {
        const results = await batchFetchMediaContent(Array.from(mediaIds));
        const mediaMap = new Map<number, string>();
        results.forEach((result) => {
          if (result.success) {
            const mediaUrl = result.content || result.url || `/api/media/${result.id}/content`;
            mediaMap.set(result.id, mediaUrl);
          }
        });
        setMediaContentMap(mediaMap);
      } catch (_error) {
        // Silently fail media fetch to prevent UI crash
        console.error("Failed to fetch media content", _error);
      } finally {
        setIsLoadingMedia(false);
      }
    };

    fetchMedia();
  }, [products]);

  // ─────────────────────────────────────────────────────────────────────────
  // Product Transformation
  // ─────────────────────────────────────────────────────────────────────────

  const transformedProducts = (() => {
    if (!products.length || !categories.length) {
      return [];
    }

    const context: TransformContext = {
      categories,
      fabrics,
      certificates,
      mediaAssets: [],
      mediaContentMap,
    };

    return transformProducts(products, context);
  })();

  // ─────────────────────────────────────────────────────────────────────────
  // Category Tabs & Tags
  // ─────────────────────────────────────────────────────────────────────────

  const categoryTabs = (() => {
    const tabs = [{ name: "ALL", label: "All Products" }];
    const activeCategories = (Array.isArray(categories) ? categories : []).filter(
      (c) => c?.isActive,
    );
    activeCategories.forEach((cat) => {
      tabs.push({
        name: cat.name.toUpperCase().replace(/\s+/g, "_"),
        label: cat.name,
      });
    });
    return tabs;
  })();

  const availableTags = (() => {
    const tags = new Set<string>();
    products.forEach((product) => {
      if (Array.isArray(product.tags)) {
        product.tags.forEach((tag) => {
          tags.add(tag);
        });
      }
    });
    return Array.from(tags);
  })();

  // ─────────────────────────────────────────────────────────────────────────
  // Filtering & Search Logic
  // ─────────────────────────────────────────────────────────────────────────

  const displayedProducts = (() => {
    let filteredProducts = products;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredProducts = filteredProducts.filter((p) => {
        const matchesName = (p.name?.toLowerCase() ?? "").includes(query);
        const matchesSku = (p.sku?.toLowerCase() ?? "").includes(query);
        const matchesDescription = (p.description?.toLowerCase() ?? "").includes(query);
        return matchesName || matchesSku || matchesDescription;
      });
    }

    // Apply attribute filters
    if (selectedFilters.fabrics.length > 0) {
      filteredProducts = filteredProducts.filter((p) =>
        selectedFilters.fabrics.includes(p.fabricId || 0),
      );
    }

    if (selectedFilters.certificates.length > 0) {
      filteredProducts = filteredProducts.filter((p) =>
        p.certificateIds?.some((id: number) => selectedFilters.certificates.includes(id)),
      );
    }

    if (selectedFilters.sizeCharts.length > 0) {
      filteredProducts = filteredProducts.filter((p) =>
        selectedFilters.sizeCharts.includes(p.sizeChartId || 0),
      );
    }

    if (selectedFilters.accessories.length > 0) {
      filteredProducts = filteredProducts.filter((p) =>
        p.accessoryIds?.some((id: number) => selectedFilters.accessories.includes(id)),
      );
    }

    if (selectedFilters.tags.length > 0) {
      filteredProducts = filteredProducts.filter((p) =>
        p.tags?.some((tag: string) => selectedFilters.tags.includes(tag)),
      );
    }

    // Transform the filtered products
    const context: TransformContext = {
      categories,
      fabrics,
      certificates,
      mediaAssets: [],
      mediaContentMap,
    };
    let transformed = transformProducts(filteredProducts, context);

    // Filter by category tab
    if (activeTab !== "ALL") {
      const categoryLabel = categoryTabs.find((tab) => tab.name === activeTab)?.label;
      if (categoryLabel) {
        transformed = transformed.filter((p) => p.category === categoryLabel);
      }
    }

    return transformed;
  })();

  // ─────────────────────────────────────────────────────────────────────────
  // Derived Product Lists
  // ─────────────────────────────────────────────────────────────────────────

  const featuredProducts = (Array.isArray(transformedProducts) ? transformedProducts : [])
    .filter((p) => p.isFeatured)
    .slice(0, 4);

  const gearProducts = (Array.isArray(transformedProducts) ? transformedProducts : []).filter((p) =>
    p.category?.toLowerCase().includes("gear"),
  );

  const isLoading = productsLoading || categoriesLoading || isLoadingMedia;

  return {
    displayedProducts,
    featuredProducts,
    gearProducts,
    categoryTabs,
    availableTags,
    fabrics,
    certificates,
    sizeCharts,
    accessories,
    isLoading,
  };
}
