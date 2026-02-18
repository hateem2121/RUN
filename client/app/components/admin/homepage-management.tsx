import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminHomepageData } from "@/hooks/use-admin-homepage-data";
import { HomepageFeaturedTab } from "./homepage/HomepageFeaturedTab";
import { HomepageHeroTab } from "./homepage/HomepageHeroTab";
import { HomepageProcessCardsTab } from "./homepage/HomepageProcessCardsTab";
import { HomepageSectionsTab } from "./homepage/HomepageSectionsTab";
import { HomepageSlogansTab } from "./homepage/HomepageSlogansTab";

export function HomepageManagement() {
  const { isLoading, hero, slogans, sections, featuredSettings, processCards } =
    useAdminHomepageData();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Homepage Management</h2>
          <p className="text-muted-foreground">
            Manage all content sections displayed on the homepage.
          </p>
        </div>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hero">Hero</TabsTrigger>
          <TabsTrigger value="slogans">Slogans</TabsTrigger>
          <TabsTrigger value="process-cards">Process Cards</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="featured">Featured Products</TabsTrigger>
        </TabsList>

        <HomepageHeroTab hero={hero} />
        <HomepageSlogansTab slogans={slogans} />
        <HomepageProcessCardsTab cards={processCards} />
        <HomepageSectionsTab sections={sections} />
        <HomepageFeaturedTab settings={featuredSettings} />
      </Tabs>
    </div>
  );
}
