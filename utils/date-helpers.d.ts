/**
 * Date handling utilities for API/interface conversions
 * Handles conversion between ISO strings (API) and Date objects (interface)
 */
/**
 * Parse API date string to Date object
 * Handles null/undefined values safely
 */
export declare const parseApiDate: (dateString: string | null | undefined) => Date | null;
/**
 * Format Date object to ISO string for API
 * Handles null/undefined values safely
 */
export declare const formatApiDate: (date: Date | null | undefined) => string | null;
/**
 * Get current timestamp as Date object
 */
export declare const getCurrentDate: () => Date;
/**
 * Get current timestamp as ISO string
 */
export declare const getCurrentISOString: () => string;
/**
 * Check if a value is a valid Date object
 */
export declare const isValidDate: (date: any) => date is Date;
/**
 * Safely convert any date-like value to Date object
 * Handles strings, Date objects, numbers (timestamps)
 */
export declare const toDate: (value: string | Date | number | null | undefined) => Date | null;
/**
 * Format date for display (human-readable)
 */
export declare const formatDisplayDate: (date: Date | string | null | undefined) => string;
/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 */
export declare const getRelativeTime: (date: Date | string | null | undefined) => string;
//# sourceMappingURL=date-helpers.d.ts.map
