export { ClientOnlyMap } from "./ClientOnlyMap";
export { useMapMarkers } from "./hooks/useMapMarkers";
export { useMapState } from "./hooks/useMapState";
// NOTE: MapMarkers is NOT exported here because it imports react-leaflet which requires
// browser globals (window). MapMarkers is only used internally by OptimizedMapContainer
// and ClientMapImplementation, which are wrapped in ClientOnly boundaries.
// Direct imports from "./MapMarkers" are fine within client-only components.
export { OptimizedMapContainer } from "./OptimizedMapContainer";
export { SimpleMapContainer } from "./SimpleMapContainer";
export { animationCache } from "./services/AnimationCache";
export { iconManager } from "./services/IconManager";
export type { AnimationType, MapLocation, TileLayerType } from "./types";
