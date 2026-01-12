import type { MediaAsset } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { CapabilityManagement } from "@/components/admin/manufacturing/CapabilityManagement";
import { HeroManagement } from "@/components/admin/manufacturing/HeroManagement";
import { ProcessManagement } from "@/components/admin/manufacturing/ProcessManagement";
import { QualityManagement } from "@/components/admin/manufacturing/QualityManagement";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaQueryKeys } from "@/lib/media-query-keys";

export default function ManufacturingManagement() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Manufacturing Management</h1>
          <p className="text-muted-foreground">
            Manage manufacturing processes, capabilities, and quality standards
          </p>
        </div>
      </div>

      {isMediaLoading ? (
        <div className="flex h-32 items-center justify-center space-x-2">
          <div className="h-4 w-4 animate-bounce rounded-full bg-manufacturing-primary [animation-delay:-0.3s]"></div>
          <div className="h-4 w-4 animate-bounce rounded-full bg-manufacturing-primary [animation-delay:-0.15s]"></div>
          <div className="h-4 w-4 animate-bounce rounded-full bg-manufacturing-primary"></div>
        </div>
      ) : (
        <Tabs
          defaultValue="hero"
          className="fade-in-50 slide-in-from-bottom-4 animate-in space-y-4 duration-500"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hero">Hero Section</TabsTrigger>
            <TabsTrigger value="processes">Processes</TabsTrigger>
            <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
            <TabsTrigger value="quality">Quality Standards</TabsTrigger>
          </TabsList>

          <TabsContent value="hero" className="space-y-4">
            <ErrorBoundary componentName="Hero Management">
              <HeroManagement mediaAssets={mediaAssets} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="processes" className="space-y-4">
            <ErrorBoundary componentName="Process Management">
              <ProcessManagement mediaAssets={mediaAssets} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-4">
            <ErrorBoundary componentName="Capability Management">
              <CapabilityManagement mediaAssets={mediaAssets} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <ErrorBoundary componentName="Quality Standards Management">
              <QualityManagement mediaAssets={mediaAssets} />
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
