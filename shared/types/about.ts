import type {
  AboutHero,
  AboutMapLocation,
  AboutSection,
  AboutStatistic,
  AboutTeamMessage,
  AboutTimelineEntry,
} from "../schemas/content/about.js";
import type { MediaAsset } from "../schemas/media.js";

export interface AboutBatchResponse {
  hero: AboutHero | null;
  timeline: AboutTimelineEntry[];
  locations: AboutMapLocation[];
  sections: AboutSection[];
  statistics: AboutStatistic[];
  teamMessage: AboutTeamMessage | null;
  mediaAssets: MediaAsset[];
  _meta: {
    fetchedAt: string;
    totalRequests: number;
    mediaAssetsLoaded: number;
    mediaIdsRequested: number[];
    responseTime: number;
  };
}
