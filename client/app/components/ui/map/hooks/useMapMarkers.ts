import type { DivIcon } from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { type AnimationType, animationCache } from "../services/AnimationCache";
import { iconManager } from "../services/IconManager";

export interface MapLocation {
  id: number;
  type: "client" | "facility";
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  details?: string;
  isActive: boolean;
}

interface MarkerConfig {
  location: MapLocation;
  icon: DivIcon | undefined;
  loading: boolean;
}

export function useMapMarkers(locations: MapLocation[]) {
  const [markerConfigs, setMarkerConfigs] = useState<MarkerConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Determine icon sizes based on type
  const iconSizes = useMemo(
    () => ({
      client: 24,
      facility: 28,
    }),
    [],
  );

  // Preload animations on mount
  useEffect(() => {
    const preloadAnimations = async () => {
      try {
        await animationCache.preloadAllAnimations();
      } catch (_error) {}
    };

    preloadAnimations();
  }, []);

  // Create markers when locations change
  useEffect(() => {
    const createMarkers = async () => {
      if (locations.length === 0) {
        setMarkerConfigs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const configs = await Promise.all(
          locations.map(async (location) => {
            const size = iconSizes[location.type as AnimationType];

            try {
              const icon = await iconManager.getIcon({
                size,
                type: location.type as AnimationType,
              });

              return {
                location,
                icon,
                loading: false,
              };
            } catch (_error) {
              // Use fallback icon if Lottie fails
              const fallbackIcon = iconManager.getFallbackIcon({
                size,
                type: location.type as AnimationType,
              });

              return {
                location,
                icon: fallbackIcon,
                loading: false,
              };
            }
          }),
        );

        setMarkerConfigs(configs);
      } catch (_error) {
        // Create fallback markers
        const fallbackConfigs = locations.map((location) => ({
          location,
          icon: iconManager.getFallbackIcon({
            size: iconSizes[location.type as AnimationType],
            type: location.type as AnimationType,
          }),
          loading: false,
        }));

        setMarkerConfigs(fallbackConfigs);
      } finally {
        setIsLoading(false);
      }
    };

    createMarkers();
  }, [locations, iconSizes]);

  // Separate markers by type for easier rendering
  const { clientMarkers, facilityMarkers } = useMemo(() => {
    const client = markerConfigs.filter((config) => config.location.type === "client");
    const facility = markerConfigs.filter((config) => config.location.type === "facility");

    return {
      clientMarkers: client,
      facilityMarkers: facility,
    };
  }, [markerConfigs]);

  return {
    clientMarkers,
    facilityMarkers,
    allMarkers: markerConfigs,
    isLoading,
    stats: {
      totalMarkers: markerConfigs.length,
      clientCount: clientMarkers.length,
      facilityCount: facilityMarkers.length,
    },
  };
}
