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

export type AnimationType = "client" | "facility";
export type TileLayerType = "roadmap" | "satellite";
