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

/** @public */ export type AnimationType = "client" | "facility";
/** @public */ export type TileLayerType = "roadmap" | "satellite";
