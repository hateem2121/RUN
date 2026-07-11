export interface EnhancedFormData {
  // PRODUCT ESSENCE - Basic Information
  name: string;
  description: string;
  weight: string;
  isActive: boolean;

  // PRODUCT ESSENCE - B2B Filtering Fields
  sport: string;
  marketSegment: string;
  seasonality: string;

  // PRODUCT ESSENCE - Fiber Compositions
  compositions: Array<{
    name: string;
    isDefault: boolean;
    fibers: Array<{
      fiberId: number | null;
      percentage: string;
    }>;
  }>;

  // PRODUCT ESSENCE - Classification
  fabricType: string;
  weave: string;
  finish: string;
  keyApplications: string[];
  weaveTypes: string[];
  finishTreatments: string[];

  // PERFORMANCE & DURABILITY - Performance Metrics
  stretchPercentage: string;
  stretchDirection: string[];
  breathability: string;
  moistureManagement: string;
  enhancedMoistureManagement: string;
  wickingRate: string;
  dryingTime: string;
  performanceFeatures: string[];
  airPermeability: string;
  waterColumn: string;

  // PERFORMANCE & DURABILITY - Durability & Quality
  yarnCountConstruction: string;
  colorfastness: string;
  tensileStrength: string;
  tearStrength: string;
  abrasionResistance: string;
  pillingGrade: string;
  shrinkageTolerancePercentage: string;
  washTemperature: string;

  // SUSTAINABILITY
  sustainabilityScore: string;
  certificationIds: number[];
  certificationTags: string[];
  endOfLifeOptions: string[];
  recyclabilityNotes: string;
  useCases: string[];

  // CARE & MAINTENANCE
  washCareInstructions: {
    careSymbols: string[];
    instructions: string;
    restrictions: string[];
  };
  visualSwatchId: number | null;
}

export const initialFormData: EnhancedFormData = {
  // PRODUCT ESSENCE
  name: "",
  description: "",
  weight: "",
  isActive: true,
  sport: "",
  marketSegment: "",
  seasonality: "",
  compositions: [
    {
      name: "Standard",
      isDefault: true,
      fibers: [],
    },
  ],
  fabricType: "",
  weave: "",
  finish: "",
  keyApplications: [],
  weaveTypes: [],
  finishTreatments: [],

  // PERFORMANCE & DURABILITY
  stretchPercentage: "",
  stretchDirection: [],
  breathability: "",
  moistureManagement: "",
  enhancedMoistureManagement: "",
  wickingRate: "",
  dryingTime: "",
  performanceFeatures: [],
  airPermeability: "",
  waterColumn: "",

  // DURABILITY & QUALITY
  yarnCountConstruction: "",
  colorfastness: "",
  tensileStrength: "",
  tearStrength: "",
  abrasionResistance: "",
  pillingGrade: "",
  shrinkageTolerancePercentage: "",
  washTemperature: "",

  // SUSTAINABILITY
  sustainabilityScore: "",
  certificationIds: [],
  certificationTags: [],
  endOfLifeOptions: [],
  recyclabilityNotes: "",
  useCases: [],

  // CARE & MAINTENANCE
  washCareInstructions: {
    careSymbols: [],
    instructions: "",
    restrictions: [],
  },
  visualSwatchId: null,
};

// Helper functions for generating test IDs
export const getButtonTestId = (action: string, target: string) => `button-${action}-${target}`;
export const getInputTestId = (fieldName: string) => `input-fabric-${fieldName}`;
/** @public */ export const getSelectTestId = (fieldName: string) => `select-fabric-${fieldName}`;
export const getRepeatedTestId = (type: string, name: string, index: number) =>
  `repeated-${type}-${name}-${index}`;

export const parseNumericValue = (val: string | number | null | undefined): number | null => {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === "number") {
    return val;
  }
  const parsed = parseFloat(val);
  return Number.isNaN(parsed) ? null : parsed;
};
