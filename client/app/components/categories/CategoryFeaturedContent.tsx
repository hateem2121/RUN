import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Component, lazy, type ReactNode, Suspense, useRef } from "react";
import { BentoCardContainer } from "@/components/ui/BentoCardContainer";
import { ExpandableCard } from "@/components/ui/bento-cards/expandable-card";
import { FlipCard } from "@/components/ui/bento-cards/flip-card";
import SvgMaskCard from "@/components/ui/bento-cards/svg-mask-card";
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Typography } from "@/components/ui/typography";
import { isModelUrl } from "@/lib/media-type-detector";
import { getResponsiveSpanClasses } from "@/lib/responsive-grid";
import { cn } from "@/lib/utils";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Lazy-load FluidGlass
const FluidGlass = lazy(() => import("@/components/ui/bento-cards/fluid-glass-final"));

interface BentoCardContent {
  title?: string;
  description?: string;
  mediaUrl?: string;
  link?: string;
  maskSvgUrl?: string;
  contentMediaUrl?: string;
  expandedContent?: Array<{ title: string; text: string }>;
  subtitle?: string;
  features?: string[];
}

interface FeaturedContent {
  card1?: BentoCardContent;
  card2?: BentoCardContent;
  card3?: BentoCardContent;
  card4?: BentoCardContent;
}

interface CategoryFeaturedContentProps {
  category: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
  };
  featuredContent: FeaturedContent;
  getMediaUrl: (mediaId: string | null | undefined) => string | undefined;
  extractMediaId: (url: string | null | undefined) => number | null;
  mediaMimeTypes: Map<number, string>;
  categoryIndex: number;
}

// Error boundary for FluidGlass component
class FluidGlassErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-linear-to-br from-purple-100/20 to-blue-100/20 dark:from-purple-900/20 dark:to-blue-900/20" />
      );
    }
    return this.props.children;
  }
}

export function CategoryFeaturedContent({
  category,
  featuredContent,
  getMediaUrl,
  extractMediaId,
  mediaMimeTypes,
}: CategoryFeaturedContentProps) {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const cards = containerRef.current.querySelectorAll(".bento-card");

      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className="mb-10 space-y-6 md:mb-20">
      <BentoCardContainer>
        {/* Card 1 - SVG Masking */}
        <div className={cn("bento-card", getResponsiveSpanClasses("card1"))}>
          <SvgMaskCard
            title={featuredContent.card1?.title || ""}
            description={featuredContent.card1?.description || ""}
            maskSvgUrl={getMediaUrl(featuredContent.card1?.maskSvgUrl)}
            contentMediaUrl={getMediaUrl(featuredContent.card1?.contentMediaUrl)}
            mediaUrl={getMediaUrl(featuredContent.card1?.mediaUrl)}
            link={featuredContent.card1?.link}
          />
        </div>

        {/* Card 2 - Expandable */}
        <div className={cn("bento-card", getResponsiveSpanClasses("card2"))}>
          {featuredContent.card2 && (
            <ExpandableCard
              title={featuredContent.card2.title || "Expandable Content"}
              description={featuredContent.card2.description || "Click to explore more details"}
              mediaUrl={getMediaUrl(featuredContent.card2.mediaUrl)}
              link={featuredContent.card2.link}
              expandedContent={featuredContent.card2.expandedContent || []}
              cardId={`card2-${category.id}`}
            />
          )}
        </div>

        {/* Card 3 - Flip */}
        <div className={cn("bento-card", getResponsiveSpanClasses("card3"))}>
          {featuredContent.card3 && (
            <FlipCard
              title={featuredContent.card3.title || "Interactive Card"}
              description={featuredContent.card3.description || "Flip to discover more"}
              subtitle={featuredContent.card3.subtitle}
              features={featuredContent.card3.features || []}
              mediaUrl={getMediaUrl(featuredContent.card3.mediaUrl)}
              link={featuredContent.card3.link}
            />
          )}
        </div>

        {/* Card 4 - Fluid Glass Lens */}
        <div className={cn("bento-card", getResponsiveSpanClasses("card4"))}>
          {featuredContent.card4 && (
            <div className="max-h-modal-md relative h-auto min-h-[300px] overflow-hidden rounded-lg bg-linear-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
              {getMediaUrl(featuredContent.card4.mediaUrl) &&
                (() => {
                  const resolvedUrl = getMediaUrl(featuredContent.card4!.mediaUrl)!;
                  const mediaId = extractMediaId(featuredContent.card4!.mediaUrl);
                  const mimeType = mediaId ? mediaMimeTypes.get(mediaId) : undefined;
                  const isModel = isModelUrl(resolvedUrl, mimeType);

                  return (
                    <div className="z-base absolute inset-0">
                      {isModel ? (
                        <LazyUnifiedModelViewer
                          asset={{
                            id: mediaId || 0,
                            filename: featuredContent.card4!.title || "model.glb",
                            mimeType: mimeType || "model/gltf-binary",
                            type: "model",
                            url: resolvedUrl,
                            isActive: true,
                            metadata: {},
                            uploadedAt: null,
                            createdAt: null,
                            updatedAt: null,
                            deletedAt: null,
                            originalName: null,
                            fileSize: null,
                            size: null,
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
                          }}
                          className="h-full w-full"
                          config={{ autoRotate: true, cameraControls: true }}
                          showControls={false}
                          showLoadingProgress={true}
                        />
                      ) : (
                        <OptimizedImage
                          src={resolvedUrl}
                          alt={featuredContent.card4?.title || "Glass Effect"}
                          imageClassName="h-full w-full object-cover"
                          className="h-full w-full"
                        />
                      )}
                    </div>
                  );
                })()}
              <FluidGlassErrorBoundary>
                <Suspense
                  fallback={
                    <div className="absolute inset-0 bg-linear-to-br from-purple-100/20 to-blue-100/20 dark:from-purple-900/20 dark:to-blue-900/20" />
                  }
                >
                  <div className="z-elevated pointer-events-none absolute inset-0">
                    <FluidGlass mode="lens" />
                  </div>
                </Suspense>
              </FluidGlassErrorBoundary>
              {(featuredContent.card4.title || featuredContent.card4.description) && (
                <div className="z-elevated pointer-events-none absolute right-0 bottom-0 left-0 p-6">
                  {featuredContent.card4.title && (
                    <Typography.H3 className="font-neue-stance mb-2 text-xl font-bold text-white drop-shadow-lg">
                      {featuredContent.card4.title}
                    </Typography.H3>
                  )}
                  {featuredContent.card4.description && (
                    <Typography.P className="text-sm text-white/90 drop-shadow-lg">
                      {featuredContent.card4.description}
                    </Typography.P>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </BentoCardContainer>
    </section>
  );
}
