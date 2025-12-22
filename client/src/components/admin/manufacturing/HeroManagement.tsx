import type { ManufacturingHero, MediaAsset } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared";
import { ManufacturingLoadingState } from "@/components/shared/manufacturing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createMediaQueryKey } from "@/lib/media-query-keys";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

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
      const res = await apiRequest(`/api/media/${heroData.videoId}`, { method: "GET" });
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
      const res = await apiRequest(`/api/media/${heroData.backgroundMediaId}`, { method: "GET" });
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
      return apiRequest("/api/manufacturing-hero", { method: "PATCH", body: data });
    },
    onSuccess: (response) => {
      // Update local state immediately with the server response
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

  // Use specific fetched assets as fallback if not found in main list
  const finalSelectedVideo = selectedVideo || specificVideo;
  const finalSelectedBackground = selectedBackgroundMedia || specificBackground;

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeroMutation.mutate(heroData);
  };

  const handleBackgroundSelect = (assets: MediaAsset[] | MediaAsset) => {
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (!asset) return;
    setHeroData({ ...heroData, backgroundMediaId: asset.id });
    setShowBackgroundPicker(false);
  };

  const handleVideoSelect = (assets: MediaAsset[] | MediaAsset) => {
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (!asset) return;
    setHeroData({ ...heroData, videoId: asset.id });
    setShowVideoPicker(false);
  };

  if (heroLoading) {
    return <ManufacturingLoadingState variant="card" message="Loading hero section..." />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
        <CardDescription>Manage the main hero section for the manufacturing page</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleHeroSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={heroData.headline}
                onChange={(e) => setHeroData({ ...heroData, headline: e.target.value })}
                placeholder="Enter headline"
              />
            </div>
            <div>
              <Label htmlFor="subheadline">Subheadline</Label>
              <Input
                id="subheadline"
                value={heroData.subheadline}
                onChange={(e) => setHeroData({ ...heroData, subheadline: e.target.value })}
                placeholder="Enter subheadline"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ctaText">CTA Button Text</Label>
              <Input
                id="ctaText"
                value={heroData.ctaText}
                onChange={(e) => setHeroData({ ...heroData, ctaText: e.target.value })}
                placeholder="e.g., Explore Our Facilities"
              />
            </div>
            <div>
              <Label htmlFor="ctaLink">CTA Button Link</Label>
              <Input
                id="ctaLink"
                value={heroData.ctaLink}
                onChange={(e) => setHeroData({ ...heroData, ctaLink: e.target.value })}
                placeholder="e.g., /contact"
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Bottom Call to Action</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bottomCtaTitle">Title</Label>
                <Input
                  id="bottomCtaTitle"
                  value={heroData.bottomCtaTitle}
                  onChange={(e) => setHeroData({ ...heroData, bottomCtaTitle: e.target.value })}
                  placeholder="e.g., Experience Precision Manufacturing"
                />
              </div>
              <div>
                <Label htmlFor="bottomCtaDescription">Description</Label>
                <Input
                  id="bottomCtaDescription"
                  value={heroData.bottomCtaDescription}
                  onChange={(e) =>
                    setHeroData({ ...heroData, bottomCtaDescription: e.target.value })
                  }
                  placeholder="Enter description"
                />
              </div>
              <div>
                <Label htmlFor="bottomCtaText">Button Text</Label>
                <Input
                  id="bottomCtaText"
                  value={heroData.bottomCtaText}
                  onChange={(e) => setHeroData({ ...heroData, bottomCtaText: e.target.value })}
                  placeholder="e.g., Start Your Project"
                />
              </div>
              <div>
                <Label htmlFor="bottomCtaLink">Button Link</Label>
                <Input
                  id="bottomCtaLink"
                  value={heroData.bottomCtaLink}
                  onChange={(e) => setHeroData({ ...heroData, bottomCtaLink: e.target.value })}
                  placeholder="e.g., /contact"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Background Media</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackgroundPicker(true)}
                  className="flex-1"
                >
                  <Image className="w-4 h-4 mr-2" />
                  {finalSelectedBackground ? finalSelectedBackground.filename : "Select Background"}
                </Button>
                {finalSelectedBackground && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHeroData({ ...heroData, backgroundMediaId: null })}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Hero Video</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVideoPicker(true)}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {finalSelectedVideo ? finalSelectedVideo.filename : "Select Video"}
                </Button>
                {finalSelectedVideo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHeroData({ ...heroData, videoId: null })}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="hero-active"
                checked={heroData.isActive}
                onCheckedChange={(checked) => setHeroData({ ...heroData, isActive: checked })}
              />
              <Label htmlFor="hero-active">Active</Label>
            </div>
          </div>

          <Button type="submit" disabled={updateHeroMutation.isPending}>
            {updateHeroMutation.isPending ? "Updating..." : "Update Hero Section"}
          </Button>
        </form>

        {/* Background Media Picker */}
        <StandardMediaSelectionDialog
          isOpen={showBackgroundPicker}
          onClose={() => setShowBackgroundPicker(false)}
          onSelect={handleBackgroundSelect}
          title="Select Background Media"
          mediaPickerTarget="background-media"
          selectionMode="single"
        />

        {/* Video Media Picker */}
        <StandardMediaSelectionDialog
          isOpen={showVideoPicker}
          onClose={() => setShowVideoPicker(false)}
          onSelect={handleVideoSelect}
          title="Select Hero Video"
          mediaPickerTarget="video-media"
          selectionMode="single"
        />
      </CardContent>
    </Card>
  );
}
