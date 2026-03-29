import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { FileText, Leaf, Package, Shield } from "lucide-react";
import { useRef, useState } from "react";
import type { HydratedFabric } from "../types";

interface FiberCompositionDisplayProps {
  fabric: HydratedFabric;
  fibers?: Array<{ id: number; name: string; type: string }>;
}

interface Composition {
  name: string;
  isDefault: boolean;
  fibers: Array<{ fiberId: number; percentage: string }>;
}

interface FiberCardProps {
  fiber: { fiberId: number; percentage: string };
  fiberDetails: { name: string; type: string };
  index: number;
  getFiberIcon: (type: string) => React.ReactNode;
}

function FiberCard({ fiber, fiberDetails, index, getFiberIcon }: FiberCardProps) {
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (barRef.current) {
      gsap.fromTo(
        barRef.current,
        { width: 0 },
        { width: `${fiber.percentage}%`, duration: 0.5, delay: index * 0.1, ease: "power2.out" },
      );
    }
  }, [fiber.percentage, index]);

  return (
    <div
      className="border-border transition-shadow-sm rounded-lg border p-4 duration-200 hover:shadow-md"
      data-testid={`fiber-card-${index}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getFiberIcon(fiberDetails.type)}
          <h4 className="text-sm font-bold tracking-wider uppercase">{fiberDetails.name}</h4>
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-black text-black">{fiber.percentage}%</span>
        <span className="text-muted-foreground text-xs tracking-wider uppercase">
          {fiberDetails.type}
        </span>
      </div>
      {/* Visual percentage bar */}
      <div className="bg-muted/20 mt-3 h-2 w-full overflow-hidden rounded-full">
        <div ref={barRef} className="h-full rounded-full bg-black" style={{ width: 0 }} />
      </div>
    </div>
  );
}

export const FiberCompositionDisplay: React.FC<FiberCompositionDisplayProps> = ({
  fabric,
  fibers = [],
}) => {
  const compositions = (fabric?.properties?.compositions as unknown as Composition[]) || [];

  // Find default composition or use first one
  const defaultComposition = compositions.find((c) => c.isDefault) || compositions[0];
  const [selectedComposition, setSelectedComposition] = useState<string>(
    defaultComposition?.name || "",
  );
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (gridRef.current) {
      gsap.from(gridRef.current, { opacity: 0, y: 10, duration: 0.2 });
    }
  }, [selectedComposition]);

  if (compositions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Fiber composition information is not available for this fabric.
      </p>
    );
  }

  const activeComposition =
    compositions.find((c) => c.name === selectedComposition) || defaultComposition;
  const compositionFibers = activeComposition?.fibers || [];

  // Helper to get fiber details
  const getFiberDetails = (fiberId: number) => {
    return (
      fibers.find((f) => f.id === fiberId) || {
        name: "Unknown Fiber",
        type: "unknown",
      }
    );
  };

  // Helper to get fiber icon based on type
  const getFiberIcon = (fiberType: string) => {
    const type = fiberType.toLowerCase();
    if (type.includes("cotton") || type.includes("natural")) {
      return <Leaf className="h-6 w-6 text-green-600" />;
    }
    if (type.includes("polyester") || type.includes("synthetic")) {
      return <Package className="h-6 w-6 text-blue-600" />;
    }
    if (type.includes("recycled")) {
      return <Shield className="h-6 w-6 text-emerald-600" />;
    }
    return <FileText className="text-muted-foreground h-6 w-6" />;
  };

  return (
    <div>
      {compositions.length > 1 && (
        <div className="border-border mb-8 flex flex-wrap items-center gap-2 border-b pb-3">
          {compositions.map((comp) => (
            <button
              type="button"
              key={comp.name}
              onClick={() => setSelectedComposition(comp.name)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedComposition === comp.name || (!selectedComposition && comp.isDefault)
                  ? "bg-black text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/30"
              }`}
            >
              {comp.name}
            </button>
          ))}
        </div>
      )}

      {/* Fiber Breakdown - Visual Cards */}
      {compositionFibers.length > 0 && (
        <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {compositionFibers.map((fiber, index: number) => {
            const fiberDetails = getFiberDetails(fiber.fiberId);
            return (
              <FiberCard
                key={fiber.fiberId || index}
                fiber={fiber}
                fiberDetails={fiberDetails}
                index={index}
                getFiberIcon={getFiberIcon}
              />
            );
          })}
        </div>
      )}

      {/* Fallback: Minimalist Table for Simple Display */}
      {compositionFibers.length === 0 && (
        <div className="text-muted-foreground py-8 text-center">
          <p>No fiber composition data available for this selection.</p>
        </div>
      )}
    </div>
  );
};
