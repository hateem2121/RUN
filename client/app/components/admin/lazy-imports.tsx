import { lazy } from "react";
// import { Loader2 } from 'lucide-react';

// Phase 5.2: Lazy-loaded Admin Components for Code Splitting

// Loading component
// const AdminLoadingFallback = () => (
//   <div className="center-flex h-loading-center">
//     <div className="text-center">
//       <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
//       <p className="text-sm text-muted-foreground">Loading module...</p>
//     </div>
//   </div>
// );

// Lazy load heavy admin components
export const LazyProductManagement = lazy(() =>
  import("./product-management-unified/ProductManagementUnified").then((module) => ({
    default: module.ProductManagementUnified,
  })),
);

export const LazyMediaLibrary = lazy(() =>
  import("./media-library/MediaLibraryContainerEnhanced").then((m) => ({
    default: m.MediaLibraryContainerEnhanced,
  })),
);

export const LazyFabricManagement = lazy(() =>
  import("./fabric-management-enhanced-v2").then((m) => ({
    default: m.FabricManagementEnhancedV2,
  })),
);

export const LazyFiberManagement = lazy(() =>
  import("./fiber-management").then((m) => ({ default: m.FiberManagement })),
);

export const LazyCertificateManagement = lazy(() =>
  import("./certificate-management").then((m) => ({ default: m.CertificateManagement })),
);

export const LazySizeChartManagement = lazy(() =>
  import("./size-chart-management-enhanced").then((m) => ({
    default: m.SizeChartManagementEnhanced,
  })),
);

export const LazyAccessoryManagement = lazy(() =>
  import("./accessory-management-enhanced").then((m) => ({
    default: m.AccessoryManagementEnhanced,
  })),
);

export const LazyCategoryManagement = lazy(() =>
  import("./category-management-simplified").then((m) => ({
    default: m.CategoryManagementSimplified,
  })),
);

export const LazyFooterManagement = lazy(() =>
  import("./footer-management/FooterManagement").then((m) => ({ default: m.FooterManagement })),
);

// Note: LazyComponentWrapper was removed as it's not used anywhere in the codebase.
// All lazy components are rendered directly with Suspense in admin.tsx.
// Future lazy component usage should wrap components directly with Suspense
// and the AdminLoadingFallback component as needed.

// Export preload functions for predictive loading
export const preloadAdminModules = {
  productManagement: () => import("./product-management-unified/ProductManagementUnified"),
  mediaLibrary: () => import("./media-library/MediaLibraryContainerEnhanced"),
  fabricManagement: () => import("./fabric-management-enhanced-v2"),
  fiberManagement: () => import("./fiber-management"),
  certificateManagement: () => import("./certificate-management"),
  sizeChartManagement: () => import("./size-chart-management-enhanced"),
  accessoryManagement: () => import("./accessory-management-enhanced"),
  categoryManagement: () => import("./category-management-simplified"),
  footerManagement: () => import("./footer-management/FooterManagement"),
};

// Preload on hover for better UX
export const preloadOnHover = (moduleName: keyof typeof preloadAdminModules) => {
  const preloader = preloadAdminModules[moduleName];
  if (preloader) {
    preloader();
  }
};
