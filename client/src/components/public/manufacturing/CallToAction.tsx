import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import lottie from 'lottie-web/build/player/lottie_light';
import type { AnimationItem } from 'lottie-web';
import { ctaBackgroundAnimation } from './lottie-animations';
import type { ManufacturingHero } from "@shared/schema";

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
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: ctaBackgroundAnimation,
        rendererSettings: {
          preserveAspectRatio: 'xMidYMid slice'
        }
      });
    } catch (error) {
      console.warn('Failed to load CTA background animation:', error);
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  const title = hero?.bottomCtaTitle || "Experience Precision Manufacturing";
  const description = hero?.bottomCtaDescription || "Partner with us for world-class production capabilities and unmatched quality";
  const buttonText = hero?.bottomCtaText || "Start Your Project";
  const buttonLink = hero?.bottomCtaLink || "/contact";

  return (
    <section className="py-20 relative overflow-hidden text-white">
      {/* Lottie Background Animation */}
      <div 
        ref={lottieContainerRef}
        className="absolute inset-0 w-full h-full"
      />
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white drop-shadow-lg">
            {description}
          </p>
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