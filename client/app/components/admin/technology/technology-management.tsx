import { BarChart3, Beaker, Bell, Box, Cpu, Rocket, Search, Settings, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TechnologyCtaManagement } from "@/components/admin/technology/TechnologyCtaManagement";
import { TechnologyEquipmentManagement } from "@/components/admin/technology/TechnologyEquipmentManagement";
import { TechnologyHeroManagement } from "@/components/admin/technology/TechnologyHeroManagement";
import { TechnologyInnovationManagement } from "@/components/admin/technology/TechnologyInnovationManagement";
import { TechnologyResearchManagement } from "@/components/admin/technology/TechnologyResearchManagement";
import { TechnologyRoadmapManagement } from "@/components/admin/technology/TechnologyRoadmapManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTechnologyFeatureFlags } from "@/hooks/useTechnologyFeatureFlags";
import { cn } from "@/lib/utils";

/**
 * PHASE 5: TECHNOLOGY MANAGEMENT - STITCH DESIGN SYSTEM REFACTOR
 *
 * Re-architecting the technology module with Cyan (#00D4FF) accents,
 * premium glassmorphism, and hardware-accelerated micro-animations.
 */
export function TechnologyManagement() {
  const featureFlags = useTechnologyFeatureFlags();

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

  // If modular components are disabled, show fallback message
  if (!featureFlags.useModularTechnologyComponents) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="size-6 text-amber-500" />
            <h2 className="font-bold text-xl text-amber-500 tracking-tight">
              Technology Management - Legacy Mode
            </h2>
          </div>
          <p className="text-admin-muted leading-relaxed">
            Modular technology components are currently disabled. Please enable the modular
            components feature flag to access the high-performance cyan-themed interface.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Premium Sticky Header AI-Standard */}
      <div className="z-10 sticky top-0 -mx-6 mb-6 flex items-center justify-between border-b border-white/5 bg-black/60 px-6 py-5 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.1)]">
            <Cpu className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Technology Orchestration
            </h1>
            <p className="text-sm text-admin-muted">
              Managing innovation lifecycles, R&D assets, and strategic roadmaps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative group hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-admin-muted group-focus-within:text-cyan-400 transition-colors" />
            <input
              type="text"
              placeholder="Search tech stack..."
              className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 w-64 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-admin-muted hover:bg-white/10 hover:text-white transition-all"
              title="Notifications"
              aria-label="Notifications"
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
            { id: "hero", label: "Hero Center", icon: Zap },
            { id: "innovations", label: "Innovations", icon: Rocket },
            { id: "equipment", label: "Hardware", icon: Box },
            { id: "research", label: "Lab R&D", icon: Beaker },
            { id: "roadmap", label: "Roadmap", icon: BarChart3 },
            { id: "cta", label: "Deployment", icon: Zap },
          ].map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-4 text-xxs sm:text-xs font-bold uppercase tracking-widest transition-all rounded-xl",
                "data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(8,145,178,0.3)]",
                "text-admin-muted hover:text-white hover:bg-white/5",
              )}
            >
              <tab.icon className="size-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-8">
          <TabsContent value="hero" className="mt-0 focus-visible:outline-none outline-none">
            <TechnologyHeroManagement />
          </TabsContent>

          <TabsContent value="innovations" className="mt-0 focus-visible:outline-none outline-none">
            <TechnologyInnovationManagement />
          </TabsContent>

          <TabsContent value="equipment" className="mt-0 focus-visible:outline-none outline-none">
            <TechnologyEquipmentManagement />
          </TabsContent>

          <TabsContent value="research" className="mt-0 focus-visible:outline-none outline-none">
            <TechnologyResearchManagement />
          </TabsContent>

          <TabsContent value="roadmap" className="mt-0 focus-visible:outline-none outline-none">
            <TechnologyRoadmapManagement />
          </TabsContent>

          <TabsContent value="cta" className="mt-0 focus-visible:outline-none outline-none">
            <TechnologyCtaManagement />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
