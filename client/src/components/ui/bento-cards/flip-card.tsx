import { ArrowRight, Repeat2 } from "lucide-react";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
// import { LoadingState } from "./enhanced-loading-states";
import { AnimatedCardWrapper } from "./enhanced-animations";
// import { motion } from "framer-motion";
import { EnhancedBentoCardErrorBoundary } from "./enhanced-error-boundary";

interface FlipCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  features?: string[];
  mediaUrl?: string | null;
  link?: string;
}

const FlipCard = memo(function FlipCard({
  title,
  subtitle,
  description,
  features,
  mediaUrl,
  link,
}: FlipCardProps) {
  // Use dynamic category data with fallbacks
  const cardTitle = title || "Category Features";
  const cardSubtitle = subtitle || "Explore the details";
  const cardDescription =
    description || "Discover the innovative features and quality standards of this category.";
  const cardFeatures =
    features && Array.isArray(features)
      ? features
      : ["Premium Quality", "Advanced Technology", "Sustainable Materials", "Custom Solutions"];
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <EnhancedBentoCardErrorBoundary showTechnicalDetails={false}>
      <AnimatedCardWrapper className="w-full h-full">
        <div className="relative w-full h-full flex items-center justify-center contain-layout">
          <div
            className="relative w-full max-w-[280px] h-[380px] group [perspective:2000px] will-change-transform"
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
          >
            <div
              className={cn(
                "relative w-full h-full",
                "[transform-style:preserve-3d]",
                "flip-card-transform",
                isFlipped ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]",
              )}
            >
              {/* Front Face */}
              <div
                className={cn(
                  "absolute inset-0 w-full h-full",
                  "[backface-visibility:hidden] [transform:rotateY(0deg)]",
                  "overflow-hidden rounded-2xl",
                  "bg-white",
                  "border border-luxury-light",
                  "shadow-sm-luxury-sm",
                  "transition-shadow-sm duration-700",
                  "group-hover:shadow-sm-luxury-lg",
                )}
              >
                <div className="relative h-full overflow-hidden bg-gradient-to-b from-luxury-gray-50 to-white">
                  {/* Media Background */}
                  {mediaUrl && !hasError ? (
                    <div className="absolute inset-0">
                      <img
                        src={mediaUrl}
                        alt={cardTitle}
                        className="w-full h-full object-cover"
                        onError={() => setHasError(true)}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-start justify-center pt-24">
                      <div className="relative w-[200px] h-[100px] flex items-center justify-center">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "absolute w-[50px] h-[50px]",
                              "rounded-[140px]",
                              "bg-gradient-to-br from-orange-400 to-orange-600",
                              "animate-[scale_3s_linear_infinite]",
                              "opacity-0",
                              "shadow-[0_0_50px_rgba(255,165,0,0.5)]",
                              "group-hover:animate-[scale_2s_linear_infinite]",
                            )}
                            style={{
                              animationDelay: `${i * 0.3}s`,
                              left: `${(i * 17) % 100}px`, // Deterministic: (index * prime) % max
                              top: `${(i * 23) % 50}px`, // Deterministic: (index * prime) % max
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  {/* Glassmorphism Background for Text */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-semibold text-white leading-snug tracking-tighter transition-all duration-500 ease-out-expo group-hover:translate-y-[-4px] drop-shadow-lg">
                          {cardTitle}
                        </h3>
                        <p className="text-sm text-white/80 line-clamp-2 tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-4px] [transition-delay:50ms] drop-shadow-md">
                          {cardSubtitle}
                        </p>
                      </div>
                      <div className="relative group/icon">
                        <div
                          className={cn(
                            "absolute inset-[-8px] rounded-lg transition-opacity duration-300",
                            "bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent",
                          )}
                        />
                        <Repeat2 className="relative z-10 w-4 h-4 text-orange-500 transition-transform duration-300 group-hover/icon:scale-110 group-hover/icon:-rotate-12" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Face */}
              <div
                className={cn(
                  "absolute inset-0 w-full h-full",
                  "[backface-visibility:hidden] [transform:rotateY(180deg)]",
                  "p-4 rounded-2xl",
                  "bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-black",
                  "border border-zinc-200 dark:border-zinc-800",
                  "shadow-sm-xs dark:shadow-lg",
                  "flex flex-col",
                  "transition-shadow-sm duration-700",
                  "group-hover:shadow-lg dark:group-hover:shadow-xl",
                  "overflow-hidden",
                )}
              >
                <div className="flex-1 space-y-4 min-h-0">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white leading-tight tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-2px]">
                      {cardTitle}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-2px] leading-relaxed">
                      {cardDescription}
                    </p>
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-[140px] flex-1 pr-1">
                    {cardFeatures.map((feature, index) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 transition-all duration-500"
                        style={{
                          transform: isFlipped ? "translateX(0)" : "translateX(-10px)",
                          opacity: isFlipped ? 1 : 0,
                          transitionDelay: `${index * 100 + 200}ms`,
                        }}
                      >
                        <ArrowRight className="w-3 h-3 text-orange-500 shrink-0" />
                        <span className="text-xs leading-tight break-words">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div
                    className={cn(
                      "group/start relative",
                      "flex items-center justify-between",
                      "p-3 rounded-lg",
                      "transition-all duration-300",
                      "bg-gradient-to-r from-zinc-100 via-zinc-100 to-zinc-100",
                      "dark:from-zinc-800 dark:via-zinc-800 dark:to-zinc-800",
                      "hover:from-orange-500/10 hover:from-0% hover:via-orange-500/5 hover:via-100% hover:to-transparent hover:to-100%",
                      "dark:hover:from-orange-500/20 dark:hover:from-0% dark:hover:via-orange-500/10 dark:hover:via-100% dark:hover:to-transparent dark:hover:to-100%",
                      "hover:scale-[1.02] hover:cursor-pointer",
                    )}
                    onClick={() => link && window.open(link, "_blank")}
                  >
                    <span className="text-sm font-medium text-zinc-900 dark:text-white transition-colors duration-300 group-hover/start:text-orange-600 dark:group-hover/start:text-orange-400">
                      Start today
                    </span>
                    <div className="relative group/icon">
                      <div
                        className={cn(
                          "absolute inset-[-4px] rounded-lg transition-all duration-300",
                          "bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent",
                          "opacity-0 group-hover/start:opacity-100 scale-90 group-hover/start:scale-100",
                        )}
                      />
                      <ArrowRight className="relative z-10 w-4 h-4 text-orange-500 transition-all duration-300 group-hover/start:translate-x-0.5 group-hover/start:scale-110" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedCardWrapper>
    </EnhancedBentoCardErrorBoundary>
  );
});

export default FlipCard;
