import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { useOptimizedMedia } from "@/hooks/use-optimized-media";
import type { MediaAsset, SustainabilityFeatures } from "@shared/schema";

export function OptimizedSustainabilityHero({ media }: { media: MediaAsset }) {
  // FIX: removed raw window access to prevent Hydration Mismatch (Server vs Client)
  // Defaulting to high-quality desktop asset for stability.
  // Future optimization: Use <picture> with srcset for true responsive images.

  const { urls } = useOptimizedMedia(media.id, {
    width: 1920,
    quality: 90,
    format: "webp",
  });

  const imageSrc =
    urls?.large ||
    urls?.medium ||
    media.url ||
    (media.id && media.id < 1000000000000 ? `/api/media/${media.id}/content` : undefined);

  return (
    <div className="absolute inset-0 min-h-full">
      {media.type === "video" ? (
        <video
          src={
            urls?.large ||
            media.url ||
            (media.id && media.id < 1000000000000 ? `/api/media/${media.id}/content` : undefined)
          }
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <img
          src={imageSrc}
          alt="Sustainability hero background"
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 to-stone-800/30" />
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
    <section className="relative h-screen bg-stone-900 overflow-hidden">
      <motion.div style={{ y }} className="absolute inset-0">
        {heroMedia && <OptimizedSustainabilityHero media={heroMedia} />}
      </motion.div>

      <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-black/30 via-black/10 to-transparent">
        <BackgroundRippleEffect />
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
              {sustainabilityFeatures?.title || "Sustainability at Our Core"}
            </h1>
            <p className="text-xl md:text-2xl text-stone-200 max-w-3xl mx-auto mb-8 drop-shadow-lg">
              {sustainabilityFeatures?.description ||
                "Building a Better Future Through Responsible Manufacturing"}
            </p>
            <Button
              size="lg"
              className="bg-stone-800 hover:bg-stone-700 text-white px-8 py-6 text-lg rounded-full shadow-2xl"
              data-testid="button-hero-cta"
            >
              {sustainabilityFeatures?.title ? "Learn More" : "Explore Our Sustainability"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
