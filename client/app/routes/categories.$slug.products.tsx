import type { Category, MediaAsset, Product } from "@shared/schema";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
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
import { Link, useLoaderData, useLocation, useNavigate, useParams } from "react-router";
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
import { Typography } from "@/components/ui/typography";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";
import { MediaQueryKeys } from "@/lib/media-query-keys";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Route } from "./+types/categories.$slug.products";

export async function loader({ params }: Route.LoaderArgs) {
  const queryClient = getQueryClient();
  const slug = params.slug;

  // 1. Fetch categories
  await queryClient.prefetchQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("/api/categories");
      return res.json();
    },
  });

  const categories = queryClient.getQueryData<Category[]>(["/api/categories"]) || [];
  const category = categories.find((c) => c.slug === slug);

  if (category) {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ["/api/products", "category", category.id],
        queryFn: async () => {
          const res = await apiRequest(`/api/products?category=${category.id}&active=true`);
          return res.json();
        },
      }),
      queryClient.prefetchQuery({
        queryKey: MediaQueryKeys.list,
        queryFn: async () => {
          const res = await apiRequest("/api/media?all=true");
          return res.json();
        },
      }),
    ]);
  }

  return { dehydratedState: dehydrate(queryClient) };
}

export function meta({}: Route.MetaArgs) {
  return [{ title: "Category Products | Run Apparel" }];
}

