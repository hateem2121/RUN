import type { AboutSection, MediaAsset } from "@shared/schema";
import { type MotionValue, motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { IconWrapper } from "@/components/ui/icon-wrapper";
import { OptimizedImage } from "@/components/ui/optimized-image";
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
  title: string;
  description: string;
  mediaId?: number | undefined;
  color: string;
  progress: MotionValue<number>;
  range: [number, number];
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
  return colors[sectionType] || "var(--color-primary)";
};

import { useIsMobile } from "@/hooks/use-is-mobile";

export const Card: React.FC<CardProps> = ({
  i,
  title,
  description,
  mediaId,
  color,
  progress,
  range,
  targetScale,
  getAssetUrl,
  getAsset,
}) => {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "start start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [2, 1]);
  const scale = useTransform(progress, range, [1, targetScale]);

  const imageUrl = mediaId ? getAssetUrl(mediaId) : null;
  const mediaAsset = mediaId ? getAsset(mediaId) : null;
  const isMobile = useIsMobile();


  return (
    <div ref={container} className={`center-flex sticky top-0 ${isMobile ? 'h-auto py-8' : 'h-screen'} isolate`}>
      <motion.div
        style={{
          scale,
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
                >
                  Learn more about our capabilities
                </button>
                <IconWrapper size="md" asChild>
                  <svg viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                <motion.div
                  className={`absolute inset-0 h-full w-full`}
                  style={{ scale: imageScale }}
                >
                  {mediaAsset.type === "video" ? (
                    <video
                      src={imageUrl}
                      className="h-full w-full rounded-lg object-cover"
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
                </motion.div>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted/20">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function StackingCards({ sections, getAssetUrl, getAsset }: StackingCardsProps) {
  const container = useRef(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  // Sort sections by position and filter active ones
  const sortedSections = sections
    .filter((section) => section.isActive)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  // Transform sections into stacking cards data
  const stackingCards: StackingCard[] = sortedSections.map((section) => ({
    title: section.title || "Manufacturing Capability",
    description: section.content || "Professional manufacturing services tailored to your needs.",
    mediaId: section.mediaIds && section.mediaIds.length > 0 ? section.mediaIds[0] : undefined,
    color: getSectionColor(section.sectionType),
    sectionType: section.sectionType,
  }));

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
    <section ref={container} className="bg-muted text-foreground dark:bg-slate-950 dark:text-white">
      {/* Header Section */}
      <div className="py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.25, 0.25, 0.75],
            }}
          >
            <h2 className="mb-6 font-bold text-4xl text-foreground dark:text-white tracking-tight md:text-5xl lg:text-6xl">
              Our Manufacturing
              <br />
              <span className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Capabilities
              </span>
            </h2>
            <motion.p
              className="mx-auto mb-8 max-w-3xl text-lg text-muted-foreground md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.25, 0.25, 0.25, 0.75],
              }}
            >
              Discover our comprehensive B2B sportswear solutions through our advanced manufacturing
              capabilities
            </motion.p>
            <motion.p
              className="center-flex gap-2 text-sm text-text-subtle"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                duration: 0.5,
                delay: 0.4,
                ease: [0.25, 0.25, 0.25, 0.75],
              }}
            >
              <span>Scroll down to explore</span>
              <svg
                className="h-4 w-4 animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </motion.p>
          </motion.div>
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
              title={card.title}
              description={card.description}
              mediaId={card.mediaId}
              color={card.color}
              progress={scrollYProgress}
              range={[i * (1 / stackingCards.length), 1]}
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
