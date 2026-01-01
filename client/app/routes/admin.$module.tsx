import { lazy, Suspense } from "react";
import { useParams } from "react-router"; // RR7 uses useParams from react-router
import PlaceholderModule from "@/components/admin/PlaceholderModule";
import { ProductsErrorFallback } from "@/components/admin/ProductsErrorFallback";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Typography } from "@/components/ui/typography";
import type { Route } from "./+types/admin.$module";

// Lazy load all admin modules
// Note: We are re-declaring these lazy imports here.
// Ideally these should be moved to a separate file or kept consistent.
const ProductManagementUnified = lazy(() =>
  import("@/components/admin/product-management-unified/ProductManagementUnified").then((m) => ({
    default: m.ProductManagementUnified,
  })),
);

const AdminMediaPage = lazy(
  () => import("@/components/admin/media-library/MediaLibraryContainerEnhanced"),
);

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
const HomepageManagement = () => <PlaceholderModule moduleName="Homepage Management" />;
const AboutManagement = () => <PlaceholderModule moduleName="About Management" />;

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
const StorageOptimization = () => <PlaceholderModule moduleName="Storage Optimization" />;
const ContactManagement = lazy(() =>
  import("@/components/admin/contact-management").then((m) => ({
    default: m.ContactPageSettings,
  })),
);
const MediaTestRunner = () => <PlaceholderModule moduleName="Media Test Runner" />;
const InquiryManagement = () => <PlaceholderModule moduleName="Inquiry Management" />;

// Loading component
function ModuleLoader() {
  return (
    <div className="h-loading-center flex items-center justify-center">
      <div className="text-center">
        <div className="border-muted border-t-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
        <Typography.P className="text-muted-foreground text-sm">Loading module...</Typography.P>
      </div>
    </div>
  );
}

export function meta({ params }: Route.MetaArgs) {
  const moduleName = params.module
    ? params.module.charAt(0).toUpperCase() + params.module.slice(1)
    : "Admin";
  return [{ title: `${moduleName} | RUN APPAREL Admin` }];
}

export default function AdminModule() {
  const { module } = useParams();

  const renderModule = () => {
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
      case "dashboard":
        // Should be handled by _index but just in case
        return null;
      default:
        return (
          <div className="flex h-[50vh] flex-col items-center justify-center text-center">
            <Typography.H2>Module Not Found</Typography.H2>
            <Typography.P className="text-muted-foreground">
              The requested admin module "{module}" does not exist.
            </Typography.P>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary fallback={<ProductsErrorFallback />}>
      <Suspense fallback={<ModuleLoader />}>{renderModule()}</Suspense>
    </ErrorBoundary>
  );
}
