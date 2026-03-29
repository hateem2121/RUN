export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    GOOGLE: "/api/auth/google",
    GOOGLE_CALLBACK: "/api/auth/google/callback",
  },
  ADMIN: {
    BASE: "/api/admin",
    DASHBOARD_STATS: "/api/admin/dashboard/stats",
    AUDIT_LOGS: "/api/admin/audit-logs",
    MEDIA: "/api/admin/media",
    USERS: "/api/admin/users",
  },
  MEDIA: {
    ROOT: "/api/media",
    UPLOAD: "/api/media/upload",
    BATCH: "/api/media/batch",
  },
  CONTENT: {
    NAVIGATION: "/api/navigation-items",
    HOMEPAGE_BATCH: "/api/homepage-batch",
  },
} as const;

export type ApiRoutes = typeof API_ROUTES;
