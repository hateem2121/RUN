import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TransformedProduct } from "@/lib/product-transformers";

interface GearSectionProps {
  gearProducts: TransformedProduct[];
  onProductClick: (product: TransformedProduct) => void;
}

export const GearSection = ({ gearProducts, onProductClick }: GearSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Guard clause for empty data
  if (!gearProducts.length) return null;

  const handlePrev = () => setCurrentIndex((p) => (p === 0 ? gearProducts.length - 1 : p - 1));
  const handleNext = () => setCurrentIndex((p) => (p === gearProducts.length - 1 ? 0 : p + 1));
  const currentProduct = gearProducts[currentIndex];

  return (
    <section className="bg-background px-6 py-16 text-foreground md:py-20 lg:py-32">
      <div className="container-wide mx-auto grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative aspect-[1/1] w-full sm:aspect-[4/5]">
          <img
            src="https://picsum.photos/seed/gear-main/800/1000"
            alt="RUN GEAR Collection"
            className="h-full w-full object-cover"
          />
          <div className="center-flex absolute inset-0 bg-black/30">
            <h2 className="text-center font-condensed text-7xl text-white leading-none md:text-9xl">
              RUN
              <br />
              GEAR
            </h2>
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Accessories & Essentials
          </p>
          <h3 className="mt-4 font-condensed text-5xl md:text-6xl">
            PERFORMANCE
            <br />
            IN EVERY DETAIL
          </h3>
          <p className="mt-6 max-w-md text-muted-foreground">
            From moisture-wicking caps to anatomically designed socks, our gear is engineered with
            the same commitment to quality and sustainability as our apparel. Elevate your run with
            accessories designed to perform.
          </p>
          <div className="mt-12">
            {currentProduct && (
              <div className="flex items-center gap-8">
                <div className="h-40 w-32 shrink-0 bg-muted">
                  <img
                    src={currentProduct.imageUrl}
                    alt={currentProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="grow">
                  <h4 className="font-semibold uppercase tracking-wider">{currentProduct.name}</h4>
                  <p className="mt-1 text-muted-foreground text-sm">{currentProduct.fabric}</p>
                  <button
                    onClick={() => onProductClick(currentProduct)}
                    className="mt-4 border-foreground border-b pb-1 text-sm uppercase tracking-widest transition-colors hover:border-muted-foreground hover:text-muted-foreground"
                  >
                    View Details
                  </button>
                </div>
              </div>
            )}
            <div className="mt-8 flex items-center gap-3 sm:gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
                className="h-11 w-11"
                aria-label="Previous gear item"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
                {gearProducts.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`flex min-h-11 min-w-11 items-center justify-center transition-all ${
                      idx === currentIndex
                        ? "h-2 w-8 rounded-full bg-primary"
                        : "h-2 w-2 rounded-full bg-muted hover:bg-muted-foreground/50"
                    }`}
                    aria-label={`Go to gear item ${idx + 1}`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
                className="h-11 w-11"
                aria-label="Next gear item"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
