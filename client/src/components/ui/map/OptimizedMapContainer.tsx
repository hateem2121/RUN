import { motion } from "framer-motion";
import { Loader2, Map, Satellite } from "lucide-react";
import { lazy, Suspense } from "react";
import { MapErrorBoundary } from "./components/MapErrorBoundary";
import type { MapLocation } from "./hooks/useMapMarkers";
import { useMapState } from "./hooks/useMapState";

// SSR-safe CSS import - leaflet CSS will be loaded on client only
if (typeof window !== "undefined") {
  import("leaflet/dist/leaflet.css");
}

// Dynamic imports for Leaflet components to prevent SSR crashes
// All react-leaflet components MUST be dynamically imported because leaflet requires browser globals
const MapContainer = lazy(() =>
  import("react-leaflet").then((mod) => ({ default: mod.MapContainer })),
);
const TileLayer = lazy(() => import("react-leaflet").then((mod) => ({ default: mod.TileLayer })));
// MapMarkers also imports react-leaflet, so it must be lazy loaded too
const MapMarkers = lazy(() => import("./MapMarkers").then((mod) => ({ default: mod.MapMarkers })));

interface OptimizedMapContainerProps {
  locations: MapLocation[];
  className?: string;
}

export function OptimizedMapContainer({ locations, className = "" }: OptimizedMapContainerProps) {
  const { activeLayer, toggleLayer, mapConfig, tileLayerConfig } = useMapState();

  const clientLocations = locations.filter((l) => l.type === "client" && l.isActive);
  const facilityLocations = locations.filter((l) => l.type === "facility" && l.isActive);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={`rounded-3xl bg-background p-8 shadow-lg ${className}`}
    >
      <div className="relative h-[500px] w-full overflow-hidden rounded-2xl">
        {/* Map Layer Toggle Button */}
        <motion.div
          className="absolute top-4 right-4 z-max"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={toggleLayer}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/90 px-4 py-2 font-medium text-sm shadow-lg transition-all duration-200 hover:shadow-xl"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {activeLayer === "roadmap" ? (
              <>
                <Satellite className="h-4 w-4" />
                Satellite
              </>
            ) : (
              <>
                <Map className="h-4 w-4" />
                Roadmap
              </>
            )}
          </motion.button>
        </motion.div>

        <MapErrorBoundary>
          <Suspense
            fallback={
              <div className="flex h-full w-full items-center justify-center bg-muted/20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <MapContainer
              center={mapConfig.center}
              zoom={mapConfig.zoom}
              style={{ height: "100%", width: "100%" }}
              zoomControl={mapConfig.zoomControl}
              scrollWheelZoom={mapConfig.scrollWheelZoom}
            >
              {/* Dynamic Tile Layer */}
              <TileLayer
                key={activeLayer}
                attribution={tileLayerConfig.attribution}
                url={tileLayerConfig.url}
              />

              {/* Optimized Markers */}
              <MapMarkers locations={locations} />
            </MapContainer>
          </Suspense>
        </MapErrorBoundary>
      </div>

      {/* Map Legend */}
      <div className="mt-6 flex items-center justify-center gap-8">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-600"></div>
          <span className="text-muted-foreground text-sm">
            Client Locations ({clientLocations.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-600"></div>
          <span className="text-muted-foreground text-sm">
            Manufacturing Facilities ({facilityLocations.length})
          </span>
        </div>
      </div>
    </motion.div>
  );
}
