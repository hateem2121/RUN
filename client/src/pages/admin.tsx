import { lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { ProductsErrorFallback } from "@/components/admin/ProductsErrorFallback";
import AdminLayout from "@/components/admin-layout";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Typography } from "@/components/ui/typography";
import { AdminProvider } from "@/context/AdminContext";

// Lazy load all admin modules for better performance
const AdminCMS = lazy(() => import("@/components/admin-cms"));
const ProductManagementUnified = lazy(() =>
  import("@/components/admin/product-management-unified/ProductManagementUnified").then((m) => ({
    default: m.ProductManagementUnified,
  })),
);

const AdminMediaPage = lazy(() => import("@/pages/admin/media"));

const FabricManagementEnhancedV2 = lazy(
  () => import("@/components/admin/fabric-management-enhanced-v2"),
);
const FiberManagement = lazy(() => import("@/components/admin/fiber-management"));
const CertificateManagement = lazy(() => import("@/components/admin/certificate-management"));
const SizeChartManagementEnhanced = lazy(
  () => import("@/components/admin/size-chart-management-enhanced"),
);
const AccessoryManagement = lazy(() => import("@/components/admin/accessory-management-enhanced"));
const NavigationManagement = lazy(() => import("@/components/admin/navigation-management"));
const HomepageManagement = lazy(() => import("@/pages/admin/HomepageManagement"));
const AboutManagement = lazy(() =>
  import("@/pages/admin/about-management").then((m) => ({
    default: m.AboutManagement,
  })),
);

const UnifiedSustainabilityManagement = lazy(() =>
  import("@/components/admin/unified-sustainability-management").then((m) => ({
    default: m.UnifiedSustainabilityManagement,
  })),
);
const ManufacturingManagement = lazy(() => import("@/components/admin/manufacturing-management"));
const TechnologyManagement = lazy(() =>
  import("@/components/admin/technology-management").then((m) => ({
    default: m.TechnologyManagement,
  })),
);
const StorageOptimization = lazy(() => import("@/pages/admin/storage-optimization"));
const ContactManagement = lazy(() => import("@/pages/admin/contact-management"));
const MediaTestRunner = lazy(() => import("@/pages/admin/media-test-runner"));
const InquiryManagement = lazy(() => import("@/pages/admin/inquiry-management"));

// Loading component for lazy loaded modules
function ModuleLoader() {
  return (
    <div className="flex h-loading-center items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <Typography.P className="text-muted-foreground text-sm">Loading module...</Typography.P>
      </div>
    </div>
  );
}

export default function Admin() {
  const [location] = useLocation();
  const pathSegments = location.split("/");
  const module = pathSegments[2]; // /admin/[module]

  const renderModule = () => {
    // Wrap all modules with error boundary and suspense
    // Each module path gets its own Suspense boundary
    return (
      <ErrorBoundary fallback={<ProductsErrorFallback />}>
        <Suspense fallback={<ModuleLoader />}>
          {(() => {
            switch (module) {
              case "products":
                return <ProductManagementUnified />;

              case "media":
                return <AdminMediaPage />;
              case "fabrics":
                return <FabricManagementEnhancedV2 />;
              case "fibers":
                return <FiberManagement />;
              case "certificates":
                return <CertificateManagement />;
              case "size-charts":
                return <SizeChartManagementEnhanced />;
              case "accessories":
                return <AccessoryManagement />;
              case "navigation":
                return <NavigationManagement />;
              case "homepage":
                return <HomepageManagement />;
              case "about":
                return <AboutManagement />;
              case "sustainability":
                return <UnifiedSustainabilityManagement />;
              case "manufacturing":
                return <ManufacturingManagement />;
              case "technology":
                return <TechnologyManagement />;
              case "storage-optimization":
                return <StorageOptimization />;
              case "contact":
                return <ContactManagement />;
              case "test-runner":
                return <MediaTestRunner />;
              case "inquiries":
                return <InquiryManagement />;

              default:
                return <AdminCMS />;
            }
          })()}
        </Suspense>
      </ErrorBoundary>
    );
  };

  return (
    <ProtectedAdminRoute>
      <AdminProvider>
        <AdminLayout currentModule={module || "dashboard"}>
          <Suspense fallback={<ModuleLoader />}>{renderModule()}</Suspense>
        </AdminLayout>
      </AdminProvider>
    </ProtectedAdminRoute>
  );
}
