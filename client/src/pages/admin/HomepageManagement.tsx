import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaQueryKeys } from "@/lib/media-query-keys";

// Import modular components
import { HomepageHeroManager } from "./content-management/homepage/HomepageHeroManager";
import { HomepageSlogansManager } from "./content-management/homepage/HomepageSlogansManager";
import { HomepageProcessManager } from "./content-management/homepage/HomepageProcessManager";
import { HomepageAnimationsManager } from "./content-management/homepage/HomepageAnimationsManager";
import { HomepageStatsManager } from "./content-management/homepage/HomepageStatsManager";
import { HomepageValuesManager } from "./content-management/homepage/HomepageValuesManager";
import { HomepageFeaturedManager } from "./content-management/homepage/HomepageFeaturedManager";

import type { HomepageSection, MediaAsset } from "@shared/schema";

export default function HomepageManagement() {
  const [activeTab, setActiveTab] = useState("hero");
  const [sections, setSections] = useState<HomepageSection[]>([]);

  // Data queries
  const { data: mediaResponse } = useQuery<{
    success: boolean;
    data: { data: MediaAsset[]; pagination: any };
  }>({
    queryKey: MediaQueryKeys.list,
  });
  const mediaAssets = mediaResponse?.data?.data || [];

  const { data: sectionsData } = useQuery<HomepageSection[]>({
    queryKey: ["/api/homepage-sections"],
  });

  useEffect(() => {
    if (sectionsData) {
      setSections(sectionsData);
    }
  }, [sectionsData]);

  // Mutation for toggling section visibility from Sidebar or Tabs
  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<HomepageSection> }) => {
      return await apiRequest(`/api/homepage-sections/${id}`, { method: "PATCH", body: data });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-sections"] });
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });
      toast({
        title: "Success",
        description: "Section updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update section",
        variant: "destructive",
      });
    },
  });

  // Sync URL hash with activeTab state on mount and hash changes
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "") || "hero";
      setActiveTab(hash);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, "", `#${value}`);
  };

  // Find specific section data
  const heroSection = sections?.find((s) => s.name === "hero");
  const slogansSection = sections?.find((s) => s.name === "slogans");
  const processSection = sections?.find((s) => s.name === "process");
  const animationsSection = sections?.find((s) => s.name === "animations");
  const statsSection = sections?.find((s) => s.name === "stats");
  const valuesSection = sections?.find((s) => s.name === "values");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Homepage Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="featured">Products</TabsTrigger>
          <TabsTrigger value="values">Values</TabsTrigger>
          <TabsTrigger value="process">Process</TabsTrigger>
          <TabsTrigger value="slogans">Slogans</TabsTrigger>
          <TabsTrigger value="animations">Anim</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <HomepageHeroManager
            mediaAssets={mediaAssets}
            sectionData={heroSection}
            onUpdateSection={(params) => updateSectionMutation.mutate(params)}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <HomepageStatsManager
            sectionData={statsSection}
            onUpdateSection={(params) => updateSectionMutation.mutate(params)}
          />
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <HomepageFeaturedManager />
        </TabsContent>

        <TabsContent value="values" className="space-y-4">
          <HomepageValuesManager
            sectionData={valuesSection}
            onUpdateSection={(params) => updateSectionMutation.mutate(params)}
          />
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <HomepageProcessManager
            sectionData={processSection}
            onUpdateSection={(params) => updateSectionMutation.mutate(params)}
          />
        </TabsContent>

        <TabsContent value="slogans" className="space-y-4">
          <HomepageSlogansManager
            sectionData={slogansSection}
            onUpdateSection={(params) => updateSectionMutation.mutate(params)}
          />
        </TabsContent>

        <TabsContent value="animations" className="space-y-4">
          <HomepageAnimationsManager
            sectionData={animationsSection}
            onUpdateSection={(params) => updateSectionMutation.mutate(params)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
