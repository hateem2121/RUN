import type { ManufacturingHero, MediaAsset } from "@shared/index";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Layout, Play, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { MediaPickerModal } from "@/components/admin/shared/MediaPickerModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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

  const updateHeroMutation = useMutation({
    mutationFn: (data: Partial<HeroFormData>) => {
      return apiRequest<ManufacturingHero>("/api/manufacturing-hero", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      if (response) {
        setHeroData({
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
        });
      }

      getQueryClient().invalidateQueries({ queryKey: ["/api/manufacturing-hero"] });
      toast({
        title: "Success",
        description: "Hero section updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update hero section",
        variant: "destructive",
      });
    },
  });

  const selectedBackgroundMedia = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === heroData.backgroundMediaId)
    : undefined;

  const selectedVideo = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === heroData.videoId)
    : undefined;

  const finalSelectedVideo = selectedVideo || specificVideo;
  const finalSelectedBackground = selectedBackgroundMedia || specificBackground;

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeroMutation.mutate(heroData);
  };

  if (heroLoading) {
    return (
      <Card variant="glass-premium" className="flex items-center justify-center">
        <CardContent className="p-12 w-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex space-x-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-[#D4A853] [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-[#D4A853] [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-[#D4A853]"></div>
            </div>
            <p className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest">
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Hero Section</h2>
              <p className="text-sm text-[#68869A]">
                Manage the main hero section for the manufacturing page
              </p>
            </div>
            <div className="flex items-center space-x-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
              <Switch
                id="hero-active"
                checked={heroData.isActive}
                onCheckedChange={(checked) => setHeroData({ ...heroData, isActive: checked })}
                className="data-[state=checked]:bg-[#D4A853]"
              />
              <Label
                htmlFor="hero-active"
                className="text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer"
              >
                Status: {heroData.isActive ? "Active" : "Hidden"}
              </Label>
            </div>
          </div>

          <form onSubmit={handleHeroSubmit} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Label
                  htmlFor="headline"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Headline
                </Label>
                <Input
                  id="headline"
                  value={heroData.headline}
                  onChange={(e) => setHeroData({ ...heroData, headline: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                  placeholder="e.g., Leading the Way in Precision Sportswear"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="subheadline"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Subheadline
                </Label>
                <Input
                  id="subheadline"
                  value={heroData.subheadline}
                  onChange={(e) => setHeroData({ ...heroData, subheadline: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                  placeholder="Enter subheadline"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
              <div className="space-y-2">
                <Label
                  htmlFor="ctaText"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Main Button Text
                </Label>
                <Input
                  id="ctaText"
                  value={heroData.ctaText}
                  onChange={(e) => setHeroData({ ...heroData, ctaText: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                  placeholder="e.g., Explore Our Facilities"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="ctaLink"
                  className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                >
                  Main Button Link
                </Label>
                <Input
                  id="ctaLink"
                  value={heroData.ctaLink}
                  onChange={(e) => setHeroData({ ...heroData, ctaLink: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                  placeholder="e.g., /contact"
                />
              </div>
            </div>

            <div className="space-y-6 pt-8 border-t border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <Layout className="w-4 h-4 text-[#D4A853]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Bottom Conversion Banner
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="bottomCtaTitle"
                    className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                  >
                    Banner Title
                  </Label>
                  <Input
                    id="bottomCtaTitle"
                    value={heroData.bottomCtaTitle}
                    onChange={(e) => setHeroData({ ...heroData, bottomCtaTitle: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                    placeholder="e.g., Experience Precision Manufacturing"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bottomCtaDescription"
                    className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                  >
                    Banner Description
                  </Label>
                  <Input
                    id="bottomCtaDescription"
                    value={heroData.bottomCtaDescription}
                    onChange={(e) =>
                      setHeroData({ ...heroData, bottomCtaDescription: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                    placeholder="Enter conversion description"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bottomCtaText"
                    className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                  >
                    Banner Button Text
                  </Label>
                  <Input
                    id="bottomCtaText"
                    value={heroData.bottomCtaText}
                    onChange={(e) => setHeroData({ ...heroData, bottomCtaText: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                    placeholder="e.g., Start Your Project"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="bottomCtaLink"
                    className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1"
                  >
                    Banner Button Link
                  </Label>
                  <Input
                    id="bottomCtaLink"
                    value={heroData.bottomCtaLink}
                    onChange={(e) => setHeroData({ ...heroData, bottomCtaLink: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-[#D4A853]/50 focus-visible:ring-offset-0 placeholder:text-white/20"
                    placeholder="e.g., /contact"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
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
                        className="text-[10px] font-bold text-[#D4A853] hover:text-[#D4A853]/80 transition-colors uppercase tracking-wider"
                      >
                        {finalSelectedBackground ? "Change" : "Select"}
                      </button>
                      {finalSelectedBackground && (
                        <button
                          type="button"
                          onClick={() => setHeroData({ ...heroData, backgroundMediaId: null })}
                          className="text-[10px] font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest pl-1">
                  Hero Video Overlay
                </Label>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
                  <div className="size-16 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Play
                      className={cn(
                        "w-6 h-6",
                        finalSelectedVideo ? "text-[#D4A853]" : "text-white/10",
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
                        className="text-[10px] font-bold text-[#D4A853] hover:text-[#D4A853]/80 transition-colors uppercase tracking-wider"
                      >
                        {finalSelectedVideo ? "Change Video" : "Select Video"}
                      </button>
                      {finalSelectedVideo && (
                        <button
                          type="button"
                          onClick={() => setHeroData({ ...heroData, videoId: null })}
                          className="text-[10px] font-bold text-red-500/70 hover:text-red-500 transition-colors uppercase tracking-wider"
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
                disabled={updateHeroMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-white px-10 py-7 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group"
              >
                {updateHeroMutation.isPending ? (
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
