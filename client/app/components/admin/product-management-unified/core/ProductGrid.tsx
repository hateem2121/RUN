import type { Category, Fabric, MediaAsset, Product } from "@shared/index";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Grid, List, Package, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { GlassCard } from "@/components/admin/shared/GlassCard";
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
}

function ProductDisplay({
  products,
  viewMode,
  getCategory,
  getFabric,
  getMediaAsset,
  onProductSelect,
  onProductEdit,
}: ProductDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Handle product deletion
  const handleProductDelete = useCallback(() => {
    // Refresh the product list after deletion
    queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
  }, [queryClient]);

  // Render individual product item
  const renderProductCard = useCallback(
    (product: Product) => {
      return (
        <div key={product.id}>
          <ProductCard
            product={product}
            {...(getCategory(product.categoryId)
              ? { category: getCategory(product.categoryId) as Category }
              : {})}
            {...(getFabric(product.fabricId)
              ? { fabric: getFabric(product.fabricId) as Fabric }
              : {})}
            getMediaAsset={getMediaAsset}
            viewMode={viewMode}
            {...(onProductSelect ? { onSelect: () => onProductSelect?.(product) } : {})}
            {...(onProductEdit ? { onEdit: () => onProductEdit?.(product) } : {})}
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
    <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-6">
      <p className="text-admin-muted text-sm font-bold tracking-wider uppercase">
        Showing {startIndex + 1}-{Math.min(endIndex, products.length)} of {products.length} products
      </p>
      <div className="flex items-center gap-2">
        <Button
          data-testid="pagination-previous-button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
        >
          Previous
        </Button>
        <span className="px-3 font-bold text-white text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          data-testid="pagination-next-button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
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

    if (searchQuery) {
      params.set("search", searchQuery);
    }
    if (categoryFilter !== "all") {
      params.set("category", categoryFilter);
    }
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (viewMode !== "grid") {
      params.set("view", viewMode);
    }
    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }
    if (pageSize !== 20) {
      params.set("limit", pageSize.toString());
    }
    if (showAdvancedFilters) {
      params.set("advanced", "true");
    }

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

  // Phase 4.1: Direct API integration
  const productsOptions = getOptimizedQueryOptions("products");

  // Create search params for API request
  const queryParams = new URLSearchParams();
  queryParams.set("page", currentPage.toString());
  queryParams.set("limit", pageSize.toString());
  if (searchQuery) queryParams.set("search", searchQuery);
  if (categoryFilter !== "all") queryParams.set("categoryId", categoryFilter);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  // (fabricId could be added here if advanced filters use it)

  const { data: apiData, isPending: productsLoading } = useQuery<{
    products: Product[];
    categories: Category[];
    fabrics: Fabric[];
    mediaAssets: MediaAsset[];
    meta: {
      page: number;
      limit: number;
      totalProducts: number;
      totalPages: number;
      hasMore: boolean;
    };
  }>({
    queryKey: [
      "/api/admin/products",
      {
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        categoryId: categoryFilter,
        status: statusFilter,
      },
    ],
    queryFn: async () => {
      const response = await fetch(`/api/admin/products?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      return response.json();
    },
    staleTime: productsOptions.staleTime,
    gcTime: productsOptions.gcTime,
    refetchOnWindowFocus: productsOptions.refetchOnWindowFocus,
  });

  const products: Product[] = apiData?.products || [];
  const categories: Category[] = apiData?.categories || [];
  const fabrics: Fabric[] = apiData?.fabrics || [];
  const mediaAssets: MediaAsset[] = apiData?.mediaAssets || [];

  const pagination = apiData?.meta
    ? {
        page: apiData.meta.page,
        limit: apiData.meta.limit,
        total: apiData.meta.totalProducts,
        totalPages: apiData.meta.totalPages,
        hasMore: apiData.meta.hasMore,
      }
    : undefined;

  const allProducts = products;

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
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-blue-500" />
          <p className="text-admin-muted text-sm font-bold uppercase tracking-wider">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Package className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Product Architecture</h1>
            <p className="text-sm text-admin-muted">
              {displayProducts.length} synchronized products
            </p>
          </div>
        </div>
        <Button
          data-testid="new-product-button"
          onClick={onProductCreate}
          className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold uppercase text-xxs tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all outline-none border-0"
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
      <GlassCard className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-admin-muted" />
            <Input
              data-testid="search-products-input"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 w-full"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger
                data-testid="category-filter-select"
                className="w-40 h-11 bg-surface-black border-white/10 text-white rounded-xl focus:ring-blue-500/50"
              >
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-surface-black border-white/10 text-white rounded-xl">
                <SelectItem
                  data-testid="category-filter-all"
                  value="all"
                  className="focus:bg-white/10 cursor-pointer"
                >
                  All Categories
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    data-testid={`category-filter-${category.id}`}
                    value={category.id.toString()}
                    className="focus:bg-white/10 cursor-pointer text-admin-foreground"
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                data-testid="status-filter-select"
                className="w-32 h-11 bg-surface-black border-white/10 text-white rounded-xl focus:ring-blue-500/50"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-surface-black border-white/10 text-white rounded-xl">
                <SelectItem
                  data-testid="status-filter-all"
                  value="all"
                  className="focus:bg-white/10 cursor-pointer"
                >
                  All Status
                </SelectItem>
                <SelectItem
                  data-testid="status-filter-active"
                  value="active"
                  className="focus:bg-white/10 cursor-pointer"
                >
                  Active
                </SelectItem>
                <SelectItem
                  data-testid="status-filter-inactive"
                  value="inactive"
                  className="focus:bg-white/10 cursor-pointer"
                >
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Phase 3: Advanced Filter Toggle */}
            <Button
              data-testid="toggle-advanced-filters-button"
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`whitespace-nowrap h-11 rounded-xl border-white/10 transition-colors ${showAdvancedFilters ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/5 text-admin-muted hover:bg-white/10 hover:text-white"}`}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showAdvancedFilters ? "Basic" : "Advanced"}
            </Button>

            <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 h-11">
              <Button
                data-testid="view-mode-grid-button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={`px-3 h-full rounded-lg transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-admin-muted hover:bg-white/10 hover:text-white"}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                data-testid="view-mode-list-button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode("list")}
                className={`px-3 h-full rounded-lg transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-admin-muted hover:bg-white/10 hover:text-white"}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || categoryFilter !== "all" || statusFilter !== "all") && (
          <div className="flex flex-wrap gap-2 px-6 pb-6 pt-0 mt-custom-space-58">
            {searchQuery && (
              <Badge
                variant="outline"
                className="gap-1 bg-white/5 border-white/10 text-white rounded-lg px-3 py-1 font-normal"
              >
                <span className="text-admin-muted mr-1">Search:</span> {searchQuery}
                <button
                  aria-label="Action button"
                  type="button"
                  data-testid="clear-search-filter-button"
                  onClick={() => setSearchQuery("")}
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-xs hover:bg-white/10 text-white/70 hover:text-white"
                >
                  ×
                </button>
              </Badge>
            )}
            {categoryFilter !== "all" && (
              <Badge
                variant="outline"
                className="gap-1 bg-white/5 border-white/10 text-white rounded-lg px-3 py-1 font-normal"
              >
                <span className="text-admin-muted mr-1">Category:</span>{" "}
                {categories.find((c) => c.id.toString() === categoryFilter)?.name}
                <button
                  aria-label="Action button"
                  type="button"
                  data-testid="clear-category-filter-button"
                  onClick={() => setCategoryFilter("all")}
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-xs hover:bg-white/10 text-white/70 hover:text-white"
                >
                  ×
                </button>
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge
                variant="outline"
                className="gap-1 bg-white/5 border-white/10 text-white rounded-lg px-3 py-1 font-normal"
              >
                <span className="text-admin-muted mr-1">Status:</span> {statusFilter}
                <button
                  aria-label="Action button"
                  type="button"
                  data-testid="clear-status-filter-button"
                  onClick={() => setStatusFilter("all")}
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full text-xs hover:bg-white/10 text-white/70 hover:text-white"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </GlassCard>

      {/* Products Grid/List */}
      {displayProducts.length === 0 ? (
        <GlassCard className="py-16 text-center">
          <Package className="mx-auto mb-6 h-16 w-16 text-admin-muted/30" />
          <h3 className="mb-2 font-bold text-white text-xl tracking-tight">No products found</h3>
          <p className="mb-8 text-admin-muted">
            {products.length === 0
              ? "Get started by creating your first product."
              : "Try adjusting your search or filters."}
          </p>
          {products.length === 0 && (
            <Button
              data-testid="create-first-product-button"
              onClick={onProductCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold uppercase tracking-widest text-xxs"
            >
              Create First Product
            </Button>
          )}
        </GlassCard>
      ) : (
        <ProductDisplay
          products={displayProducts}
          viewMode={viewMode}
          getCategory={getCategory}
          getFabric={getFabric}
          getMediaAsset={getMediaAsset}
          {...(onProductSelect ? { onProductSelect } : {})}
          {...(onProductEdit ? { onProductEdit } : {})}
        />
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <GlassCard className="mt-8 flex flex-col pt-0 pb-0 gap-6 sm:flex-row items-center justify-between p-4">
          <div className="text-admin-muted text-sm font-bold uppercase tracking-wider">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total}
          </div>

          <div className="flex items-center gap-2">
            <Button
              data-testid="pagination-bottom-previous-button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 rounded-lg hidden sm:flex"
            >
              Previous
            </Button>

            {/* Page numbers */}
            <div className="flex gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum = 0;
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
                    variant={pageNum === currentPage ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded transition-all ${pageNum === currentPage ? "bg-white/20 text-white font-bold" : "text-admin-muted hover:bg-white/10 hover:text-white"}`}
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
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-10 rounded-lg hidden sm:flex"
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
            <SelectTrigger
              data-testid="page-size-select"
              className="w-32 sm:w-36 h-10 bg-surface-black border-white/10 text-white rounded-lg focus:ring-blue-500/50"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-surface-black border-white/10 text-white rounded-lg">
              <SelectItem
                data-testid="page-size-10"
                value="10"
                className="focus:bg-white/10 cursor-pointer"
              >
                10 per page
              </SelectItem>
              <SelectItem
                data-testid="page-size-20"
                value="20"
                className="focus:bg-white/10 cursor-pointer"
              >
                20 per page
              </SelectItem>
              <SelectItem
                data-testid="page-size-50"
                value="50"
                className="focus:bg-white/10 cursor-pointer"
              >
                50 per page
              </SelectItem>
              <SelectItem
                data-testid="page-size-100"
                value="100"
                className="focus:bg-white/10 cursor-pointer"
              >
                100 per page
              </SelectItem>
            </SelectContent>
          </Select>
        </GlassCard>
      )}
    </div>
  );
}
