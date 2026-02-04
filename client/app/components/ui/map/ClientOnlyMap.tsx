import { lazy, Suspense, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { MapLocation } from "./hooks/useMapMarkers";

// Completely lazy-load the simple map container to prevent any SSR evaluation
const LazySimpleMapContainer = lazy(() =>
  import("./SimpleMapContainer").then((mod) => ({
    default: mod.SimpleMapContainer,
  }))
);

interface ClientOnlyMapProps {
  locations: MapLocation[];
  className?: string;
}

/**
 * A wrapper component that ensures the map is only rendered on the client side.
 * Uses SimpleMapContainer (vanilla Leaflet) to avoid react-leaflet hydration issues.
 */
export function ClientOnlyMap({ locations, className }: ClientOnlyMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Use a delay to ensure hydration is complete
    const timer = setTimeout(() => setIsClient(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isClient) {
    return (
      <div className="bg-muted/20 flex h-128 w-full items-center justify-center rounded-3xl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          <span className="text-muted-foreground text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="bg-muted/20 flex h-128 w-full items-center justify-center rounded-3xl">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            <span className="text-muted-foreground text-sm">
              Initializing map...
            </span>
          </div>
        </div>
      }
    >
      <LazySimpleMapContainer locations={locations} className={className} />
    </Suspense>
  );
}

