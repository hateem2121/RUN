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

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  ProductSummary,
  Category,
  Fabric,
  Certificate,
  SizeChart,
  Accessory,
} from "@shared/schema";
import {
  transformProducts,
  TransformedProduct,
  TransformContext,
} from "@/lib/product-transformers";
import { batchFetchMediaContent } from "@/lib/queryClient";
import { useInquiryCart } from "@/contexts/InquiryCartContext";
import { Loader2, Search, ExternalLink } from "lucide-react";
import { InquiryCartButton } from "@/components/InquiryCartButton";
import { CardContent, CardFooter } from "@/components/ui/card";
import { ProductFilters } from "@/components/products/ProductFilters";
import { OptimizedImage } from "@/components/ui/optimized-image";

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
      } catch (error) {
        console.error("Failed to batch fetch media:", error);
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
    () =>
      transformedProducts.filter((p) => p.category && p.category.toLowerCase().includes("gear")),
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
    className={`text-[10px] bg-white text-black px-2 py-0.5 border border-black font-bold tracking-widest ${className}`}
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
  <nav aria-label="Breadcrumb" className="max-w-[1440px] mx-auto px-6 pt-4 md:pt-6 lg:pt-8">
    <ol className="flex items-center space-x-2 text-xs sm:text-sm uppercase tracking-widest text-gray-500">
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
    <div className="flex items-center space-x-12 shrink-0 px-6">
      {bannerItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-12">
          <span className="font-condensed text-4xl md:text-5xl lg:text-6xl whitespace-nowrap">
            {item}
          </span>
          {index < bannerItems.length - 1 && <AsteriskIcon className="w-10 h-10 shrink-0" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-black text-white py-8 my-16 overflow-hidden">
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
      className="group overflow-hidden rounded-lg glass-card-light hover:shadow-sm-luxury-elevated transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={product.name}
      data-testid={`product-card-${product.id}`}
    >
      <CardContent className="p-0">
        <div className="aspect-[4/3] bg-gray-50/50 overflow-hidden relative flex items-center justify-center">
          {product.imageId && (isHovered && product.hoverImageId ? product.hoverImageId : true) ? (
            <OptimizedImage
              mediaId={isHovered && product.hoverImageId ? product.hoverImageId : product.imageId}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300"
              aspectRatio={4 / 3}
              objectFit="contain"
              quality={85}
            />
          ) : (
            <img
              src={isHovered && product.hoverImageUrl ? product.hoverImageUrl : product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300"
              loading="lazy"
            />
          )}
          {/* Certification badges - always visible on mobile, hover on desktop */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
            {product.certifications.includes("GOTS") && <GotsIcon />}
            {product.certifications.includes("OEKO-TEX") && <OekoTexIcon />}
            {product.certifications.includes("RCS") && <RcsIcon />}
          </div>
          {/* Desktop hover overlay */}
          <div className="hidden md:flex absolute inset-0 bg-black/20 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => onQuickViewClick(product)}
              className="bg-white/90 text-black px-6 py-3 min-h-[44px] text-xs uppercase tracking-widest hover:bg-white transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black flex items-center justify-center backdrop-blur-xs"
              data-testid={`quick-view-${product.id}`}
            >
              Quick View
            </button>
          </div>
          {/* Mobile quick view button - always visible in bottom left */}
          <button
            onClick={() => onQuickViewClick(product)}
            className="md:hidden absolute bottom-3 left-3 bg-white text-black p-2 min-w-[44px] min-h-[44px] rounded-full shadow-lg hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center"
            data-testid={`quick-view-mobile-${product.id}`}
            aria-label="Quick view product"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start p-4 text-center">
        <h3 className="text-lg font-semibold uppercase tracking-wide w-full mb-2">
          {product.name}
        </h3>
        <div className="text-sm text-gray-600 mt-1 uppercase tracking-wide space-x-2 w-full">
          <span>{product.fabric}</span>
          <span>|</span>
          <span>{product.weight.value} GSM</span>
        </div>
        <div className="text-sm text-gray-600 mt-1 uppercase tracking-wide space-x-2 w-full">
          <span>MOQ: {product.moq}</span>
          <span>|</span>
          <span>LEAD: {product.leadTime}</span>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-2 w-full">
          <Link
            href={product.detailUrl}
            className="bg-white text-black border border-gray-200 px-4 py-3 min-h-[44px] text-xs uppercase tracking-widest hover:border-black transition-colors w-full focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center gap-2"
            data-testid={`view-details-${product.id}`}
          >
            <span>View Details</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
          <button
            onClick={handleRequestQuote}
            disabled={alreadyInCart}
            className="bg-black text-white px-4 py-3 min-h-[44px] text-xs uppercase tracking-widest transition-colors w-full focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
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
  }, [products]);

  const PRODUCTS_PER_LOAD = 12;
  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PRODUCTS_PER_LOAD);
  };

  return (
    <section className="bg-white text-black py-16 lg:py-24 px-6">
      <div className="max-w-[1440px] mx-auto">
        {products.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p>No products found in this category.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickViewClick={onQuickViewClick}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={handleLoadMore}
                  className="bg-black text-white px-8 py-4 min-h-[44px] text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-black focus:ring-offset-2"
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
  <section className="bg-white text-black py-16 lg:py-24 px-6">
    <div className="max-w-[1440px] mx-auto">
      <h2 className="font-condensed text-5xl sm:text-6xl md:text-8xl lg:text-9xl mb-12 text-center">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
    <section className="bg-black text-white py-16 md:py-20 lg:py-32">
      <div className="max-w-[1440px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
          {stats.map((stat) => (
            <div key={stat.label} className="border-t border-gray-700 pt-6 md:pt-8">
              <p className="font-condensed text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
                {stat.value}
              </p>
              <h3 className="mt-3 md:mt-4 text-base md:text-lg font-semibold uppercase tracking-widest">
                {stat.label}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-gray-400 max-w-xs mx-auto">
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
    <section className="bg-white text-black py-16 md:py-20 lg:py-32 px-6">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div className="relative aspect-[1/1] sm:aspect-[4/5] w-full">
          <img
            src="https://picsum.photos/seed/gear-main/800/1000"
            alt="RUN GEAR Collection"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="font-condensed text-white text-7xl md:text-9xl text-center leading-none">
              RUN
              <br />
              GEAR
            </h2>
          </div>
        </div>
        <div>
          <p className="text-sm uppercase tracking-widest text-gray-500">
            Accessories & Essentials
          </p>
          <h3 className="font-condensed text-5xl md:text-6xl mt-4">
            PERFORMANCE
            <br />
            IN EVERY DETAIL
          </h3>
          <p className="mt-6 text-gray-700 max-w-md">
            From moisture-wicking caps to anatomically designed socks, our gear is engineered with
            the same commitment to quality and sustainability as our apparel. Elevate your run with
            accessories designed to perform.
          </p>
          <div className="mt-12">
            {currentProduct && (
              <div className="flex items-center gap-8">
                <div className="w-32 h-40 shrink-0">
                  <img
                    src={currentProduct.imageUrl}
                    alt={currentProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grow">
                  <h4 className="font-semibold uppercase tracking-wider">{currentProduct.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{currentProduct.fabric}</p>
                  <button
                    onClick={() => onProductClick(currentProduct)}
                    className="mt-4 text-sm uppercase tracking-widest border-b border-black hover:text-gray-600 hover:border-gray-600 pb-1"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 sm:gap-4 mt-8">
              <button
                onClick={handlePrev}
                className="p-3 sm:p-4 min-w-[44px] min-h-[44px] border border-black hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="Previous gear item"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex gap-2 sm:gap-3 items-center">
                {gearProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-all ${
                      idx === currentIndex
                        ? "w-8 h-2 bg-black rounded-full"
                        : "w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400"
                    }`}
                    aria-label={`Go to gear item ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                className="p-3 sm:p-4 min-w-[44px] min-h-[44px] border border-black hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="Next gear item"
              >
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ResponsibilitySection = () => (
  <section className="bg-white text-black py-20 lg:py-32">
    <div className="max-w-[1440px] mx-auto px-6">
      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 sm:gap-0 mb-8">
        <span className="text-sm uppercase tracking-widest">Ethical</span>
        <span className="text-sm uppercase tracking-widest">Manufacturing</span>
      </div>
      <div className="text-center border-y-2 border-black py-8">
        <h2 className="font-condensed sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[140px] text-[35px] text-center font-medium">
          TRANSPARENT
        </h2>
        <h2 className="font-condensed sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl 2xl:text-[140px] md:-mt-8 text-[35px] font-medium ml-[-2px] mr-[-2px] pl-[0px] pr-[0px] mt-[0px] mb-[0px] text-center pt-[15px] pb-[15px]">
          PARTNERSHIPS
        </h2>
      </div>
      <div className="flex justify-center mt-12">
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
  <section className="relative bg-black text-white py-32 lg:py-48 px-6">
    <img
      src="https://picsum.photos/seed/brand/1920/1080"
      alt="Close-up of high-performance fabric"
      className="absolute inset-0 w-full h-full object-cover opacity-20"
    />
    <div className="relative max-w-4xl mx-auto text-center">
      <p className="text-sm uppercase tracking-widest text-gray-400">Our Philosophy</p>
      <h2 className="font-condensed text-4xl sm:text-5xl md:text-7xl lg:text-8xl mt-4">
        ENGINEERED FOR MOVEMENT. DESIGNED FOR TOMORROW.
      </h2>
      <p className="mt-8 text-gray-300 max-w-2xl mx-auto">
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
      className="fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      data-testid="quick-view-modal"
    >
      <div
        className="bg-white text-black w-full max-w-4xl h-auto max-h-[90vh] shadow-xl flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Product Image */}
        <div className="w-full md:w-1/2 bg-gray-100 relative">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {product.certifications.includes("GOTS") && <GotsIcon />}
            {product.certifications.includes("OEKO-TEX") && <OekoTexIcon />}
            {product.certifications.includes("RCS") && <RcsIcon />}
          </div>
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto relative">
          <button
            onClick={onClose}
            className="sticky top-0 right-0 float-right text-2xl hover:text-gray-600 bg-white z-10 -mt-6 -mr-6 md:-mt-8 md:-mr-8 p-2 rounded-full hover:bg-gray-100 transition-colors"
            data-testid="close-modal"
            aria-label="Close modal"
          >
            ×
          </button>

          <h2 id="product-modal-title" className="text-2xl font-bold uppercase tracking-wide mb-2">
            {product.name}
          </h2>
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-6">SKU: {product.sku}</p>

          <div className="space-y-4 mb-6 text-sm">
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
            <h3 className="font-semibold mb-2 uppercase text-xs tracking-wider">Composition</h3>
            <p className="text-sm text-gray-700">{product.specifications.fabricComposition}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-2 uppercase text-xs tracking-wider">
              Care Instructions
            </h3>
            <p className="text-sm text-gray-700">{product.specifications.careInstructions}</p>
          </div>

          {product.specifications.features.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2 uppercase text-xs tracking-wider">Features</h3>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
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
              className="w-full bg-black text-white px-6 py-3 min-h-[44px] text-sm uppercase tracking-widest hover:bg-gray-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              data-testid="modal-request-quote"
            >
              {alreadyInCart ? "Added to Inquiry" : "Request a Quote"}
            </button>
            <button
              className="w-full bg-white text-black border border-black px-6 py-3 min-h-[44px] text-sm uppercase tracking-widest hover:bg-gray-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center"
              data-testid="download-tech-sheet"
            >
              Download Tech Sheet
            </button>
            <button
              className="w-full bg-white text-black border border-black px-6 py-3 min-h-[44px] text-sm uppercase tracking-widest hover:bg-gray-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-black focus:ring-offset-2 flex items-center justify-center"
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

  const [location] = useLocation();
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
  }, [location, categories, categoryTabs]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  const activeCategoryLabel =
    categoryTabs.find((tab) => tab.name === activeTab)?.label || "All Products";

  return (
    <div className="min-h-screen bg-white pb-16 sm:pb-20 md:pb-24">
      <InquiryCartButton />

      {/* Hero Section with Category Tabs */}
      <section className="bg-white text-black px-6 mt-12 md:mt-20 lg:mt-[100px] mb-12 md:mb-20 lg:mb-[100px] pt-0 pb-0 lg:pt-20">
        <div className="max-w-[1440px] mx-auto text-center">
          <p className="text-sm uppercase tracking-widest text-gray-500 mt-[0px] mb-[0px] pt-[35px] pb-[35px]">
            RUN — For a Better Tomorrow
          </p>
          <h1 className="font-condensed text-5xl sm:text-6xl md:text-8xl lg:text-9xl mt-2">
            {activeCategoryLabel.toUpperCase()}
          </h1>
          <div className="mt-8 border-y border-black overflow-x-auto">
            <div className="flex justify-center min-w-max md:min-w-0 md:flex-wrap">
              {categoryTabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`font-condensed text-sm sm:text-base md:text-lg px-4 py-3 md:px-8 md:py-4 tracking-tighter transition-colors duration-200 ${
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
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, SKU, or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-black focus:border-transparent"
                data-testid="search-input"
                aria-label="Search products"
              />
            </div>

            {/* Product Count */}
            <div className="text-sm text-gray-600 whitespace-nowrap">
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
