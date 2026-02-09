/**
 * Shared utility functions for fiber and fabric property handling
 */

/**
 * Helper function to safely handle properties regardless of type
 * Used across fiber and fabric components to normalize property data
 */
export const getPropertiesArray = (properties: unknown): string[] => {
  if (!properties) {
    return [];
  }
  if (typeof properties === "string") {
    return properties.split(",").filter((p: string) => p.trim());
  }
  if (typeof properties === "object" && Array.isArray(properties)) {
    return properties.filter((p) => typeof p === "string" && p.trim());
  }
  if (typeof properties === "object") {
    return Object.keys(properties).filter((k) => k.trim());
  }
  return [];
};

/**
 * Format properties for display with proper spacing and capitalization
 */
export const formatPropertyForDisplay = (property: string): string => {
  return property.trim().replace(/([a-z])([A-Z])/g, "$1 $2");
};

/**
 * Convert properties array back to object format for API storage
 */
export const propertiesToObject = (properties: string[]): Record<string, boolean> => {
  return properties.reduce((acc: Record<string, boolean>, prop: string) => {
    const cleanProp = prop.trim();
    if (cleanProp) {
      acc[cleanProp] = true;
    }
    return acc;
  }, {});
};
