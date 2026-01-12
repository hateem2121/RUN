/**
 * Date handling utilities for API/interface conversions
 * Handles conversion between ISO strings (API) and Date objects (interface)
 */

/**
 * Parse API date string to Date object
 * Handles null/undefined values safely
 */
export const parseApiDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  if (dateString === "null" || dateString === "undefined") return null;

  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (_error) {
    return null;
  }
};

/**
 * Format Date object to ISO string for API
 * Handles null/undefined values safely
 */
export const formatApiDate = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  if (!(date instanceof Date)) return null;

  try {
    return date.toISOString();
  } catch (_error) {
    return null;
  }
};

/**
 * Get current timestamp as Date object
 */
export const getCurrentDate = (): Date => {
  return new Date();
};

/**
 * Get current timestamp as ISO string
 */
export const getCurrentISOString = (): string => {
  return new Date().toISOString();
};

/**
 * Check if a value is a valid Date object
 */
export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !Number.isNaN(date.getTime());
};

/**
 * Safely convert any date-like value to Date object
 * Handles strings, Date objects, numbers (timestamps)
 */
export const toDate = (value: string | Date | number | null | undefined): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === "string") {
    return parseApiDate(value);
  }

  if (typeof value === "number") {
    try {
      const date = new Date(value);
      return isValidDate(date) ? date : null;
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Format date for display (human-readable)
 */
export const formatDisplayDate = (date: Date | string | null | undefined): string => {
  const dateObj = toDate(date);
  if (!dateObj) return "Unknown";

  try {
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Invalid Date";
  }
};

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 */
export const getRelativeTime = (date: Date | string | null | undefined): string => {
  const dateObj = toDate(date);
  if (!dateObj) return "Unknown";

  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

  return formatDisplayDate(dateObj);
};
