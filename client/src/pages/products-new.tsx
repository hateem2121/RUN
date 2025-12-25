import type { Category } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
// Components
import { InquiryCartButton } from "@/components/InquiryCartButton";
import { FeaturedProducts, ProductGrid, QuickViewModal } from "@/components/products";
import { ProductFilters } from "@/components/products/ProductFilters";
import {
  BrandStatement,
  GearSection,
  ResponsibilitySection,
  StatsSection,
} from "@/components/sections";
import { ScrollingBanner } from "@/components/ui/scrolling-banner";
import { Typography } from "@/components/ui/typography";
// Hooks
import {
  type ProductFilters as ProductFiltersType,
  useProductsPageData,
} from "@/hooks/use-products-page-data";
import type { TransformedProduct } from "@/lib/product-transformers";

// ─────────────────────────────────────────────────────────────────────────
// Sub-components (UI Helpers)
// ─────────────────────────────────────────────────────────────────────────

const Breadcrumbs = ({ activeCategoryName }: { activeCategoryName: string }) => (
  <nav aria-label="Breadcrumb" className="container-wide mx-auto px-6 pt-4 md:pt-6 lg:pt-8">
    <ol className="flex items-center space-x-2 text-muted-foreground text-xs uppercase tracking-widest sm:text-sm">
      <li>
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
      </li>
      <li>
        <span className="mx-2">/</span>
      </li>
      <li aria-current="page" className="font-semibold text-foreground">
        {activeCategoryName}
      </li>
    </ol>
  </nav>
);

// ─────────────────────────────────────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────

export default function ProductsPageNew() {
  const [_location] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<TransformedProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<ProductFiltersType>({
    fabrics: [],
    certificates: [],
    sizeCharts: [],
    accessories: [],
    tags: [],
    moqRange: [0, 10000],
  });

  const {
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
  } = useProductsPageData({
    activeTab,
    selectedFilters,
    searchQuery,
  });

  // Fetch categories to match slug to category name (for URL handling)
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // URL Parameter Handling - Auto-select category from ?category= param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const categorySlug = searchParams.get("category");

    if (categorySlug && categories.length > 0 && categoryTabs.length > 0) {
      const category = categories.find((c) => c.slug === categorySlug);

      if (category) {
        const tabName = category.name.toUpperCase().replace(/\s+/g, "_");
        const tabExists = categoryTabs.some((tab) => tab.name === tabName);
        if (tabExists) {
          setActiveTab(tabName);
        }
      }
    }
  }, [categories, categoryTabs]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const activeCategoryLabel =
    categoryTabs.find((tab) => tab.name === activeTab)?.label || "All Products";

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-20 md:pb-24">
      <InquiryCartButton />

      {/* Hero Section with Category Tabs */}
      <section className="mt-12 mb-12 bg-background px-6 pt-0 pb-0 text-foreground md:mt-20 md:mb-20 lg:mt-[100px] lg:mb-[100px] lg:pt-20">
        <div className="container-wide mx-auto text-center">
          <Typography.P className="mt-[0px] mb-[0px] pt-[35px] pb-[35px] text-muted-foreground text-sm uppercase tracking-widest">
            RUN — For a Better Tomorrow
          </Typography.P>
          <Typography.H1 className="mt-2 font-condensed text-5xl sm:text-6xl md:text-8xl lg:text-9xl">
            {activeCategoryLabel.toUpperCase()}
          </Typography.H1>
          <div className="mt-8 overflow-x-auto border-border border-y">
            <div className="flex min-w-max justify-center md:min-w-0 md:flex-wrap">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`px-4 py-3 font-condensed text-sm tracking-tighter transition-colors duration-200 sm:text-base md:px-8 md:py-4 md:text-lg ${
                    activeTab === tab.name ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  aria-pressed={activeTab === tab.name}
                  data-testid={`category-tab-${tab.name}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Breadcrumbs activeCategoryName={activeCategoryLabel} />

      {/* Filters and Search */}
      <section className="bg-background px-6 py-6">
        <div className="container-wide mx-auto">
          <div className="mb-4 flex flex-col items-start gap-4 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative w-full max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, or description..."
                className="w-full rounded-md border border-input bg-background py-2 pr-4 pl-10 text-foreground focus:border-ring focus:outline-hidden focus:ring-2 focus:ring-ring"
                data-testid="search-input"
                aria-label="Search products"
              />
            </div>

            {/* Product Count */}
            <div className="whitespace-nowrap text-muted-foreground text-sm">
              {displayedProducts.length} {displayedProducts.length === 1 ? "product" : "products"}{" "}
              found
            </div>
          </div>

          {/* Filter Component */}
          <div className="flex items-center gap-4">
            <ProductFilters
              fabrics={fabrics}
              certificates={certificates}
              sizeCharts={sizeCharts}
              accessories={accessories}
              selectedFilters={selectedFilters}
              onFiltersChange={setSelectedFilters}
              availableTags={availableTags}
            />
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <ProductGrid products={displayedProducts} onQuickViewClick={setSelectedProduct} />

      {/* Stats Section */}
      <StatsSection />

      {/* Scrolling Banner */}
      <ScrollingBanner text="SUSTAINABLE PERFORMANCE * ETHICAL MANUFACTURING * B2B PARTNERSHIPS * INNOVATIVE FABRICS" />

      {/* Gear Section */}
      {gearProducts.length > 0 && (
        <GearSection gearProducts={gearProducts} onProductClick={setSelectedProduct} />
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <FeaturedProducts
          title="Featured Products"
          products={featuredProducts}
          onQuickViewClick={setSelectedProduct}
        />
      )}

      {/* Responsibility Section */}
      <ResponsibilitySection />

      {/* Brand Statement */}
      <BrandStatement />

      {/* Quick View Modal */}
      {selectedProduct && (
        <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      )}
    </div>
  );
}
