import { motion } from "framer-motion";
import { Map, Satellite } from "lucide-react";
import { MapContainer, TileLayer } from "react-leaflet";
import { MapErrorBoundary } from "./components/MapErrorBoundary";
import type { MapLocation } from "./hooks/useMapMarkers";
import { useMapState } from "./hooks/useMapState";
import { MapMarkers } from "./MapMarkers";

// SSR-safe CSS import
if (typeof window !== "undefined") {
  import("leaflet/dist/leaflet.css");
}

interface ClientMapProps {
  locations: MapLocation[];
  className?: string;
}

export default function ClientMapImplementation({ locations, className = "" }: ClientMapProps) {
  const { activeLayer, toggleLayer, mapConfig, tileLayerConfig } = useMapState();

  const clientLocations = locations.filter((l) => l.type === "client" && l.isActive);
  const facilityLocations = locations.filter((l) => l.type === "facility" && l.isActive);

  return (
    <div className={`rounded-3xl bg-background p-8 shadow-lg ${className}`}>
      <div className="relative h-128 w-full overflow-hidden rounded-2xl">
        {/* Map Layer Toggle Button */}
        <motion.div
          className="absolute top-4 right-4 z-elevated"
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
        </MapErrorBoundary>
      </div>

      {/* Map Legend */}
      <div className="mt-6 center-flex gap-8">
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
    </div>
  );
}
