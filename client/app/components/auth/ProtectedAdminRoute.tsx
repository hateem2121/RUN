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

import { AlertTriangle } from "lucide-react";

import { login, useAuth } from "@/lib/auth";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();

  if (import.meta.env.DEV) {
    return <>{children}</>;
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="from-background to-muted flex min-h-screen items-center justify-center bg-linear-to-br">
        <output className="text-center" aria-label="Checking access">
          <div
            className="border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2"
            aria-hidden="true"
          />
          <p className="text-muted-foreground mt-4">Checking access...</p>
        </output>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    login(window.location.pathname);
    return (
      <div className="from-background to-muted flex min-h-screen items-center justify-center bg-linear-to-br">
        <output className="text-center" aria-label="Redirecting to login">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </output>
      </div>
    );
  }

  // Authenticated but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-destructive/5 to-destructive/10">
        <div className="bg-card border-border w-full max-w-md rounded-lg border p-8 text-center shadow-xl">
          <div className="bg-destructive/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-8 w-8" />
          </div>
          <h1 className="text-foreground mb-2 text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access the admin console.
          </p>
          <p className="text-muted-foreground mb-6 text-sm">
            Logged in as: <span className="font-medium">{user?.email}</span>
          </p>
          <button
            type="button"
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
