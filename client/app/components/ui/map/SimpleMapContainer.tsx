import { Loader2, Map as MapIcon, Satellite } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapErrorBoundary } from "./components/MapErrorBoundary";
import type { MapLocation } from "./hooks/useMapMarkers";

interface SimpleMapContainerProps {
  locations: MapLocation[];
  className?: string | undefined;
}

// Load Leaflet types for TypeScript
type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;
type LeafletTileLayer = import("leaflet").TileLayer;

interface MapInstance {
  map: LeafletMap;
  markers: LeafletMarker[];
  tileLayer: LeafletTileLayer;
}

/**
 * A simpler map container that uses vanilla Leaflet instead of react-leaflet.
 * This avoids the hydration issues caused by react-leaflet.
 */
export function SimpleMapContainer({ locations, className = "" }: SimpleMapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapInstance | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<"roadmap" | "satellite">("roadmap");

  const clientLocations = locations.filter((l) => l.type === "client" && l.isActive);
  const facilityLocations = locations.filter((l) => l.type === "facility" && l.isActive);

  // Initialize map on mount
  const initializeMap = useCallback(async () => {
    if (!containerRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      // Dynamically import Leaflet
      const L = await import("leaflet");
      await import("leaflet/dist/leaflet.css");

      // Fix default icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      // Create map
      const map = L.map(containerRef.current, {
        center: [25, 0],
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // Add tile layer
      const tileLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      ).addTo(map);

      // Add markers
      const markers: LeafletMarker[] = [];

      locations.forEach((location) => {
        if (!location.isActive) {
          return;
        }

        const color = location.type === "facility" ? "#16a34a" : "#2563eb";

        const icon = L.divIcon({
          className: "custom-map-marker",
          html: `<div style="
            width: 16px;
            height: 16px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        const marker = L.marker([location.latitude, location.longitude], { icon })
          .bindPopup(`
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; color: ${color}; margin: 0 0 4px 0;">
                ${location.type === "facility" ? "Facility" : "Client"}: ${location.name}
              </h3>
              <p style="margin: 0; font-size: 12px; color: #666;">
                ${location.city}, ${location.country}
              </p>
              ${location.details ? `<p style="margin: 4px 0 0 0; font-size: 12px;">${location.details}</p>` : ""}
            </div>
          `)
          .addTo(map);

        markers.push(marker);
      });

      mapInstanceRef.current = { map, markers, tileLayer };
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load map");
    }
  }, [locations]);

  // Cleanup on unmount
  useEffect(() => {
    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(() => {
      initializeMap();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap]);

  // Handle layer toggle
  const toggleLayer = useCallback(async () => {
    if (!mapInstanceRef.current) {
      return;
    }

    const L = await import("leaflet");
    const { map, tileLayer } = mapInstanceRef.current;

    tileLayer.remove();

    const newUrl =
      activeLayer === "roadmap"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

    const newTileLayer = L.tileLayer(newUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current.tileLayer = newTileLayer;
    setActiveLayer(activeLayer === "roadmap" ? "satellite" : "roadmap");
  }, [activeLayer]);

  if (error) {
    return (
      <div className={`bg-background rounded-3xl p-8 shadow-lg ${className}`}>
        <div className="bg-muted/20 flex h-128 w-full items-center justify-center rounded-2xl">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Failed to load map: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      <div className={`bg-background rounded-3xl p-8 shadow-lg ${className}`}>
        <div className="relative h-128 w-full overflow-hidden rounded-2xl">
          {/* Map Layer Toggle Button */}
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={toggleLayer}
              className="border-border/50 bg-background/90 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105"
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

          {/* Map Container */}
          <div ref={containerRef} className="h-full w-full bg-[#1a1a2e]" />

          {/* Loading Overlay */}
          {!isLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                <span className="text-muted-foreground text-sm">Loading map...</span>
              </div>
            </div>
          )}
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
    </MapErrorBoundary>
  );
}
