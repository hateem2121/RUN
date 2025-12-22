import type { Category, MediaAsset, Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Grid3X3,
  LayoutGrid,
  Loader2,
  Play,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";
import { MediaQueryKeys } from "@/lib/media-query-keys";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function CategoryProductsPage() {
  const { slug } = useParams();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"small" | "medium" | "large">("medium");
  const [sortBy, setSortBy] = useState("name");

  // Fetch category by slug
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const category = categories.find((c) => c.slug === slug);

  // Fetch subcategories
  const subcategories = categories.filter((c) => c.parentId === category?.id && c.isActive);

  // Fetch media assets
  const { data: mediaData } = useQuery<{ data: MediaAsset[] }>({
    queryKey: MediaQueryKeys.list,
    queryFn: () => apiRequest("/api/media?all=true"),
  });
  const mediaAssets = mediaData?.data || [];

  // Fetch products for this category
  const { data: productsResponse, isLoading } = useQuery<{ data: Product[]; pagination?: any }>({
    queryKey: ["/api/products", "category", category?.id],
    queryFn: () => apiRequest(`/api/products?category=${category?.id}&active=true`),
    enabled: !!category?.id,
  });

  const products = productsResponse?.data || [];

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.sku.toLowerCase().includes(searchLower) ||
      product.shortDescription?.toLowerCase().includes(searchLower)
    );
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
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

  // Get optimized media URL with robust fallback mechanism
  const getOptimizedMediaUrl = (mediaId: number | null | undefined) => {
    if (!mediaId) return undefined;

    // Always provide a fallback URL, even when mediaAssets isn't loaded yet
    const fallbackUrl = MediaUrlBuilder.buildUrlSafe(mediaId);

    // If mediaAssets is available, try to find the specific media
    if (Array.isArray(mediaAssets)) {
      const media = mediaAssets.find((m) => m.id === mediaId);
      return media ? media.url || fallbackUrl : fallbackUrl;
    }

    // Return fallback URL when mediaAssets is still loading
    return fallbackUrl;
  };

  // Enhanced component for optimized category banner
  const OptimizedCategoryBanner = ({
    mediaId,
    fallbackUrl,
    alt,
  }: {
    mediaId?: number;
    fallbackUrl?: string;
    alt: string;
  }) => {
    const { urls } = useOptimizedMedia(mediaId || 0, {
      width: 1920,
      quality: 90,
      format: "webp",
    });

    const optimizedSrc = urls?.large || urls?.medium || fallbackUrl;
    return <img src={optimizedSrc} alt={alt} className="w-full h-full object-cover" />;
  };

  // Get all images for a product (for carousel)
  const getProductImages = (product: Product) => {
    const imageIds = product.imageIds || [];

    if (Array.isArray(mediaAssets)) {
      const images = imageIds.map((id) => {
        const media = mediaAssets.find((m) => m.id === id);
        return (
          media || {
            id,
            type: "image" as const,
            url: MediaUrlBuilder.buildUrlSafe(id),
            filename: `media-${id}`,
            size: 0,
            uploadedAt: new Date().toISOString(),
          }
        );
      });
      return images;
    }

    // Return minimal media objects when mediaAssets is still loading
    return imageIds.map((id) => ({
      id,
      type: "image" as const,
      url: MediaUrlBuilder.buildUrlSafe(id),
      filename: `media-${id}`,
      size: 0,
      uploadedAt: new Date().toISOString(),
    }));
  };

  // Get primary media with fallback mechanism
  const getPrimaryMedia = (product: Product) => {
    const primaryId =
      product.primaryImageId ||
      product.primaryVideoId ||
      (product.imageIds && product.imageIds[0]) ||
      (product.videos && product.videos[0]);
    if (!primaryId || typeof primaryId !== "number") return null;

    // If mediaAssets is available, return the actual media object
    if (Array.isArray(mediaAssets)) {
      const media = mediaAssets.find((m) => m.id === primaryId);
      return media || null;
    }

    // Return a minimal media object when mediaAssets is still loading
    // This allows the UI to render with a working URL
    return {
      id: primaryId,
      type: product.primaryVideoId === primaryId ? ("video" as const) : ("image" as const),
      url: MediaUrlBuilder.buildUrlSafe(primaryId),
      filename: `media-${primaryId}`,
      size: 0,
      uploadedAt: new Date().toISOString(),
    };
  };

  // Product Image Carousel Component
  const ProductImageCarousel = ({ product, viewMode }: { product: Product; viewMode: string }) => {
    const images = getProductImages(product);
    const primaryVideo = product.primaryVideoId ? getPrimaryMedia(product) : null;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
    const [loadingImages, setLoadingImages] = useState<Set<number>>(new Set());
    const [isNavigating, setIsNavigating] = useState(false);

    // Show video first if available, then images
    const hasVideo = primaryVideo?.type === "video";
    const totalItems = (hasVideo ? 1 : 0) + images.length;
    const showVideo = hasVideo && currentImageIndex === 0;
    const imageIndex = hasVideo ? currentImageIndex - 1 : currentImageIndex;

    // Enhanced navigation with loading management
    const goToNext = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isNavigating) return; // Prevent rapid clicking during loads

      const nextIndex = (currentImageIndex + 1) % totalItems;

      // PHASE 2: Check if next image is preloaded for instant navigation
      const nextImageId = images[hasVideo ? nextIndex - 1 : nextIndex]?.id;
      const isNextImageLoaded = nextImageId ? loadedImages.has(nextImageId) : true;

      setIsNavigating(true);
      setCurrentImageIndex(nextIndex);

      // Adaptive delay based on load status
      const delay = isNextImageLoaded ? 150 : 300;
      setTimeout(() => setIsNavigating(false), delay);
    };

    const goToPrevious = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isNavigating) return; // Prevent rapid clicking during loads

      const prevIndex = (currentImageIndex - 1 + totalItems) % totalItems;

      // PHASE 2: Check if previous image is preloaded for instant navigation
      const prevImageId = images[hasVideo ? prevIndex - 1 : prevIndex]?.id;
      const isPrevImageLoaded = prevImageId ? loadedImages.has(prevImageId) : true;

      setIsNavigating(true);
      setCurrentImageIndex(prevIndex);

      // Adaptive delay based on load status
      const delay = isPrevImageLoaded ? 150 : 300;
      setTimeout(() => setIsNavigating(false), delay);
    };

    const goToIndex = (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (isNavigating) return; // Prevent rapid clicking during loads

      // PHASE 2: Check if target image is preloaded for instant navigation
      const targetImageId = images[hasVideo ? index - 1 : index]?.id;
      const isTargetImageLoaded = targetImageId ? loadedImages.has(targetImageId) : true;

      setIsNavigating(true);
      setCurrentImageIndex(index);

      // Adaptive delay based on load status
      const delay = isTargetImageLoaded ? 150 : 400; // Longer for random jumps
      setTimeout(() => setIsNavigating(false), delay);
    };

    // Preload adjacent images for smooth navigation
    useEffect(() => {
      if (images.length <= 1) return;

      const preloadImage = (imageId: number, priority = false) => {
        if (loadedImages.has(imageId) || loadingImages.has(imageId)) return;

        setLoadingImages((prev) => new Set([...prev, imageId]));

        const img = new Image();
        if (priority) {
          img.fetchPriority = "high"; // Use high priority for immediate navigation
        }

        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, imageId]));
          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(imageId);
            return newSet;
          });
        };
        img.onerror = () => {
          setLoadingImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(imageId);
            return newSet;
          });
        };
        // PHASE 2: Use content URL for all images
        img.src = getOptimizedMediaUrl(imageId) || MediaUrlBuilder.buildContentUrl(imageId) || "";
      };

      // PHASE 2: Enhanced batch preloading strategy
      const performBatchPreloading = async () => {
        // Priority 1: Current image (high priority)
        if (!showVideo && images[imageIndex]) {
          preloadImage(images[imageIndex].id, true);
        }

        // Priority 2: Adjacent images (immediate navigation)
        const nextImageIndex = hasVideo ? imageIndex + 1 : (imageIndex + 1) % images.length;
        const prevImageIndex = hasVideo
          ? imageIndex - 1
          : (imageIndex - 1 + images.length) % images.length;

        if (images[nextImageIndex] && nextImageIndex >= 0) {
          preloadImage(images[nextImageIndex].id, true);
        }
        if (images[prevImageIndex] && prevImageIndex >= 0 && prevImageIndex !== nextImageIndex) {
          preloadImage(images[prevImageIndex].id, true);
        }

        // Priority 3: Extended range (2-3 images away) for smoother navigation
        const extendedIndices = [];
        for (let offset = 2; offset <= 3; offset++) {
          const nextExtended = hasVideo
            ? imageIndex + offset
            : (imageIndex + offset) % images.length;
          const prevExtended = hasVideo
            ? imageIndex - offset
            : (imageIndex - offset + images.length) % images.length;

          if (images[nextExtended] && nextExtended >= 0 && nextExtended < images.length) {
            extendedIndices.push(nextExtended);
          }
          if (images[prevExtended] && prevExtended >= 0 && prevExtended !== nextExtended) {
            extendedIndices.push(prevExtended);
          }
        }

        // Batch preload extended range with small delays
        for (const idx of extendedIndices) {
          const image = images[idx];
          if (image) {
            setTimeout(() => preloadImage(image.id), Math.random() * 200);
          }
        }
      };

      performBatchPreloading();
    }, [currentImageIndex, images, hasVideo, imageIndex, showVideo, loadedImages, loadingImages]);

    // Track image load status
    const handleImageLoad = (imageId: number) => {
      setLoadedImages((prev) => new Set([...prev, imageId]));
      setLoadingImages((prev) => {
        const newSet = new Set(prev);
        newSet.delete(imageId);
        return newSet;
      });
    };

    const handleImageLoadStart = (imageId: number) => {
      if (!loadedImages.has(imageId)) {
        setLoadingImages((prev) => new Set([...prev, imageId]));
      }
    };

    if (totalItems === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <LayoutGrid className="w-12 h-12" />
        </div>
      );
    }

    return (
      <div
        className="relative w-full h-full group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Current Media Display */}
        {showVideo && primaryVideo ? (
          <div className="relative w-full h-full">
            <video
              src={getOptimizedMediaUrl(primaryVideo.id)}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => e.currentTarget.pause()}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const placeholder = target.parentElement?.querySelector(".media-fallback");
                if (placeholder) {
                  (placeholder as HTMLElement).style.display = "flex";
                }
              }}
            />
            <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded">
              <Play className="w-3 h-3" />
            </div>
            <div className="media-fallback absolute inset-0 w-full h-full hidden items-center justify-center text-gray-400 bg-gray-200">
              <Play className="w-12 h-12" />
            </div>
          </div>
        ) : (
          images[imageIndex] && (
            <>
              {/* Enhanced Loading State */}
              {!loadedImages.has(images[imageIndex].id) && (
                <div className="absolute inset-0 w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    {loadingImages.has(images[imageIndex].id) ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                        <div className="text-xs">Loading...</div>
                      </>
                    ) : (
                      <LayoutGrid className="w-12 h-12" />
                    )}
                  </div>
                </div>
              )}

              {/* Main Image */}
              <img
                src={getOptimizedMediaUrl(images[imageIndex].id)}
                alt={product.name}
                className={cn(
                  "w-full h-full object-cover transition-all duration-300",
                  loadedImages.has(images[imageIndex].id)
                    ? "opacity-100 group-hover:scale-105"
                    : "opacity-0",
                )}
                onLoadStart={() =>
                  images[imageIndex] && handleImageLoadStart(images[imageIndex].id)
                }
                onLoad={() => images[imageIndex] && handleImageLoad(images[imageIndex].id)}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const placeholder = target.parentElement?.querySelector(".media-fallback");
                  if (placeholder) {
                    (placeholder as HTMLElement).style.display = "flex";
                  }
                  // Remove from loading state
                  setLoadingImages((prev) => {
                    const newSet = new Set(prev);
                    if (images[imageIndex]) newSet.delete(images[imageIndex].id);
                    return newSet;
                  });
                }}
              />

              {/* Fallback for errors */}
              <div className="media-fallback absolute inset-0 w-full h-full hidden items-center justify-center text-gray-400 bg-gray-200">
                <LayoutGrid className="w-12 h-12" />
              </div>
            </>
          )
        )}

        {/* Navigation Controls - only show if multiple items */}
        {totalItems > 1 && (
          <>
            {/* Navigation Arrows - show on hover for medium/large views */}
            {viewMode !== "small" && isHovered && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={isNavigating}
                  className={cn(
                    "absolute left-2 top-1/2 -translate-y-1/2 text-white p-1 rounded-full transition-all duration-200",
                    isNavigating
                      ? "bg-black/30 cursor-not-allowed"
                      : "bg-black/50 hover:bg-black/70",
                  )}
                >
                  <ChevronLeft className={cn("w-4 h-4", isNavigating && "opacity-50")} />
                </button>
                <button
                  onClick={goToNext}
                  disabled={isNavigating}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 text-white p-1 rounded-full transition-all duration-200",
                    isNavigating
                      ? "bg-black/30 cursor-not-allowed"
                      : "bg-black/50 hover:bg-black/70",
                  )}
                >
                  <ChevronRight className={cn("w-4 h-4", isNavigating && "opacity-50")} />
                </button>
              </>
            )}

            {/* Dots Navigation - always visible at bottom */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {Array.from({ length: totalItems }).map((_, index) => {
                // Check if this image is loaded for visual feedback
                const imageToCheck = images[hasVideo ? index - 1 : index];
                const isImageLoaded =
                  index === 0 && hasVideo
                    ? true
                    : imageToCheck
                      ? loadedImages.has(imageToCheck.id)
                      : false;

                return (
                  <button
                    key={index}
                    onClick={(e) => goToIndex(index, e)}
                    disabled={isNavigating}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200 relative",
                      currentImageIndex === index
                        ? "bg-white scale-110"
                        : isNavigating
                          ? "bg-white/30 cursor-not-allowed"
                          : "bg-white/50 hover:bg-white/80",
                    )}
                  >
                    {/* Loading indicator for dots */}
                    {currentImageIndex === index && !isImageLoaded && (
                      <div className="absolute inset-0 rounded-full border border-white/50 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Image Counter - show for large view */}
        {totalItems > 1 && viewMode === "large" && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
            <span>
              {currentImageIndex + 1} / {totalItems}
            </span>
            {isNavigating && (
              <div className="w-2 h-2 border border-white/50 border-t-white rounded-full animate-spin" />
            )}
          </div>
        )}

        {/* Hidden preload images for adjacent items */}
        <div className="hidden">
          {images.map((image, index) => {
            // Only preload adjacent images, not all images
            const isAdjacent =
              Math.abs(index - imageIndex) <= 1 ||
              (imageIndex === 0 && index === images.length - 1) ||
              (imageIndex === images.length - 1 && index === 0);

            if (!isAdjacent || loadedImages.has(image.id)) return null;

            return (
              <img
                key={`preload-${image.id}`}
                src={getOptimizedMediaUrl(image.id)}
                alt=""
                onLoad={() => handleImageLoad(image.id)}
                onLoadStart={() => handleImageLoadStart(image.id)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const gridClasses = {
    small: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3",
    medium: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
    large: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  };

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Category Not Found</h2>
          <p className="text-gray-600 mb-4">The category you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/products")}>Browse All Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      {category.bannerUrl && (
        <div className="relative h-64 md:h-80 overflow-hidden">
          <OptimizedCategoryBanner
            mediaId={parseInt(category.bannerUrl)}
            fallbackUrl={category.bannerUrl}
            alt={category.name}
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">{category.name}</h1>
              {category.description && (
                <p className="text-lg max-w-2xl mx-auto">{category.description}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b pt-20">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/")}>
              Home
            </Button>
            <span>/</span>
            <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/products")}>
              Products
            </Button>
            <span>/</span>
            <span className="text-gray-600">{category.name}</span>
          </nav>
        </div>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subcategories.map((subcat) => (
                <Link href={`/categories/${subcat.slug}`} key={subcat.id}>
                  <Card className="group cursor-pointer hover:shadow-md transition-shadow-sm">
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {subcat.imageUrl && (
                          <img
                            src={getOptimizedMediaUrl(parseInt(subcat.imageUrl)) || subcat.imageUrl}
                            alt={subcat.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-medium">{subcat.name}</h3>
                          <p className="text-sm text-gray-600">
                            {products.filter((p) => p.categoryId === subcat.id).length} products
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b shadow-sm-xs">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <h1 className="text-2xl font-bold">
              {!category.bannerUrl && category.name}
              {category.bannerUrl && "Products"}
            </h1>

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
            </div>
          </div>

          {/* Results count */}
          <div className="mt-2 text-sm text-gray-600">
            Showing {sortedProducts.length} products
            {searchTerm && ` for "${searchTerm}"`}
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
            <p className="text-gray-500">No products found in this category</p>
          </div>
        ) : (
          <div className={cn("grid", gridClasses[viewMode])}>
            {sortedProducts.map((product) => {
              return (
                <Link href={`/categories/${slug}/${product.slug || product.id}`} key={product.id}>
                  <Card className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow-sm">
                    {/* Interactive Image Carousel */}
                    <div
                      className={cn(
                        "relative bg-gray-100 overflow-hidden",
                        viewMode === "small" ? "aspect-[3/4]" : "aspect-[4/5]",
                      )}
                    >
                      <ProductImageCarousel product={product} viewMode={viewMode} />

                      {/* Badges - moved outside carousel to prevent conflicts */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-modal">
                        {product.isFeatured && (
                          <Badge className="bg-yellow-500 text-white">Featured</Badge>
                        )}
                        {product.tags && product.tags.length > 0 && viewMode !== "small" && (
                          <Badge variant="secondary">{product.tags[0]}</Badge>
                        )}
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className={cn("p-3", viewMode === "small" ? "p-2" : "p-3")}>
                      <h3
                        className={cn(
                          "font-semibold text-gray-900 line-clamp-2",
                          viewMode === "small" ? "text-sm" : "text-base",
                        )}
                      >
                        {product.name}
                      </h3>

                      {viewMode !== "small" && (
                        <>
                          <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
                          {product.shortDescription && viewMode === "large" && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {product.shortDescription}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
