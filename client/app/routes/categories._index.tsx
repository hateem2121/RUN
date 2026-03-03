import type { Category } from "@shared/index";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { AlertCircle, Eye, Loader2 } from "lucide-react";
// CHUNK 6: Lazy-load FluidGlass to defer three.js (565KB) from main bundle
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData } from "react-router";
import { CategoryFeaturedContent } from "@/components/categories/CategoryFeaturedContent";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { headingVariants, Typography } from "@/components/ui/typography";
import { apiRequest, batchFetchMediaContent, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });
  return { dehydratedState: dehydrate(queryClient) };
}

// Lazy-load FluidGlass (imports three.js)
// const _FluidGlass = lazy(() => import("@/components/ui/bento-cards/fluid-glass-final"));

import { GeometricDivider } from "@/components/ui/geometric-divider";
import type { Route } from "./+types/categories._index";

// --- Types ---
interface BentoCardContent {
  title?: string;
  description?: string;
  mediaUrl?: string; // ID or URL string
  link?: string;
  // SvgMask specific
  maskSvgUrl?: string;
  contentMediaUrl?: string;
  // Expandable specific
  expandedContent?: Array<{ title: string; text: string }>;
  // Flip specific
  subtitle?: string;
  features?: string[];
}

interface FeaturedContent {
  card1?: BentoCardContent;
  card2?: BentoCardContent;
  card3?: BentoCardContent;
  card4?: BentoCardContent;
}

// Error boundary for FluidGlass component
// class FluidGlassErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
//   constructor(props: { children: ReactNode }) {
//     super(props);
//     this.state = { hasError: false };
//   }

//   static getDerivedStateFromError() {
//     return { hasError: true };
//   }

//   override componentDidCatch(_error: Error) {}

//   override render() {
//     if (this.state.hasError) {
//       // Render nothing or a fallback background
//       return (
//         <div className="absolute inset-0 bg-linear-to-br from-purple-100/20 to-blue-100/20 dark:from-purple-900/20 dark:to-blue-900/20" />
//       );
//     }

//     return this.props.children;
//   }
// }

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Product Categories | Run Apparel" },
    {
      name: "description",
      content: "Explore our comprehensive range of sportswear solutions.",
    },
  ];
}

