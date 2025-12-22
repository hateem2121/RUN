import { lazy, Suspense } from "react";
import { useLocation } from "wouter";
import { ProductsErrorFallback } from "@/components/admin/ProductsErrorFallback";
import AdminLayout from "@/components/admin-layout";
import { ProtectedAdminRoute } from "@/components/auth/ProtectedAdminRoute";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { AdminProvider } from "@/context/AdminContext";

// Lazy load all admin modules for better performance
const AdminCMS = lazy(() => import("@/components/admin-cms"));
const ProductManagementUnified = lazy(() =>
  import(
    "@/components/admin/product-management-unified/ProductManagementUnified"
  ).then((m) => ({ default: m.ProductManagementUnified })),
);
const CategoryManagementSimplified = lazy(
  () => import("@/components/admin/category-management-simplified"),
);
const AdminMediaPage = lazy(() => import("@/pages/admin/media"));

const FabricManagementEnhancedV2 = lazy(
  () => import("@/components/admin/fabric-management-enhanced-v2"),
);
const FiberManagement = lazy(
  () => import("@/components/admin/fiber-management"),
);
const CertificateManagement = lazy(
  () => import("@/components/admin/certificate-management"),
);
const SizeChartManagementEnhanced = lazy(
  () => import("@/components/admin/size-chart-management-enhanced"),
);
const AccessoryManagement = lazy(
  () => import("@/components/admin/accessory-management-enhanced"),
);
const NavigationManagement = lazy(
  () => import("@/components/admin/navigation-management"),
);
const HomepageManagement = lazy(
  () => import("@/pages/admin/HomepageManagement"),
);
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
const ManufacturingManagement = lazy(
  () => import("@/components/admin/manufacturing-management"),
);
const TechnologyManagement = lazy(() =>
  import("@/components/admin/technology-management").then((m) => ({
    default: m.TechnologyManagement,
  })),
);
const StorageOptimization = lazy(
  () => import("@/pages/admin/storage-optimization"),
);
const ContactManagement = lazy(
  () => import("@/pages/admin/contact-management"),
);
const MediaTestRunner = lazy(() => import("@/pages/admin/media-test-runner"));
const InquiryManagement = lazy(
  () => import("@/pages/admin/inquiry-management"),
);
const FooterManagement = lazy(() => import("@/pages/admin/footer-management"));

// Loading component for lazy loaded modules
function ModuleLoader() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600">Loading module...</p>
      </div>
    </div>
  );
}

export default function Admin() {
  const [location] = useLocation();
  const pathSegments = location.split("/");
  const module = pathSegments[2]; // /admin/[module]

  console.log("Admin Route Debug:", { location, pathSegments, module });

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
              case "categories":
                return <CategoryManagementSimplified />;
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
              case "footer":
                return <FooterManagement />;
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
