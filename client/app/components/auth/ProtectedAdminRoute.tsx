/**
 * Protected Admin Route Component
 *
 * Wraps admin pages to enforce authentication and authorization.
 * User must be:
 * 1. Authenticated (logged in with Replit Auth)
 * 2. Admin (isAdmin=true in database)
 *
 * SECURITY: This is UI-level protection only
 * Real enforcement happens server-side via requireAdmin middleware on /api/admin/* routes
 */

import { login, useAuth } from "@/lib/auth";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="from-background to-muted flex min-h-screen items-center justify-center bg-linear-to-br">
        <div className="text-center">
          <div className="border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-muted-foreground mt-4">Checking access...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    login(window.location.pathname);
    return (
      <div className="from-background to-muted flex min-h-screen items-center justify-center bg-linear-to-br">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Authenticated but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-red-50 to-red-100">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin console.
          </p>
          <p className="text-muted-foreground mb-6 text-sm">
            Logged in as: <span className="font-medium">{user?.email}</span>
          </p>
          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="bg-primary hover:bg-primary/90 rounded-lg px-6 py-2 text-white transition-colors"
            data-testid="button-return-home"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated AND admin - render protected content
  return <>{children}</>;
}
