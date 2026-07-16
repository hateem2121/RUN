/**
 * Client-Side Authentication Hook & Utilities
 *
 * SEC-001 FIX: Replaced hardcoded admin stub with real auth state
 * from the server-side session via /api/auth/user endpoint.
 *
 * ProtectedAdminRoute depends on this hook to enforce UI-level access control.
 * Server-side enforcement is via requireAdmin middleware on /api/admin/* routes.
 */

import { useQuery } from "@tanstack/react-query";

interface AuthUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

/**
 * Real authentication hook that queries the server session.
 *
 * - Returns loading state while checking auth
 * - Returns isAuthenticated: false if not logged in (401 from server)
 * - Returns isAdmin based on the database user record
 */
export const useAuth = (): AuthState => {
  const { data, isLoading, isError } = useQuery<AuthUser>({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", {
        credentials: "include", // Send session cookies
      });
      if (!res.ok) {
        throw new Error(`Auth check failed: ${res.status}`);
      }
      return res.json();
    },
    retry: false, // Don't retry auth failures — they mean "not logged in"
    staleTime: 5 * 60 * 1000, // Cache auth state for 5 minutes
    refetchOnWindowFocus: true, // Re-check on tab focus
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !isError && !!data,
    isAdmin: !!data?.isAdmin,
  };
};

/**
 * Redirect the user to the Google OAuth login flow.
 * Passes the current URL as returnUrl so the user is redirected back after login.
 */
export const login = (returnUrl?: string) => {
  const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : "";
  window.location.href = `/api/auth/login${params}`;
};

/**
 * Log out the user by calling the server-side logout endpoint.
 * The server destroys the session and redirects to home.
 */
/** @public */ export const logout = () => {
  window.location.href = "/api/auth/logout";
};
