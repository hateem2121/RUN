import type { Category } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, Eye, Loader2 } from "lucide-react";
// CHUNK 6: Lazy-load FluidGlass to defer three.js (565KB) from main bundle
import { Component, lazy, type ReactNode, Suspense, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BentoCardContainer } from "@/components/ui/BentoCardContainer";
import ExpandableCard from "@/components/ui/bento-cards/expandable-card";
import FlipCard from "@/components/ui/bento-cards/flip-card";
// Direct imports for immediate rendering
import SvgMaskCard from "@/components/ui/bento-cards/svg-mask-card";
import { Button } from "@/components/ui/button";
import { isModelUrl } from "@/lib/media-type-detector";
import { batchFetchMediaContent } from "@/lib/queryClient";
import { getResponsiveSpanClasses } from "@/lib/responsive-grid";
import { cn } from "@/lib/utils";

// Lazy-load FluidGlass (imports three.js)
const FluidGlass = lazy(() => import("@/components/ui/bento-cards/fluid-glass-final"));

import { CircularNavButton } from "@/components/ui/circular-nav-button";
import { GeometricDivider } from "@/components/ui/geometric-divider";
// CHUNK 6: Use lazy-loaded 3D viewer to reduce initial bundle by ~1MB
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";

// Error boundary for FluidGlass component
class FluidGlassErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn(
      "FluidGlass component error (WebGL not supported):",
      error.message,
    );
  }

  render() {
    if (this.state.hasError) {
      // Render nothing or a fallback background
      return (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-blue-100/20 dark:from-purple-900/20 dark:to-blue-900/20" />
      );
    }

    return this.props.children;
  }
}

