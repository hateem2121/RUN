import type { Certificate } from "../schemas/catalog.js";
import type {
  SustainabilityGoal,
  SustainabilityInitiative,
  SustainabilityMetric,
  UnifiedSustainability,
} from "../schemas/content/sustainability";
import type { Fabric } from "../schemas/materials.js";

export interface SustainabilityBatchResponse {
  hero: UnifiedSustainability | null;
  metrics: SustainabilityMetric[];
  initiatives: SustainabilityInitiative[];
  goals: SustainabilityGoal[];
  certificates: Certificate[];
  fabrics: Fabric[];
}
