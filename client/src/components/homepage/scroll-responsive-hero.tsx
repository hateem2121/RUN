/**
 * Scroll-Responsive Hero Section
 * Eliminates timer conflicts and scroll lag by using scroll progress for all animations
 */

import type { HomepageHero, MediaAsset } from "@shared/schema";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ButtonHoverMultiple } from "@/components/ui/button-hover-multiple";
import { cn } from "@/lib/utils";
import { OptimizedHeroMedia } from "./optimized-hero-media";
import { OptimizedMatrixSloganWrapper } from "./optimized-matrix-slogan-wrapper";

interface ScrollResponsiveHeroProps {
  hero?: HomepageHero | null;
  slogans: Array<{ id: number; text: string; color?: string }>;
  heroMediaAsset?: MediaAsset | null;
  className?: string;
}

export const ScrollResponsiveHero = memo(function ScrollResponsiveHero({
  hero,
  slogans,
  heroMediaAsset,
  className,
}: ScrollResponsiveHeroProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [, setCurrentSloganIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  // Scroll progress calculation
  const updateScrollProgress = useCallback(() => {
    if (!heroRef.current) return;

    const rect = heroRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate progress based on how much of hero is scrolled past
    let progress = 0;
    if (rect.top < 0) {
      progress = Math.abs(rect.top) / (rect.height - windowHeight);
    }

    // Clamp between 0 and 1
    progress = Math.max(0, Math.min(1, progress));
    setScrollProgress(progress);

    // Update slogan based on scroll progress
    const sloganIndex = Math.floor(progress * slogans.length);
    setCurrentSloganIndex(Math.min(sloganIndex, slogans.length - 1));

    // Track scrolling state
    setIsScrolling(true);
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
  }, [slogans.length]);

  // Scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      requestAnimationFrame(updateScrollProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollProgress(); // Initial calculation

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [updateScrollProgress]);

  // Animation values based on scroll progress
  const textOpacity = 1 - scrollProgress * 0.7;
  const textScale = 1 - scrollProgress * 0.1;
  const backgroundOpacity = 1 - scrollProgress * 0.3;

  return (
    <section
      ref={heroRef}
      className={cn("relative flex items-center justify-center overflow-hidden pb-20", className)}
      style={{
        minHeight: "100vh",
      }}
    >
      {/* Background Media - Optimized Direct Loading */}
      {hero?.backgroundImageId && heroMediaAsset && (
        <div className="absolute inset-0 h-full w-full" style={{ opacity: backgroundOpacity }}>
          <OptimizedHeroMedia asset={heroMediaAsset} />
        </div>
      )}
      {/* Hero Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        {/* Scroll-Responsive Matrix Text */}
        {slogans.length > 0 && (
          <motion.div
            className="mt-[25px] mb-[25px] flex w-full justify-center pt-[0px] pb-[0px] md:mb-12"
            style={{
              opacity: textOpacity,
              scale: textScale,
            }}
          >
            <OptimizedMatrixSloganWrapper
              slogans={slogans}
              className="font-medium text-xl italic sm:text-2xl md:text-3xl lg:text-4xl"
              displayDuration={3000}
              transitionDuration={1500}
              letterInterval={50}
            />

            {/* Scroll Progress Indicator */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 transform">
              <div className="h-1 w-32 overflow-hidden rounded-full bg-white/20">
                <motion.div
                  className="h-full rounded-full bg-white/60"
                  style={{
                    width: `${scrollProgress * 100}%`,
                    transition: isScrolling ? "none" : "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Hero Title and Subtitle */}
        {hero && (
          <motion.div
            style={{
              opacity: textOpacity,
              scale: textScale,
            }}
          >
            <h1 className="mb-4 break-words font-bold font-neue-stance text-4xl text-white sm:text-5xl md:mb-6 md:text-6xl xl:text-7xl 2xl:text-8xl">
              {hero.title}
            </h1>
            <p className="mx-auto mb-6 max-w-3xl px-2 text-lg text-neutral-200 sm:text-xl md:mb-8 md:text-2xl">
              {hero.subtitle}
            </p>

            {/* CTA Button */}
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              {hero.ctaText && hero.ctaLink && (
                <Link href={hero.ctaLink}>
                  <ButtonHoverMultiple>
                    {hero.ctaText}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </ButtonHoverMultiple>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
      {/* Scroll Hint - Only show initially */}
      {scrollProgress < 0.1 && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 transform text-center text-white/60"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="mb-2 text-sm">Scroll to explore</div>
          <div className="relative mx-auto h-10 w-6 rounded-full border-2 border-white/40">
            <motion.div
              className="absolute top-1 left-1/2 h-3 w-1 -translate-x-1/2 transform rounded-full bg-white/60"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      )}
    </section>
  );
});
