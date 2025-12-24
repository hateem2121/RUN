import { BarChart3, Clock, Image, Layout, MapPin, MessageSquare } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Lazy load tab components for bundle optimization
const AboutHeroTab = lazy(() =>
  import("@/components/admin/about-hero-tab").then((module) => ({ default: module.AboutHeroTab })),
);
const AboutTimelineTab = lazy(() =>
  import("@/components/admin/about-timeline-tab").then((module) => ({
    default: module.AboutTimelineTab,
  })),
);
const AboutLocationsTab = lazy(() =>
  import("@/components/admin/about-locations-tab").then((module) => ({
    default: module.AboutLocationsTab,
  })),
);
const AboutSectionsTab = lazy(() =>
  import("@/components/admin/about-sections-tab").then((module) => ({
    default: module.AboutSectionsTab,
  })),
);
const AboutStatisticsTab = lazy(() =>
  import("@/components/admin/about-statistics-tab").then((module) => ({
    default: module.AboutStatisticsTab,
  })),
);
const AboutTeamMessageTab = lazy(() =>
  import("@/components/admin/about-team-message-tab").then((module) => ({
    default: module.AboutTeamMessageTab,
  })),
);

export function AboutManagement() {
  const [activeTab, setActiveTab] = useState("hero");

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b">
        <h1 className="text-2xl font-bold">About Us Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage all content for your About Us page
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="px-6 py-4 border-b">
            <TabsList className="grid w-full grid-cols-6 max-w-4xl">
              <TabsTrigger value="hero" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Hero
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Locations
              </TabsTrigger>
              <TabsTrigger value="sections" className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Sections
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Team Message
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-6">
              <Suspense
                fallback={
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-64 w-full" />
                  </div>
                }
              >
                <TabsContent value="hero" className="mt-0">
                  <AboutHeroTab />
                </TabsContent>

                <TabsContent value="timeline" className="mt-0">
                  <AboutTimelineTab />
                </TabsContent>

                <TabsContent value="locations" className="mt-0">
                  <AboutLocationsTab />
                </TabsContent>

                <TabsContent value="sections" className="mt-0">
                  <AboutSectionsTab />
                </TabsContent>

                <TabsContent value="statistics" className="mt-0">
                  <AboutStatisticsTab />
                </TabsContent>

                <TabsContent value="team" className="mt-0">
                  <AboutTeamMessageTab />
                </TabsContent>
              </Suspense>
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