export default function CategoryProductsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"small" | "medium" | "large">("medium");
  const [sortBy, setSortBy] = useState("name");

  // Fetch category by slug
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const res = await apiRequest("/api/categories");
      return res.json();
    },
  });

  const category = categories.find((c) => c.slug === slug);

  // Fetch subcategories
  const subcategories = categories.filter((c) => c.parentId === category?.id && c.isActive);

  // Fetch media assets
  const { data: mediaData } = useQuery<{ data: MediaAsset[] }>({
    queryKey: MediaQueryKeys.list,
    queryFn: async () => {
      const res = await apiRequest("/api/media?all=true");
      return res.json();
    },
  });
  const mediaAssets = mediaData?.data || [];

  // Fetch products for this category
  const { data: productsResponse, isLoading } = useQuery<{
    data: Product[];
    pagination?: any;
  }>({
    queryKey: ["/api/products", "category", category?.id],
    queryFn: async () => {
      if (!category?.id) return { data: [] };
      const res = await apiRequest(`/api/products?category=${category.id}&active=true`);
      return res.json();
    },
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
    return <img src={optimizedSrc} alt={alt} className="h-full w-full object-cover" />;
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
      product.imageIds?.[0] ||
      product.videos?.[0];
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
    }, [images, hasVideo, imageIndex, showVideo, loadedImages, loadingImages]);

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
        <div className="text-muted-foreground/50 flex h-full w-full items-center justify-center">
          <LayoutGrid className="h-12 w-12" />
        </div>
      );
    }

    return (
      <div
        className="group relative h-full w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Current Media Display */}
        {showVideo && primaryVideo ? (
          <div className="relative h-full w-full">
            <video
              src={getOptimizedMediaUrl(primaryVideo.id)}
              className="h-full w-full object-cover"
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
            <div className="absolute top-2 right-2 rounded bg-black/70 p-1 text-white">
              <Play className="h-3 w-3" />
            </div>
            <div className="media-fallback bg-muted text-muted-foreground/50 absolute inset-0 hidden h-full w-full items-center justify-center">
              <Play className="h-12 w-12" />
            </div>
          </div>
        ) : (
          images[imageIndex] && (
            <>
              {/* Enhanced Loading State */}
              {!loadedImages.has(images[imageIndex].id) && (
                <div className="bg-muted absolute inset-0 flex h-full w-full animate-pulse items-center justify-center">
                  <div className="text-muted-foreground/50 text-center">
                    {loadingImages.has(images[imageIndex].id) ? (
                      <>
                        <div className="border-muted-foreground mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                        <div className="text-xs">Loading...</div>
                      </>
                    ) : (
                      <LayoutGrid className="h-12 w-12" />
                    )}
                  </div>
                </div>
              )}

              {/* Main Image */}
              <img
                src={getOptimizedMediaUrl(images[imageIndex].id)}
                alt={product.name}
                className={cn(
                  "h-full w-full object-cover transition-all duration-300",
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
              <div className="media-fallback bg-muted text-muted-foreground/50 absolute inset-0 hidden h-full w-full items-center justify-center">
                <LayoutGrid className="h-12 w-12" />
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
                    "absolute top-1/2 left-2 -translate-y-1/2 rounded-full p-1 text-white transition-all duration-200",
                    isNavigating
                      ? "cursor-not-allowed bg-black/30"
                      : "bg-black/50 hover:bg-black/70",
                  )}
                >
                  <ChevronLeft className={cn("h-4 w-4", isNavigating && "opacity-50")} />
                </button>
                <button
                  onClick={goToNext}
                  disabled={isNavigating}
                  className={cn(
                    "absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1 text-white transition-all duration-200",
                    isNavigating
                      ? "cursor-not-allowed bg-black/30"
                      : "bg-black/50 hover:bg-black/70",
                  )}
                >
                  <ChevronRight className={cn("h-4 w-4", isNavigating && "opacity-50")} />
                </button>
              </>
            )}

            {/* Dots Navigation - always visible at bottom */}
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
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
                      "relative h-2 w-2 rounded-full transition-all duration-200",
                      currentImageIndex === index
                        ? "scale-110 bg-white"
                        : isNavigating
                          ? "cursor-not-allowed bg-white/30"
                          : "bg-white/50 hover:bg-white/80",
                    )}
                  >
                    {/* Loading indicator for dots */}
                    {currentImageIndex === index && !isImageLoaded && (
                      <div className="absolute inset-0 animate-pulse rounded-full border border-white/50" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Image Counter - show for large view */}
        {totalItems > 1 && viewMode === "large" && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-white">
            <span>
              {currentImageIndex + 1} / {totalItems}
            </span>
            {isNavigating && (
              <div className="h-2 w-2 animate-spin rounded-full border border-white/50 border-t-white" />
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Typography.H2 className="mb-2 text-2xl font-bold">Category Not Found</Typography.H2>
          <Typography.P className="text-muted-foreground mb-4">
            The category you're looking for doesn't exist.
          </Typography.P>
          <Button onClick={() => navigate("/products")}>Browse All Products</Button>
        </div>
      </div>
    );
  }

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <div className="bg-muted/30 min-h-screen">
        {/* Hero Section */}
        {category.bannerUrl && (
          <div className="relative h-64 overflow-hidden md:h-80">
            <OptimizedCategoryBanner
              mediaId={parseInt(category.bannerUrl, 10)}
              fallbackUrl={category.bannerUrl}
              alt={category.name}
            />
            <div className="center-flex absolute inset-0 bg-black/40">
              <div className="text-center text-white">
                <Typography.H1 className="mb-2 text-4xl font-bold md:text-5xl">
                  {category.name}
                </Typography.H1>
                {category.description && (
                  <Typography.P className="mx-auto max-w-2xl text-lg">
                    {category.description}
                  </Typography.P>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <div className="border-b bg-white pt-20">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm">
              <Button variant="link" className="h-auto p-0" onClick={() => navigate("/")}>
                Home
              </Button>
              <span>/</span>
              <Button variant="link" className="h-auto p-0" onClick={() => navigate("/products")}>
                Products
              </Button>
              <span>/</span>
              <span className="text-muted-foreground">{category.name}</span>
            </nav>
          </div>
        </div>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div className="border-b bg-white">
            <div className="container mx-auto px-4 py-6">
              <Typography.H2 className="mb-4 text-lg font-semibold">Subcategories</Typography.H2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {subcategories.map((subcat) => (
                  <Link to={`/categories/${subcat.slug}`} key={subcat.id}>
                    <Card className="group transition-shadow-sm cursor-pointer hover:shadow-md">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          {subcat.imageUrl && (
                            <img
                              src={
                                getOptimizedMediaUrl(parseInt(subcat.imageUrl, 10)) ||
                                subcat.imageUrl
                              }
                              alt={subcat.name}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <Typography.H3 className="font-medium">{subcat.name}</Typography.H3>
                            <Typography.P className="text-muted-foreground text-sm">
                              {products.filter((p) => p.categoryId === subcat.id).length} products
                            </Typography.P>
                          </div>
                        </div>
                        <ChevronRight className="text-muted-foreground/50 group-hover:text-muted-foreground h-5 w-5" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="shadow-sm-xs border-b bg-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
              <Typography.H1 className="text-2xl font-bold">
                {!category.bannerUrl && category.name}
                {category.bannerUrl && "Products"}
              </Typography.H1>

              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="text-muted-foreground/50 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:w-72"
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
              </div>
            </div>

            {/* Results count */}
            <div className="text-muted-foreground mt-2 text-sm">
              Showing {sortedProducts.length} products
              {searchTerm && ` for "${searchTerm}"`}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="min-h-value-card flex items-center justify-center">
              <Loader2 className="text-muted-foreground/50 h-8 w-8 animate-spin" />
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Typography.P className="text-muted-foreground">
                No products found in this category
              </Typography.P>
            </div>
          ) : (
            <div className={cn("grid", gridClasses[viewMode])}>
              {sortedProducts.map((product) => {
                return (
                  <Link to={`/categories/${slug}/${product.slug || product.id}`} key={product.id}>
                    <Card className="group transition-shadow-sm cursor-pointer overflow-hidden hover:shadow-lg">
                      {/* Interactive Image Carousel */}
                      <div
                        className={cn(
                          "bg-muted relative overflow-hidden",
                          viewMode === "small" ? "aspect-3/4" : "aspect-4/5",
                        )}
                      >
                        <ProductImageCarousel product={product} viewMode={viewMode} />

                        {/* Badges - moved outside carousel to prevent conflicts */}
                        <div className="z-modal absolute top-2 left-2 flex flex-col gap-1">
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
                            "text-foreground line-clamp-2 font-semibold",
                            viewMode === "small" ? "text-sm" : "text-base",
                          )}
                        >
                          {product.name}
                        </h3>

                        {viewMode !== "small" && (
                          <>
                            <Typography.P className="text-muted-foreground mt-1 text-sm">
                              SKU: {product.sku}
                            </Typography.P>
                            {product.shortDescription && viewMode === "large" && (
                              <Typography.P className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                                {product.shortDescription}
                              </Typography.P>
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
    </HydrationBoundary>
  );
}
