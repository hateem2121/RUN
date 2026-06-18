import type { MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { CapabilityManagement } from "@/components/admin/manufacturing/CapabilityManagement";
import { CaseStudyManagement } from "@/components/admin/manufacturing/CaseStudyManagement";
import { HeroManagement } from "@/components/admin/manufacturing/HeroManagement";
import { ProcessManagement } from "@/components/admin/manufacturing/ProcessManagement";
import { QualityManagement } from "@/components/admin/manufacturing/QualityManagement";
import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaQueryKeys } from "@/lib/media-query-keys";

export function ManufacturingManagement() {
  // OPTIMIZATION: Defer heavy media loading until editing mode is active (Refactor Phase 4)
  const { data: mediaResponse, isPending: isMediaLoading } = useQuery<{
    success: boolean;
    data: { data: MediaAsset[]; pagination: unknown };
  }>({
    queryKey: MediaQueryKeys.list,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  const mediaAssets = Array.isArray(mediaResponse?.data?.data) ? mediaResponse.data.data : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Manufacturing Management"
        description="Manage manufacturing processes, capabilities, and quality standards"
      />

      {isMediaLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex space-x-2">
              <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></div>
              <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></div>
              <div className="h-3 w-3 animate-bounce rounded-full bg-blue-500"></div>
            </div>
            <p className="text-xs font-medium text-admin-muted uppercase tracking-widest">
              Loading assets...
            </p>
          </div>
        </div>
      ) : (
        <Tabs
          defaultValue="hero"
          className="fade-in-50 slide-in-from-bottom-4 animate-in space-y-6 duration-500"
        >
          <TabsList className="bg-white/5 border border-white/10 p-1 h-12 rounded-xl grid w-full grid-cols-5 lg:max-w-3xl overflow-hidden mb-8">
            <TabsTrigger
              value="hero"
              className="rounded-lg data-custom-misc-54:bg-brand-manufacturing data-custom-misc-55:text-black text-admin-muted transition-all font-medium"
            >
              Hero
            </TabsTrigger>
            <TabsTrigger
              value="processes"
              className="rounded-lg data-custom-misc-56:bg-brand-manufacturing data-custom-misc-57:text-black text-admin-muted transition-all font-medium"
            >
              Processes
            </TabsTrigger>
            <TabsTrigger
              value="capabilities"
              className="rounded-lg data-custom-misc-58:bg-brand-manufacturing data-custom-misc-59:text-black text-admin-muted transition-all font-medium"
            >
              Capabilities
            </TabsTrigger>
            <TabsTrigger
              value="quality"
              className="rounded-lg data-custom-misc-60:bg-brand-manufacturing data-custom-misc-61:text-black text-admin-muted transition-all font-medium"
            >
              Quality
            </TabsTrigger>
            <TabsTrigger
              value="cases"
              className="rounded-lg data-custom-misc-62:bg-brand-manufacturing data-custom-misc-63:text-black text-admin-muted transition-all font-medium"
            >
              Stories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="outline-none focus-visible:ring-0">
            <ErrorBoundary componentName="Hero Management">
              <HeroManagement mediaAssets={mediaAssets} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="processes" className="outline-none focus-visible:ring-0">
            <ErrorBoundary componentName="Process Management">
              <ProcessManagement mediaAssets={mediaAssets} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="capabilities" className="outline-none focus-visible:ring-0">
            <ErrorBoundary componentName="Capability Management">
              <CapabilityManagement mediaAssets={mediaAssets} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="quality" className="outline-none focus-visible:ring-0">
            <ErrorBoundary componentName="Quality Standards Management">
              <QualityManagement mediaAssets={mediaAssets} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="cases" className="outline-none focus-visible:ring-0">
            <ErrorBoundary componentName="Case Study Management">
              <CaseStudyManagement mediaAssets={mediaAssets} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// Quality Standards Management now implemented as modular component

// Manufacturing Management now uses modular sub-components:
// - HeroManagement: Handles hero section configuration
// - ProcessManagement: Manages manufacturing processes and workflows
// - CapabilityManagement: Manages manufacturing capabilities and specifications
// - Each component is wrapped in ErrorBoundary for graceful failure handling
// - Original 2,500+ line monolithic component reduced to ~75 lines
