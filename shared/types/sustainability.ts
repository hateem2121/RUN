import type { Certificate } from "../schema/catalog";
import type {
  SustainabilityGoal,
  SustainabilityInitiative,
  SustainabilityMetric,
  UnifiedSustainability,
} from "../schema/content/sustainability";
import type { Fabric } from "../schema/materials";

export interface SustainabilityBatchResponse {
  hero: UnifiedSustainability | null;
  metrics: SustainabilityMetric[];
  initiatives: SustainabilityInitiative[];
  goals: SustainabilityGoal[];
  certificates: Certificate[];
  fabrics: Fabric[];
}
