import {
  Bell,
  Home,
  LayoutTemplate,
  ListOrdered,
  Loader2,
  MessageSquare,
  MonitorPlay,
  Search,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminHomepageData } from "@/hooks/use-admin-homepage-data";
import { cn } from "@/lib/utils";
import { HomepageFeaturedTab } from "./HomepageFeaturedTab";
import { HomepageHeroTab } from "./HomepageHeroTab";
import { HomepageProcessCardsTab } from "./HomepageProcessCardsTab";
import { HomepageSectionsTab } from "./HomepageSectionsTab";
import { HomepageSlogansTab } from "./HomepageSlogansTab";

export function HomepageManagement() {
  const { isLoading, hero, slogans, sections, featuredSettings, processCards } =
    useAdminHomepageData();

  const getTabFromUrl = useCallback(() => {
    if (typeof window === "undefined") return "hero";
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("tab") || "hero";
  }, []);

  const [activeTab, setActiveTab] = useState(getTabFromUrl);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("tab", value);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, "", newUrl);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [getTabFromUrl]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Premium Sticky Header AI-Standard */}
      <div className="z-10 sticky top-0 -mx-6 mb-6 flex items-center justify-between border-b border-white/5 bg-black/60 px-6 py-5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-blue-glow">
            <Home className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Homepage Orchestration</h1>
            <p className="text-sm text-admin-muted">
              Managing global storefront, narrative sections, and featured experiences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-admin-muted group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              placeholder="Search content..."
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-64 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              aria-label="Action button"
              type="button"
              title="Notifications"
              className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-admin-muted hover:bg-white/10 hover:text-white transition-all"
            >
              <Bell className="size-5" />
            </button>
            <div className="h-10 w-px bg-white/10 mx-2" />
            <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2">
              <div className="size-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xxs font-black text-green-500 uppercase tracking-widest">
                Modular Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
        <TabsList className="flex h-auto w-full flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md">
          {[
            { id: "hero", label: "Hero Experience", icon: MonitorPlay },
            { id: "slogans", label: "Strategic Slogans", icon: MessageSquare },
            { id: "process-cards", label: "Process Flow", icon: ListOrdered },
            { id: "sections", label: "Narrative Sections", icon: LayoutTemplate },
            { id: "featured", label: "Featured Curation", icon: Star },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-4 text-xxs sm:text-xs font-bold uppercase tracking-widest transition-all rounded-xl",
                "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(37,99,235,0.3)]",
                "text-admin-muted hover:text-white hover:bg-white/5",
              )}
            >
              <tab.icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8">
          <HomepageHeroTab hero={hero} />
          <HomepageSlogansTab slogans={slogans} />
          <HomepageProcessCardsTab cards={processCards} />
          <HomepageSectionsTab sections={sections} />
          <HomepageFeaturedTab settings={featuredSettings} />
        </div>
      </Tabs>
    </div>
  );
}
