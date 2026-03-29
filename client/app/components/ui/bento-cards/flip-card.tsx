import { ArrowRight, Repeat2 } from "lucide-react";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
// import { LoadingState } from "./enhanced-loading-states";
import { AnimatedCardWrapper } from "./enhanced-animations";
import { EnhancedBentoCardErrorBoundary } from "./enhanced-error-boundary";

interface FlipCardProps {
  title?: string | undefined;
  subtitle?: string | undefined;
  description?: string | undefined;
  features?: string[];
  mediaUrl?: string | null | undefined;
  link?: string | undefined;
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
      <AnimatedCardWrapper className="h-full w-full">
        <div className="relative flex h-full w-full items-center justify-center contain-layout">
          <div
            className="group perspective-deep relative h-96 w-full max-w-72"
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
          >
            <div
              className={cn(
                "relative h-full w-full",
                "transform-3d",
                "flip-card-transform",
                isFlipped ? "rotate-y-180" : "rotate-y-0",
              )}
            >
              {/* Front Face */}
              <div
                className={cn(
                  "absolute inset-0 h-full w-full",
                  "backface-hidden rotate-y-0",
                  "overflow-hidden rounded-2xl",
                  "bg-white dark:bg-zinc-950",
                  "border border-border",
                  "shadow-luxury-sm",
                  "transition-shadow duration-700",
                  "group-hover:shadow-luxury-lg",
                )}
              >
                <div className="relative h-full overflow-hidden bg-linear-to-b from-surface-subtle to-white dark:from-zinc-900 dark:to-zinc-950">
                  {/* Media Background */}
                  {mediaUrl && !hasError ? (
                    <div className="absolute inset-0">
                      <img
                        src={mediaUrl}
                        alt={cardTitle}
                        className="h-full w-full object-cover"
                        onError={() => setHasError(true)}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-start justify-center pt-24">
                      <div className="relative flex h-widget-track w-widget-track items-center justify-center">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "absolute h-particle w-particle",
                              "rounded-full",
                              "bg-linear-to-br from-orange-400 to-orange-600",
                              "animate-particle-scale",
                              "opacity-0",
                              "shadow-glow-orange",
                              "group-hover:animate-particle-scale-fast",
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

                <div className="absolute right-0 bottom-0 left-0 p-5">
                  {/* Glassmorphism Background for Text */}
                  <div className="rounded-2xl border border-glass bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <h3 className="font-semibold text-lg text-white leading-snug tracking-tighter drop-shadow-lg transition-all duration-500 ease-out-expo group-hover:translate-y-[-4px]">
                          {cardTitle}
                        </h3>
                        <p className="line-clamp-2 text-sm text-white/80 tracking-tight drop-shadow-md transition-all delay-50 duration-500 ease-out-expo group-hover:translate-y-[-4px]">
                          {cardSubtitle}
                        </p>
                      </div>
                      <div className="group/icon relative">
                        <div
                          className={cn(
                            "absolute inset-[-8px] rounded-lg transition-opacity duration-300",
                            "bg-linear-to-br from-orange-500/20 via-orange-500/10 to-transparent",
                          )}
                        />
                        <Repeat2 className="relative z-elevated h-4 w-4 text-orange-500 transition-transform duration-300 group-hover/icon:-rotate-12 group-hover/icon:scale-110" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back Face */}
              <div
                className={cn(
                  "absolute inset-0 h-full w-full",
                  "backface-hidden rotate-y-180",
                  "rounded-2xl p-4",
                  "bg-linear-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-black",
                  "border border-zinc-200 dark:border-zinc-800",
                  "shadow-sm-xs dark:shadow-lg",
                  "flex flex-col",
                  "transition-shadow-sm duration-700",
                  "group-hover:shadow-lg dark:group-hover:shadow-xl",
                  "overflow-hidden",
                )}
              >
                <div className="min-h-0 flex-1 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg text-zinc-900 leading-tight tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-2px] dark:text-white">
                      {cardTitle}
                    </h3>
                    <p className="text-sm text-zinc-600 leading-relaxed tracking-tight transition-all duration-500 ease-out-expo group-hover:translate-y-[-2px] dark:text-zinc-400">
                      {cardDescription}
                    </p>
                  </div>

                  <div className="max-h-36 flex-1 space-y-2 overflow-y-auto pr-1">
                    {cardFeatures.map((feature, index) => (
                      <div
                        key={feature}
                        className="flex items-center gap-2 text-sm text-zinc-700 transition-all duration-500 dark:text-zinc-300"
                        style={{
                          transform: isFlipped ? "translateX(0)" : "translateX(-10px)",
                          opacity: isFlipped ? 1 : 0,
                          transitionDelay: `${index * 100 + 200}ms`,
                        }}
                      >
                        <ArrowRight className="h-3 w-3 shrink-0 text-orange-500" />
                        <span className="wrap-break-word text-xs leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-zinc-200 border-t pt-4 dark:border-zinc-800">
                  <div
                    className={cn(
                      "group/start relative",
                      "flex items-center justify-between",
                      "rounded-lg p-3",
                      "transition-all duration-300",
                      "bg-linear-to-r from-surface-muted via-surface-subtle to-white",
                      "dark:from-luxury-charcoal dark:via-luxury-charcoal dark:to-surface-black",
                      "hover:from-0% hover:from-primary/10 hover:via-100% hover:via-primary/5 hover:to-100% hover:to-transparent",
                      "dark:hover:from-0% dark:hover:from-primary/20 dark:hover:via-100% dark:hover:via-primary/10 dark:hover:to-100% dark:hover:to-transparent",
                      "hover:scale-[1.02] hover:cursor-pointer",
                    )}
                    onClick={() => link && window.open(link, "_blank")}
                  >
                    <span className="font-medium text-sm text-zinc-900 transition-colors duration-300 group-hover/start:text-orange-600 dark:text-white dark:group-hover/start:text-orange-400">
                      Start today
                    </span>
                    <div className="group/icon relative">
                      <div
                        className={cn(
                          "absolute inset-[-4px] rounded-lg transition-all duration-300",
                          "bg-linear-to-br from-orange-500/20 via-orange-500/10 to-transparent",
                          "scale-90 opacity-0 group-hover/start:scale-100 group-hover/start:opacity-100",
                        )}
                      />
                      <ArrowRight className="relative z-elevated h-4 w-4 text-orange-500 transition-all duration-300 group-hover/start:translate-x-0.5 group-hover/start:scale-110" />
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
