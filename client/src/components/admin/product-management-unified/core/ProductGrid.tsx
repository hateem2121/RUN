import type { Category, Fabric, MediaAsset, Product } from "@shared/schema";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Grid, List, Package, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getOptimizedQueryOptions } from "@/lib/queryClient";
import { ProductAdvancedFilters } from "../advanced/ProductAdvancedFilters";
import { ProductBulkOperations } from "../advanced/ProductBulkOperations";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  onProductSelect?: (product: Product) => void;
  onProductEdit?: (product: Product) => void;
  onProductCreate?: () => void;
}

const PAGINATION_CONFIG = {
  ITEMS_PER_PAGE: 20,
};

// Product Display Component with Traditional Pagination
interface ProductDisplayProps {
  products: Product[];
  viewMode: "grid" | "list";
  getCategory: (categoryId: number | null) => Category | undefined;
  getFabric: (fabricId: number | null) => Fabric | undefined;
  getMediaAsset: (mediaId: number) => MediaAsset | undefined;
  onProductSelect?: (product: Product) => void;
  onProductEdit?: (product: Product) => void;
  selectedProductIds: number[];
  setSelectedProductIds: (ids: number[]) => void;
}

function ProductDisplay({
  products,
  viewMode,
  getCategory,
  getFabric,
  getMediaAsset,
  onProductSelect,
  onProductEdit,
  selectedProductIds,
  setSelectedProductIds,
}: ProductDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Handle product deletion
  const handleProductDelete = useCallback(() => {
    // Refresh the product list after deletion
    queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    queryClient.invalidateQueries({
      queryKey: ["/api/admin/products/initial-data"],
    });
  }, [queryClient]);

  // Render individual product item
  const renderProductCard = useCallback(
    (product: Product) => {
      return (
        <div key={product.id}>
          <ProductCard
            product={product}
            category={getCategory(product.categoryId)}
            fabric={getFabric(product.fabricId)}
            getMediaAsset={getMediaAsset}
            viewMode={viewMode}
            onSelect={() => onProductSelect?.(product)}
            onEdit={() => onProductEdit?.(product)}
            onDelete={handleProductDelete}
          />
        </div>
      );
    },
    [
      getCategory,
      getFabric,
      getMediaAsset,
      viewMode,
      onProductSelect,
      onProductEdit,
      handleProductDelete,
    ],
  );

  // Traditional pagination rendering (virtual scrolling eliminated)
  const ITEMS_PER_PAGE = PAGINATION_CONFIG.ITEMS_PER_PAGE;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageProducts = products.slice(startIndex, endIndex);

  const PaginationControls = () => (
    <div className="mt-6 flex items-center justify-between">
      <p className="text-muted-foreground text-sm">
        Showing {startIndex + 1}-{Math.min(endIndex, products.length)} of {products.length} products
      </p>
      <div className="flex items-center gap-2">
        <Button
          data-testid="pagination-previous-button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="px-3 text-sm font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          data-testid="pagination-next-button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef}>
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "space-y-4"
        }
      >
        {currentPageProducts.map((product) => renderProductCard(product))}
      </div>
      {totalPages > 1 && <PaginationControls />}
    </div>
  );
}

