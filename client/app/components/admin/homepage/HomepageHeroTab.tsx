import type { HomepageHero, InsertHomepageHero, MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { Eye, EyeOff, Globe, Image as ImageIcon, Play, Save, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/admin/shared/GlassCard";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { useAdminHomepageMutations } from "@/hooks/use-admin-homepage-mutations";
import { cn } from "@/lib/utils";

interface HomepageHeroTabProps {
  hero: HomepageHero | undefined;
}

export function HomepageHeroTab({ hero }: HomepageHeroTabProps) {
  const { updateHomepageHero } = useAdminHomepageMutations();
  const [formData, setFormData] = useState<Partial<InsertHomepageHero>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: mediaAssets = [] } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media-assets"],
  });

  useEffect(() => {
    if (hero) {
      setFormData({
        title: hero.title || "",
        subtitle: hero.subtitle || "",
        backgroundImageId: hero.backgroundImageId,
        ctaText: hero.ctaText || "",
        ctaLink: hero.ctaLink || "",
        isActive: hero.isActive ?? true,
        sortOrder: hero.sortOrder ?? 0,
      });
      setIsDirty(false);
    }
  }, [hero]);

  const handleChange = <K extends keyof InsertHomepageHero>(
    field: K,
    value: InsertHomepageHero[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateHomepageHero.mutate(formData, {
      onSuccess: () => setIsDirty(false),
    });
  };

  const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    const media = Array.isArray(assets) ? assets[0] : assets;
    if (media) {
      handleChange("backgroundImageId", media.id);
      setIsMediaPickerOpen(false);
    }
  };

  const selectedBackgroundMedia = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === formData.backgroundImageId)
    : null;

  return (
    <TabsContent value="hero" className="mt-0 focus-visible:outline-none outline-none">
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Globe className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Global Hero Infrastructure
                </h2>
                <p className="text-sm text-[#68869A]">
                  Configure high-impact frontpage narrative and primary action triggers
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="flex gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 h-11 px-4"
                title={showPreview ? "Hide Preview" : "Show Preview"}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPreview ? "Hide Preview" : "Show Preview"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isDirty || updateHomepageHero.isPending}
                className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all outline-none border-0"
              >
                {updateHomepageHero.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {updateHomepageHero.isPending ? "Syncing..." : "Sync Hero"}
              </Button>
            </div>
          </div>

          <div className={cn("grid gap-10", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                  >
                    Primary Headline
                  </Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-blue-500/50 placeholder:text-white/20"
                    placeholder="e.g., Run Your Future"
                  />
                  <p className="text-[10px] text-[#68869A] mt-2 px-1">
                    Use <code className="text-blue-400">|</code> to split the headline into multiple
                    lines (e.g., Run | Your | Future).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="subtitle"
                    className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                  >
                    Secondary Tagline
                  </Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle || ""}
                    onChange={(e) => handleChange("subtitle", e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-blue-500/50 placeholder:text-white/20"
                    placeholder="e.g., High-performance activewear"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1 flex items-center gap-2">
                  <Zap className="size-3 text-blue-400" /> Action Protocols
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="ctaText"
                      className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest"
                    >
                      Primary Action
                    </Label>
                    <Input
                      id="ctaText"
                      value={formData.ctaText || ""}
                      onChange={(e) => handleChange("ctaText", e.target.value)}
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 placeholder:text-white/20"
                      placeholder="e.g., Explore Collection"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="ctaLink"
                      className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest"
                    >
                      Route URI
                    </Label>
                    <Input
                      id="ctaLink"
                      value={formData.ctaLink || ""}
                      onChange={(e) => handleChange("ctaLink", e.target.value)}
                      className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:ring-blue-500/50 placeholder:text-white/20"
                      placeholder="/products"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1 flex items-center gap-2">
                  <ImageIcon className="size-3 text-blue-400" /> Cinematic Background
                </Label>
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all cursor-pointer h-48",
                    formData.backgroundImageId
                      ? "border-blue-500/30 bg-blue-500/5"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                  )}
                  onClick={() => setIsMediaPickerOpen(true)}
                >
                  {formData.backgroundImageId ? (
                    <>
                      {selectedBackgroundMedia?.type === "video" ? (
                        <video
                          src={selectedBackgroundMedia.url}
                          autoPlay
                          muted
                          loop
                          className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity group-hover:opacity-30"
                        />
                      ) : selectedBackgroundMedia?.type === "image" ? (
                        <img
                          src={selectedBackgroundMedia.url}
                          alt="Hero Background"
                          className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity group-hover:opacity-30"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-900/20">
                          <ImageIcon className="h-12 w-12 text-blue-500/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/40 backdrop-blur-sm">
                        <span className="rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                          Change Media
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 backdrop-blur-md">
                          {selectedBackgroundMedia?.type || "Media"}
                        </span>
                        <span className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                          ID: {formData.backgroundImageId}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <div className="rounded-full bg-white/5 p-4 text-[#68869A] group-hover:scale-110 group-hover:bg-white/10 group-hover:text-white transition-all">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-white">Select Cinematic Media</p>
                        <p className="text-xs text-[#68869A] mt-1">
                          High-resolution video or image
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <Switch
                  id="isActive"
                  checked={formData.isActive ?? true}
                  onCheckedChange={(checked) => handleChange("isActive", checked)}
                  className="data-[state=checked]:bg-blue-500"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="isActive"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                  >
                    Broadcast Status
                  </Label>
                  <p className="text-xs text-[#68869A]">
                    Activate this module on the global storefront
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Viewport Simulation */}
            {showPreview && (
              <div className="relative mx-auto w-full max-w-[340px] h-[680px] rounded-[40px] border-[8px] border-black bg-[#0A0A0A] shadow-2xl overflow-hidden mt-4 lg:mt-0 xl:max-w-[380px] xl:h-[760px] animate-in fade-in zoom-in-95 duration-500 hidden sm:block">
                {/* Dynamic Island Simulation */}
                <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-50">
                  <div className="w-1/3 h-5 bg-black rounded-b-3xl"></div>
                </div>

                {/* Main Content Area */}
                <div className="absolute inset-0 z-0 bg-black">
                  {selectedBackgroundMedia?.type === "video" ? (
                    <video
                      src={selectedBackgroundMedia.url}
                      autoPlay
                      muted
                      loop
                      className="absolute inset-0 h-full w-full object-cover opacity-80"
                    />
                  ) : selectedBackgroundMedia?.type === "image" ? (
                    <img
                      src={selectedBackgroundMedia.url}
                      alt="Hero Background"
                      className="absolute inset-0 h-full w-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-black"></div>
                  )}
                  {/* Subtle vignette/overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80"></div>
                </div>

                {/* Hero Content Overlay */}
                <div className="absolute inset-x-0 bottom-0 z-10 p-6 flex flex-col justify-end text-center pb-12">
                  <h2 className="font-['Neue_Stance'] text-4xl font-bold uppercase leading-none text-white tracking-tighter mb-2">
                    {formData.title || "Headline Vector"}
                  </h2>
                  <p className="text-sm text-white/80 font-medium mb-6 px-4">
                    {formData.subtitle ||
                      "The subheader provides crucial initial context to the user."}
                  </p>

                  {formData.ctaText && (
                    <div className="h-12 w-full rounded-full bg-white text-black flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs px-6 shadow-xl shadow-white/10">
                      <span>{formData.ctaText}</span>
                      <Play className="size-3 fill-black text-black" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        <StandardMediaSelectionDialog
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={handleMediaSelect}
          title="Select Background Cinematic"
          mediaPickerTarget="homepage-hero"
          selectionMode="single"
        />
      </div>
    </TabsContent>
  );
}
