import { lazy, Suspense } from "react";
import { useParams } from "react-router"; // RR7 uses useParams from react-router
import { AdminErrorBoundary } from "@/components/admin/AdminErrorBoundary";
import { PlaceholderModule } from "@/components/admin/PlaceholderModule";
import { ApiErrorFallback } from "@/components/admin/shared/ApiErrorFallback";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";
import { ErrorBoundary as InlineErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Typography } from "@/components/ui/typography";
import type { Route } from "./+types/admin.$module";

export { AdminErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

// Lazy load all admin modules
// Note: We are re-declaring these lazy imports here.
// Ideally these should be moved to a separate file or kept consistent.
const ProductManagementUnified = lazy(() =>
  import("@/components/admin/product-management-unified/ProductManagementUnified").then((m) => ({
    default: m.ProductManagementUnified,
  })),
);

const AdminMediaPage = lazy(() =>
  import("@/components/admin/media-library/MediaLibraryContainerEnhanced").then((m) => ({
    default: m.MediaLibraryContainerEnhanced,
  })),
);

const FabricManagement = lazy(() =>
  import("@/components/admin/fabric/fabric-management-enhanced").then((m) => ({
    default: m.FabricManagementEnhancedV2,
  })),
);
const FiberManagement = lazy(() =>
  import("@/components/admin/fiber/fiber-management").then((m) => ({ default: m.FiberManagement })),
);
const CertificateManagement = lazy(() =>
  import("@/components/admin/certificate/certificate-management").then((m) => ({
    default: m.CertificateManagement,
  })),
);
const SizeChartManagement = lazy(() =>
  import("@/components/admin/product-management-unified/size-chart-management-enhanced").then(
    (m) => ({
      default: m.SizeChartManagementEnhanced,
    }),
  ),
);
const AccessoryManagement = lazy(() =>
  import("@/components/admin/product-management-unified/accessory-management-enhanced").then(
    (m) => ({
      default: m.AccessoryManagementEnhanced,
    }),
  ),
);
// Unused exports removed
const HomepageManagement = lazy(() =>
  import("@/components/admin/homepage/homepage-management").then((m) => ({
    default: m.HomepageManagement,
  })),
);
const CategoryManagement = lazy(() =>
  import("@/components/admin/categories/category-management-simplified").then((m) => ({
    default: m.CategoryManagementSimplified,
  })),
);
const FooterManagement = lazy(() =>
  import("@/components/admin/footer-management/FooterManagement").then((m) => ({
    default: m.FooterManagement,
  })),
);
const AboutManagement = lazy(() =>
  import("@/components/admin/about/AboutManagement").then((m) => ({ default: m.AboutManagement })),
);
const BlogManagement = lazy(() =>
  import("@/components/admin/blog/blog-management").then((m) => ({ default: m.BlogManagement })),
);

const SustainabilityManagement = lazy(() =>
  import("@/components/admin/sustainability/unified-sustainability-management").then((m) => ({
    default: m.UnifiedSustainabilityManagement,
  })),
);
const ManufacturingManagement = lazy(() =>
  import("@/components/admin/manufacturing/manufacturing-management").then((m) => ({
    default: m.ManufacturingManagement,
  })),
);
const TechnologyManagement = lazy(() =>
  import("@/components/admin/technology/technology-management").then((m) => ({
    default: m.TechnologyManagement,
  })),
);
const StorageOptimization = lazy(() =>
  import("@/components/admin/storage-optimization/StorageOptimizationDashboard").then((m) => ({
    default: m.StorageOptimizationDashboard,
  })),
);
const ContactManagement = lazy(() =>
  import("@/components/admin/contact-management/ContactPageSettings").then((m) => ({
    default: m.ContactPageSettings,
  })),
);
const MediaTestRunner = () => <PlaceholderModule moduleName="Media Test Runner" />;
const InquiryManagement = lazy(() =>
  import("@/components/admin/inquiry-management/index").then((m) => ({
    default: m.InquiryManagement,
  })),
);
const InventoryManagement = ({ moduleName }: { moduleName: string }) => (
  <PlaceholderModule moduleName={moduleName} />
);

// Loading component
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

export function meta({ params }: Route.MetaArgs) {
  const moduleName = params.module
    ? params.module.charAt(0).toUpperCase() + params.module.slice(1)
    : "Admin";
  return [{ title: `${moduleName} | RUN APPAREL Admin` }];
}

const AdminDashboard = ({ moduleName }: { moduleName: string }) => (
  <PlaceholderModule moduleName={moduleName} />
);
const OrderManagement = ({ moduleName }: { moduleName: string }) => (
  <PlaceholderModule moduleName={moduleName} />
);
const CustomerManagement = ({ moduleName }: { moduleName: string }) => (
  <PlaceholderModule moduleName={moduleName} />
);
const AdminSettings = ({ moduleName }: { moduleName: string }) => (
  <PlaceholderModule moduleName={moduleName} />
);

export default function AdminModuleRoute() {
  const { module } = useParams();

  const renderModule = () => {
    switch (module) {
      case "products":
        return <ProductManagementUnified />;
      case "product":
        return <InventoryManagement moduleName="Inventory" />;
      case "orders":
        return <OrderManagement moduleName="Orders" />;
      case "customers":
        return <CustomerManagement moduleName="Customers" />;
      case "settings":
        return <AdminSettings moduleName="Settings" />;
      case "dashboard":
        return <AdminDashboard moduleName="Dashboard" />;
      case "categories":
        return <CategoryManagement />;
      case "category":
        return <CategoryManagement />;
      case "media":
        return <AdminMediaPage />;
      case "fabrics":
        return <FabricManagement />;
      case "fibers":
        return <FiberManagement />;
      case "fiber":
        return <FiberManagement />;
      case "certifications":
        return <CertificateManagement />;
      case "certification":
        return <CertificateManagement />;
      case "certificates":
        return <CertificateManagement />;
      case "certificate":
        return <CertificateManagement />;
      case "size-charts":
        return <SizeChartManagement />;
      case "size-chart":
        return <SizeChartManagement />;
      case "accessories":
        return <AccessoryManagement />;

      case "manufacturing":
        return <ManufacturingManagement />;
      case "homepage":
        return <HomepageManagement />;
      case "about":
        return <AboutManagement />;
      case "sustainability":
        return <SustainabilityManagement />;
      case "technology":
        return <TechnologyManagement />;
      case "storage-optimization":
        return <StorageOptimization />;
      case "contact":
        return <ContactManagement />;
      case "footer":
        return <FooterManagement />;
      case "inquiries":
        return <InquiryManagement />;
      case "blog":
        return <BlogManagement />;
      case "test-runner":
        return <MediaTestRunner />;
      default:
        return <PlaceholderModule moduleName={module ?? "Unknown Module"} />;
    }
  };

  const moduleName = module ? module.charAt(0).toUpperCase() + module.slice(1) : "Module";

  return (
    <InlineErrorBoundary
      key={module} // Reset error boundary when switching modules
      fallback={<ApiErrorFallback moduleName={moduleName} />}
    >
      <Suspense fallback={<ModuleLoader />}>{renderModule()}</Suspense>
    </InlineErrorBoundary>
  );
}
