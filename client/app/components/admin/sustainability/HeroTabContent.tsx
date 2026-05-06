import type { UnifiedSustainability } from "@shared/index";
import { Eye, EyeOff, Image as ImageIcon, LayoutTemplate, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface HeroTabContentProps {
  localForm: Partial<UnifiedSustainability>;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
  onSave: () => void;
  onOpenMediaPicker: () => void;
}

export function HeroTabContent({
  localForm,
  hasUnsavedChanges: _hasUnsavedChanges,
  isPending: _isPending,
  onLocalUpdate,
  onSave: _onSave,
  onOpenMediaPicker,
}: HeroTabContentProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <TabsContent value="hero" className="outline-none">
      <Card className="glass-premium p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Ecosystem Hero Section</h2>
            <p className="text-sm text-admin-muted">
              Configure the primary mission statement and high-impact visual assets
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="flex gap-2 text-xxs font-bold uppercase tracking-widest hover:bg-white/5 h-11 px-4"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>

        <div className={cn("grid gap-10", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
          <div className="space-y-8">
            <div className="space-y-2">
              <Label
                htmlFor="headline"
                className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
              >
                Primary Mission Headline
              </Label>
              <Input
                id="headline"
                value={localForm.headline || ""}
                onChange={(e) =>
                  onLocalUpdate({
                    headline: e.target.value,
                  })
                }
                className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20"
                placeholder="e.g., Pioneering Regenerative Sportswear"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="subheadline"
                className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
              >
                Manifesto Subheadline
              </Label>
              <Textarea
                id="subheadline"
                value={localForm.subheadline || ""}
                onChange={(e) =>
                  onLocalUpdate({
                    subheadline: e.target.value,
                  })
                }
                className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-emerald-500/50 placeholder:text-white/20 resize-none"
                placeholder="Articulate the sustaining vision behind the mission..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                Cinematic Background Asset
              </Label>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onOpenMediaPicker}
                  className="flex-1 bg-white/5 border-white/10 h-14 rounded-xl justify-start px-4 text-admin-muted hover:bg-white/10 hover:text-white transition-all border-0 shadow-none ring-offset-0 focus:ring-0"
                >
                  <ImageIcon className="mr-3 h-5 w-5 text-emerald-500" />
                  <span className="truncate">
                    {localForm.backgroundImageId
                      ? `Asset ID: ${localForm.backgroundImageId}`
                      : "Select Atmospheric Media"}
                  </span>
                </Button>
                {localForm.backgroundImageId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onLocalUpdate({ backgroundImageId: null })}
                    className="h-14 w-14 rounded-xl border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-admin-muted"
                  >
                    <Plus className="h-5 w-5 rotate-45" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="ctaText"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Action Trigger Text
                </Label>
                <Input
                  id="ctaText"
                  value={localForm.ctaText || ""}
                  onChange={(e) =>
                    onLocalUpdate({
                      ctaText: e.target.value,
                    })
                  }
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20"
                  placeholder="e.g., Explore Materials"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ctaLink"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Action Destination (URL)
                </Label>
                <Input
                  id="ctaLink"
                  value={localForm.ctaLink || ""}
                  onChange={(e) =>
                    onLocalUpdate({
                      ctaLink: e.target.value,
                    })
                  }
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20"
                  placeholder="e.g., /materials"
                />
              </div>
            </div>
          </div>

          {showPreview && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <LayoutTemplate className="h-4 w-4 text-emerald-400" />
                <span className="text-xxs font-bold text-emerald-400 uppercase tracking-widest">
                  Mobile Viewport Simulation
                </span>
              </div>
              <div className="aspect-[9/16] max-w-[300px] mx-auto rounded-huge border-[8px] border-white/10 bg-black overflow-hidden relative shadow-2xl ring-1 ring-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />
                <div className="absolute inset-0 z-0 bg-emerald-900/20 animate-pulse" />
                <div className="absolute bottom-10 left-6 right-6 z-20 space-y-4">
                  <h3 className="text-2xl font-bold text-white leading-tight">
                    {localForm.headline || "Pioneering Vision"}
                  </h3>
                  <p className="text-xs text-white/60 line-clamp-3">
                    {localForm.subheadline || "The future of sportswear is circular."}
                  </p>
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-10 rounded-full text-xxs uppercase tracking-widest">
                    {localForm.ctaText || "Take Action"}
                  </Button>
                </div>
              </div>
              <p className="text-xxs text-center text-admin-muted italic">
                Simulated mobile rendering showing typography and action placement.
              </p>
            </div>
          )}
        </div>
      </Card>
    </TabsContent>
  );
}