export function ProductGrid({ onProductSelect, onProductEdit, onProductCreate }: ProductGridProps) {
  // Phase 3: Advanced Features - Enhanced State Management
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState<string>(
    searchParams.get("category") || "all",
  );
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    (searchParams.get("view") as "grid" | "list") || "grid",
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    searchParams.get("advanced") === "true",
  );
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get("limit")) || 20);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) params.set("search", searchQuery);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (viewMode !== "grid") params.set("view", viewMode);
    if (currentPage > 1) params.set("page", currentPage.toString());
    if (pageSize !== 20) params.set("limit", pageSize.toString());
    if (showAdvancedFilters) params.set("advanced", "true");

    setSearchParams(params, { replace: true });
  }, [
    searchQuery,
    categoryFilter,
    statusFilter,
    viewMode,
    currentPage,
    pageSize,
    showAdvancedFilters,
    setSearchParams,
  ]);

  // Phase 2: Real-time Sync - Enhanced data fetching with pagination
  interface PaginatedResponse {
    data: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  }

  // Phase 4.1: Use batched endpoint for initial data loading with optimized caching
  const staticOptions = getOptimizedQueryOptions("static");
  const { data: initialData, isPending: initialDataLoading } = useQuery({
    queryKey: ["/api/admin/products/initial-data"],
    queryFn: async () => {
      const response = await fetch("/api/admin/products/initial-data");
      if (!response.ok) throw new Error("Failed to fetch initial data");
      return response.json();
    },
    staleTime: staticOptions.staleTime,
    gcTime: staticOptions.gcTime,
    refetchOnWindowFocus: staticOptions.refetchOnWindowFocus,
    refetchInterval: false as const,
  });

  // Use batched data or fall back to individual queries
  const products: Product[] = initialData?.products || [];
  // Derive pagination from meta or create default values
  const pagination = initialData?.meta
    ? {
        page: 1,
        limit: initialData.meta.totalProducts || 50,
        total: initialData.meta.totalProducts || 0,
        totalPages: 1,
        hasMore: false,
      }
    : undefined;
  const categories: Category[] = initialData?.categories || [];
  const fabrics: Fabric[] = initialData?.fabrics || [];
  // Media assets are now sent directly without pagination wrapper
  const mediaAssets: MediaAsset[] = initialData?.mediaAssets || [];

  // Only fetch additional products if paginating beyond initial data
  const productsOptions = getOptimizedQueryOptions("products");
  const { data: additionalProductResponse } = useQuery<PaginatedResponse>({
    queryKey: ["/api/products", currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/products?page=${currentPage}&limit=${pageSize}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    enabled: currentPage > 1, // Only fetch if not on first page
    staleTime: productsOptions.staleTime,
    gcTime: productsOptions.gcTime,
    refetchOnWindowFocus: productsOptions.refetchOnWindowFocus,
    refetchInterval: false as const,
  });

  // Use additional products if available
  const allProducts =
    currentPage > 1 && additionalProductResponse
      ? additionalProductResponse?.data || products
      : products;

  // Combine loading states
  const productsLoading = initialDataLoading;

  // Phase 3: Advanced Features - Callbacks for advanced features
  const handleFilteredProductsChange = useCallback((filtered: Product[]) => {
    setFilteredProducts(filtered);
  }, []);

  const handleBulkActionComplete = useCallback(() => {
    setSelectedProductIds([]);
  }, []);

  // Phase 3: Basic filtering logic (when advanced filters are off)
  const displayProducts = useMemo(() => {
    if (showAdvancedFilters && filteredProducts.length > 0) {
      return filteredProducts; // Use advanced filtered results
    }

    return allProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        categoryFilter === "all" || product.categoryId?.toString() === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && product.isActive) ||
        (statusFilter === "inactive" && !product.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [
    allProducts,
    searchQuery,
    categoryFilter,
    statusFilter,
    showAdvancedFilters,
    filteredProducts,
  ]);

  // Helper functions for getting related data
  const getCategory = (categoryId: number | null) => categories.find((c) => c.id === categoryId);

  const getFabric = (fabricId: number | null) => fabrics.find((f) => f.id === fabricId);

  const getMediaAsset = (mediaId: number) =>
    Array.isArray(mediaAssets) ? mediaAssets.find((m) => m.id === mediaId) : undefined;

  if (productsLoading) {
    return (
      <div className="h-loading-center flex items-center justify-center">
        <div className="text-center">
          <div className="border-border mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-t-blue-600" />
          <p className="text-muted-foreground text-sm">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Product Management</h1>
            <p className="text-muted-foreground">{displayProducts.length} products</p>
          </div>
        </div>
        <Button
          data-testid="new-product-button"
          onClick={onProductCreate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      {/* Phase 3: Bulk Operations */}
      <ProductBulkOperations
        products={displayProducts}
        selectedProductIds={selectedProductIds}
        onSelectionChange={setSelectedProductIds}
        onBulkActionComplete={handleBulkActionComplete}
      />

      {/* Phase 3: Advanced Filters */}
      {showAdvancedFilters && (
        <ProductAdvancedFilters
          products={products}
          categories={categories}
          fabrics={fabrics}
          onFilteredProductsChange={handleFilteredProductsChange}
        />
      )}

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground/70 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            data-testid="search-products-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger data-testid="category-filter-select" className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem data-testid="category-filter-all" value="all">
                All Categories
              </SelectItem>
              {categories.map((category) => (
                <SelectItem
                  key={category.id}
                  data-testid={`category-filter-${category.id}`}
                  value={category.id.toString()}
                >
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="status-filter-select" className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem data-testid="status-filter-all" value="all">
                All Status
              </SelectItem>
              <SelectItem data-testid="status-filter-active" value="active">
                Active
              </SelectItem>
              <SelectItem data-testid="status-filter-inactive" value="inactive">
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Phase 3: Advanced Filter Toggle */}
          <Button
            data-testid="toggle-advanced-filters-button"
            variant={showAdvancedFilters ? "default" : "outline"}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="whitespace-nowrap"
          >
            <Filter className="mr-2 h-4 w-4" />
            {showAdvancedFilters ? "Basic" : "Advanced"}
          </Button>

          <div className="bg-muted flex rounded-md p-1">
            <Button
              data-testid="view-mode-grid-button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              data-testid="view-mode-list-button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(searchQuery || categoryFilter !== "all" || statusFilter !== "all") && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <button
                data-testid="clear-search-filter-button"
                onClick={() => setSearchQuery("")}
                className="hover:bg-muted/30 ml-1 flex h-4 w-4 items-center justify-center rounded-full text-xs"
              >
                ×
              </button>
            </Badge>
          )}
          {categoryFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Category: {categories.find((c) => c.id.toString() === categoryFilter)?.name}
              <button
                data-testid="clear-category-filter-button"
                onClick={() => setCategoryFilter("all")}
                className="hover:bg-muted/30 ml-1 flex h-4 w-4 items-center justify-center rounded-full text-xs"
              >
                ×
              </button>
            </Badge>
          )}
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {statusFilter}
              <button
                data-testid="clear-status-filter-button"
                onClick={() => setStatusFilter("all")}
                className="hover:bg-muted/30 ml-1 flex h-4 w-4 items-center justify-center rounded-full text-xs"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Products Grid/List */}
      {displayProducts.length === 0 ? (
        <div className="bg-background rounded-lg py-12 text-center">
          <Package className="text-muted-foreground/50 mx-auto mb-4 h-16 w-16" />
          <h3 className="text-foreground mb-2 text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground mb-4">
            {products.length === 0
              ? "Get started by creating your first product."
              : "Try adjusting your search or filters."}
          </p>
          {products.length === 0 && (
            <Button
              data-testid="create-first-product-button"
              onClick={onProductCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create First Product
            </Button>
          )}
        </div>
      ) : (
        <ProductDisplay
          products={displayProducts}
          viewMode={viewMode}
          getCategory={getCategory}
          getFabric={getFabric}
          getMediaAsset={getMediaAsset}
          onProductSelect={onProductSelect}
          onProductEdit={onProductEdit}
          selectedProductIds={selectedProductIds}
          setSelectedProductIds={setSelectedProductIds}
        />
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between rounded-lg border bg-white p-4">
          <div className="text-muted-foreground text-sm">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} products
          </div>

          <div className="flex items-center gap-2">
            <Button
              data-testid="pagination-bottom-previous-button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    data-testid={`pagination-page-${pageNum}-button`}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              data-testid="pagination-bottom-next-button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasMore}
            >
              Next
            </Button>
          </div>

          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value, 10));
              setCurrentPage(1); // Reset to first page when changing page size
            }}
          >
            <SelectTrigger data-testid="page-size-select" className="w-32 sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem data-testid="page-size-10" value="10">
                10 per page
              </SelectItem>
              <SelectItem data-testid="page-size-20" value="20">
                20 per page
              </SelectItem>
              <SelectItem data-testid="page-size-50" value="50">
                50 per page
              </SelectItem>
              <SelectItem data-testid="page-size-100" value="100">
                100 per page
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
