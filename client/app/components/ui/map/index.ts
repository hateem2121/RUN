export { ClientOnlyMap } from "./ClientOnlyMap";
// NOTE: MapMarkers is NOT exported here because it imports react-leaflet which requires
// browser globals (window). MapMarkers is only used internally by OptimizedMapContainer
// and ClientMapImplementation, which are wrapped in ClientOnly boundaries.
// Direct imports from "./MapMarkers" are fine within client-only components.

export type { MapLocation } from "./types";
