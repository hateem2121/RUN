import { useCallback, useState } from "react";

type TileLayerType = "roadmap" | "satellite";

interface MapConfig {
  center: [number, number];
  zoom: number;
  scrollWheelZoom: boolean;
  zoomControl: boolean;
}

const DEFAULT_CONFIG: MapConfig = {
  center: [20, 0],
  zoom: 2,
  scrollWheelZoom: false,
  zoomControl: true,
};

export function useMapState(initialConfig?: Partial<MapConfig>) {
  const [activeLayer, setActiveLayer] = useState<TileLayerType>("roadmap");
  const [mapConfig] = useState<MapConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });

  const toggleLayer = useCallback(() => {
    setActiveLayer((current) => (current === "roadmap" ? "satellite" : "roadmap"));
  }, []);

  const getTileLayerConfig = useCallback(() => {
    if (activeLayer === "roadmap") {
      return {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      };
    } else {
      return {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.digitalglobe.com/">DigitalGlobe</a>',
      };
    }
  }, [activeLayer]);

  return {
    activeLayer,
    toggleLayer,
    mapConfig,
    tileLayerConfig: getTileLayerConfig(),
  };
}
