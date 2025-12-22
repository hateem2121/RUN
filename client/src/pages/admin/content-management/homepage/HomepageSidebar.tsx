import type { HomepageSection } from "@shared/schema";
import { GripVertical, Home, Layers, LayoutTemplate, Leaf, Sparkles, Type } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface HomepageSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  sections: HomepageSection[];
  onToggleVisibility: (sectionId: number, isActive: boolean) => void;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: <Home className="h-4 w-4" />,
  slogans: <Type className="h-4 w-4" />,
  process: <Layers className="h-4 w-4" />,
  animations: <Sparkles className="h-4 w-4" />,
  sustainability: <Leaf className="h-4 w-4" />,
  sections: <LayoutTemplate className="h-4 w-4" />,
};

export function HomepageSidebar({
  activeTab,
  onTabChange,
  sections,
  onToggleVisibility,
}: HomepageSidebarProps) {
  // Combine static tabs (that might not be in DB as "sections" yet or are special)
  // with DB sections. For this refactor, we'll iterate through a predefined list
  // that matches the original tabs, but check against DB sections for visibility status.

  // Note: 'hero', 'slogans', 'process' might not be in the 'homepage_sections' table
  // as rows in some implementations, but the prompt implies a "Sections" tab existed
  // that was a list of these.
  // However, based on the `HomepageManagement.tsx` file we saw, the tabs were hardcoded.
  // The `homepage_sections` table seems to hold "Dynamic Sections" + "Sustainability".

  const menuItems = [
    { key: "hero", label: "Hero Section", isDbSection: false },
    { key: "slogans", label: "Slogans", isDbSection: false },
    { key: "process", label: "Process Cards", isDbSection: false },
    { key: "animations", label: "Animations", isDbSection: false },
    // Sustainability IS a DB section (name='sustainability' usually),
    // so we try to find it in the sections list to control its visibility.
    { key: "sustainability", label: "Sustainability", isDbSection: true },
    // "sections" tab is being deprecated/repurposed, so we might list other dynamic sections here
  ];

  // Helper to find listing in DB sections
  const getSectionData = (key: string) => {
    return sections.find((s) => s.name.toLowerCase() === key.toLowerCase());
  };

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="px-4 py-2 border-b">
        <h2 className="font-semibold text-lg tracking-tight">Page Structure</h2>
        <p className="text-xs text-muted-foreground">Manage order & visibility</p>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {menuItems.map((item) => {
            const dbSection = item.isDbSection ? getSectionData(item.key) : null;
            const isActive = activeTab === item.key;

            return (
              <div
                key={item.key}
                className={cn(
                  "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "transparent",
                )}
              >
                <button
                  onClick={() => onTabChange(item.key)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="text-muted-foreground group-hover:text-foreground">
                    {SECTION_ICONS[item.key] || <LayoutTemplate className="h-4 w-4" />}
                  </span>
                  <span>{item.label}</span>
                </button>

                {/* Show toggle only if it maps to a DB section that controls visibility */}
                {dbSection && (
                  <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={dbSection.isActive ?? true} // Default to true if undefined
                      onCheckedChange={(val) => onToggleVisibility(dbSection.id, val)}
                      className="scale-75 data-[state=checked]:bg-primary"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Render other dynamic sections from DB that aren't explicitly in the menuItems above */}
          {sections
            .filter((s) => !menuItems.some((item) => item.key === s.name.toLowerCase()))
            .map((section) => {
              const isSelected = activeTab === `section-${section.id}`;
              return (
                <div
                  key={section.id}
                  className={cn(
                    "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
                    isSelected ? "bg-accent text-accent-foreground" : "transparent",
                  )}
                >
                  <button
                    onClick={() => onTabChange(`section-${section.id}`)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                    <span className="truncate max-w-[120px]" title={section.title || section.name}>
                      {section.title || section.name}
                    </span>
                  </button>

                  <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={section.isActive ?? true}
                      onCheckedChange={(val) => onToggleVisibility(section.id, val)}
                      className="scale-75"
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </ScrollArea>
    </div>
  );
}
