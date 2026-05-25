/**
 * Shared API Parameter Constants
 * Prevents parameter mismatches between frontend and backend
 * Part of systematic admin products recovery plan
 */

// Media API sorting options - MUST match server validation and storage implementation
export const MEDIA_SORT_OPTIONS = {
  UPLOADED_AT: "uploadedAt",
  CREATED_AT: "createdAt", // Maps to uploadedAt in storage layer
  FILENAME: "filename",
  NAME: "name",
  SIZE: "size",
  TYPE: "type",
} as const;

export type MediaSortOption = (typeof MEDIA_SORT_OPTIONS)[keyof typeof MEDIA_SORT_OPTIONS];

// Sort order options
export const SORT_ORDER_OPTIONS = {
  ASC: "asc",
  DESC: "desc",
} as const;

export type SortOrderOption = (typeof SORT_ORDER_OPTIONS)[keyof typeof SORT_ORDER_OPTIONS];

// Default pagination settings for consistent behavior
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 20,
  ADMIN_LIMIT: 50, // For admin interfaces
  MAX_LIMIT: 100, // Server validation max limit
} as const;

// Media API parameter builder utility
export const buildMediaApiParams = (options: {
  page?: number;
  limit?: number;
  sortBy?: MediaSortOption;
  sortOrder?: SortOrderOption;
  search?: string;
  type?: string;
  all?: boolean;
}): string => {
  const params = new URLSearchParams();

  if (options.page) {
    params.set("page", options.page.toString());
  }
  if (options.limit) {
    params.set("limit", options.limit.toString());
  }
  if (options.sortBy) {
    params.set("sortBy", options.sortBy);
  }
  if (options.sortOrder) {
    params.set("sortOrder", options.sortOrder);
  }
  if (options.search) {
    params.set("search", options.search);
  }
  if (options.type && options.type !== "all") {
    params.set("type", options.type);
  }
  if (options.all) {
    params.set("all", "true");
  }

  return params.toString();
};

// Common admin media query configurations
export const ADMIN_MEDIA_QUERIES = {
  // Recent assets for admin dropdowns/selectors
  RECENT_ADMIN: {
    limit: DEFAULT_PAGINATION.ADMIN_LIMIT,
    sortBy: MEDIA_SORT_OPTIONS.UPLOADED_AT,
    sortOrder: SORT_ORDER_OPTIONS.DESC,
  },

  // Max assets within server validation limits
  MAX_ASSETS: {
    limit: DEFAULT_PAGINATION.MAX_LIMIT, // 100 - respects server validation
    sortBy: MEDIA_SORT_OPTIONS.UPLOADED_AT,
    sortOrder: SORT_ORDER_OPTIONS.DESC,
  },

  // Public website queries
  PUBLIC_ALL: {
    all: true,
  },
} as const;

// About Module API Routes
export const ABOUT_API = {
  BATCH: "/api/about-batch",
  HERO: "/api/about-hero",
  STATISTICS: "/api/about-statistics",
  STATISTICS_REORDER: "/api/about-statistics/reorder",
  TIMELINE: "/api/about-timeline",
  TIMELINE_REORDER: "/api/about-timeline/reorder",
  LOCATIONS: "/api/about-locations",
  LOCATIONS_REORDER: "/api/about-locations/reorder",
  SECTIONS: "/api/about-sections",
  SECTIONS_REORDER: "/api/about-sections/reorder",
  TEAM_MESSAGE: "/api/about-team-messages",
} as const;
