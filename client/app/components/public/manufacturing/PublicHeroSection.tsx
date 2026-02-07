import type { ManufacturingHero, MediaAsset } from "@shared/schema";
import { domAnimation, LazyMotion, type MotionValue, m } from "framer-motion";
import { ArrowDown, Factory } from "lucide-react";
import { useRef } from "react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";

import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface PublicHeroSectionProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  mediaAssets: MediaAsset[];
  hero: ManufacturingHero | undefined;
}

export function PublicHeroSection({
  mouseX,
  mouseY,
  rotateX,
  rotateY,
  mediaAssets,
  hero,
}: PublicHeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);

  // Hero background media
  const heroBackgroundAsset =
    Array.isArray(mediaAssets) && hero?.backgroundMediaId
      ? mediaAssets.find((asset) => asset.id === hero.backgroundMediaId)
      : null;

  // Gear-like rotation for decorative elements (if added later)
  // Assembly line stagger effect
  // biome-ignore lint/suspicious/noExplicitAny: Complex animation variants
  const containerVariants: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Sequential reveals like assembly line
        delayChildren: 0.3,
      },
    },
  };

  if (!hero) {
    return (
      <section className="center-flex bg-manufacturing-primary/10 min-h-screen">
        <div className="text-center">
          <Factory className="text-manufacturing-primary mx-auto mb-4 h-16 w-16" />
          <h1 className="text-foreground mb-2 text-4xl font-bold">Manufacturing Excellence</h1>
          <p className="text-muted-foreground text-xl">
            Precision crafted solutions for your business
          </p>
        </div>
      </section>
    );
  }

  return (
    <ManufacturingErrorBoundary>
      <LazyMotion features={domAnimation}>
        <m.section
          ref={heroRef}
          style={{ perspective: 2000 }}
          className="center-flex relative min-h-[90vh] w-full overflow-hidden py-24 md:py-32"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          onMouseMove={(e) => {
            // Simple optimization: Direct set is usually fast, but we can guard against excessive updates
            // Framer Motion values are optimized, but we'll ensure we don't trigger layout thrashing
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
          }}
        >
          {/* Background Elements */}
          <div className="absolute inset-0 z-0">
            {heroBackgroundAsset ? (
              <OptimizedImage
                mediaId={heroBackgroundAsset.id}
                alt="Manufacturing Background"
                className="h-full w-full object-cover opacity-20 dark:opacity-40"
                priority={true}
              />
            ) : (
              <div className="bg-muted/10 h-full w-full" />
            )}
            <div className="from-background via-background/80 to-background absolute inset-0 bg-gradient-to-b" />
          </div>

          {/* Content Container */}
          <m.div
            style={{ rotateX, rotateY }}
            className="z-default relative mx-auto max-w-5xl px-6 text-center"
          >
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Factory className="mx-auto mb-8 size-20 text-primary md:size-24" />
            </m.div>

            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-foreground mb-6 text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl"
            >
              {hero.headline}
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-muted-foreground mx-auto max-w-3xl text-xl leading-relaxed md:text-2xl"
            >
              {hero.subheadline}
            </m.p>

            {hero.ctaText && hero.ctaLink && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }} // Adjusted delay
                className="mt-10" // Added margin top
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-primary text-primary-foreground px-8 py-4 text-lg hover:bg-primary/90"
                  asChild
                >
                  <a href={hero.ctaLink}>{hero.ctaText}</a>
                </Button>
              </m.div>
            )}

            {/* Scroll indicator */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 transform"
            >
              <m.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex flex-col items-center text-blue-200"
              >
                <span className="mb-2 text-sm">Scroll to explore</span>
                <ArrowDown className="h-5 w-5" />
              </m.div>
            </m.div>
          </m.div>
        </m.section>
      </LazyMotion>
    </ManufacturingErrorBoundary>
  );
}
