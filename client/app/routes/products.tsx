import { Grid2X2, Grid3X3, LayoutGrid, Loader2, Search } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { GlobalErrorBoundary } from "@/components/error-boundaries/GlobalErrorBoundary";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductsListSEO } from "@/components/products/ProductsListSEO";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import {
  AccessorySchema,
  CategorySchema,
  CertificateSchema,
  FabricSchema,
  type ProductSummary,
  ProductSummarySchema,
  SizeChartSchema,
  safeParseArray,
} from "@/schemas/product";
import type { Route } from "./+types/products";

export function meta({ loaderData, location }: Route.MetaArgs) {
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get("search");
  const categoryId = searchParams.get("category");

  // Find category name if possible from loader data
  const loaderDataCast = loaderData as { categories?: Array<{ id: number; name: string }> };
  const categories = Array.isArray(loaderDataCast?.categories) ? loaderDataCast.categories : [];
  const category = categories.find(
    (c: { id: number; name: string }) => c.id.toString() === categoryId,
  );

  let title = "Products | Run Apparel";
  let description =
    "Browse our extensive catalog of professional sportswear products and textiles.";

  if (searchTerm) {
    title = `Search results for "${searchTerm}" | Run Apparel`;
    description = `Discover ${searchTerm} sportswear and textile solutions in our B2B catalog.`;
  } else if (category) {
    title = `${category.name} | Sportswear Manufacturing | Run Apparel`;
    description = `Premium ${category.name.toLowerCase()} manufacturing solutions. Professional B2B textile production since 1889.`;
  }

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: "sportswear, manufacturing, B2B, apparel, textile, wholesale" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const categoryId = url.searchParams.get("category");

  const port = import.meta.env.PORT || "5002" || "5002";
  const base = `http://localhost:${port}`;
  const cookie = request.headers.get("cookie") ?? "";
  const fetchHeaders = { cookie };

  // Build products query — pass through search/category to server API
  const productParams = new URLSearchParams({ limit: "100", active: "true" });
  if (search) productParams.set("search", search);
  if (categoryId && categoryId !== "all") productParams.set("category", categoryId);

  // Parallel fetch from server API — replaces direct Drizzle queries
  const [categoriesRes, fabricsRes, certificatesRes, sizeChartsRes, accessoriesRes, productsRes] =
    await Promise.all([
      fetch(`${base}/api/categories`, { headers: fetchHeaders }),
      fetch(`${base}/api/fabrics`, { headers: fetchHeaders }),
      fetch(`${base}/api/certificates`, { headers: fetchHeaders }),
      fetch(`${base}/api/size-charts`, { headers: fetchHeaders }),
      fetch(`${base}/api/accessories`, { headers: fetchHeaders }),
      fetch(`${base}/api/products?${productParams}`, { headers: fetchHeaders }),
    ]);

  const [
    categoriesData,
    fabricsData,
    certificatesData,
    sizeChartsData,
    accessoriesData,
    productsData,
  ] = await Promise.all([
    categoriesRes.json() as Promise<unknown[]>,
    fabricsRes.json() as Promise<unknown[]>,
    certificatesRes.json() as Promise<unknown[]>,
    sizeChartsRes.json() as Promise<unknown[]>,
    accessoriesRes.json() as Promise<unknown[]>,
    productsRes.json() as Promise<{ data: unknown[]; pagination?: unknown }>,
  ]);

  return {
    categories: categoriesData,
    fabrics: fabricsData,
    certificates: certificatesData,
    sizeCharts: sizeChartsData,
    accessories: accessoriesData,
    // Products API returns paginated shape { data, pagination } — extract data array
    products: productsData.data ?? [],
  };
}

// Loading Fallback Component
function ProductsLoader() {
  return (
    <div className="flex min-h-96 items-center justify-center">
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
    </div>
  );
}

