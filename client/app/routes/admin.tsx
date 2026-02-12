import { Outlet, useLocation } from "react-router";
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
import AdminLayout from "@/components/admin/admin-layout";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { AdminProvider } from "@/context/AdminContext";
import type { Route } from "./+types/admin";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin Console | RUN APPAREL" }];
}

export { AdminErrorBoundary as ErrorBoundary };

export default function AdminRoute() {
  const location = useLocation();
  const pathSegments = location.pathname.split("/");
  // Accessing index 2 because path starts with /admin/... e.g., ["", "admin", "products"]
  const currentModule = pathSegments[2] || "dashboard";

  return (
    <ProtectedAdminRoute>
      <AdminProvider>
        <AdminLayout currentModule={currentModule}>
          <Outlet />
        </AdminLayout>
      </AdminProvider>
    </ProtectedAdminRoute>
  );
}
