import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Layout,
  Link as LinkIcon,
  Monitor,
  MousePointerClick,
  Rocket,
  Save,
  X,
  Zap,
} from "lucide-react";
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Types
interface CtaFormData {
  headline: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  benefits: string[];
  isActive: boolean;
}

interface TechnologyCta {
  id: number;
  headline: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  benefits: string[];
  isActive?: boolean;
}

interface LegacyTechnologyCta {
  title?: string;
  ctaText?: string;
  ctaLink?: string;
}

type ExtendedTechnologyCta = TechnologyCta & LegacyTechnologyCta;

export function TechnologyCtaManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [ctaForm, setCtaForm] = useState<CtaFormData>({
    headline: "",
    content: "",
    buttonText: "",
    buttonLink: "",
    benefits: [],
    isActive: true,
  });

  const [newBenefit, setNewBenefit] = useState("");

  // Queries and Mutations
  const { data: ctaData, isLoading } = useQuery<TechnologyCta>({
    queryKey: ["/api/technology-cta"],
  });

  const updateCtaMutation = useMutation({
    mutationFn: (data: CtaFormData) =>
      apiRequest("/api/technology-cta", {
        method: "PATCH",
        body: JSON.stringify({
          title: data.headline,
          content: data.content,
          ctaText: data.buttonText,
          ctaLink: data.buttonLink,
          benefits: data.benefits,
          isActive: data.isActive,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-cta"] });
      toast({
        title: "Success",
        description: "CTA section updated successfully",
      });
    },
  });

  // Set initial data when CTA loads
  React.useEffect(() => {
    if (ctaData) {
      const legacyData = ctaData as ExtendedTechnologyCta;
      setCtaForm({
        headline: legacyData.title || ctaData.headline || "",
        content: ctaData.content || "",
        buttonText: legacyData.ctaText || ctaData.buttonText || "",
        buttonLink: legacyData.ctaLink || ctaData.buttonLink || "",
        benefits: ctaData.benefits || [],
        isActive: ctaData.isActive ?? true,
      });
    }
  }, [ctaData]);

  // Event Handlers
  const handleCtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCtaMutation.mutate(ctaForm);
  };

  const handleAddBenefit = () => {
    if (newBenefit.trim()) {
      setCtaForm((prev) => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()],
      }));
      setNewBenefit("");
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setCtaForm((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Panel */}
      <div className="sticky top-0 z-30 -mx-4 mb-4 flex flex-col gap-6 border-b border-white/10 bg-surface-black/80 p-6 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
              CTA <span className="text-[#00D4FF]">Configuration</span>
            </h2>
            <p className="text-admin-foreground/60 text-sm font-medium tracking-wide italic">
              Final conversion point for technology solutions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleCtaSubmit}
              disabled={updateCtaMutation.isPending}
              className="group h-11 border-none bg-[#00D4FF] px-8 font-bold text-[#0A0A0A] transition-all hover:bg-[#00D4FF]/90 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] active:scale-95 disabled:bg-[#00D4FF]/50"
            >
              <Save className="mr-2 h-5 w-5" />
              {updateCtaMutation.isPending ? "SYNCHRONIZING..." : "SAVE CHANGES"}
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-[200px] w-full animate-pulse rounded-2xl bg-white/[0.02]" />
          <div className="h-[400px] w-full animate-pulse rounded-2xl bg-white/[0.02]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Primary Configuration */}
          <div className="space-y-8 lg:col-span-8">
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#00D4FF]/10 text-[#00D4FF] ring-1 ring-[#00D4FF]/20 shadow-[0_0_20px_rgba(0,212,255,0.1)]">
                  <Rocket className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight italic">
                    Content & Headline
                  </h3>
                  <p className="text-xs font-medium text-admin-muted">
                    Define the primary value proposition
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xxs font-black uppercase tracking-[0.2em] text-admin-muted">
                    Primary Headline
                  </Label>
                  <Input
                    value={ctaForm.headline}
                    onChange={(e) => setCtaForm((prev) => ({ ...prev, headline: e.target.value }))}
                    className="h-14 border-white/5 bg-white/[0.03] text-lg font-bold text-white focus:border-[#00D4FF]/40"
                    placeholder="Get Started Today..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xxs font-black uppercase tracking-[0.2em] text-admin-muted">
                    Supporting Content
                  </Label>
                  <Textarea
                    value={ctaForm.content}
                    onChange={(e) => setCtaForm((prev) => ({ ...prev, content: e.target.value }))}
                    className="h-[200px] resize-none border-white/5 bg-white/[0.03] text-admin-foreground focus:border-[#00D4FF]/40"
                    placeholder="Describe the solution in detail..."
                  />
                </div>
              </div>
            </div>

            {/* Action Layer */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
                  <MousePointerClick className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight italic">
                    Action Triggers
                  </h3>
                  <p className="text-xs font-medium text-admin-muted">
                    Configure buttons and landing paths
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xxs font-black uppercase tracking-[0.2em] text-admin-muted">
                    Button Descriptor
                  </Label>
                  <Input
                    value={ctaForm.buttonText}
                    onChange={(e) =>
                      setCtaForm((prev) => ({ ...prev, buttonText: e.target.value }))
                    }
                    className="h-12 border-white/5 bg-white/[0.03] text-white focus:border-[#00D4FF]/40"
                    placeholder="Contact Us..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xxs font-black uppercase tracking-[0.2em] text-admin-muted">
                    Destination Link
                  </Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
                    <Input
                      value={ctaForm.buttonLink}
                      onChange={(e) =>
                        setCtaForm((prev) => ({ ...prev, buttonLink: e.target.value }))
                      }
                      className="h-12 border-white/5 bg-white/[0.03] pl-10 text-[#00D4FF] focus:border-[#00D4FF]/40"
                      placeholder="/contact..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Multi-Benefits & Status */}
          <div className="space-y-8 lg:col-span-4">
            {/* Status Section */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-admin-muted">
                  Ecosystem Status
                </h3>
                <Badge
                  className={
                    ctaForm.isActive ? "bg-[#00D4FF] text-[#0A0A0A]" : "bg-white/5 text-admin-muted"
                  }
                >
                  {ctaForm.isActive ? "LIVE" : "DRAFT"}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-4 ring-1 ring-white/5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full animate-pulse",
                      ctaForm.isActive ? "bg-[#00D4FF]" : "bg-white/20",
                    )}
                  />
                  <span className="text-sm font-bold text-admin-foreground">Public Visibility</span>
                </div>
                <Switch
                  checked={ctaForm.isActive}
                  onCheckedChange={(checked) =>
                    setCtaForm((prev) => ({ ...prev, isActive: checked }))
                  }
                  className="data-[state=checked]:bg-[#00D4FF]"
                />
              </div>
            </div>

            {/* Benefits Ecosystem */}
            <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl">
              <div className="mb-6 space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">
                  Solution Benefits
                </h3>
                <p className="text-xs text-admin-muted">Key takeaways for B2B manufacturers</p>
              </div>

              <div className="mb-6 space-y-3">
                {ctaForm.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5 transition-all hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[#00D4FF]/60" />
                      <span className="text-sm text-admin-foreground/80">{benefit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(index)}
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      title="Remove Benefit"
                      aria-label="Remove Benefit"
                    >
                      <X className="h-4 w-4 text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Define new benefit..."
                  className="border-white/5 bg-white/[0.03] text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddBenefit();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddBenefit}
                  disabled={!newBenefit.trim()}
                  className="w-full bg-[#E3DFD6]/10 text-admin-foreground hover:bg-[#E3DFD6]/20"
                >
                  ADD BENEFIT VECTOR
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats - Engagement Dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#00D4FF]/10 text-[#00D4FF]">
            <Zap className="h-5 w-5" />
          </div>
          <div className="text-2xl font-black text-white">4.2%</div>
          <div className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            Avg. CTR
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
            <Monitor className="h-5 w-5" />
          </div>
          <div className="text-2xl font-black text-white">12.5k</div>
          <div className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            Total Impressions
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
            <Layout className="h-5 w-5" />
          </div>
          <div className="text-2xl font-black text-white">A/B</div>
          <div className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            Test Variant
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
            <Clock className="h-5 w-5" />
          </div>
          <div className="text-2xl font-black text-white">320ms</div>
          <div className="text-xs font-bold uppercase tracking-wider text-admin-muted">
            Avg. Interaction Time
          </div>
        </div>
      </div>
    </div>
  );
}