export function Component() {
  // Direct Server Data (No client-side fetch required for initial load)
  const {
    categories: serverCategories,
    fabrics: serverFabrics,
    certificates: serverCertificates,
    sizeCharts: serverSizeCharts,
    accessories: serverAccessories,
    products: serverProducts,
  } = useLoaderData<typeof loader>();

  const [searchParams, setSearchParams] = useSearchParams();
  usePerformanceMonitor("ProductsPage");
  const { trackPageView, trackFunnelStage } = useAnalyticsTracker();
  const [displayedProducts, setDisplayedProducts] = useState<ProductSummary[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 12;

  // Parse URL search params
  const initialSearchTerm = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "all";
  const viewParam = searchParams.get("view");
  const validViewMode =
    viewParam === "small" || viewParam === "medium" || viewParam === "large" ? viewParam : "medium";
  const initialSortBy = searchParams.get("sort") || "name";

  // State
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [viewMode, setViewMode] = useState<"small" | "medium" | "large">(validViewMode);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Advanced filters state
  const [selectedFilters, setSelectedFilters] = useState({
    fabrics: [] as number[],
    certificates: [] as number[],
    sizeCharts: [] as number[],
    accessories: [] as number[],
    tags: [] as string[],
    moqRange: [0, 10000] as [number, number],
  });

  // --- Safe Parsing of Server Data ---
  const categories = useMemo(
    () => safeParseArray(CategorySchema, serverCategories),
    [serverCategories],
  );
  const fabrics = useMemo(() => safeParseArray(FabricSchema, serverFabrics), [serverFabrics]);
  const certificates = useMemo(
    () => safeParseArray(CertificateSchema, serverCertificates),
    [serverCertificates],
  );
  const sizeCharts = useMemo(
    () => safeParseArray(SizeChartSchema, serverSizeCharts),
    [serverSizeCharts],
  );
  const accessories = useMemo(
    () => safeParseArray(AccessorySchema, serverAccessories),
    [serverAccessories],
  );

  // Use server products by default.
  // Note: Client-side search/filter state updates URL -> triggers Loader -> updates serverProducts.
  const products = useMemo(() => {
    if (!isHydrated) return [];
    return safeParseArray(ProductSummarySchema, serverProducts);
  }, [serverProducts, isHydrated]);

  // Track page view on mount
  useEffect(() => {
    trackPageView("/products");
    trackFunnelStage("Product List View");
  }, [trackPageView, trackFunnelStage]);

  // Update URL params when filters change (Debounced sync)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Only update if changed
    const currentSearch = params.get("search") || "";
    const currentCategory = params.get("category") || "all";
    const currentView = params.get("view") || "medium";
    const currentSort = params.get("sort") || "name";

    let changed = false;

    if (searchTerm !== currentSearch) {
      if (searchTerm) {
        params.set("search", searchTerm);
      } else {
        params.delete("search");
      }
      changed = true;
    }

    if (selectedCategory !== currentCategory) {
      if (selectedCategory && selectedCategory !== "all") {
        params.set("category", selectedCategory);
      } else {
        params.delete("category");
      }
      changed = true;
    }

    if (viewMode !== currentView) {
      params.set("view", viewMode);
      changed = true;
    }

    if (sortBy !== currentSort) {
      params.set("sort", sortBy);
      changed = true;
    }

    if (changed) {
      setSearchParams(params, { replace: true, preventScrollReset: true });
    }
  }, [searchTerm, selectedCategory, viewMode, sortBy, setSearchParams, searchParams]);

  // Extract unique tags from all products
  const availableTags = useMemo(() => {
    if (!isHydrated) return [];
    return [...new Set((products || []).filter(Boolean).flatMap((p) => p.tags || []))];
  }, [products, isHydrated]);

  // Filter and sort products (Client-side refinement of server results)
  const sortedProducts = useMemo(() => {
    return (products || [])
      .filter((product) => {
        if (!product) {
          return false;
        }
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
            // Use time value or 0 if invalid
            return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
          case "featured":
            return (b?.isFeatured ? 1 : 0) - (a?.isFeatured ? 1 : 0);
          default:
            return 0;
        }
      });
  }, [products, selectedFilters, sortBy]);

  // Initialize displayed products when sortedProducts changes
  useEffect(() => {
    setDisplayedProducts(sortedProducts.slice(0, itemsPerPage));
    setHasMore(sortedProducts.length > itemsPerPage);
  }, [sortedProducts]);

  // Infinite Scroll Logic
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !isHydrated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          // Load more
          setDisplayedProducts((prev) => {
            const nextBatch = sortedProducts.slice(prev.length, prev.length + itemsPerPage);
            if (nextBatch.length === 0) {
              setHasMore(false);
              return prev;
            }
            if (prev.length + nextBatch.length >= sortedProducts.length) {
              setHasMore(false);
            }
            return [...prev, ...nextBatch];
          });
        }
      },
      { rootMargin: "400px" },
    );

    const currentTarget = observerRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, sortedProducts, isHydrated]);

  // Get selected category object for SEO
  const selectedCategoryObj = categories.find((c) => c.id.toString() === selectedCategory);

  return (
    <div className="min-h-screen bg-muted/30 pt-production-header">
      <GlobalErrorBoundary>
        <Suspense fallback={<ProductsLoader />}>
          {/* SEO Component */}
          <ProductsListSEO
            category={selectedCategoryObj}
            searchTerm={searchTerm}
            totalProducts={sortedProducts.length}
          />

          {/* Header */}
          <div className="z-sticky border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 border-b backdrop-blur-md">
            <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8">
              {/* Breadcrumbs Integration */}
              <div className="mb-4 flex justify-start">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link to="/">Home</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Products</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>

              <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
                <Typography.H1 className="font-neue-stance text-2xl font-bold tracking-tight">
                  Products
                </Typography.H1>

                <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 sm:w-80"
                      aria-label="Search products"
                    />
                  </div>

                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48" aria-label="Filter by category">
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
                    <SelectTrigger className="w-full sm:w-40" aria-label="Sort by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode */}
                  <section className="flex gap-1 rounded-md bg-muted p-1" aria-label="View mode">
                    <Button
                      size="sm"
                      variant={viewMode === "small" ? "default" : "ghost"}
                      onClick={() => setViewMode("small")}
                      className="p-2"
                      aria-label="Small grid view"
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "medium" ? "default" : "ghost"}
                      onClick={() => setViewMode("medium")}
                      className="p-2"
                      aria-label="Medium grid view"
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === "large" ? "default" : "ghost"}
                      onClick={() => setViewMode("large")}
                      className="p-2"
                      aria-label="Large grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </section>
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
            <output
              className="container mx-auto mt-2 max-w-7xl px-4 pb-2 text-sm text-muted-foreground md:px-8"
              aria-live="polite"
            >
              Showing {sortedProducts.length} products
              {searchTerm && ` for "${searchTerm}"`}
              {selectedCategory &&
                selectedCategory !== "all" &&
                ` in ${
                  categories.find((c) => c.id.toString() === selectedCategory)?.name || "Category"
                }`}
            </output>
          </div>

          {/* Products Grid */}
          <div className="container mx-auto max-w-7xl px-4 py-8 md:px-8">
            {/* No isLoading state needed as loader suspense handles it */}
            {sortedProducts.length === 0 ? (
              <div className="py-12 text-center">
                <Typography.P className="text-muted-foreground">No products found</Typography.P>
              </div>
            ) : (
              <>
                <div className="transition-opacity duration-200">
                  <ProductGrid
                    products={displayedProducts}
                    viewMode={viewMode}
                    categories={categories}
                  />
                </div>

                {/* Infinite scroll observer */}
                {hasMore && (
                  <div
                    ref={observerRef}
                    className="flex flex-col items-center justify-center gap-3 py-12"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    <Typography.P className="text-xs font-medium uppercase tracking-widest text-muted-foreground/60">
                      Loading more products
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

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };
