import type { ManufacturingHero } from "@shared/schema";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CallToActionProps {
  hero?: ManufacturingHero | null | undefined;
}

export function CallToAction({ hero }: CallToActionProps) {
  const title = hero?.bottomCtaTitle || "Experience Precision Manufacturing";
  const description =
    hero?.bottomCtaDescription ||
    "Partner with us for world-class production capabilities and unmatched quality";
  const buttonText = hero?.bottomCtaText || "Start Your Project";
  const buttonLink = hero?.bottomCtaLink || "/contact";

  return (
    <section 
      className="relative overflow-hidden py-24"
      data-testid="manufacturing-cta-section"
    >
      {/* Background Gradient - Performance Optimized (Replaces Lottie) */}
      <div className="absolute inset-0 h-full w-full bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950" />

      {/* Subtle animated overlay using CSS only */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent" />

      <div className="container relative z-default mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 
            className="mb-6 font-bold text-4xl text-white md:text-5xl"
            data-testid="cta-title"
          >
            {title}
          </h2>
          <p 
            className="mx-auto mb-10 max-w-2xl text-blue-50 text-xl md:text-2xl drop-shadow-sm"
            data-testid="cta-description"
          >
            {description}
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="h-14 px-8 text-lg font-semibold bg-white text-blue-700 hover:bg-blue-50 border-none shadow-xl transition-transform hover:scale-105"
            asChild
            data-testid="cta-button"
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
