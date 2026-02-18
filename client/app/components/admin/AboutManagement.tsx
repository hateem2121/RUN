import { AboutHeroTab } from "@/components/admin/about-hero-tab";
import { AboutLocationsTab } from "@/components/admin/about-locations-tab";
import { AboutSectionsTab } from "@/components/admin/about-sections-tab";
import { AboutStatisticsTab } from "@/components/admin/about-statistics-tab";
import { AboutTeamMessageTab } from "@/components/admin/about-team-message-tab";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AboutManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">About page Management</h1>
          <p className="text-muted-foreground">
            Manage the content, locations, and statistics displayed on the About page.
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="hero"
        className="fade-in-50 slide-in-from-bottom-4 animate-in space-y-4 duration-500"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
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
