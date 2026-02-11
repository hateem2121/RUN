import type { HomepageHero, InsertHomepageHero, MediaAsset } from "@shared/schema";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Assuming Switch exists
import { TabsContent } from "@/components/ui/tabs";
import { useAdminHomepageMutations } from "@/hooks/use-admin-homepage-mutations";

interface HomepageHeroTabProps {
  hero: HomepageHero | undefined;
}

export function HomepageHeroTab({ hero }: HomepageHeroTabProps) {
  const { updateHomepageHero } = useAdminHomepageMutations();
  const [formData, setFormData] = useState<Partial<InsertHomepageHero>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

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
    // Using explicit 'any' until I import MediaAsset correctly
    const media = Array.isArray(assets) ? assets[0] : assets;
    if (media) {
      handleChange("backgroundImageId", media.id);
      setIsMediaPickerOpen(false);
    }
  };

  return (
    <TabsContent value="hero" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Homepage Hero</CardTitle>
          <CardDescription>Manage the main hero section of the homepage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter hero title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle || ""}
                onChange={(e) => handleChange("subtitle", e.target.value)}
                placeholder="Enter hero subtitle"
              />
            </div>

            <div>
              <Label>Background Image</Label>
              <div className="mt-2">
                {formData.backgroundImageId ? (
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground text-sm">
                      Media ID: {formData.backgroundImageId}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsMediaPickerOpen(true)}>
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setIsMediaPickerOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Select Background Image
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ctaText">CTA Text</Label>
                <Input
                  id="ctaText"
                  value={formData.ctaText || ""}
                  onChange={(e) => handleChange("ctaText", e.target.value)}
                  placeholder="Button text"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ctaLink">CTA Link</Label>
                <Input
                  id="ctaLink"
                  value={formData.ctaLink || ""}
                  onChange={(e) => handleChange("ctaLink", e.target.value)}
                  placeholder="Button link (e.g. /products)"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive ?? true}
                onCheckedChange={(checked) => handleChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
        </CardContent>
        <div className="flex justify-end border-t p-4">
          <Button onClick={handleSave} disabled={!isDirty || updateHomepageHero.isPending}>
            {updateHomepageHero.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Background Image"
        mediaPickerTarget="homepage-hero-background"
        selectionMode="single"
      />
    </TabsContent>
  );
}
