import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { ClippedElement } from "@/components/ui/ClippedElement";
import type { SizeChartDisplayProps } from "../types";

export const SizeChartDisplay: React.FC<SizeChartDisplayProps> = ({ sizeChart }) => {
  const sizes = sizeChart?.measurements ? Object.keys(sizeChart.measurements) : [];
  const [selectedSize, setSelectedSize] = useState<string>(sizes[0] || "");
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (contentRef.current) {
      gsap.from(contentRef.current, { opacity: 0, y: 10, duration: 0.2 });
    }
  }, [selectedSize]);

  if (!sizeChart || !sizeChart.measurements || sizes.length === 0) {
    return (
      <p className="text-muted-foreground">Size information is not available for this product.</p>
    );
  }

  const measurements = sizeChart.measurements[selectedSize];
  const measurementKeys = measurements ? Object.keys(measurements) : [];

  return (
    <div>
      <div className="border-border mb-8 flex flex-wrap items-center gap-2 border-b pb-3">
        {sizes.map((size) => (
          <ClippedElement
            key={size}
            as="button"
            onClick={() => setSelectedSize(size)}
            className={`min-h-tab tracking-premium md:tracking-premium-lg px-4 py-2.5 text-sm font-bold uppercase transition-all duration-300 ease-in-out focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-hidden sm:px-5 ${
              selectedSize === size
                ? "scale-105 bg-black text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/20 hover:scale-105"
            }`}
            clipAmount={8}
            aria-pressed={selectedSize === size}
            data-testid={`button-size-${size.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {size}
          </ClippedElement>
        ))}
      </div>
      {measurements && (
        <div
          ref={contentRef}
          className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm sm:grid-cols-4 sm:gap-x-6 sm:gap-y-6 lg:gap-x-8"
        >
          {measurementKeys.map((key) => (
            <div key={key}>
              <span className="text-muted-foreground text-xs tracking-wider uppercase">{key}</span>
              <p className="mt-1 text-base font-bold sm:text-lg">{measurements[key] || "N/A"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
