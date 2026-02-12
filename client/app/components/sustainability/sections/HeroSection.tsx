import type { MediaAsset, SustainabilityFeatures } from "@shared/schema";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from "@/components/ui/button";
import { OptimizedImage } from "@/components/ui/optimized-image";
export function OptimizedSustainabilityHero({ media }: { media: MediaAsset }) {
  // FIX: removed raw window access to prevent Hydration Mismatch (Server vs Client)
  // Defaulting to high-quality desktop asset for stability.
  // Future optimization: Use <picture> with srcset for true responsive images.

  return (
    <div className="absolute inset-0 min-h-full">
      {media.type === "video" ? (
        <video
          src={
            media.url ||
            (media.id && media.id < 1000000000000 ? `/api/media/${media.id}/content` : undefined)
          }
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <OptimizedImage
          mediaId={media.id}
          src={media.url || undefined}
          alt="Sustainability hero background"
          imageClassName="h-full w-full object-cover"
          className="h-full w-full"
          priority={true}
        />
      )}
      <div className="absolute inset-0 bg-linear-to-b from-stone-900/50 to-stone-800/30" />
    </div>
  );
}

export function HeroSection({
  heroMedia,
  sustainabilityFeatures,
}: {
  heroMedia?: MediaAsset;
  sustainabilityFeatures?: SustainabilityFeatures;
}) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <section className="relative h-screen overflow-hidden bg-stone-900">
      <motion.div style={{ y }} className="absolute inset-0">
        {heroMedia && <OptimizedSustainabilityHero media={heroMedia} />}
      </motion.div>

      <div className="center-flex absolute inset-0 z-default bg-linear-to-b from-black/30 via-black/10 to-transparent">
        <BackgroundRippleEffect />
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-6 font-bold text-5xl text-white drop-shadow-2xl md:text-7xl">
              {sustainabilityFeatures?.title || "Sustainability at Our Core"}
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-stone-200 text-xl drop-shadow-lg md:text-2xl">
              {sustainabilityFeatures?.description ||
                "Building a Better Future Through Responsible Manufacturing"}
            </p>
            <Button
              size="lg"
              className="rounded-full bg-stone-800 px-8 py-6 text-lg text-white shadow-2xl hover:bg-stone-700"
              data-testid="button-hero-cta"
            >
              {sustainabilityFeatures?.title ? "Learn More" : "Explore Our Sustainability"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
