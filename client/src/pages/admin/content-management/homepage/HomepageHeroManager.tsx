import type { HomepageHero, HomepageSection, MediaAsset } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

interface HomepageHeroManagerProps {
  mediaAssets: MediaAsset[];
  sectionData?: HomepageSection;
  onUpdateSection?: (params: { id: number; data: Partial<HomepageSection> }) => void;
}

export function HomepageHeroManager({
  mediaAssets,
  sectionData,
  onUpdateSection,
}: HomepageHeroManagerProps) {
  // Fetch hero data locally
  const { data: heroData } = useQuery<HomepageHero>({
    queryKey: ["/api/homepage-hero"],
  });

  const [heroForm, setHeroForm] = useState<Partial<HomepageHero>>({});

  useEffect(() => {
    if (heroData) {
      setHeroForm(heroData);
    }
  }, [heroData]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Local state for section title editing
  const [sectionTitle, setSectionTitle] = useState(sectionData?.title || "");

  // Update local state when sectionData changes
  useEffect(() => {
    if (sectionData) {
      setSectionTitle(sectionData.title || "");
    }
  }, [sectionData]);

  const handleUpdateSection = (data: Partial<HomepageSection>) => {
    if (sectionData && onUpdateSection) {
      onUpdateSection({ id: sectionData.id, data });
    }
  };

  const updateHeroMutation = useMutation({
    mutationFn: async (data: Partial<HomepageHero>) => {
      const result = await apiRequest("/api/homepage-hero", {
        method: "PATCH",
        body: data,
      });
      return result;
    },
    onMutate: async (data) => {
      // Cancel outgoing queries
      await getQueryClient().cancelQueries({
        queryKey: ["/api/homepage-hero"],
      });

      // Snapshot previous value
      const previousHero = getQueryClient().getQueryData(["/api/homepage-hero"]);

      // Optimistically update
      getQueryClient().setQueryData<HomepageHero | null>(["/api/homepage-hero"], (old) => {
        if (!old) return old;
        return { ...old, ...data };
      });

      return { previousHero };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousHero) {
        getQueryClient().setQueryData(["/api/homepage-hero"], context.previousHero);
      }

      toast({
        title: "Error",
        description: "Failed to update hero section",
        variant: "destructive",
      });
    },
    onSuccess: (_data) => {
      // Targeted cache invalidation to maintain hit rates
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-hero"] });

      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-batch"] });

      toast({
        title: "Success",
        description: "Hero section updated successfully",
      });
    },
  });

  const handleSaveHero = () => {
    if (!heroForm.title?.trim()) {
      toast({
        title: "Validation Error",
        description: "Hero title is required",
        variant: "destructive",
      });
      return;
    }

    // Filter out auto-generated fields that cause validation rejection
    const filteredData = {
      title: heroForm.title,
      subtitle: heroForm.subtitle,
      backgroundImageId: heroForm.backgroundImageId,
      ctaText: heroForm.ctaText,
      ctaLink: heroForm.ctaLink,
      isActive: heroForm.isActive,
      sortOrder: heroForm.sortOrder,
    };

    updateHeroMutation.mutate(filteredData);
  };

  const selectedMedia = heroForm.backgroundImageId
    ? mediaAssets?.find((asset) => asset.id === heroForm.backgroundImageId)
    : null;

  return (
    <div className="space-y-6">
      {/* Generic Section Settings (Visibility & Title) */}
      {sectionData && (
        <Card>
          <CardHeader>
            <CardTitle>Section Settings</CardTitle>
            <CardDescription>
              Manage the visibility and generic title of this section on the homepage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Section Visibility</Label>
                <div className="text-muted-foreground text-sm">
                  Toggle whether this whole section is visible to visitors.
                </div>
              </div>
              <Switch
                checked={sectionData.isActive ?? true}
                onCheckedChange={(checked) => handleUpdateSection({ isActive: checked })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="section-title">Section Title (Internal/Display)</Label>
              <div className="flex gap-2">
                <Input
                  id="section-title"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="Enter section title"
                />
                <Button
                  variant="outline"
                  onClick={() => handleUpdateSection({ title: sectionTitle })}
                  disabled={sectionTitle === sectionData.title}
                >
                  Save Title
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hero Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Configuration</CardTitle>
          <CardDescription>
            Configure the main hero content (Title, Subtitle, CTA, Background).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="hero-title">Title *</Label>
              <Input
                id="hero-title"
                value={heroForm.title || ""}
                onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                placeholder="Enter hero title"
                required
              />
            </div>
            <div>
              <Label htmlFor="hero-subtitle">Subtitle</Label>
              <Textarea
                id="hero-subtitle"
                value={heroForm.subtitle || ""}
                onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                placeholder="Enter hero subtitle"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hero-cta-text">CTA Text</Label>
                <Input
                  id="hero-cta-text"
                  value={heroForm.ctaText || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, ctaText: e.target.value })}
                  placeholder="Enter CTA button text"
                />
              </div>
              <div>
                <Label htmlFor="hero-cta-link">CTA Link</Label>
                <Input
                  id="hero-cta-link"
                  value={heroForm.ctaLink || ""}
                  onChange={(e) => setHeroForm({ ...heroForm, ctaLink: e.target.value })}
                  placeholder="Enter CTA button link"
                />
              </div>
            </div>

            {/* Background Media Selection */}
            <div className="space-y-2">
              <Label>Background Media</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMediaPicker(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {selectedMedia ? "Change Background" : "Select Background"}
                </Button>
                {heroForm.backgroundImageId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHeroForm({ ...heroForm, backgroundImageId: null })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {selectedMedia && (
                <div className="mt-2">
                  <img
                    src={
                      selectedMedia.url ||
                      (selectedMedia.id && selectedMedia.id < 1000000000000
                        ? `/api/media/${selectedMedia.id}/content`
                        : undefined)
                    }
                    alt="Background preview"
                    className="h-32 w-full rounded border object-cover"
                  />
                  <p className="mt-1 text-muted-foreground text-xs">{selectedMedia.filename}</p>
                </div>
              )}
            </div>

            {/* Unified Media Selection Dialog */}
            <StandardMediaSelectionDialog
              isOpen={showMediaPicker}
              onClose={() => setShowMediaPicker(false)}
              onSelect={(asset: MediaAsset | MediaAsset[]) => {
                const singleAsset = Array.isArray(asset) ? asset[0] : asset;
                if (!singleAsset) return;
                setHeroForm({ ...heroForm, backgroundImageId: singleAsset.id });
              }}
              title="Select Hero Background"
              mediaPickerTarget="hero-background"
              selectionMode="single"
            />

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSaveHero}
                disabled={updateHeroMutation.isPending || !heroForm.title?.trim()}
              >
                {updateHeroMutation.isPending ? "Saving..." : "Save Hero Section"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
