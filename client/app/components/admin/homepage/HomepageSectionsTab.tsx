import type { HomepageSection } from "@shared/index";
import { Edit, LayoutTemplate } from "lucide-react";
import { useState } from "react";
import { GlassCard } from "@/components/admin/shared/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminHomepageMutations } from "@/hooks/use-admin-homepage-mutations";

interface HomepageSectionsTabProps {
  sections: HomepageSection[];
}

export function HomepageSectionsTab({ sections }: HomepageSectionsTabProps) {
  const { updateSection } = useAdminHomepageMutations();
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);

  // Helper to get friendly name
  const getFriendlyName = (name: string) => {
    return name
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <TabsContent value="sections" className="mt-0 focus-visible:outline-none outline-none">
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <LayoutTemplate className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Content Regions</h2>
                <p className="text-sm text-admin-muted">
                  Manage content blocks across the global storefront.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {getFriendlyName(section.name)}
                    </h3>
                    <div className="px-2 py-0.5 rounded bg-black/40 border border-white/10 text-xxs font-bold tracking-widest uppercase text-admin-muted">
                      {section.name}
                    </div>
                  </div>
                  <p className="text-sm text-admin-muted line-clamp-2 pr-8">
                    {section.content || "No content defined."}
                  </p>
                </div>

                <div className="flex items-center gap-6 self-stretch sm:self-auto border-t border-white/5 sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto mt-4 sm:mt-0">
                  <div className="flex items-center gap-3 mr-auto sm:mr-4 pr-4 border-r border-white/5">
                    <Switch
                      checked={section.isActive ?? true}
                      onCheckedChange={(checked) =>
                        updateSection.mutate({ id: section.id, data: { isActive: checked } })
                      }
                      className="data-custom-misc-40:bg-blue-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
                        Status
                      </span>
                      <span
                        className={`text-sm font-medium ${section.isActive ? "text-white" : "text-admin-muted"}`}
                      >
                        {section.isActive ? "Broadcasting" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setEditingSection(section)}
                    className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl"
                  >
                    <Edit className="mr-2 h-4 w-4 text-blue-400" /> Modify Region
                  </Button>
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <div className="py-16 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <LayoutTemplate className="h-10 w-10 text-admin-muted mb-4 opacity-50" />
                <p className="text-white font-medium mb-1">No Regions Found</p>
                <p className="text-sm text-admin-muted max-w-sm text-center">
                  Content regions are typically pre-seeded by the system.
                </p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Edit Dialog */}
        {editingSection && (
          <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
            <DialogContent className="max-w-2xl bg-surface-black border-white/10 text-white">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <LayoutTemplate className="h-4 w-4 text-blue-400" />
                  </div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Modify {getFriendlyName(editingSection.name)}
                  </DialogTitle>
                </div>
                <DialogDescription className="text-admin-muted">
                  Update the localized content payload for this structural region.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-content"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Region Payload
                  </Label>
                  <Textarea
                    id="edit-content"
                    className="min-h-custom-space-28 bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 resize-none font-mono text-sm leading-relaxed"
                    value={editingSection.content || ""}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, content: e.target.value })
                    }
                  />
                  <p className="text-xxs text-admin-muted mt-2 ml-1">
                    Supports plain text content depending on the region's rendering structure.
                  </p>
                </div>
              </div>
              <DialogFooter className="border-t border-white/10 pt-4 mt-2">
                <Button
                  onClick={() => {
                    updateSection.mutate({
                      id: editingSection.id,
                      data: { content: editingSection.content },
                    });
                    setEditingSection(null);
                  }}
                  disabled={updateSection.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                >
                  Confirm Modification
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TabsContent>
  );
}
