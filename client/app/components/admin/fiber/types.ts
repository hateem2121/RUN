export interface FiberFormData {
  name: string;
  type: string;
  description: string;
  properties: string;
  sustainabilityScore: number | undefined;
  environmentalImpact: string;
  isActive: boolean;
}

export const initialFiberFormData: FiberFormData = {
  name: "",
  type: "",
  description: "",
  properties: "",
  sustainabilityScore: undefined,
  environmentalImpact: "",
  isActive: true,
};

export const getFiberTypeColor = (type: string) => {
  switch (type) {
    case "natural":
      return "bg-green-50 text-green-700 border-green-200";
    case "synthetic":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "blended":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-orange-50 text-orange-700 border-orange-200";
  }
};

export const getSustainabilityColor = (score: number) => {
  if (score >= 4) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (score >= 3) {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
  return "bg-orange-50 text-orange-700 border-orange-200";
};

export const getSustainabilityLabel = (score: number) => {
  if (score >= 4) {
    return "High Impact";
  }
  if (score >= 3) {
    return "Moderate Impact";
  }
  return "Low Impact";
};

export const getSustainabilityBadgeColor = (score: number) => {
  if (score >= 4) {
    return "bg-emerald-100 text-emerald-800 border-emerald-300";
  }
  if (score >= 3) {
    return "bg-yellow-100 text-yellow-800 border-yellow-300";
  }
  return "bg-orange-100 text-orange-800 border-orange-300";
};

// Helper for test IDs
/** @public */ export const getFiberTestId = (prefix: string, identifier: string | number) =>
  `${prefix}-fiber-${identifier}`;
