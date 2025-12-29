import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Grid2X2, Grid3X3, LayoutGrid, Loader2, Search } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useLocation } from "wouter";

import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductsListSEO } from "@/components/products/ProductsListSEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { useAnalyticsTracker } from "@/hooks/useAnalyticsTracker";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { MediaQueryKeys } from "@/lib/media-query-keys";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import {
  AccessorySchema,
  CategorySchema,
  CertificateSchema,
  FabricSchema,
  MediaAssetSchema,
  type ProductSummary,
  ProductSummarySchema,
  SizeChartSchema,
  safeParseArray,
} from "@/schemas/product";

// Loading Fallback Component
function ProductsLoader() {
  return (
    <div className="flex min-h-96 items-center justify-center">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  );
}

export default function ProductsPage() {
  const [location, setLocation] = useLocation();
  usePerformanceMonitor("ProductsPage");
  const { trackPageView, trackFunnelStage } = useAnalyticsTracker();
  const [displayedProducts, setDisplayedProducts] = useState<ProductSummary[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 12;

  // Parse URL search params
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");

  // Type-safe view mode parsing
  const viewParam = searchParams.get("view");
  const validViewMode =
    viewParam === "small" || viewParam === "medium" || viewParam === "large" ? viewParam : "medium";
  const [viewMode, setViewMode] = useState<"small" | "medium" | "large">(validViewMode);

  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "name");

  // Advanced filters state
  const [selectedFilters, setSelectedFilters] = useState({
    fabrics: [] as number[],
    certificates: [] as number[],
    sizeCharts: [] as number[],
    accessories: [] as number[],
    tags: [] as string[],
    moqRange: [0, 10000] as [number, number],
  });

  // --- Centralized Data Fetching ---

  // 1. Categories
  const { data: categoriesData = [] } = useQuery<unknown[]>({
    queryKey: ["/api/categories"],
  });
  const categories = safeParseArray(CategorySchema, categoriesData);

  // 2. Fabrics
  const { data: fabricsData = [] } = useQuery<unknown[]>({
    queryKey: ["/api/fabrics"],
  });
  const fabrics = safeParseArray(FabricSchema, fabricsData);

  // 3. Certificates
  const { data: certificatesData = [] } = useQuery<unknown[]>({
    queryKey: ["/api/certificates"],
  });
  const certificates = safeParseArray(CertificateSchema, certificatesData);

  // 4. Size Charts
  const { data: sizeChartsData = [] } = useQuery<unknown[]>({
    queryKey: ["/api/size-charts"],
  });
  const sizeCharts = safeParseArray(SizeChartSchema, sizeChartsData);

  // 5. Accessories
  const { data: accessoriesData = [] } = useQuery<unknown[]>({
    queryKey: ["/api/accessories"],
  });
  const accessories = safeParseArray(AccessorySchema, accessoriesData);

  // 6. Media Assets
  const { data: mediaResponse } = useQuery({
    queryKey: MediaQueryKeys.list,
    queryFn: () => apiRequest("/api/media?all=true", { method: "GET" }),
  });
  const mediaAssets = safeParseArray(MediaAssetSchema, mediaResponse?.data || []);

  // 7. Products
  const {
    data: productsResponse,
    isLoading,
    isPlaceholderData,
  } = useQuery({
    queryKey: ["/api/products", searchTerm, selectedCategory],
    queryFn: () => apiRequest("/api/products", { method: "GET" }),
    placeholderData: keepPreviousData,
  });
  const products = safeParseArray(ProductSummarySchema, productsResponse?.data || []);

  // Track page view on mount
  useEffect(() => {
    trackPageView("/products");
    trackFunnelStage("Product List View");
  }, [trackPageView, trackFunnelStage]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (viewMode !== "medium") params.set("view", viewMode);
    if (sortBy !== "name") params.set("sort", sortBy);

    const newPath = params.toString() ? `/products?${params.toString()}` : "/products";
    if (location !== newPath) {
      setLocation(newPath);
    }
  }, [searchTerm, selectedCategory, viewMode, sortBy, location, setLocation]);

  // Extract unique tags from all products
  const availableTags = [...new Set((products || []).filter(Boolean).flatMap((p) => p.tags || []))];

  // Filter and sort products
  const sortedProducts = (products || [])
    .filter((product) => {
      if (!product) return false;
      // Advanced filters
      if (
        selectedFilters.fabrics.length > 0 &&
        !selectedFilters.fabrics.includes(product.fabricId || 0)
      ) {
        return false;
      }

      if (selectedFilters.certificates.length > 0) {
        const productCerts = product.certificateIds || [];
        if (!selectedFilters.certificates.some((certId) => productCerts.includes(certId))) {
          return false;
        }
      }

      if (
        selectedFilters.sizeCharts.length > 0 &&
        !selectedFilters.sizeCharts.includes(product.sizeChartId || 0)
      ) {
        return false;
      }

      if (selectedFilters.accessories.length > 0) {
        const productAccs = product.accessoryIds || [];
        if (!selectedFilters.accessories.some((accId) => productAccs.includes(accId))) {
          return false;
        }
      }

      if (selectedFilters.tags.length > 0) {
        const productTags = product.tags || [];
        if (!selectedFilters.tags.some((tag) => productTags.includes(tag))) {
          return false;
        }
      }

      // MOQ filter
      const moq =
        typeof product.minimumOrderQuantity === "string"
          ? parseInt(product.minimumOrderQuantity, 10) || 0
          : product.minimumOrderQuantity || 0;
      if (moq < selectedFilters.moqRange[0] || moq > selectedFilters.moqRange[1]) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a?.name || "").localeCompare(b?.name || "");
        case "newest":
          // Date parsing
          return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
        case "featured":
          return (b?.isFeatured ? 1 : 0) - (a?.isFeatured ? 1 : 0);
        default:
          return 0;
      }
    });

  // Initialize displayed products when sortedProducts changes
  useEffect(() => {
    setDisplayedProducts(sortedProducts.slice(0, itemsPerPage));
    setHasMore(sortedProducts.length > itemsPerPage);
  }, [sortedProducts]);

  const observerRef = { current: null };

  // Get selected category object for SEO
  const selectedCategoryObj = categories.find((c) => c.id.toString() === selectedCategory);

  return (
    <div className="bg-muted/30 pt-production-header min-h-screen">
      <GlobalErrorBoundary>
        <Suspense fallback={<ProductsLoader />}>
          {/* SEO Component */}
          <ProductsListSEO
            category={selectedCategoryObj}
            searchTerm={searchTerm}
            totalProducts={sortedProducts.length}
          />

          {/* Header */}
          <div className="z-modal-backdrop border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 border-b backdrop-blur-md">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                <Typography.H1 className="text-2xl font-bold">Products</Typography.H1>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 sm:w-80"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories
                        .filter((c) => c.isActive)
                        .map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category?.name || "Category"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode */}
                  <div className="bg-muted flex gap-1 rounded-md p-1">
                    <Button
                      size="sm"
                      variant={viewMode === "small" ? "default" : "ghost"}
                      onClick={() => setViewMode("small")}
                      className="p-2"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "medium" ? "default" : "ghost"}
                      onClick={() => setViewMode("medium")}
                      className="p-2"
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "large" ? "default" : "ghost"}
                      onClick={() => setViewMode("large")}
                      className="p-2"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Advanced Filters */}
                  <ProductFilters
                    fabrics={fabrics.filter((f) => f.isActive)}
                    certificates={certificates.filter((c) => c.isActive)}
                    sizeCharts={sizeCharts.filter((s) => s.isActive)}
                    accessories={accessories.filter((a) => a.isActive)}
                    selectedFilters={selectedFilters}
                    onFiltersChange={setSelectedFilters}
                    availableTags={availableTags}
                  />
                </div>
              </div>

              {/* Results count */}
              <div className="text-muted-foreground mt-2 text-sm">
                Showing {sortedProducts.length} products
                {searchTerm && ` for "${searchTerm}"`}
                {selectedCategory &&
                  ` in ${
                    categories.find((c) => c.id.toString() === selectedCategory)?.name || "Category"
                  }`}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="container mx-auto px-4 py-8">
            {isLoading ? (
              <ProductsLoader />
            ) : sortedProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Typography.P className="text-muted-foreground">No products found</Typography.P>
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "transition-opacity duration-200",
                    isPlaceholderData && "opacity-50",
                  )}
                >
                  <ProductGrid
                    products={displayedProducts}
                    mediaAssets={mediaAssets}
                    viewMode={viewMode}
                    categories={categories}
                  />
                </div>

                {/* Infinite scroll observer (Placeholder) */}
                {hasMore && (
                  <div ref={observerRef} className="flex justify-center py-8">
                    <Loader2 className="text-luxury-gray-600 mx-auto mb-3 h-8 w-8 animate-spin" />
                    <Typography.P className="text-luxury-body text-sm">
                      "Loading more products..."
                    </Typography.P>
                  </div>
                )}
              </>
            )}
          </div>
        </Suspense>
      </GlobalErrorBoundary>
    </div>
  );
}
