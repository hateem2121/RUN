/**
 * Utility functions for handling fiber properties
 * Fiber properties are stored as JSONB objects in the database where the keys represent the property names.
 */

/**
 * Converts an array of property strings into an object where keys are the properties and values are true.
 * This format is used to store properties in the JSONB database column.
 */
export function propertiesToObject(properties: string[]): Record<string, boolean> {
  if (!Array.isArray(properties)) return {};

  return properties.reduce(
    (acc, prop) => {
      if (prop) {
        acc[prop] = true;
      }
      return acc;
    },
    {} as Record<string, boolean>,
  );
}

/**
 * Extracts an array of property strings from a properties object.
 * It returns the keys of the object.
 */
export function getPropertiesArray(properties: unknown): string[] {
  if (!properties || typeof properties !== "object") {
    return [];
  }

  return Object.keys(properties);
}
