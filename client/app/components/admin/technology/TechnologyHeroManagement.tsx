import type { MediaAsset } from "@shared/index";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  Globe,
  Image as ImageIcon,
  LayoutTemplate,
  Plus,
  Save,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

// Types
interface HeroFormData {
  title: string;
  subtitle: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  backgroundMediaId: number | null;
  isActive: boolean;
}

interface TechnologyHero {
  id: number;
  title: string;
  subtitle: string;
  description?: string | undefined;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText?: string | undefined;
  secondaryButtonLink?: string | undefined;
  backgroundMediaId?: number | null;
  isActive?: boolean | undefined;
}

interface TechnologyHeroManagementProps {
  isLoading?: boolean | undefined;
}

export function TechnologyHeroManagement({
  isLoading: externalLoading,
}: TechnologyHeroManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [showHeroBackgroundPicker, setShowHeroBackgroundPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [heroData, setHeroData] = useState<HeroFormData>({
    title: "",
    subtitle: "",
    description: "",
    primaryButtonText: "",
    primaryButtonLink: "",
    secondaryButtonText: "",
    secondaryButtonLink: "",
    backgroundMediaId: null,
    isActive: true,
  });

  // Queries and Mutations
  const { data: hero, isPending: heroLoading } = useQuery<TechnologyHero>({
    queryKey: ["/api/technology-hero"],
  });

  const { data: mediaAssets = [] } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media-assets"],
  });

  const updateHeroMutation = useMutation({
    mutationFn: (data: HeroFormData) =>
      apiRequest("/api/technology-hero", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-hero"] });
      setHasChanges(false);
      toast({
        title: "Configuration Synchronized",
        description: "Technology hero protocols have been updated across the ecosystem.",
      });
    },
  });

  // Event Handlers
  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeroMutation.mutate(heroData);
  };

  const handleInputChange = (updates: Partial<HeroFormData>) => {
    setHeroData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Set initial data when hero loads
  useEffect(() => {
    if (hero) {
      setHeroData({
        title: hero.title || "",
        subtitle: hero.subtitle || "",
        description: hero.description || "",
        primaryButtonText: hero.primaryButtonText || "",
        primaryButtonLink: hero.primaryButtonLink || "",
        secondaryButtonText: hero.secondaryButtonText || "",
        secondaryButtonLink: hero.secondaryButtonLink || "",
        backgroundMediaId: hero.backgroundMediaId || null,
        isActive: hero.isActive ?? true,
      });
      setHasChanges(false);
    }
  }, [hero]);

  const selectedBackgroundMedia = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === heroData.backgroundMediaId)
    : null;

  const loading = externalLoading || heroLoading;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="flex space-x-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-500 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-500"></div>
        </div>
        <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
          Calibrating Hero Systems...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="glass-premium">
        <CardContent className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Globe className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Tech-Hero Infrastructure
                </h2>
                <p className="text-sm text-admin-muted">
                  Configure high-impact visual narratives and primary action triggers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex gap-2 text-xxs font-bold uppercase tracking-widest hover:bg-white/5 h-11 px-4"
                title={showPreview ? "Hide Preview" : "Show Preview"}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
              <Button
                onClick={handleHeroSubmit}
                disabled={!hasChanges || updateHeroMutation.isPending}
                className="h-11 bg-cyan-600 hover:bg-cyan-700 text-white px-8 font-bold uppercase text-xxs tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all outline-none border-0"
              >
                {updateHeroMutation.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {updateHeroMutation.isPending ? "Syncing..." : "Sync Hero"}
              </Button>
            </div>
          </div>

          <div className={cn("grid gap-10", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Primary Innovation Headline
                  </Label>
                  <Input
                    id="title"
                    value={heroData.title}
                    onChange={(e) => handleInputChange({ title: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-cyan-500/50 placeholder:text-white/20"
                    placeholder="e.g., The Future of Textile Engineering"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="subtitle"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Strategic Subheader
                  </Label>
                  <Input
                    id="subtitle"
                    value={heroData.subtitle}
                    onChange={(e) => handleInputChange({ subtitle: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-cyan-500/50 placeholder:text-white/20"
                    placeholder="e.g., Empowering Global Brands"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Technical Manifesto
                </Label>
                <Textarea
                  id="description"
                  value={heroData.description}
                  onChange={(e) => handleInputChange({ description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px] focus:ring-cyan-500/50 placeholder:text-white/20 resize-none"
                  placeholder="Detail the technological impact and mission parameters..."
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Zap className="size-3 text-cyan-400" /> Action Protocols
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="gap-6 grid">
                    <div className="space-y-2">
                      <Label
                        htmlFor="primaryButtonText"
                        className="text-xxs font-bold text-admin-muted uppercase tracking-widest"
                      >
                        Primary Action
                      </Label>
                      <Input
                        id="primaryButtonText"
                        value={heroData.primaryButtonText}
                        onChange={(e) => handleInputChange({ primaryButtonText: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-cyan-500/50 placeholder:text-white/20"
                        placeholder="e.g., Get Started"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="primaryButtonLink"
                        className="text-xxs font-bold text-admin-muted uppercase tracking-widest"
                      >
                        Route (Primary)
                      </Label>
                      <Input
                        id="primaryButtonLink"
                        value={heroData.primaryButtonLink}
                        onChange={(e) => handleInputChange({ primaryButtonLink: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-cyan-500/50 placeholder:text-white/20"
                        placeholder="/contact"
                        required
                      />
                    </div>
                  </div>

                  <div className="gap-6 grid">
                    <div className="space-y-2">
                      <Label
                        htmlFor="secondaryButtonText"
                        className="text-xxs font-bold text-admin-muted uppercase tracking-widest"
                      >
                        Secondary Action
                      </Label>
                      <Input
                        id="secondaryButtonText"
                        value={heroData.secondaryButtonText}
                        onChange={(e) => handleInputChange({ secondaryButtonText: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-cyan-500/50 placeholder:text-white/20"
                        placeholder="e.g., Learn More"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="secondaryButtonLink"
                        className="text-xxs font-bold text-admin-muted uppercase tracking-widest"
                      >
                        Route (Secondary)
                      </Label>
                      <Input
                        id="secondaryButtonLink"
                        value={heroData.secondaryButtonLink}
                        onChange={(e) => handleInputChange({ secondaryButtonLink: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-cyan-500/50 placeholder:text-white/20"
                        placeholder="/about"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                  Cinematic Tech-Asset
                </Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowHeroBackgroundPicker(true)}
                    className="flex-1 bg-white/5 border-white/10 h-14 rounded-xl justify-start px-4 text-admin-muted hover:bg-white/10 hover:text-white transition-all border-0 shadow-none ring-offset-0 focus:ring-0"
                  >
                    <ImageIcon className="mr-3 h-5 w-5 text-cyan-500" />
                    <span className="truncate">
                      {selectedBackgroundMedia
                        ? selectedBackgroundMedia.originalName
                        : "Select Digital Environment Assets"}
                    </span>
                  </Button>
                  {heroData.backgroundMediaId && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleInputChange({ backgroundMediaId: null })}
                      className="h-14 w-14 rounded-xl border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-admin-muted"
                      title="Remove Background"
                    >
                      <Plus className="h-5 w-5 rotate-45" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "size-2 rounded-full",
                      heroData.isActive ? "bg-cyan-500 animate-pulse" : "bg-[#68869A]",
                    )}
                  />
                  <Label
                    htmlFor="isActive"
                    className="text-xxs font-bold text-white uppercase tracking-widest"
                  >
                    System Visibility
                  </Label>
                </div>
                <Switch
                  id="isActive"
                  checked={heroData.isActive}
                  onCheckedChange={(checked) => handleInputChange({ isActive: checked })}
                  className="data-[state=checked]:bg-cyan-600"
                />
              </div>
            </div>

            {showPreview && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <LayoutTemplate className="h-4 w-4 text-cyan-400" />
                  <span className="text-xxs font-bold text-cyan-400 uppercase tracking-widest">
                    Mobile Viewport Simulation
                  </span>
                </div>
                <div className="aspect-[9/16] max-w-[300px] mx-auto rounded-huge border-[8px] border-white/10 bg-black overflow-hidden relative shadow-2xl ring-1 ring-white/5">
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-10" />
                  <div className="absolute inset-0 z-0 bg-cyan-900/20 animate-pulse" />
                  {selectedBackgroundMedia?.type === "image" && (
                    <img
                      src={selectedBackgroundMedia.url || ""}
                      alt="Preview"
                      className="absolute inset-0 object-cover w-full h-full opacity-60"
                    />
                  )}
                  <div className="absolute bottom-10 left-6 right-6 z-20 space-y-4">
                    <h3 className="text-2xl font-bold text-white leading-tight">
                      {heroData.title || "Innovation Redefined"}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-3">
                      {heroData.description ||
                        heroData.subtitle ||
                        "The next frontier of manufacturing technology."}
                    </p>
                    <div className="flex flex-col gap-2 pt-2">
                      <Button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold h-10 rounded-full text-xxs uppercase tracking-widest">
                        {heroData.primaryButtonText || "Get Started"}
                      </Button>
                      {heroData.secondaryButtonText && (
                        <Button
                          variant="outline"
                          className="w-full bg-transparent border-white/20 text-white font-bold h-10 rounded-full text-xxs uppercase tracking-widest"
                        >
                          {heroData.secondaryButtonText}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xxs text-center text-admin-muted italic">
                  Simulated high-performance rendering for mobile deployments.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <StandardMediaSelectionDialog
        isOpen={showHeroBackgroundPicker}
        onClose={() => setShowHeroBackgroundPicker(false)}
        onSelect={(asset: MediaAsset | MediaAsset[]) => {
          const selectedAsset = Array.isArray(asset) ? asset[0] : asset;
          if (selectedAsset) {
            handleInputChange({ backgroundMediaId: selectedAsset.id });
            setShowHeroBackgroundPicker(false);
          }
        }}
        title="Select Tech Hero Assets"
        mediaPickerTarget="technology-hero-background"
      />
    </div>
  );
}