export default function CategoriesPage() {
  // Fetch all categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<
    Category[]
  >({
    queryKey: ["/api/categories"],
  });

  // Filter active categories with featured content
  const activeCategories = categories.filter((cat) => cat.isActive);

  // Type guard for featured content access
  const getFeaturedContent = (category: Category) => {
    const content = category.featuredContent;
    if (content && typeof content === "object" && content !== null) {
      return content as Record<string, any>;
    }
    return {};
  };

  // PHASE 1A INTEGRATION: Extract ALL media IDs from categories and batch fetch them
  const allMediaIds = useMemo(() => {
    const ids: number[] = [];
    activeCategories.forEach((category) => {
      const content = getFeaturedContent(category);

      // Extract media IDs from all card types
      [content.card1, content.card2, content.card3, content.card4].forEach(
        (card: any) => {
          if (card?.maskSvgUrl && !isNaN(parseInt(card.maskSvgUrl, 10))) {
            ids.push(parseInt(card.maskSvgUrl, 10));
          }
          if (
            card?.contentMediaUrl &&
            !isNaN(parseInt(card.contentMediaUrl, 10))
          ) {
            ids.push(parseInt(card.contentMediaUrl, 10));
          }
          if (card?.mediaUrl && !isNaN(parseInt(card.mediaUrl, 10))) {
            ids.push(parseInt(card.mediaUrl, 10));
          }
        },
      );
    });

    // Remove duplicates and invalid IDs
    return [...new Set(ids)].filter((id) => id > 0 && id < 1000000000000);
  }, [activeCategories]);

  // PHASE 1A: Batch fetch all category media to eliminate N+1 requests
  const [batchedMedia, setBatchedMedia] = useState<Map<number, string>>(
    new Map(),
  );
  const [mediaMimeTypes, setMediaMimeTypes] = useState<Map<number, string>>(
    new Map(),
  );
  const [, setMediaBatchLoading] = useState(false);

  useEffect(() => {
    if (allMediaIds.length === 0) return;

    const fetchBatchedMedia = async () => {
      setMediaBatchLoading(true);
      try {
        console.log(
          `🚀 [Categories] PHASE 1A: Batching ${allMediaIds.length} media assets to eliminate N+1`,
        );
        const results = await batchFetchMediaContent(allMediaIds);

        const mediaMap = new Map<number, string>();
        const mimeTypeMap = new Map<number, string>();
        results.forEach((result) => {
          if (result.success) {
            // PHASE 1B Integration: Use inline content if available (small assets), otherwise URL
            const mediaUrl =
              result.content || result.url || `/api/media/${result.id}/content`;
            mediaMap.set(result.id, mediaUrl);
            // Store MIME type for model detection
            if (result.mimeType) {
              mimeTypeMap.set(result.id, result.mimeType);
            }
          }
        });

        setBatchedMedia(mediaMap);
        setMediaMimeTypes(mimeTypeMap);
        console.log(
          `✅ [Categories] PHASE 1A+1B: Batched ${mediaMap.size}/${allMediaIds.length} assets with ${results.filter((r) => r.content).length} inline, ${mimeTypeMap.size} with MIME types`,
        );
      } catch (error) {
        console.error("❌ [Categories] Batch media fetch failed:", error);
      } finally {
        setMediaBatchLoading(false);
      }
    };

    fetchBatchedMedia();
  }, [allMediaIds]);

  // Debug code removed - environment-specific logging should be handled at build time

  // Helper: Extract numeric media ID from either numeric string or /api/media/:id/content URL
  const extractMediaId = (
    mediaUrl: string | null | undefined,
  ): number | null => {
    if (!mediaUrl) return null;

    // Try direct numeric parse first
    const directId = parseInt(mediaUrl, 10);
    if (!isNaN(directId)) return directId;

    // Extract from /api/media/:id/content or /api/media/:id/ pattern
    const match = mediaUrl.match(/\/api\/media\/(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }

    return null;
  };

  // PHASE 1A: Enhanced batch-first media URL resolver - eliminates N+1 requests
  const getMediaUrl = (
    mediaId: string | null | undefined,
  ): string | undefined => {
    // Handle corruption and empty values
    if (
      !mediaId ||
      mediaId === "undefined" ||
      mediaId === "null" ||
      mediaId === "" ||
      mediaId.includes("undefined")
    ) {
      return undefined;
    }

    // Return unified media URLs as-is (but check for corruption)
    if (mediaId.startsWith("/api/media/")) {
      return mediaId.includes("undefined") ? undefined : mediaId;
    }

    // Return direct URLs as-is
    if (mediaId.startsWith("http")) {
      return mediaId;
    }

    // CRITICAL FIX: Skip timestamp-based optimistic IDs (> 1000000000000)
    const numericId = parseInt(mediaId, 10);
    if (!isNaN(numericId) && numericId > 1000000000000) {
      console.warn(
        `[Categories] Skipping optimistic entry with timestamp ID: ${mediaId}`,
      );
      return undefined;
    }

    // PHASE 1A: Use batched media first - eliminates individual requests
    if (!isNaN(numericId) && batchedMedia.has(numericId)) {
      return batchedMedia.get(numericId);
    }

    // Fallback: Convert to unified content format (rare case for unbatched media)
    return `/api/media/${mediaId}/content`;
  };

  // Show loading state for both categories and media batch
  // FIX: Only block on categories loading, not media batch
  if (categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-card">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-luxury-gray-600 mx-auto mb-3" />
          <p className="text-luxury-body text-sm">
            {categoriesLoading
              ? "Loading categories..."
              : `Loading ${allMediaIds.length} media assets...`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card pt-12 md:pt-20 pb-6 md:pb-12">
      {/* Hero Section */}
      <div className="container mx-auto px-4 mt-0 mb-0 pt-6 md:pt-[50px] pb-6 md:pb-[50px]">
        <motion.h1
          className="text-4xl md:text-5xl font-neue-stance font-bold text-center text-luxury-heading"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Product Categories
        </motion.h1>
        <motion.p
          className="text-lg text-luxury-body text-center max-w-2xl mx-auto mt-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          Explore our comprehensive range of sportswear solutions
        </motion.p>
      </div>
      {/* Categories with Bento Cards */}
      <div className="container mx-auto px-4">
        {activeCategories.length > 0 ? (
          <div className="space-y-0">
            {activeCategories.map((category, categoryIndex) => {
              const featuredContent = getFeaturedContent(category);

              // Show category even if only partially configured
              const hasAnyContent =
                featuredContent.card1 ||
                featuredContent.card2 ||
                featuredContent.card3 ||
                featuredContent.card4;

              return (
                <div key={category.id} className="w-full">
                  {!hasAnyContent ? (
                    // Enhanced error handling for categories without featured content
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: categoryIndex * 0.05,
                      }}
                      className="bg-white shadow-sm-luxury-lg rounded-lg p-8 border border-luxury-light mb-20"
                    >
                      <div className="text-center mb-6">
                        <h2 className="text-2xl font-neue-stance font-bold text-luxury-charcoal mb-4">
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="text-luxury-body max-w-2xl mx-auto mb-4">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <Alert className="bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          <div className="space-y-2">
                            <p className="font-medium">
                              Featured content not yet configured
                            </p>
                            <p className="text-sm">
                              This category is available but needs featured
                              content setup in the admin panel to display
                              interactive cards.
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open("/admin/categories", "_blank")
                              }
                              className="mt-2 text-amber-700 border-amber-300 hover:bg-amber-100"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Configure in Admin Panel
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  ) : (
                    <motion.section
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: categoryIndex * 0.05,
                      }}
                      className="space-y-6 mb-10 md:mb-20"
                    >
                      {/* Category Header */}
                      <div className="text-center mb-6 md:mb-10">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 mb-3">
                          <h2 className="text-3xl md:text-4xl font-neue-stance font-bold text-luxury-heading">
                            {category.name}
                          </h2>
                          <CircularNavButton
                            href={`/products?category=${category.slug}`}
                          />
                        </div>
                        {category.description && (
                          <p className="text-luxury-body max-w-3xl mx-auto leading-tight md:leading-normal px-4 md:px-0">
                            {category.description}
                          </p>
                        )}
                      </div>

                      {/* Bento Grid Layout - Responsive Grid System */}
                      <BentoCardContainer>
                        {/* Card 1 - SVG Masking with Dual Media Support */}
                        <div
                          className={cn(
                            "bento-card",
                            getResponsiveSpanClasses("card1"),
                          )}
                        >
                          <SvgMaskCard
                            title={featuredContent.card1?.title || ""}
                            description={
                              featuredContent.card1?.description || ""
                            }
                            // Enhanced dual media props
                            maskSvgUrl={getMediaUrl(
                              featuredContent.card1?.maskSvgUrl,
                            )}
                            contentMediaUrl={getMediaUrl(
                              featuredContent.card1?.contentMediaUrl,
                            )}
                            // Legacy support for backward compatibility
                            mediaUrl={getMediaUrl(
                              featuredContent.card1?.mediaUrl,
                            )}
                            link={featuredContent.card1?.link}
                          />
                        </div>

                        {/* Card 2 - Expandable */}
                        <div
                          className={cn(
                            "bento-card",
                            getResponsiveSpanClasses("card2"),
                          )}
                        >
                          <ExpandableCard
                            title={
                              featuredContent.card2?.title ||
                              "Expandable Content"
                            }
                            description={
                              featuredContent.card2?.description ||
                              "Click to explore more details"
                            }
                            mediaUrl={getMediaUrl(
                              featuredContent.card2?.mediaUrl,
                            )}
                            link={featuredContent.card2?.link}
                            expandedContent={
                              featuredContent.card2?.expandedContent
                            }
                            cardId={`card2-${category.id}`}
                          />
                        </div>

                        {/* Card 3 - Flip */}
                        <div
                          className={cn(
                            "bento-card",
                            getResponsiveSpanClasses("card3"),
                          )}
                        >
                          <FlipCard
                            title={
                              featuredContent.card3?.title || "Interactive Card"
                            }
                            description={
                              featuredContent.card3?.description ||
                              "Flip to discover more"
                            }
                            subtitle={featuredContent.card3?.subtitle}
                            features={featuredContent.card3?.features}
                            mediaUrl={getMediaUrl(
                              featuredContent.card3?.mediaUrl,
                            )}
                            link={featuredContent.card3?.link}
                          />
                        </div>

                        {/* Card 4 - Fluid Glass Lens with 3D Model or Image Background */}
                        <div
                          className={cn(
                            "bento-card",
                            getResponsiveSpanClasses("card4"),
                          )}
                        >
                          <div className="relative min-h-[300px] h-auto max-h-[600px] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg overflow-hidden">
                            {/* Media Background - 3D Model or Image */}
                            {getMediaUrl(featuredContent.card4?.mediaUrl) &&
                              (() => {
                                const resolvedUrl = getMediaUrl(
                                  featuredContent.card4.mediaUrl,
                                )!;
                                const mediaId = extractMediaId(
                                  featuredContent.card4.mediaUrl,
                                );
                                const mimeType = mediaId
                                  ? mediaMimeTypes.get(mediaId)
                                  : undefined;
                                const isModel = isModelUrl(
                                  resolvedUrl,
                                  mimeType,
                                );

                                return (
                                  <div className="absolute inset-0 z-0">
                                    {isModel ? (
                                      // 3D Model Viewer for GLB/GLTF files
                                      <LazyUnifiedModelViewer
                                        asset={{
                                          id: mediaId || 0,
                                          filename:
                                            featuredContent.card4.title ||
                                            "model.glb",
                                          originalName: null,
                                          fileSize: null,
                                          size: null,
                                          mimeType:
                                            mimeType || "model/gltf-binary",
                                          type: "model",
                                          url: resolvedUrl,
                                          thumbnailUrl: null,
                                          thumbnailFilename: null,
                                          thumbnailStoragePath: null,
                                          imageVariants: null,
                                          storagePath: resolvedUrl,
                                          bucketName: "default",
                                          folderId: null,
                                          tags: null,
                                          altText: null,
                                          caption: null,
                                          metadata: {},


                                          uploadedAt: null,
                                          isActive: true,
                                          createdAt: null,
                                          updatedAt: null,
                                          deletedAt: null,
                                        }}
                                        className="w-full h-full"
                                        config={{
                                          autoRotate: true,
                                          cameraControls: true,
                                        }}
                                        showControls={false}
                                        showLoadingProgress={true}
                                      />
                                    ) : (
                                      // Standard image for non-3D media
                                      <img
                                        src={resolvedUrl}
                                        alt={
                                          featuredContent.card4?.title ||
                                          "Glass Effect"
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                );
                              })()}
                            {/* Three.js Glass Lens Overlay - CHUNK 6: Lazy-loaded to defer three.js */}
                            <FluidGlassErrorBoundary>
                              <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 to-blue-100/20 dark:from-purple-900/20 dark:to-blue-900/20" />}>
                                <div className="absolute inset-0 z-modal-backdrop pointer-events-none">
                                  <FluidGlass mode="lens" />
                                </div>
                              </Suspense>
                            </FluidGlassErrorBoundary>
                            {/* Text Content from Admin Console */}
                            {(featuredContent.card4?.title ||
                              featuredContent.card4?.description) && (
                                <div className="absolute bottom-0 left-0 right-0 p-6 z-modal pointer-events-none">
                                  {featuredContent.card4?.title && (
                                    <h3 className="text-xl font-neue-stance font-bold text-white mb-2 drop-shadow-lg">
                                      {featuredContent.card4.title}
                                    </h3>
                                  )}
                                  {featuredContent.card4?.description && (
                                    <p className="text-sm text-white/90 drop-shadow-lg">
                                      {featuredContent.card4.description}
                                    </p>
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </BentoCardContainer>
                    </motion.section>
                  )}

                  {/* Geometric Divider - only between sections, not after the last one */}
                  {categoryIndex < activeCategories.length - 1 && (
                    <GeometricDivider
                      // animationDelay={categoryIndex * 0.1}
                      className="my-8 md:my-16"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Alert className="max-w-md mx-auto bg-blue-50 border-blue-200">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-3">
                  <h3 className="font-semibold">No categories available</h3>
                  <p className="text-sm">
                    Categories are currently being set up. Check back soon or
                    contact the admin to configure product categories.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open("/admin/categories", "_blank")}
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Admin Panel
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
