import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { StandardMediaSelectionDialog } from "@/components/admin/shared";
import type { MediaAsset } from "@shared/schema";

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
  description?: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundMediaId?: number | null;
  isActive?: boolean;
}

// MediaAsset imported from shared schema

interface TechnologyHeroManagementProps {
  isLoading?: boolean;
}

export function TechnologyHeroManagement({
  isLoading: externalLoading,
}: TechnologyHeroManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [showHeroBackgroundPicker, setShowHeroBackgroundPicker] = useState(false);

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
      apiRequest("/api/technology-hero", { method: "PATCH", body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technology-hero"] });
      toast({
        title: "Success",
        description: "Hero section updated successfully",
      });
    },
  });

  // Event Handlers
  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeroMutation.mutate(heroData);
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
    }
  }, [hero]);

  const selectedBackgroundMedia = Array.isArray(mediaAssets)
    ? mediaAssets.find((asset) => asset.id === heroData.backgroundMediaId)
    : null;

  const loading = externalLoading || heroLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
        <CardDescription>
          Configure the main hero section that introduces your technology platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 h-10 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <form onSubmit={handleHeroSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={heroData.title}
                  onChange={(e) => setHeroData({ ...heroData, title: e.target.value })}
                  placeholder="Advanced Technology Solutions"
                  required
                />
              </div>
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={heroData.subtitle}
                  onChange={(e) => setHeroData({ ...heroData, subtitle: e.target.value })}
                  placeholder="Innovation at Every Step"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={heroData.description}
                onChange={(e) => setHeroData({ ...heroData, description: e.target.value })}
                placeholder="Describe your technology platform and what makes it unique"
                rows={3}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Call-to-Action Buttons</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primaryButtonText">Primary Button Text</Label>
                  <Input
                    id="primaryButtonText"
                    value={heroData.primaryButtonText}
                    onChange={(e) =>
                      setHeroData({ ...heroData, primaryButtonText: e.target.value })
                    }
                    placeholder="Get Started"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryButtonLink">Primary Button Link</Label>
                  <Input
                    id="primaryButtonLink"
                    value={heroData.primaryButtonLink}
                    onChange={(e) =>
                      setHeroData({ ...heroData, primaryButtonLink: e.target.value })
                    }
                    placeholder="/contact"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="secondaryButtonText">Secondary Button Text</Label>
                  <Input
                    id="secondaryButtonText"
                    value={heroData.secondaryButtonText}
                    onChange={(e) =>
                      setHeroData({ ...heroData, secondaryButtonText: e.target.value })
                    }
                    placeholder="Learn More"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryButtonLink">Secondary Button Link</Label>
                  <Input
                    id="secondaryButtonLink"
                    value={heroData.secondaryButtonLink}
                    onChange={(e) =>
                      setHeroData({ ...heroData, secondaryButtonLink: e.target.value })
                    }
                    placeholder="/about"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Background Media</h4>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowHeroBackgroundPicker(true)}
                >
                  {heroData.backgroundMediaId ? "Change Background" : "Select Background"}
                </Button>
                {heroData.backgroundMediaId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setHeroData({ ...heroData, backgroundMediaId: null })}
                  >
                    Remove Background
                  </Button>
                )}
              </div>
              {selectedBackgroundMedia && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedBackgroundMedia.type}</Badge>
                  <span className="text-sm text-gray-600">
                    Selected: {selectedBackgroundMedia.originalName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setHeroData({ ...heroData, backgroundMediaId: null })}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={heroData.isActive}
                onCheckedChange={(checked) => setHeroData({ ...heroData, isActive: checked })}
              />
              <Label htmlFor="isActive">Show Hero Section</Label>
            </div>

            <Button type="submit" disabled={updateHeroMutation.isPending}>
              {updateHeroMutation.isPending ? "Saving..." : "Save Hero Section"}
            </Button>
          </form>
        )}
      </CardContent>

      {/* Hero Background Media Selection Dialog */}
      <StandardMediaSelectionDialog
        isOpen={showHeroBackgroundPicker}
        onClose={() => setShowHeroBackgroundPicker(false)}
        onSelect={(asset: MediaAsset | MediaAsset[]) => {
          const selectedAsset = Array.isArray(asset) ? asset[0] : asset;
          if (selectedAsset) {
            setHeroData({ ...heroData, backgroundMediaId: selectedAsset.id });
            setShowHeroBackgroundPicker(false);
          }
        }}
        title="Select Hero Background"
        mediaPickerTarget="technology-hero-background"
        selectionMode="single"
      />
    </Card>
  );
}
