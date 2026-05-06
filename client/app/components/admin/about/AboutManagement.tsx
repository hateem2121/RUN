import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AboutHeroTab } from "./about-hero-tab";
import { AboutLocationsTab } from "./about-locations-tab";
import { AboutSectionsTab } from "./about-sections-tab";
import { AboutStatisticsTab } from "./about-statistics-tab";
import { AboutTeamMessageTab } from "./about-team-message-tab";
import { AboutTimelineTab } from "./about-timeline-tab";

export function AboutManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">About page Management</h1>
          <p className="text-admin-muted">
            Manage the content, locations, and statistics displayed on the About page.
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="hero"
        className="fade-in-50 slide-in-from-bottom-4 animate-in space-y-4 duration-500"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="team">Team Message</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="sections">Content Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="space-y-4">
          <ErrorBoundary componentName="About Hero Tab">
            <AboutHeroTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <ErrorBoundary componentName="About Statistics Tab">
            <AboutStatisticsTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <ErrorBoundary componentName="About Timeline Tab">
            <AboutTimelineTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <ErrorBoundary componentName="About Team Message Tab">
            <AboutTeamMessageTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <ErrorBoundary componentName="About Locations Tab">
            <AboutLocationsTab />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <ErrorBoundary componentName="About Sections Tab">
            <AboutSectionsTab />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}
