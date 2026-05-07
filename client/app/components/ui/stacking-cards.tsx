import { gsap, useGSAP } from "@/lib/gsap";
import type { AboutSection, MediaAsset } from "@shared/index";
import { useRef } from "react";
import { IconWrapper } from "@/components/ui/icon-wrapper";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Skeleton } from "@/components/ui/skeleton";

interface StackingCard {
  title: string;
  description: string;
  mediaId?: number | undefined;
  color: string;
  sectionType: string;
}

interface StackingCardsProps {
  sections: AboutSection[];
  getAssetUrl: (mediaId: number) => string | null;
  getAsset: (mediaId: number) => MediaAsset | null;
}

interface CardProps {
  i: number;
  total: number;
  title: string;
  description: string;
  mediaId?: number | undefined;
  color: string;
  targetScale: number;
  getAssetUrl: (mediaId: number) => string | null;
  getAsset: (mediaId: number) => MediaAsset | null;
}

// Color mapping for different section types
const getSectionColor = (sectionType: string): string => {
  const colors: Record<string, string> = {
    manufacturing: "var(--color-chart-blue)",
    quality: "var(--color-chart-purple)",
    global: "var(--color-primary)",
    innovation: "var(--color-brand-magenta)",
    sustainability: "var(--color-brand-lime)",
    custom: "var(--color-info)",
  };
  return colors[sectionType] ?? "var(--color-primary)";
};