export default function CategoriesPage() {
  const loaderData = useLoaderData<typeof loader>();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.to(".hero-reveal", {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: "expo.out",
        delay: 0.2,
      });
    },
    { scope: containerRef },
  );

  // Fetch all categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => apiRequest("/api/categories"),
  });

  // Filter active categories with featured content
  const activeCategories = categories.filter((cat) => cat.isActive);

  // Type guard for featured content access
  const getFeaturedContent = useCallback((category: Category): FeaturedContent => {
    const content = category.featuredContent;
    if (content && typeof content === "object" && content !== null) {
      return content as unknown as FeaturedContent;
    }
    return {};
  }, []);

  // PHASE 1A INTEGRATION: Extract ALL media IDs from categories and batch fetch them
  const allMediaIds = useMemo(() => {
    const ids: number[] = [];
    activeCategories.forEach((category) => {
      const content = getFeaturedContent(category);

      // Extract media IDs from all card types
      [content.card1, content.card2, content.card3, content.card4].forEach(
        (card: BentoCardContent | undefined) => {
          if (card?.maskSvgUrl && !Number.isNaN(parseInt(card.maskSvgUrl, 10))) {
            ids.push(parseInt(card.maskSvgUrl, 10));
          }
          if (card?.contentMediaUrl && !Number.isNaN(parseInt(card.contentMediaUrl, 10))) {
            ids.push(parseInt(card.contentMediaUrl, 10));
          }
          if (card?.mediaUrl && !Number.isNaN(parseInt(card.mediaUrl, 10))) {
            ids.push(parseInt(card.mediaUrl, 10));
          }
        },
      );
    });

    // Remove duplicates and invalid IDs
    return [...new Set(ids)].filter((id) => id > 0 && id < 1000000000000);
  }, [activeCategories, getFeaturedContent]);

  // PHASE 1A: Batch fetch all category media to eliminate N+1 requests
  const [batchedMedia, setBatchedMedia] = useState<Map<number, string>>(new Map());
  const [mediaMimeTypes, setMediaMimeTypes] = useState<Map<number, string>>(new Map());
  const [, setMediaBatchLoading] = useState(false);

  useEffect(() => {
    if (allMediaIds.length === 0) {
      return;
    }

    const fetchBatchedMedia = async () => {
      setMediaBatchLoading(true);
      try {
        const results = await batchFetchMediaContent(allMediaIds);

        const mediaMap = new Map<number, string>();
        const mimeTypeMap = new Map<number, string>();
        results.forEach((result) => {
          if (result.success) {
            // PHASE 1B Integration: Use inline content if available (small assets), otherwise URL
            const mediaUrl = result.content || result.url || `/api/media/${result.id}/content`;
            mediaMap.set(result.id, mediaUrl);
            // Store MIME type for model detection
            if (result.mimeType) {
              mimeTypeMap.set(result.id, result.mimeType);
            }
          }
        });

        setBatchedMedia(mediaMap);
        setMediaMimeTypes(mimeTypeMap);
      } catch (_error) {
      } finally {
        setMediaBatchLoading(false);
      }
    };

    fetchBatchedMedia();
  }, [allMediaIds]);

  // Helper: Extract numeric media ID from either numeric string or /api/media/:id/content URL
  const extractMediaId = (mediaUrl: string | null | undefined): number | null => {
    if (!mediaUrl) {
      return null;
    }

    // Try direct numeric parse first
    const directId = parseInt(mediaUrl, 10);
    if (!Number.isNaN(directId)) {
      return directId;
    }

    // Extract from /api/media/:id/content or /api/media/:id/ pattern
    const match = mediaUrl.match(/\/api\/media\/(\d+)/);
    if (match?.[1]) {
      return parseInt(match[1], 10);
    }

    return null;
  };

  // PHASE 1A: Enhanced batch-first media URL resolver - eliminates N+1 requests
  const getMediaUrl = (mediaId: string | null | undefined): string | undefined => {
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
    if (!Number.isNaN(numericId) && numericId > 1000000000000) {
      return undefined;
    }

    // PHASE 1A: Use batched media first - eliminates individual requests
    if (!Number.isNaN(numericId) && batchedMedia.has(numericId)) {
      return batchedMedia.get(numericId);
    }

    // Fallback: Convert to unified content format (rare case for unbatched media)
    return `/api/media/${mediaId}/content`;
  };

  // Show loading state for both categories and media batch
  // FIX: Only block on categories loading, not media batch
  if (categoriesLoading) {
    return (
      <div className="bg-card flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="text-luxury-gray-600 mx-auto mb-3 h-8 w-8 animate-spin" />
          <Typography.P className="text-luxury-body text-sm">
            {categoriesLoading
              ? "Loading categories..."
              : `Loading ${allMediaIds.length} media assets...`}
          </Typography.P>
        </div>
      </div>
    );
  }

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <div ref={containerRef} className="bg-card min-h-screen pt-12 pb-6 md:pt-20 md:pb-12">
        {/* Hero Section */}
        <div className="container px-4 md:px-8 mt-0 mb-0 pt-6 pb-6 md:pt-[50px] md:pb-[50px]">
          {/* Breadcrumbs Integration */}
          <div className="mb-8 flex justify-center opacity-0 hero-reveal">
            <nav className="flex items-center space-x-2 text-luxury-gray-400 text-xs uppercase tracking-widest">
              <a href="/" className="hover:text-luxury-charcoal transition-colors">
                Home
              </a>
              <span className="text-luxury-gray-300">/</span>
              <span className="text-luxury-charcoal font-medium">Categories</span>
            </nav>
          </div>

          <h1
            className={cn(
              headingVariants({ variant: "h1" }),
              "font-neue-stance text-luxury-heading text-center font-bold md:text-5xl opacity-0 hero-reveal",
            )}
          >
            Product Categories
          </h1>
          <p className="text-luxury-body mx-auto mt-3 mb-4 max-w-2xl text-center text-lg opacity-0 hero-reveal">
            Explore our comprehensive range of sportswear solutions
          </p>
        </div>
        {/* Categories with Bento Cards */}
        <div className="container mx-auto max-w-7xl px-4 md:px-8">
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
                      <div
                        className="border-border shadow-luxury-md mb-20 overflow-hidden rounded-2xl border bg-card/60 p-8 backdrop-blur-md dark:bg-card/40"
                      >
                        <div className="mb-6 text-center">
                          <Typography.H2 className="font-neue-stance text-foreground mb-4 text-2xl font-bold">
                            {category.name}
                          </Typography.H2>
                          {category.description && (
                            <Typography.P className="text-muted-foreground mx-auto mb-4 max-w-2xl">
                              {category.description}
                            </Typography.P>
                          )}
                        </div>

                        <div className="relative overflow-hidden rounded-xl border border-amber-200/50 bg-amber-50/10 p-6 dark:border-amber-400/20 dark:bg-amber-900/10">
                          <div className="flex items-start gap-4">
                            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div>
                                <Typography.P className="text-foreground font-medium">
                                  Featured content not yet configured
                                </Typography.P>
                                <Typography.P className="text-muted-foreground text-sm">
                                  This category is available but needs featured content setup in the
                                  admin panel to display interactive cards.
                                </Typography.P>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open("/admin/categories", "_blank")}
                                className="border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/30"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Configure in Admin Panel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <CategoryFeaturedContent
                        category={{
                          id: category.id,
                          name: category.name,
                          slug: category.slug,
                          description: category.description,
                        }}
                        featuredContent={featuredContent}
                        getMediaUrl={getMediaUrl}
                        extractMediaId={extractMediaId}
                        mediaMimeTypes={mediaMimeTypes}
                        categoryIndex={categoryIndex}
                      />
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
            <div className="py-16 text-center">
              <Alert className="mx-auto max-w-md border-blue-200 bg-blue-50">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="space-y-3">
                    <Typography.H3 className="font-semibold">No categories available</Typography.H3>
                    <Typography.P className="text-sm">
                      Categories are currently being set up. Check back soon or contact the admin to
                      configure product categories.
                    </Typography.P>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open("/admin/categories", "_blank")}
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Admin Panel
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </div>
    </HydrationBoundary>
  );
}
