/**
 * ============================================================================
 * PRODUCTS PAGE - TABLE OF CONTENTS
 * ============================================================================
 *
 * 1. IMPORTS & TYPES
 * 2. CUSTOM HOOKS
 *    - useProductsPageData: Manages all data fetching, filtering, and transformations
 * 3. ICON COMPONENTS
 *    - AsteriskIcon, CertificationBadge, GotsIcon, OekoTexIcon, RcsIcon
 * 4. UI COMPONENTS
 *    - Breadcrumbs, ScrollingBanner
 * 5. PRODUCT COMPONENTS
 *    - ProductCard, ProductGrid, FeaturedProducts
 * 6. SECTION COMPONENTS
 *    - ArrowIcons, StatsSection, GearSection, ResponsibilitySection, BrandStatement
 * 7. MODAL COMPONENTS
 *    - QuickViewModal
 * 8. MAIN PAGE COMPONENT
 *    - ProductsPageNew (default export)
 *
 * ============================================================================
 */

import type {
  Accessory,
  Category,
  Certificate,
  Fabric,
  ProductSummary,
  SizeChart,
} from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { InquiryCartButton } from "@/components/InquiryCartButton";
import { ProductFilters } from "@/components/products/ProductFilters";
import { CardContent, CardFooter } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useInquiryCart } from "@/contexts/InquiryCartContext";
import {
  type TransformContext,
  type TransformedProduct,
  transformProducts,
} from "@/lib/product-transformers";
import { batchFetchMediaContent } from "@/lib/queryClient";

// ═══════════════════════════════════════════════════════════════════════════
// 2. CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════

