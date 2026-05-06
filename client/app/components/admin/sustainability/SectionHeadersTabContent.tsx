import type { UnifiedSustainability } from "@shared/index";
import { Award, Info, Leaf, Save, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface SectionHeadersTabContentProps {
  localForm: Partial<UnifiedSustainability>;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
  onSave: () => void;
}

export function SectionHeadersTabContent({
  localForm,
  hasUnsavedChanges,
  isPending,
  onLocalUpdate,
  onSave,
}: SectionHeadersTabContentProps) {
  return (
    <TabsContent value="headers" className="outline-none">
      <Card className="glass-premium p-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Global Section Headers</h2>
            <p className="text-sm text-admin-muted">
              Sovereign narrative control for sustainability module headlines and subheadlines
            </p>
          </div>
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isPending}
            className={cn(
              "font-bold uppercase text-xxs tracking-widest h-11 px-6 rounded-xl transition-all active:scale-95 shadow-lg",
              hasUnsavedChanges
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                : "bg-white/5 text-admin-muted border border-white/10 cursor-not-allowed",
            )}
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Sync Narrative
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Metrics Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="size-4" />
              </div>
              <h3 className="text-xxs font-bold text-white uppercase tracking-[0.2em]">
                Impact Metrics Section
              </h3>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative group">
              <div className="space-y-2">
                <Label
                  htmlFor="metricsTitle"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Primary Headline
                </Label>
                <Input
                  id="metricsTitle"
                  value={localForm.metricsTitle || ""}
                  onChange={(e) => onLocalUpdate({ metricsTitle: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50"
                  placeholder="e.g., Real-Time Environmental Impact"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="metricsDescription"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Supporting Narrative
                </Label>
                <Textarea
                  id="metricsDescription"
                  value={localForm.metricsDescription || ""}
                  onChange={(e) => onLocalUpdate({ metricsDescription: e.target.value })}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-500/50 resize-none min-h-[100px]"
                  placeholder="Elaborate on your impact measurement methodology..."
                />
              </div>
            </div>
          </div>

          {/* Initiatives Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Leaf className="size-4" />
              </div>
              <h3 className="text-xxs font-bold text-white uppercase tracking-[0.2em]">
                Active Initiatives Section
              </h3>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative group">
              <div className="space-y-2">
                <Label
                  htmlFor="initiativesTitle"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Primary Headline
                </Label>
                <Input
                  id="initiativesTitle"
                  value={localForm.initiativesTitle || ""}
                  onChange={(e) => onLocalUpdate({ initiativesTitle: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50"
                  placeholder="e.g., Regenerative Ecosystem Protocols"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="initiativesDescription"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Supporting Narrative
                </Label>
                <Textarea
                  id="initiativesDescription"
                  value={localForm.initiativesDescription || ""}
                  onChange={(e) => onLocalUpdate({ initiativesDescription: e.target.value })}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-500/50 resize-none min-h-[100px]"
                  placeholder="Explain the strategy behind your active sustainability programs..."
                />
              </div>
            </div>
          </div>

          {/* Certifications Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award className="size-4" />
              </div>
              <h3 className="text-xxs font-bold text-white uppercase tracking-[0.2em]">
                Compliance Section
              </h3>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative group">
              <div className="space-y-2">
                <Label
                  htmlFor="certificationsTitle"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Primary Headline
                </Label>
                <Input
                  id="certificationsTitle"
                  value={localForm.certificationsTitle || ""}
                  onChange={(e) => onLocalUpdate({ certificationsTitle: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50"
                  placeholder="e.g., Global Compliance Standards"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="certificationsDescription"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Supporting Narrative
                </Label>
                <Textarea
                  id="certificationsDescription"
                  value={localForm.certificationsDescription || ""}
                  onChange={(e) => onLocalUpdate({ certificationsDescription: e.target.value })}
                  rows={2}
                  className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-500/50 resize-none min-h-[80px]"
                  placeholder="Detail the significance of your global certifications..."
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="certificationsFooterNote"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Compliance Legal Note
                </Label>
                <Textarea
                  id="certificationsFooterNote"
                  value={localForm.certificationsFooterNote || ""}
                  onChange={(e) => onLocalUpdate({ certificationsFooterNote: e.target.value })}
                  rows={2}
                  className="bg-white/5 border-white/10 text-admin-muted rounded-xl focus:ring-emerald-500/50 resize-none min-h-[80px] text-xs"
                  placeholder="Additional context on validity or auditing bodies..."
                />
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Target className="size-4" />
              </div>
              <h3 className="text-xxs font-bold text-white uppercase tracking-[0.2em]">
                Mission Goals Section
              </h3>
            </div>

            <div className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative group">
              <div className="space-y-2">
                <Label
                  htmlFor="goalsTitle"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Primary Headline
                </Label>
                <Input
                  id="goalsTitle"
                  value={localForm.goalsTitle || ""}
                  onChange={(e) => onLocalUpdate({ goalsTitle: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50"
                  placeholder="e.g., Strategic Environmental Objectives"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="goalsDescription"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Supporting Narrative
                </Label>
                <Textarea
                  id="goalsDescription"
                  value={localForm.goalsDescription || ""}
                  onChange={(e) => onLocalUpdate({ goalsDescription: e.target.value })}
                  rows={3}
                  className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-500/50 resize-none min-h-[100px]"
                  placeholder="Detail your roadmap for long-term sustainability..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
          <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/20">
            <Info className="size-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-white tracking-tight">
              Narrative Synchronization
            </h4>
            <p className="text-xs text-admin-muted leading-relaxed">
              These headers govern the tone and authority of their respective sections. Changing
              them will update the live public sustainability page immediately upon sync.
            </p>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}
