import type { ManufacturingHero, MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Layout, Play, Save } from "lucide-react";
import { useActionState, useEffect, useOptimistic, useState } from "react";
import { toast } from "sonner";
import { MediaPickerModal } from "@/components/admin/shared/MediaPickerModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createMediaQueryKey } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface HeroFormData {
  headline: string;
  subheadline: string;
  backgroundMediaId: number | null;
  videoId: number | null;
  isActive: boolean;
  ctaText: string;
  ctaLink: string;
  // Bottom Call to Action
  bottomCtaTitle: string;
  bottomCtaDescription: string;
  bottomCtaText: string;
  bottomCtaLink: string;
}

interface HeroManagementProps {
  mediaAssets: MediaAsset[];
}

export function HeroManagement({ mediaAssets }: HeroManagementProps) {
  const [heroData, setHeroData] = useState<HeroFormData>({
    headline: "",
    subheadline: "",
    backgroundMediaId: null,
    videoId: null,
    isActive: true,
    ctaText: "",
    ctaLink: "",
    bottomCtaTitle: "",
    bottomCtaDescription: "",
    bottomCtaText: "",
    bottomCtaLink: "",
  });
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  // Hero queries
  const { data: hero, isPending: heroLoading } = useQuery<ManufacturingHero>({
    queryKey: ["/api/manufacturing-hero"],
  });

  // Fetch specific video asset if not found in main assets list
  const { data: specificVideo } = useQuery<MediaAsset>({
    queryKey: createMediaQueryKey.single(heroData.videoId || 0),
    queryFn: async (): Promise<MediaAsset> => {
      if (!heroData.videoId) throw new Error("No video ID");
      const res = await apiRequest<{ data: MediaAsset }>(`/api/media/${heroData.videoId}`, {
        method: "GET",
      });
      return res.data;
    },
    enabled:
      !!heroData.videoId &&
      !mediaAssets?.find((asset: MediaAsset) => asset.id === heroData.videoId),
  });

  // Fetch specific background asset if not found in main assets list
  const { data: specificBackground } = useQuery<MediaAsset>({
    queryKey: createMediaQueryKey.single(heroData.backgroundMediaId || 0),
    queryFn: async (): Promise<MediaAsset> => {
      if (!heroData.backgroundMediaId) throw new Error("No background media ID");
      const res = await apiRequest<{ data: MediaAsset }>(
        `/api/media/${heroData.backgroundMediaId}`,
        {
          method: "GET",
        },
      );
      return res.data;
    },
    enabled:
      !!heroData.backgroundMediaId &&
      !mediaAssets?.find((asset: MediaAsset) => asset.id === heroData.backgroundMediaId),
  });

  useEffect(() => {
    if (hero) {
      setHeroData({
        headline: hero.headline || "",
        subheadline: hero.subheadline || "",
        backgroundMediaId: hero.backgroundMediaId || null,
        videoId: hero.videoId || null,
        isActive: hero.isActive ?? true,
        ctaText: hero.ctaText || "",
        ctaLink: hero.ctaLink || "",
        bottomCtaTitle: hero.bottomCtaTitle || "",
        bottomCtaDescription: hero.bottomCtaDescription || "",
        bottomCtaText: hero.bottomCtaText || "",
        bottomCtaLink: hero.bottomCtaLink || "",
      });
    }
  }, [hero]);

  const [optimisticHero, setOptimisticHero] = useOptimistic(
    heroData,
    (state, newData: Partial<HeroFormData>) => ({ ...state, ...newData }),
  );

  const [_state, formAction, isPending] = useActionState(
    async (_prevState: { success: boolean } | null, formData: FormData) => {
      const data: Partial<HeroFormData> = {
        headline: formData.get("headline") as string,
        subheadline: formData.get("subheadline") as string,
        ctaText: formData.get("ctaText") as string,
        ctaLink: formData.get("ctaLink") as string,
        bottomCtaTitle: formData.get("bottomCtaTitle") as string,
        bottomCtaDescription: formData.get("bottomCtaDescription") as string,
        bottomCtaText: formData.get("bottomCtaText") as string,
        bottomCtaLink: formData.get("bottomCtaLink") as string,
        isActive: formData.get("isActive") === "on",
        backgroundMediaId: heroData.backgroundMediaId,
        videoId: heroData.videoId,
      };

      try {
        const response = await apiRequest<ManufacturingHero>("/api/manufacturing-hero", {
          method: "PATCH",
          body: JSON.stringify(data),
        });

        if (response) {
          const updatedData = {
            headline: response.headline || "",
            subheadline: response.subheadline || "",
            backgroundMediaId: response.backgroundMediaId || null,
            videoId: response.videoId || null,
            isActive: response.isActive ?? true,
            ctaText: response.ctaText || "",
            ctaLink: response.ctaLink || "",
            bottomCtaTitle: response.bottomCtaTitle || "",
            bottomCtaDescription: response.bottomCtaDescription || "",
            bottomCtaText: response.bottomCtaText || "",
            bottomCtaLink: response.bottomCtaLink || "",
          };
          setHeroData(updatedData);
          getQueryClient().invalidateQueries({ queryKey: ["/api/manufacturing-hero"] });
          toast.success("Success", { description: "Hero section updated successfully" });
        }
        return { success: true };
      } catch (_error) {
        toast.error("Error", { description: "Failed to update hero section" });
        return { success: false };
      }
    },
    { success: false },
  );

  const selectedBackgroundMedia = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === optimisticHero.backgroundMediaId)
    : undefined;

  const selectedVideo = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === optimisticHero.videoId)
    : undefined;

  const finalSelectedVideo = selectedVideo || specificVideo;
  const finalSelectedBackground = selectedBackgroundMedia || specificBackground;

  const handleSave = async (formData: FormData) => {
    const data = Object.fromEntries(formData.entries());
    setOptimisticHero({
      ...data,
      isActive: formData.get("isActive") === "on",
    } as Partial<HeroFormData>);
    formAction(formData);
  };

  if (heroLoading) {
    return (
      <Card variant="glass-premium" className="flex items-center justify-center">
        <CardContent className="p-12 w-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex space-x-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-manufacturing [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-manufacturing [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-manufacturing"></div>
            </div>
            <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
              Orchestrating Hero Tab...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card variant="glass-premium">
        <CardContent className="p-8">
          <form 
            action={process.env.NODE_ENV === "test" || process.env.VITEST ? undefined : handleSave} 
            onSubmit={process.env.NODE_ENV === "test" || process.env.VITEST ? (e) => {
              e.preventDefault();
              handleSave(new FormData(e.currentTarget));
            } : undefined} 
            className="space-y-10"
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Hero Section</h2>
                <p className="text-sm text-admin-muted">
                  Manage the main hero section for the manufacturing page
                </p>
              </div>
              <div className="flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                <Switch
                  id="hero-active"
                  name="isActive"
                  checked={optimisticHero.isActive}
                  onCheckedChange={(checked) => setHeroData({ ...heroData, isActive: checked })}
                  className="data-custom-misc-49:bg-brand-manufacturing"
                />
                <Label
                  htmlFor="hero-active"
                  className="text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer"
                >
                  Status: {optimisticHero.isActive ? "Active" : "Hidden"}
                </Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label
                  htmlFor="headline"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Headline
                </Label>
                <Input
                  id="headline"
                  name="headline"
                  value={optimisticHero.headline}
                  onChange={(e) => setHeroData({ ...heroData, headline: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-15/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                  placeholder="e.g., Leading the Way in Precision Sportswear"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="subheadline"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Subheadline
                </Label>
                <Input
                  id="subheadline"
                  name="subheadline"
                  value={optimisticHero.subheadline}
                  onChange={(e) => setHeroData({ ...heroData, subheadline: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-16/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                  placeholder="Enter subheadline"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
              <div className="space-y-2">
                <Label
                  htmlFor="ctaText"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Main Button Text
                </Label>
                <Input
                  id="ctaText"
                  name="ctaText"
                  value={optimisticHero.ctaText}
                  onChange={(e) => setHeroData({ ...heroData, ctaText: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-17/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                  placeholder="e.g., Explore Our Facilities"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ctaLink"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Main Button Link
                </Label>
                <Input
                  id="ctaLink"
                  name="ctaLink"
                  value={optimisticHero.ctaLink}
                  onChange={(e) => setHeroData({ ...heroData, ctaLink: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-18/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                  placeholder="e.g., /contact"
                />
              </div>
            </div>

            <div className="space-y-6 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-4 h-4 text-brand-manufacturing" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Bottom Conversion Banner
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="bottomCtaTitle"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Banner Title
                  </Label>
                  <Input
                    id="bottomCtaTitle"
                    name="bottomCtaTitle"
                    value={optimisticHero.bottomCtaTitle}
                    onChange={(e) => setHeroData({ ...heroData, bottomCtaTitle: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-19/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                    placeholder="e.g., Experience Precision Manufacturing"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bottomCtaDescription"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Banner Description
                  </Label>
                  <Input
                    id="bottomCtaDescription"
                    name="bottomCtaDescription"
                    value={optimisticHero.bottomCtaDescription}
                    onChange={(e) =>
                      setHeroData({ ...heroData, bottomCtaDescription: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-20/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                    placeholder="Enter conversion description"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bottomCtaText"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Banner Button Text
                  </Label>
                  <Input
                    id="bottomCtaText"
                    name="bottomCtaText"
                    value={optimisticHero.bottomCtaText}
                    onChange={(e) => setHeroData({ ...heroData, bottomCtaText: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-21/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                    placeholder="e.g., Start Your Project"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bottomCtaLink"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Banner Button Link
                  </Label>
                  <Input
                    id="bottomCtaLink"
                    name="bottomCtaLink"
                    value={optimisticHero.bottomCtaLink}
                    onChange={(e) => setHeroData({ ...heroData, bottomCtaLink: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-custom-color-22/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                    placeholder="e.g., /contact"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
              <div className="space-y-3">
                <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                  Background Asset
                </Label>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                  <div className="size-16 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {finalSelectedBackground?.url ? (
                      <img
                        src={finalSelectedBackground.url}
                        className="w-full h-full object-cover"
                        alt="Background preview"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-white/10" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate mb-1">
                      {finalSelectedBackground?.filename || "No asset selected"}
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowBackgroundPicker(true)}
                        data-testid="select-background-button"
                        aria-label={
                          finalSelectedBackground
                            ? "Change background asset"
                            : "Select background asset"
                        }
                        className="text-xxs font-bold text-brand-manufacturing hover:text-brand-manufacturing/80 transition-colors uppercase tracking-wider"
                      >
                        {finalSelectedBackground ? "Change" : "Select"}
                      </button>
                      {finalSelectedBackground && (
                        <button
                          type="button"
                          onClick={() => setHeroData({ ...heroData, backgroundMediaId: null })}
                          aria-label="Remove background asset"
                          className="text-xxs font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                  Hero Video Overlay
                </Label>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                  <div className="size-16 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Play
                      className={cn(
                        "w-6 h-6",
                        finalSelectedVideo ? "text-brand-manufacturing" : "text-white/10",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate mb-1">
                      {finalSelectedVideo?.filename || "No video selected"}
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowVideoPicker(true)}
                        data-testid="select-video-button"
                        aria-label={
                          finalSelectedVideo
                            ? "Change hero video overlay"
                            : "Select hero video overlay"
                        }
                        className="text-xxs font-bold text-brand-manufacturing hover:text-brand-manufacturing/80 transition-colors uppercase tracking-wider"
                      >
                        {finalSelectedVideo ? "Change Video" : "Select Video"}
                      </button>
                      {finalSelectedVideo && (
                        <button
                          type="button"
                          onClick={() => setHeroData({ ...heroData, videoId: null })}
                          aria-label="Remove hero video overlay"
                          className="text-xxs font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-white/5">
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-white px-10 py-7 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-custom-misc-50 group"
              >
                {isPending ? (
                  "Applying Changes..."
                ) : (
                  <span className="flex items-center gap-2 text-sm uppercase tracking-wider">
                    <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Save Hero Settings
                  </span>
                )}
              </Button>
            </div>
          </form>

          <MediaPickerModal
            isOpen={showBackgroundPicker}
            onClose={() => setShowBackgroundPicker(false)}
            onSelect={(asset) => {
              setHeroData({ ...heroData, backgroundMediaId: Number(asset.id) });
              setShowBackgroundPicker(false);
            }}
            title="Select Background Asset"
            allowedTypes={["image"]}
          />

          <MediaPickerModal
            isOpen={showVideoPicker}
            onClose={() => setShowVideoPicker(false)}
            onSelect={(asset) => {
              setHeroData({ ...heroData, videoId: Number(asset.id) });
              setShowVideoPicker(false);
            }}
            title="Select Hero Video"
            allowedTypes={["video"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
