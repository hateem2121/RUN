import { useRef } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Factory, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ManufacturingErrorBoundary } from "@/components/manufacturing-error-boundary";

import type { ManufacturingHero, MediaAsset } from "@shared/schema";
import { OptimizedImage } from "@/components/ui/optimized-image";

interface PublicHeroSectionProps {
  mouseX: any;
  mouseY: any;
  rotateX: any;
  rotateY: any;
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

  // Mechanical animation variants (industrial character)
  const mechanicalVariants: any = {
    hidden: {
      x: -100,
      opacity: 0,
      rotateY: -15,
    },
    visible: {
      x: 0,
      opacity: 1,
      rotateY: 0,
      transition: {
        type: "spring",
        stiffness: 50, // Heavy, deliberate motion
        damping: 20, // Industrial resistance
        mass: 1.5, // Weight feeling
        duration: 1.2, // Longer duration for mechanical feel
      },
    },
  };

  // Gear-like rotation for decorative elements (if added later)
  // Assembly line stagger effect
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
      <section className="min-h-screen flex items-center justify-center bg-manufacturing-primary/10">
        <div className="text-center">
          <Factory className="w-16 h-16 text-manufacturing-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Manufacturing Excellence</h1>
          <p className="text-xl text-gray-600">Precision crafted solutions for your business</p>
        </div>
      </section>
    );
  }

  return (
    <ManufacturingErrorBoundary>
      <LazyMotion features={domAnimation}>
        <m.section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--gradient-manufacturing-hero)]"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          onMouseMove={(e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
          }}
        >
          {/* Background Media */}
          {heroBackgroundAsset && (
            <div className="absolute inset-0 z-0">
              <OptimizedImage
                mediaId={heroBackgroundAsset.id}
                alt="Manufacturing Background"
                className="w-full h-full"
                priority={true}
              />
            </div>
          )}

          {/* Fallback gradient background - Now handled by parent section class */}
          {!heroBackgroundAsset && <div className="absolute inset-0 bg-transparent" />}

          {/* Content */}
          <m.div
            style={{ rotateX, rotateY }}
            className="relative z-10 text-center text-white max-w-4xl mx-auto px-4"
          >
            <m.div variants={mechanicalVariants} className="mb-8">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                {hero.headline || "Precision Manufacturing"}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white drop-shadow-lg max-w-3xl mx-auto">
                {hero.subheadline ||
                  "Where innovation meets excellence in every stitch, every detail, every product"}
              </p>
            </m.div>

            {hero.ctaText && hero.ctaLink && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-manufacturing-primary hover:bg-blue-50 px-8 py-4 text-lg"
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
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <m.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex flex-col items-center text-blue-200"
              >
                <span className="text-sm mb-2">Scroll to explore</span>
                <ArrowDown className="w-5 h-5" />
              </m.div>
            </m.div>
          </m.div>
        </m.section>
      </LazyMotion>
    </ManufacturingErrorBoundary>
  );
}
