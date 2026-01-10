import type { ManufacturingHero } from "@shared/schema";
import { motion } from "framer-motion";
import type { AnimationItem } from "lottie-web";
import lottie from "lottie-web/build/player/lottie_light";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ctaBackgroundAnimation } from "./lottie-animations";

interface CallToActionProps {
  hero?: ManufacturingHero | null;
}

export function CallToAction({ hero }: CallToActionProps) {
  const lottieContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!lottieContainerRef.current) return;

    // Clean up previous animation
    if (animationRef.current) {
      animationRef.current.destroy();
    }

    try {
      animationRef.current = lottie.loadAnimation({
        container: lottieContainerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: ctaBackgroundAnimation,
        rendererSettings: {
          preserveAspectRatio: "xMidYMid slice",
        },
      });
    } catch (_error) {}

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  const title = hero?.bottomCtaTitle || "Experience Precision Manufacturing";
  const description =
    hero?.bottomCtaDescription ||
    "Partner with us for world-class production capabilities and unmatched quality";
  const buttonText = hero?.bottomCtaText || "Start Your Project";
  const buttonLink = hero?.bottomCtaLink || "/contact";

  return (
    <section className="relative overflow-hidden py-20 text-white">
      {/* Lottie Background Animation */}
      <div ref={lottieContainerRef} className="absolute inset-0 h-full w-full" />

      <div className="container relative z-default mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 font-bold text-4xl">{title}</h2>
          <p className="mx-auto mb-8 max-w-2xl text-white text-xl drop-shadow-lg">{description}</p>
          <Button
            size="lg"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
            asChild
          >
            <a href={buttonLink}>
              {buttonText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
