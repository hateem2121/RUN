import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Map as MapIcon, Satellite } from "lucide-react";
import { useRef } from "react";
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
  className?: string | undefined;
}

export default function ClientMapImplementation({ locations, className = "" }: ClientMapProps) {
  const { activeLayer, toggleLayer, mapConfig, tileLayerConfig } = useMapState();
  const toggleRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!toggleRef.current) return;
      gsap.from(toggleRef.current, { opacity: 0, scale: 0.8, duration: 0.3 });
    },
    { scope: toggleRef },
  );

  const clientLocations = locations.filter((l) => l.type === "client" && l.isActive);
  const facilityLocations = locations.filter((l) => l.type === "facility" && l.isActive);

  return (
    <div className={`bg-background rounded-3xl p-8 shadow-lg ${className}`}>
      <div className="relative h-128 w-full overflow-hidden rounded-2xl">
        {/* Map Layer Toggle Button */}
        <div ref={toggleRef} className="z-elevated absolute top-4 right-4">
          <button
            onClick={toggleLayer}
            className="border-border/50 bg-background/90 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 active:scale-95"
          >
            {activeLayer === "roadmap" ? (
              <>
                <Satellite className="h-4 w-4" />
                Satellite
              </>
            ) : (
              <>
                <MapIcon className="h-4 w-4" />
                Roadmap
              </>
            )}
          </button>
        </div>

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
      <div className="center-flex mt-6 gap-8">
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
