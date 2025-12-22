import type { Accessory, Category, Certificate, Fabric, MediaAsset, ProductSummary, SizeChart } from "@shared/schema";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Grid2X2, Grid3X3, LayoutGrid, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ProductFilters } from "@/components/products/ProductFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
// CLEANED: Removed deprecated useInfiniteScroll - using traditional pagination
import { ProductsListSEO } from "@/components/products/ProductsListSEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnalyticsTracker } from "@/hooks/useAnalyticsTracker";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { MediaQueryKeys } from "@/lib/media-query-keys";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const [location, setLocation] = useLocation();
  usePerformanceMonitor('ProductsPage');
  const { trackPageView, trackFunnelStage } = useAnalyticsTracker();
  const [displayedProducts, setDisplayedProducts] = useState<ProductSummary[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 12;
  
  // Parse URL search params
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  
  // Type-safe view mode parsing
  const viewParam = searchParams.get("view");
  const validViewMode = viewParam === "small" || viewParam === "medium" || viewParam === "large" ? viewParam : "medium";
  const [viewMode, setViewMode] = useState<"small" | "medium" | "large">(validViewMode);
  
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "name");

  // Advanced filters state
  const [selectedFilters, setSelectedFilters] = useState({
    fabrics: [] as number[],
    certificates: [] as number[],
    sizeCharts: [] as number[],
    accessories: [] as number[],
    tags: [] as string[],
    moqRange: [0, 10000] as [number, number]
  });

  // Fetch categories for filter
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch fabrics for filter
  const { data: fabrics = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
  });

  // Fetch certificates for filter
  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  // Fetch size charts for filter
  const { data: sizeCharts = [] } = useQuery<SizeChart[]>({
    queryKey: ["/api/size-charts"],
  });

  // Fetch accessories for filter
  const { data: accessories = [] } = useQuery<Accessory[]>({
    queryKey: ["/api/accessories"],
  });

  // Fetch media assets for displaying images/videos
  const { data: mediaData } = useQuery<{ data: MediaAsset[] }>({
    queryKey: MediaQueryKeys.list,
    queryFn: () => apiRequest("/api/media?all=true", { method: "GET" }),
  });
  const mediaAssets = mediaData?.data || [];

  // Track page view on mount
  useEffect(() => {
    trackPageView('/products');
    trackFunnelStage('Product List View');
  }, [trackPageView, trackFunnelStage]);

  // Build query params for products
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.set("search", searchTerm);
  if (selectedCategory && selectedCategory !== "all") queryParams.set("category", selectedCategory);
  queryParams.set("active", "true");

  // Fetch products with placeholderData for smooth filter transitions
  const { data: productsData, isLoading, isPlaceholderData } = useQuery<{data: ProductSummary[]}>({
    queryKey: ['/api/products', searchTerm, selectedCategory],
    placeholderData: keepPreviousData,
  });
  
  const products = Array.isArray(productsData?.data) ? productsData.data : [];

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (viewMode !== "medium") params.set("view", viewMode);
    if (sortBy !== "name") params.set("sort", sortBy);
    
    const newPath = params.toString() ? `/products?${params.toString()}` : '/products';
    if (location !== newPath) {
      setLocation(newPath);
    }
  }, [searchTerm, selectedCategory, viewMode, sortBy, location, setLocation]);

  // Extract unique tags from all products
  const availableTags = [...new Set(products.flatMap(p => p.tags || []))];

  // Filter and sort products
  const sortedProducts = products
    .filter(product => {
      // Advanced filters
      if (selectedFilters.fabrics.length > 0 && !selectedFilters.fabrics.includes(product.fabricId || 0)) {
        return false;
      }
      
      if (selectedFilters.certificates.length > 0) {
        const productCerts = product.certificateIds || [];
        if (!selectedFilters.certificates.some(certId => productCerts.includes(certId))) {
          return false;
        }
      }
      
      if (selectedFilters.sizeCharts.length > 0 && !selectedFilters.sizeCharts.includes(product.sizeChartId || 0)) {
        return false;
      }
      
      if (selectedFilters.accessories.length > 0) {
        const productAccs = product.accessoryIds || [];
        if (!selectedFilters.accessories.some(accId => productAccs.includes(accId))) {
          return false;
        }
      }
      
      if (selectedFilters.tags.length > 0) {
        const productTags = product.tags || [];
        if (!selectedFilters.tags.some(tag => productTags.includes(tag))) {
          return false;
        }
      }
      
      // MOQ filter
      const moq = typeof product.minimumOrderQuantity === 'string' 
        ? parseInt(product.minimumOrderQuantity) || 0 
        : product.minimumOrderQuantity || 0;
      if (moq < selectedFilters.moqRange[0] || moq > selectedFilters.moqRange[1]) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "featured":
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
        default:
          return 0;
      }
    });

  // Initialize displayed products when sortedProducts changes
  useEffect(() => {
    setDisplayedProducts(sortedProducts.slice(0, itemsPerPage));
    setHasMore(sortedProducts.length > itemsPerPage);
  }, [sortedProducts]);

  // CLEANED: Traditional pagination - no infinite scroll needed
  const observerRef = { current: null };



  // Get selected category object for SEO
  const selectedCategoryObj = categories.find(c => c.id.toString() === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Component */}
      <ProductsListSEO 
        category={selectedCategoryObj}
        searchTerm={searchTerm}
        totalProducts={sortedProducts.length}
      />

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-modal-backdrop">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <h1 className="text-2xl font-bold">Products</h1>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-[300px]"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.filter(c => c.isActive).map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-md">
                <Button
                  size="sm"
                  variant={viewMode === "small" ? "default" : "ghost"}
                  onClick={() => setViewMode("small")}
                  className="p-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "medium" ? "default" : "ghost"}
                  onClick={() => setViewMode("medium")}
                  className="p-2"
                >
                  <Grid2X2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "large" ? "default" : "ghost"}
                  onClick={() => setViewMode("large")}
                  className="p-2"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
              </div>

              {/* Advanced Filters */}
              <ProductFilters
                fabrics={fabrics.filter(f => f.isActive)}
                certificates={certificates.filter(c => c.isActive)}
                sizeCharts={sizeCharts.filter(s => s.isActive)}
                accessories={accessories.filter(a => a.isActive)}
                selectedFilters={selectedFilters}
                onFiltersChange={setSelectedFilters}
                availableTags={availableTags}
              />
            </div>
          </div>

          {/* Results count */}
          <div className="mt-2 text-sm text-gray-600">
            Showing {sortedProducts.length} products
            {searchTerm && ` for "${searchTerm}"`}
            {selectedCategory && ` in ${categories.find(c => c.id.toString() === selectedCategory)?.name}`}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        ) : (
          <>
            <div className={cn(
              "transition-opacity duration-200",
              isPlaceholderData && "opacity-50"
            )}>
              <ProductGrid 
                products={displayedProducts} 
                mediaAssets={mediaAssets}
                viewMode={viewMode}
              />
            </div>

          {/* Infinite scroll observer */}
          {hasMore && (
            <div 
              ref={observerRef}
              className="flex justify-center py-8"
            >
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}
        </>
        )}
      </div>
    </div>
  );
}