interface ProductFilters {
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

/**
 * Custom hook that manages all data fetching, filtering, and product transformations
 * for the products page. Consolidates complex logic to keep the main component clean.
 */
function useProductsPageData({
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
    if (products.length === 0) return;

    const mediaIds = new Set<number>();
    products.forEach((product) => {
      if (product.primaryImageId) mediaIds.add(product.primaryImageId);
      if (Array.isArray(product.imageIds)) {
        product.imageIds.forEach((id) => {
          if (typeof id === "number") mediaIds.add(id);
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
      } finally {
        setIsLoadingMedia(false);
      }
    };

    fetchMedia();
  }, [products]);

  // ─────────────────────────────────────────────────────────────────────────
  // Product Transformation
  // ─────────────────────────────────────────────────────────────────────────

  const transformedProducts = useMemo(() => {
    if (!products.length || !categories.length) return [];

    const context: TransformContext = {
      categories,
      fabrics,
      certificates,
      mediaAssets: [],
      mediaContentMap,
    };

    return transformProducts(products, context);
  }, [products, categories, fabrics, certificates, mediaContentMap]);

  // ─────────────────────────────────────────────────────────────────────────
  // Category Tabs & Tags
  // ─────────────────────────────────────────────────────────────────────────

  const categoryTabs = useMemo(() => {
    const tabs = [{ name: "ALL", label: "All Products" }];
    const activeCategories = categories.filter((c) => c.isActive);
    activeCategories.forEach((cat) => {
      tabs.push({
        name: cat.name.toUpperCase().replace(/\s+/g, "_"),
        label: cat.name,
      });
    });
    return tabs;
  }, [categories]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach((product) => {
      if (Array.isArray(product.tags)) {
        product.tags.forEach((tag) => tags.add(tag));
      }
    });
    return Array.from(tags);
  }, [products]);

  // ─────────────────────────────── P�──────────────Pr�──────────────────────────
  // Filtering & Search Logic
  // ─────────────────────────────────────────────────────────────────────────

  const displayedProducts = useMemo(() => {
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
  }, [
    activeTab,
    products,
    categories,
    fabrics,
    certificates,
    mediaContentMap,
    categoryTabs,
    selectedFilters,
    searchQuery,
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // Derived Product Lists
  // ─────────────────────────────────────────────────────────────────────────

  const featuredProducts = useMemo(
    () => transformedProducts.filter((p) => p.isFeatured).slice(0, 4),
    [transformedProducts],
  );

  const gearProducts = useMemo(
    () => transformedProducts.filter((p) => p.category?.toLowerCase().includes("gear")),
    [transformedProducts],
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

// ═══════════════════════════════════════════════════════════════════════════
// 3. ICON COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const AsteriskIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="currentColor"
      d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z"
      transform="rotate(22.5 50 50)"
    />
  </svg>
);

const CertificationBadge = ({ text, className }: { text: string; className?: string }) => (
  <div
    className={`border border-black bg-white px-2 py-0.5 font-bold text-[10px] text-black tracking-widest ${className}`}
  >
    {text}
  </div>
);

const GotsIcon = () => <CertificationBadge text="GOTS" />;
const OekoTexIcon = () => <CertificationBadge text="OEKO-TEX" />;
const RcsIcon = () => <CertificationBadge text="RCS" />;

// ═══════════════════════════════════════════════════════════════════════════
// 4. UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const Breadcrumbs = ({ activeCategoryName }: { activeCategoryName: string }) => (
  <nav aria-label="Breadcrumb" className="mx-auto max-w-[1440px] px-6 pt-4 md:pt-6 lg:pt-8">
    <ol className="flex items-center space-x-2 text-gray-500 text-xs uppercase tracking-widest sm:text-sm">
      <li>
        <a href="/" className="hover:text-black">
          Home
        </a>
      </li>
      <li>
        <span className="mx-2">/</span>
      </li>
      <li aria-current="page" className="font-semibold text-black">
        {activeCategoryName}
      </li>
    </ol>
  </nav>
);

const ScrollingBanner = ({ text }: { text: string }) => {
  const bannerItems = text.split("*").map((s) => s.trim());
  const content = (
    <div className="flex shrink-0 items-center space-x-12 px-6">
      {bannerItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-12">
          <span className="whitespace-nowrap font-condensed text-4xl md:text-5xl lg:text-6xl">
            {item}
          </span>
          {index < bannerItems.length - 1 && <AsteriskIcon className="h-10 w-10 shrink-0" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="my-16 overflow-hidden bg-black py-8 text-white">
      <style>{`
        @keyframes scroll-banner {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .scrolling-banner-inner {
          display: flex;
          animation: scroll-banner 60s linear infinite;
        }
        
        @media (min-width: 640px) {
          .scrolling-banner-inner {
            animation: scroll-banner 45s linear infinite;
          }
        }
        
        @media (min-width: 1024px) {
          .scrolling-banner-inner {
            animation: scroll-banner 30s linear infinite;
          }
        }
      `}</style>
      <div className="scrolling-banner-inner">
        {content}
        {content}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 5. PRODUCT COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface ProductCardProps {
  product: TransformedProduct;
  onQuickViewClick: (product: TransformedProduct) => void;
}

const ProductCard = ({ product, onQuickViewClick }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { addItem, isInCart } = useInquiryCart();
  const alreadyInCart = isInCart(product.id);

  const handleRequestQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product);
  };

  return (
    <div
      className="group glass-card-light overflow-hidden rounded-lg transition-all duration-300 hover:shadow-sm-luxury-elevated"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={product.name}
      data-testid={`product-card-${product.id}`}
    >
      <CardContent className="p-0">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gray-50/50">
          {product.imageId && (isHovered && product.hoverImageId ? product.hoverImageId : true) ? (
            <OptimizedImage
              mediaId={isHovered && product.hoverImageId ? product.hoverImageId : product.imageId}
              alt={product.name}
              className="h-full w-full object-contain transition-all duration-300 group-hover:scale-105"
              aspectRatio={4 / 3}
              objectFit="contain"
              quality={85}
            />
          ) : (
            <img
              src={isHovered && product.hoverImageUrl ? product.hoverImageUrl : product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain transition-all duration-300 group-hover:scale-105"
              loading="lazy"
            />
          )}
          {/* Certification badges - always visible on mobile, hover on desktop */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
            {product.certifications.includes("GOTS") && <GotsIcon />}
            {product.certifications.includes("OEKO-TEX") && <OekoTexIcon />}
            {product.certifications.includes("RCS") && <RcsIcon />}
          </div>
          {/* Desktop hover overlay */}
          <div className="absolute inset-0 hidden items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
            <button
              onClick={() => onQuickViewClick(product)}
              className="flex min-h-[44px] items-center justify-center bg-white/90 px-6 py-3 text-black text-xs uppercase tracking-widest backdrop-blur-xs transition-colors hover:bg-white focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              data-testid={`quick-view-${product.id}`}
            >
              Quick View
            </button>
          </div>
          {/* Mobile quick view button - always visible in bottom left */}
          <button
            onClick={() => onQuickViewClick(product)}
            className="absolute bottom-3 left-3 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white p-2 text-black shadow-lg transition-colors hover:bg-gray-200 focus:ring-2 focus:ring-black focus:ring-offset-2 md:hidden"
            data-testid={`quick-view-mobile-${product.id}`}
            aria-label="Quick view product"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start p-4 text-center">
        <h3 className="mb-2 w-full font-semibold text-lg uppercase tracking-wide">
          {product.name}
        </h3>
        <div className="mt-1 w-full space-x-2 text-gray-600 text-sm uppercase tracking-wide">
          <span>{product.fabric}</span>
          <span>|</span>
          <span>{product.weight.value} GSM</span>
        </div>
        <div className="mt-1 w-full space-x-2 text-gray-600 text-sm uppercase tracking-wide">
          <span>MOQ: {product.moq}</span>
          <span>|</span>
          <span>LEAD: {product.leadTime}</span>
        </div>
        <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          <Link
            href={product.detailUrl}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 border border-gray-200 bg-white px-4 py-3 text-black text-xs uppercase tracking-widest transition-colors hover:border-black focus:ring-2 focus:ring-black focus:ring-offset-2"
            data-testid={`view-details-${product.id}`}
          >
            <span>View Details</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
          <button
            onClick={handleRequestQuote}
            disabled={alreadyInCart}
            className="flex min-h-[44px] w-full items-center justify-center bg-black px-4 py-3 text-white text-xs uppercase tracking-widest transition-colors focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            data-testid={`request-quote-${product.id}`}
          >
            {alreadyInCart ? "Added" : "Request Quote"}
          </button>
        </div>
      </CardFooter>
    </div>
  );
};

interface ProductGridProps {
  products: TransformedProduct[];
  onQuickViewClick: (product: TransformedProduct) => void;
}

const ProductGrid = ({ products, onQuickViewClick }: ProductGridProps) => {
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, []);

  const PRODUCTS_PER_LOAD = 12;
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PRODUCTS_PER_LOAD);
  };

  return (
    <section className="bg-white px-6 py-16 text-black lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        {products.length === 0 ? (
          <div className="px-4 py-20 text-center">
            <p>No products found in this category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickViewClick={onQuickViewClick}
                />
              ))}
            </div>
            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="min-h-[44px] bg-black px-8 py-4 text-sm text-white uppercase tracking-widest transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  data-testid="load-more-button"
                  aria-label="Load more products"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

interface FeaturedProductsProps {
  title: string;
  products: TransformedProduct[];
  onQuickViewClick: (product: TransformedProduct) => void;
}

const FeaturedProducts = ({ title, products, onQuickViewClick }: FeaturedProductsProps) => (
  <section className="bg-white px-6 py-16 text-black lg:py-24">
    <div className="mx-auto max-w-[1440px]">
      <h2 className="mb-12 text-center font-condensed text-5xl sm:text-6xl md:text-8xl lg:text-9xl">
        {title}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onQuickViewClick={onQuickViewClick} />
        ))}
      </div>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// 6. SECTION COMPONENTS
// ════════════════e��══════════════════════════════════════════════════════════

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
  </svg>
);

const StatsSection = () => {
  const stats = [
    {
      value: "74",
      label: "Permanent Employees",
      description:
        "Our skilled workforce boasts a 94.6% retention rate, ensuring consistent quality.",
    },
    {
      value: "40+",
      label: "Years of Heritage",
      description: "Four decades of manufacturing expertise, now powered by 3D design technology.",
    },
    {
      value: "100%",
      label: "SMETA Audited",
      description:
        "Fully compliant with SMETA 4-Pillar standards for ethical and responsible production.",
    },
  ];

  return (
    <section className="bg-black py-16 text-white md:py-20 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-3 md:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="border-gray-700 border-t pt-6 md:pt-8">
              <p className="font-condensed text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
                {stat.value}
              </p>
              <h3 className="mt-3 font-semibold text-base uppercase tracking-widest md:mt-4 md:text-lg">
                {stat.label}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-gray-400 text-xs sm:text-sm">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

interface GearSectionProps {
  gearProducts: TransformedProduct[];
  onProductClick: (product: TransformedProduct) => void;
}

const GearSection = ({ gearProducts, onProductClick }: GearSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const handlePrev = () => setCurrentIndex((p) => (p === 0 ? gearProducts.length - 1 : p - 1));
  const handleNext = () => setCurrentIndex((p) => (p === gearProducts.length - 1 ? 0 : p + 1));
  const currentProduct = gearProducts[currentIndex];

  return (
    <section className="bg-white px-6 py-16 text-black md:py-20 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative aspect-[1/1] w-full sm:aspect-[4/5]">
          <img
            src="https://picsum.photos/seed/gear-main/800/1000"
            alt="RUN GEAR Collection"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-center font-condensed text-7xl text-white leading-none md:text-9xl">
              RUN
              <br />
              GEAR
            </h2>
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-sm uppercase tracking-widest">
            Accessories & Essentials
          </p>
          <h3 className="mt-4 font-condensed text-5xl md:text-6xl">
            PERFORMANCE
            <br />
            IN EVERY DETAIL
          </h3>
          <p className="mt-6 max-w-md text-gray-700">
            From moisture-wicking caps to anatomically designed socks, our gear is engineered with
            the same commitment to quality and sustainability as our apparel. Elevate your run with
            accessories designed to perform.
          </p>
          <div className="mt-12">
            {currentProduct && (
              <div className="flex items-center gap-8">
                <div className="h-40 w-32 shrink-0">
                  <img
                    src={currentProduct.imageUrl}
                    alt={currentProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="grow">
                  <h4 className="font-semibold uppercase tracking-wider">{currentProduct.name}</h4>
                  <p className="mt-1 text-gray-500 text-sm">{currentProduct.fabric}</p>
                  <button
                    onClick={() => onProductClick(currentProduct)}
                    className="mt-4 border-black border-b pb-1 text-sm uppercase tracking-widest hover:border-gray-600 hover:text-gray-600"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
            <div className="mt-8 flex items-center gap-3 sm:gap-4">
              <button
                onClick={handlePrev}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-black p-3 transition-colors hover:bg-gray-100 sm:p-4"
                aria-label="Previous gear item"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                {gearProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-all ${
                      idx === currentIndex
                        ? "h-2 w-8 rounded-full bg-black"
                        : "h-2 w-2 rounded-full bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to gear item ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center border border-black p-3 transition-colors hover:bg-gray-100 sm:p-4"
                aria-label="Next gear item"
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ResponsibilitySection = () => (
  <section className="bg-white py-20 text-black lg:py-32">
    <div className="mx-auto max-w-[1440px] px-6">
      <div className="mb-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-between sm:gap-0">
        <span className="text-sm uppercase tracking-widest">Ethical</span>
        <span className="text-sm uppercase tracking-widest">Manufacturing</span>
      </div>
      <div className="border-black border-y-2 py-8 text-center">
        <h2 className="text-center font-condensed font-medium text-[35px] sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[140px]">
          TRANSPARENT
        </h2>
        <h2 className="mt-[0px] mr-[-2px] mb-[0px] ml-[-2px] pt-[15px] pr-[0px] pb-[15px] pl-[0px] text-center font-condensed font-medium text-[35px] sm:text-6xl md:-mt-8 md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[140px]">
          PARTNERSHIPS
        </h2>
      </div>
      <div className="mt-12 flex justify-center">
        <p className="max-w-3xl text-center text-gray-700">
          We are committed to ethical manufacturing and sustainable sourcing. Our partnerships with
          certified suppliers ensure that every product we create not only meets the highest
          performance standards but also contributes to a better future for our planet and its
          people.
        </p>
      </div>
    </div>
  </section>
);

const BrandStatement = () => (
  <section className="relative bg-black px-6 py-32 text-white lg:py-48">
    <img
      src="https://picsum.photos/seed/brand/1920/1080"
      alt="Close-up of high-performance fabric"
      className="absolute inset-0 h-full w-full object-cover opacity-20"
    />
    <div className="relative mx-auto max-w-4xl text-center">
      <p className="text-gray-400 text-sm uppercase tracking-widest">Our Philosophy</p>
      <h2 className="mt-4 font-condensed text-4xl sm:text-5xl md:text-7xl lg:text-8xl">
        ENGINEERED FOR MOVEMENT. DESIGNED FOR TOMORROW.
      </h2>
      <p className="mx-auto mt-8 max-w-2xl text-gray-300">
        We believe in the power of running to change lives and the responsibility to protect the
        planet we run on. Our apparel is a fusion of cutting-edge performance technology and
        sustainable innovation, built to support your every stride and honor our collective future.
      </p>
    </div>
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════
// 7. MODAL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

interface QuickViewModalProps {
  product: TransformedProduct;
  onClose: () => void;
}

const QuickViewModal = ({ product, onClose }: QuickViewModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { addItem, isInCart } = useInquiryCart();
  const alreadyInCart = isInCart(product.id);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      data-testid="quick-view-modal"
    >
      <div
        className="flex h-auto max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden bg-white text-black shadow-xl md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product Image */}
        <div className="relative w-full bg-gray-100 md:w-1/2">
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {product.certifications.includes("GOTS") && <GotsIcon />}
            {product.certifications.includes("OEKO-TEX") && <OekoTexIcon />}
            {product.certifications.includes("RCS") && <RcsIcon />}
          </div>
        </div>

        {/* Product Details */}
        <div className="relative w-full overflow-y-auto p-6 md:w-1/2 md:p-8">
          <button
            onClick={onClose}
            className="sticky top-0 right-0 z-default float-right -mt-6 -mr-6 rounded-full bg-white p-2 text-2xl transition-colors hover:bg-gray-100 hover:text-gray-600 md:-mt-8 md:-mr-8"
            data-testid="close-modal"
            aria-label="Close modal"
          >
            ×
          </button>

          <h2 id="product-modal-title" className="mb-2 font-bold text-2xl uppercase tracking-wide">
            {product.name}
          </h2>
          <p className="mb-6 text-gray-500 text-sm uppercase tracking-widest">SKU: {product.sku}</p>

          <div className="mb-6 space-y-4 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Fabric:</span>
              <span>{product.fabric}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Weight:</span>
              <span>
                {product.weight.value} {product.weight.unit}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">MOQ:</span>
              <span>{product.moq} units</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Lead Time:</span>
              <span>{product.leadTime}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="font-semibold">Fit:</span>
              <span>{product.specifications.fit}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-xs uppercase tracking-wider">Composition</h3>
            <p className="text-gray-700 text-sm">{product.specifications.fabricComposition}</p>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 font-semibold text-xs uppercase tracking-wider">
              Care Instructions
            </h3>
            <p className="text-gray-700 text-sm">{product.specifications.careInstructions}</p>
          </div>

          {product.specifications.features.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-2 font-semibold text-xs uppercase tracking-wider">Features</h3>
              <ul className="list-inside list-disc space-y-1 text-gray-700 text-sm">
                {product.specifications.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => {
                addItem(product);
              }}
              disabled={alreadyInCart}
              className="flex min-h-[44px] w-full items-center justify-center bg-black px-6 py-3 text-sm text-white uppercase tracking-widest transition-colors hover:bg-gray-800 focus:outline-hidden focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
              data-testid="modal-request-quote"
            >
              {alreadyInCart ? "Added to Inquiry" : "Request a Quote"}
            </button>
            <button
              className="flex min-h-[44px] w-full items-center justify-center border border-black bg-white px-6 py-3 text-black text-sm uppercase tracking-widest transition-colors hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-black focus:ring-offset-2"
              data-testid="download-tech-sheet"
            >
              Download Tech Sheet
            </button>
            <button
              className="flex min-h-[44px] w-full items-center justify-center border border-black bg-white px-6 py-3 text-black text-sm uppercase tracking-widest transition-colors hover:bg-gray-100 focus:outline-hidden focus:ring-2 focus:ring-black focus:ring-offset-2"
              data-testid="request-sample"
            >
              Request Sample
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// 8. MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function ProductsPageNew() {
  // ─────────────────────────────────────────────────────────────────────────
  // Local State (UI only)
  // ─────────────────────────────────────────────────────────────────────────

  const [_location] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<TransformedProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<ProductFilters>({
    fabrics: [],
    certificates: [],
    sizeCharts: [],
    accessories: [],
    tags: [],
    moqRange: [0, 10000],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Data & Filtering (managed by custom hook)
  // ─────────────────────────────────────────────────────────────────────────

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

  // Fetch categories to match slug to category name
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // ─────────────────────────────────────────────────────────────────────────
  // URL Parameter Handling - Auto-select category from ?category= param
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Parse URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const categorySlug = searchParams.get("category");

    if (categorySlug && categories.length > 0 && categoryTabs.length > 0) {
      // Find category by slug
      const category = categories.find((c) => c.slug === categorySlug);

      if (category) {
        // Generate tab name using same logic as categoryTabs
        const tabName = category.name.toUpperCase().replace(/\s+/g, "_");

        // Set active tab if it exists
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
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  const activeCategoryLabel =
    categoryTabs.find((tab) => tab.name === activeTab)?.label || "All Products";

  return (
    <div className="min-h-screen bg-white pb-16 sm:pb-20 md:pb-24">
      <InquiryCartButton />

      {/* Hero Section with Category Tabs */}
      <section className="mt-12 mb-12 bg-white px-6 pt-0 pb-0 text-black md:mt-20 md:mb-20 lg:mt-[100px] lg:mb-[100px] lg:pt-20">
        <div className="mx-auto max-w-[1440px] text-center">
          <p className="mt-[0px] mb-[0px] pt-[35px] pb-[35px] text-gray-500 text-sm uppercase tracking-widest">
            RUN — For a Better Tomorrow
          </p>
          <h1 className="mt-2 font-condensed text-5xl sm:text-6xl md:text-8xl lg:text-9xl">
            {activeCategoryLabel.toUpperCase()}
          </h1>
          <div className="mt-8 overflow-x-auto border-black border-y">
            <div className="flex min-w-max justify-center md:min-w-0 md:flex-wrap">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`px-4 py-3 font-condensed text-sm tracking-tighter transition-colors duration-200 sm:text-base md:px-8 md:py-4 md:text-lg ${
                    activeTab === tab.name ? "bg-black text-white" : "hover:bg-gray-100"
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

      {/* Breadcrumbs */}
      <Breadcrumbs activeCategoryName={activeCategoryLabel} />

      {/* Filters and Search */}
      <section className="bg-white px-6 py-6">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-4 flex flex-col items-start gap-4 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative w-full max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, or description..."
                className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:outline-hidden focus:ring-2 focus:ring-black"
                data-testid="search-input"
                aria-label="Search products"
              />
            </div>

            {/* Product Count */}
            <div className="whitespace-nowrap text-gray-600 text-sm">
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
