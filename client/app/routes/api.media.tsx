export async function loader() {
  return {
    success: true,
    data: {
      data: [], // Empty list of media assets
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    },
  };
}

import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };
