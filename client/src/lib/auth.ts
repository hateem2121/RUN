/**
 * Frontend Auth Utilities
 * Reference: https://developers.google.com/identity/protocols/oauth2
 *
 * CRITICAL SECURITY NOTE:
 * - Admin status verification happens on BACKEND via requireAdmin middleware
 * - Frontend only uses this for UI display - NOT authorization
 * - All /api/admin/* routes are protected server-side regardless of frontend checks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";

/**
 * User type matching server-side User schema
 * See: shared/schema.ts
 */
export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
}

/**
 * Hook to get current authenticated user
 * Returns null if not authenticated (401)
 *
 * SECURITY: This is for UI only - backend enforces admin access
 */
export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    retry: false, // Don't retry on 401 (unauthenticated)
    staleTime: 5 * 60 * 1000, // 5 minutes - matches admin cache TTL
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/user");
        if (response.status === 401) {
          // Not authenticated - return null instead of throwing
          return null;
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.statusText}`);
        }
        return await response.json();
      } catch (err) {
        // If fetch fails (network error, etc), return null
        console.error("[Auth] Failed to fetch user:", err);
        return null;
      }
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/cache/clear", { method: "POST" });
    },
    onSuccess: () => {
      // Invalidate all queries after cache clear
      queryClient.invalidateQueries();
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin ?? false,
    error,
    clearAdminCache: clearCacheMutation.mutate,
    isClearingCache: clearCacheMutation.isPending,
  };
}

/**
 * Redirect to Google Auth login
 * The backend will redirect back to returnTo after successful auth
 */
export function login(returnTo: string = window.location.pathname) {
  const params = new URLSearchParams({ returnTo });
  window.location.href = `/api/login?${params.toString()}`;
}

/**
 * Logout and redirect to home
 */
export function logout() {
  window.location.href = "/api/logout";
}

/**
 * Get user's display name
 */
export function getDisplayName(user: AuthUser | null): string {
  if (!user) return "Guest";

  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  if (user.email) {
    const emailName = user.email.split("@")[0];
    return emailName || "User";
  }

  return "User";
}
