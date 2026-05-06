import type { UnifiedSustainability } from "@shared/index";
import {
  Eye,
  LayoutTemplate,
  Link as LinkIcon,
  MousePointerClick,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CallToActionTabContentProps {
  localForm: Partial<UnifiedSustainability>;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
  onSave: () => void;
}

export function CallToActionTabContent({
  localForm,
  hasUnsavedChanges,
  isPending,
  onLocalUpdate,
  onSave,
}: CallToActionTabContentProps) {
  const [showCTAPreview, setShowCTAPreview] = useState(false);

  return (
    <TabsContent value="cta" className="outline-none">
      <Card className="glass-premium p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Ecosystem Conversion</h2>
            <p className="text-sm text-admin-muted">
              Configure the final call-to-action to bridge the gap between awareness and active
              partnership
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowCTAPreview(true)}
              className="h-11 px-6 rounded-xl text-admin-muted hover:bg-white/5 font-bold uppercase text-xxs tracking-widest border border-white/5"
            >
              <Eye className="mr-2 h-4 w-4" />
              Live Preview
            </Button>
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
              Sync Engagement
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="callToActionTitle"
                className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
              >
                Conversion Headline
              </Label>
              <Input
                id="callToActionTitle"
                value={localForm.callToActionTitle || ""}
                onChange={(e) => onLocalUpdate({ callToActionTitle: e.target.value })}
                placeholder="e.g., Engineer Your Sustainable Future"
                className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="callToActionDescription"
                className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
              >
                Strategic Narrative
              </Label>
              <Textarea
                id="callToActionDescription"
                value={localForm.callToActionDescription || ""}
                onChange={(e) => onLocalUpdate({ callToActionDescription: e.target.value })}
                placeholder="Articulate the final value proposition and invitation to engage..."
                rows={4}
                className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-emerald-500/50 placeholder:text-white/20 resize-none"
              />
            </div>
          </div>

          <div className="space-y-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 border-dashed">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="callToActionButtonText"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Interactive Label
                </Label>
                <div className="relative">
                  <MousePointerClick className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-emerald-400" />
                  <Input
                    id="callToActionButtonText"
                    value={localForm.callToActionButtonText || ""}
                    onChange={(e) => onLocalUpdate({ callToActionButtonText: e.target.value })}
                    placeholder="e.g., Consult with Experts"
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 pl-12 focus:ring-emerald-500/50 placeholder:text-white/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="callToActionButtonLink"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Destination Protocol (URL)
                </Label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-emerald-400" />
                  <Input
                    id="callToActionButtonLink"
                    value={localForm.callToActionButtonLink || ""}
                    onChange={(e) => onLocalUpdate({ callToActionButtonLink: e.target.value })}
                    placeholder="e.g., /contact"
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 pl-12 focus:ring-emerald-500/50 placeholder:text-white/20 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-3 text-emerald-400" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                  UX Recommendation
                </span>
              </div>
              <p className="text-xxs text-admin-muted leading-relaxed">
                Ensure the button text is concise and action-oriented. Linking to a contact form or
                detailed sustainability report yields the highest B2B conversion rate.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* CTA Preview Modal */}
      <Dialog open={showCTAPreview} onOpenChange={setShowCTAPreview}>
        <DialogContent
          contentType="form"
          className="max-w-md bg-surface-black border-white/10 p-0 overflow-hidden rounded-huge shadow-2xl ring-1 ring-white/10"
        >
          <DialogHeader className="p-8 pb-4">
            <div className="items-center gap-2 mb-2 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 inline-flex w-fit mx-auto">
              <LayoutTemplate className="h-4 w-4 text-emerald-400" />
              <span className="text-xxs font-bold text-emerald-400 uppercase tracking-widest">
                Experience Simulation
              </span>
            </div>
            <DialogTitle className="text-xl font-bold text-white tracking-tight text-center">
              Engagement Preview
            </DialogTitle>
          </DialogHeader>

          <div className="px-8 pb-8 flex justify-center">
            <div className="aspect-[16/9] w-full rounded-huge border-[8px] border-white/10 bg-black overflow-hidden relative shadow-2xl ring-1 ring-white/5 p-8 flex flex-col items-center justify-center text-center">
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-black z-0" />

              <div className="relative z-10 space-y-4 max-w-[320px]">
                <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
                  {localForm.callToActionTitle || "Join the Future"}
                </h3>
                <p className="text-xxs text-white/50 leading-relaxed max-w-[280px] mx-auto">
                  {localForm.callToActionDescription ||
                    "Partner with us to redefine the environmental standards of global manufacturing."}
                </p>
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 rounded-full text-white text-xxs font-bold uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20">
                    {localForm.callToActionButtonText || "Get Started"}
                    <Send className="size-3 ml-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 border-0">
            <Button
              onClick={() => setShowCTAPreview(false)}
              className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-white font-bold uppercase text-xxs tracking-widest hover:bg-white/10"
            >
              Terminate Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TabsContent>
  );
}
