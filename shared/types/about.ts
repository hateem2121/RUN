import type {
  AboutHero,
  AboutMapLocation,
  AboutSection,
  AboutStatistic,
  AboutTeamMessage,
  AboutTimelineEntry,
} from "../schemas/content/about.js";

export interface AboutBatchResponse {
  hero: AboutHero | null;
  timeline: AboutTimelineEntry[];
  locations: AboutMapLocation[];
  sections: AboutSection[];
  statistics: AboutStatistic[];
  teamMessage: AboutTeamMessage | null;
}
