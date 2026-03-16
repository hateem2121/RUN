import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FabricDisplayProps } from "../types";
import { FiberCompositionDisplay } from "./FiberCompositionDisplay";

export const FabricDisplay: React.FC<FabricDisplayProps> = ({ fabric, fibers = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!fabric) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">
          Material information is not available for this product.
        </p>
      </div>
    );
  }

  // Check if we have collapsible content
  const hasDescription = !!fabric.description;
  const hasPerformanceFeatures =
    fabric.properties?.performanceFeatures && fabric.properties.performanceFeatures.length > 0;
  const hasFiberComposition =
    fabric.properties?.compositions && fabric.properties.compositions.length > 0;
  const hasCollapsibleContent = hasDescription || hasPerformanceFeatures || hasFiberComposition;

  return (
    <div>
      {/* Always Visible: Fabric Name */}
      <h3 className="mb-4 text-xl font-bold sm:text-2xl" data-testid="text-fabric-name">
        {fabric.name}
      </h3>

      {/* Desktop: Always show description */}
      {hasDescription && (
        <p
          className="text-foreground/80 mb-8 hidden leading-relaxed whitespace-pre-line md:block"
          data-testid="text-fabric-description"
        >
          {fabric.description}
        </p>
      )}

      {/* Always Visible: Property Grid */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:gap-8">
        {fabric.weight && (
          <div className="border-l-4 border-black pl-4 sm:pl-6" data-testid="info-fabric-weight">
            <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
              Weight
            </div>
            <div className="font-semibold">{fabric.weight} GSM</div>
          </div>
        )}
        {fabric.fabricType && (
          <div className="border-l-4 border-black pl-4 sm:pl-6" data-testid="info-fabric-type">
            <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
              Fabric Type
            </div>
            <div className="font-semibold">{fabric.fabricType}</div>
          </div>
        )}
        {fabric.sport && (
          <div className="border-l-4 border-black pl-4 sm:pl-6" data-testid="info-fabric-sport">
            <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
              Sport Category
            </div>
            <div className="font-semibold">{fabric.sport}</div>
          </div>
        )}
        {fabric.seasonality && (
          <div
            className="border-l-4 border-black pl-4 sm:pl-6"
            data-testid="info-fabric-seasonality"
          >
            <div className="text-muted-foreground mb-1 text-xs tracking-wider uppercase">
              Seasonality
            </div>
            <div className="font-semibold">{fabric.seasonality}</div>
          </div>
        )}
      </div>

      {/* Mobile Toggle Button */}
      {hasCollapsibleContent && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="border-border hover:bg-background mt-6 flex w-full items-center justify-center gap-2 border-t border-b py-3 text-sm font-bold tracking-wider text-black uppercase transition-colors md:hidden"
          data-testid="button-toggle-materials"
        >
          <span>{isExpanded ? "Show Less" : "Show More"}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Desktop: Always show all content */}
      <div className="hidden md:block">
        {hasPerformanceFeatures && (
          <div className="mt-8">
            <h4 className="mb-4 text-sm font-bold tracking-wider uppercase">
              Performance Features
            </h4>
            <ul className="space-y-2" data-testid="list-fabric-features">
              {fabric.properties?.performanceFeatures?.map((feature: string, index: number) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="mr-2 text-black">•</span>
                  <span className="text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasFiberComposition && (
          <div className="border-border mt-10 border-t pt-8">
            <h4 className="mb-6 text-sm font-bold tracking-wider uppercase">Fiber Composition</h4>
            <FiberCompositionDisplay fabric={fabric} fibers={fibers as any} />
          </div>
        )}
      </div>

      {/* Mobile: Collapsible content with animation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="pt-6">
              {hasDescription && (
                <p
                  className="text-foreground/80 mb-8 leading-relaxed whitespace-pre-line"
                  data-testid="text-fabric-description"
                >
                  {fabric.description}
                </p>
              )}

              {hasPerformanceFeatures && (
                <div className="mt-8">
                  <h4 className="mb-4 text-sm font-bold tracking-wider uppercase">
                    Performance Features
                  </h4>
                  <ul className="space-y-2" data-testid="list-fabric-features">
                    {fabric.properties?.performanceFeatures?.map(
                      (feature: string, index: number) => (
                        <li key={index} className="flex items-start text-sm">
                          <span className="mr-2 text-black">•</span>
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {hasFiberComposition && (
                <div className="border-border mt-10 border-t pt-8">
                  <h4 className="mb-6 text-sm font-bold tracking-wider uppercase">
                    Fiber Composition
                  </h4>
                  <FiberCompositionDisplay fabric={fabric} fibers={fibers as any} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