export function Card({
  i,
  total,
  title,
  description,
  mediaId,
  color,
  targetScale,
  getAssetUrl,
  getAsset,
}: CardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  const imageUrl = mediaId ? getAssetUrl(mediaId) : null;
  const mediaAsset = mediaId ? getAsset(mediaId) : null;
  const isMobile = useIsMobile();

  useGSAP(
    () => {
      // Image parallax: scale from 2 → 1 as the card scrolls from entering to pinned
      if (imageWrapperRef.current) {
        gsap.fromTo(
          imageWrapperRef.current,
          { scale: 2 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top bottom",
              end: "top top",
              scrub: true,
            },
          },
        );
      }

      // Card scale: shrinks from 1 → targetScale as the whole section scrolls.
      // Progress range mirrors: [i * (1/total), 1]
      // We tie the tween to the parent section by using the card's own container
      // and reading scroll progress across the full stacking section height.
      if (cardRef.current) {
        const rangeStart = i / total;
        gsap.fromTo(
          cardRef.current,
          { scale: 1 },
          {
            scale: targetScale,
            ease: "none",
            scrollTrigger: {
              trigger: containerRef.current,
              // The scale-down starts when this card begins its range and ends at the
              // bottom of the stacking section.  Since each card is sticky/pinned the
              // container scroll distance maps cleanly to the framer range.
              start: `top+=${rangeStart * 100}% top`,
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
    },
    { scope: containerRef, dependencies: [isMobile, targetScale, i, total] },
  );

  return (
    <div
      ref={containerRef}
      className={`center-flex sticky top-0 ${isMobile ? "h-auto py-8" : "h-screen"} isolate`}
    >
      <div
        ref={cardRef}
        style={{
          top: isMobile ? 20 : `calc(-5vh + ${i * 25}px)`,
          pointerEvents: "auto",
        }}
        className="stacking-card group"
      >
        {/* Gradient overlay with color accent */}
        <div
          className="pointer-events-none absolute inset-0 rounded-xl bg-linear-to-br from-white/10 via-transparent to-black/10"
          style={{
            backgroundColor: `color-mix(in srgb, ${color}, transparent 95%)`,
          }}
        />

        {/* Inner glow with color tint */}
        <div
          className="pointer-events-none absolute inset-px rounded-xl bg-linear-to-br from-white/5 to-transparent"
          style={{
            background: `linear-gradient(to bottom right, color-mix(in srgb, ${color}, transparent 95%), transparent)`,
          }}
        />

        {/* Hover shimmer effect - disabled on mobile for performance */}
        {!isMobile && (
          <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div className="shimmer-overlay" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-elevated flex h-full flex-col">
          <h2 className="mb-4 shrink-0 text-center font-bold text-2xl text-foreground dark:text-white md:text-3xl">
            {title}
          </h2>
          <div className={`flex flex-1 flex-col items-stretch gap-6 md:flex-row md:gap-8`}>
            <div className={`flex min-h-0 w-full flex-col justify-center md:w-2/5`}>
              <p className="mb-6 flex-1 text-sm text-muted-foreground dark:text-white/90 leading-relaxed md:text-base">
                {description}
              </p>
              <div className="flex shrink-0 items-center gap-2 text-muted-foreground dark:text-white/80">
                <button
                  type="button"
                  className="cursor-pointer rounded-sm text-sm underline transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Learn more about our ${title} capabilities`}
                >
                  Learn more about our capabilities
                </button>
                <IconWrapper size="md" asChild aria-hidden="true">
                  <svg viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <title>Arrow icon</title>
                    <path
                      d="M21.5303 6.53033C21.8232 6.23744 21.8232 5.76256 21.5303 5.46967L16.7574 0.696699C16.4645 0.403806 15.9896 0.403806 15.6967 0.696699C15.4038 0.989592 15.4038 1.46447 15.6967 1.75736L19.9393 6L15.6967 10.2426C15.4038 10.5355 15.4038 11.0104 15.6967 11.3033C15.9896 11.5962 16.4645 11.5962 16.7574 11.3033L21.5303 6.53033ZM0 6.75L21 6.75V5.25L0 5.25L0 6.75Z"
                      fill="currentColor"
                    />
                  </svg>
                </IconWrapper>
              </div>
            </div>

            <div
              className={`relative min-h-48 w-full overflow-hidden rounded-lg bg-white/10 md:min-h-80 md:w-3/5`}
            >
              {imageUrl && mediaAsset ? (
                <div ref={imageWrapperRef} className={`absolute inset-0 h-full w-full`}>
                  {mediaAsset.type === "video" ? (
                    <video
                      src={imageUrl}
                      className="h-full w-full rounded-lg object-cover"
                      aria-label={`${title} background video`}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : (
                    <OptimizedImage
                      mediaId={mediaId!}
                      alt={title}
                      quality={90}
                      className="h-full w-full rounded-lg object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted/20">
                  <Skeleton className="h-full w-full rounded-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StackingCards({ sections, getAssetUrl, getAsset }: StackingCardsProps) {
  const headerRef = useRef<HTMLDivElement>(null);

  // Sort sections by position and filter active ones
  const sortedSections = sections
    .filter((section) => section.isActive)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // Transform sections into stacking cards data
  const stackingCards: StackingCard[] = sortedSections.map((section) => ({
    title: section.title ?? "Manufacturing Capability",
    description: section.content ?? "Professional manufacturing services tailored to your needs.",
    mediaId: section.mediaIds && section.mediaIds.length > 0 ? section.mediaIds[0] : undefined,
    color: getSectionColor(section.sectionType),
    sectionType: section.sectionType,
  }));

  // Header entrance animations (replaces motion.div whileInView)
  useGSAP(
    () => {
      if (!headerRef.current) return;

      gsap.from(headerRef.current.querySelector<HTMLElement>(".header-heading"), {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "cubic.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
          once: true,
        },
      });

      gsap.from(headerRef.current.querySelector<HTMLElement>(".header-body"), {
        opacity: 0,
        y: 20,
        duration: 0.6,
        delay: 0.2,
        ease: "cubic.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
          once: true,
        },
      });

      gsap.from(headerRef.current.querySelector<HTMLElement>(".header-hint"), {
        opacity: 0,
        y: 10,
        duration: 0.5,
        delay: 0.4,
        ease: "cubic.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 80%",
          once: true,
        },
      });
    },
    { scope: headerRef },
  );

  if (stackingCards.length === 0) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <h2 className="mb-4 font-bold text-3xl tracking-tighter sm:text-4xl md:text-5xl">
            Our Manufacturing Capabilities
          </h2>
          <p className="text-muted-foreground">No manufacturing capabilities configured yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-muted text-foreground dark:bg-slate-950 dark:text-white">
      {/* Header Section */}
      <div className="py-20" ref={headerRef}>
        <div className="container mx-auto px-4 text-center md:px-6">
          <div className="header-heading">
            <h2 className="mb-6 font-bold text-4xl text-foreground dark:text-white tracking-tight md:text-5xl lg:text-6xl">
              Our Manufacturing
              <br />
              <span className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Capabilities
              </span>
            </h2>
          </div>
          <p className="header-body mx-auto mb-8 max-w-3xl text-lg text-muted-foreground md:text-xl">
            Discover our comprehensive B2B sportswear solutions through our advanced manufacturing
            capabilities
          </p>
          <p className="header-hint center-flex gap-2 text-sm text-text-subtle">
            <span>Scroll down to explore</span>
            <svg
              className="h-4 w-4 animate-bounce"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Scroll indicator</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </p>
        </div>
      </div>

      {/* Stacking Cards Section */}
      <div>
        {stackingCards.map((card, i) => {
          const targetScale = 1 - (stackingCards.length - i) * 0.05;
          return (
            <Card
              key={`manufacturing_${i}`}
              i={i}
              total={stackingCards.length}
              title={card.title}
              description={card.description}
              mediaId={card.mediaId}
              color={card.color}
              targetScale={targetScale}
              getAssetUrl={getAssetUrl}
              getAsset={getAsset}
            />
          );
        })}
      </div>
    </section>
  );
}
