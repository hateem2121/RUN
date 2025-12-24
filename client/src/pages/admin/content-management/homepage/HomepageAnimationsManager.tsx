import type { HomepageSection } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { getQueryClient } from "@/lib/queryClient";

interface HomepageAnimationsManagerProps {
  sectionData?: HomepageSection;
  onUpdateSection?: (params: { id: number; data: Partial<HomepageSection> }) => void;
}

export function HomepageAnimationsManager({
  sectionData,
  onUpdateSection,
}: HomepageAnimationsManagerProps) {
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

  const [activeTab, setActiveTab] = useState<"dot-grid" | "liquid-glass" | "swipe">("dot-grid");

  // Fetch animation settings
  const { isLoading } = useQuery({
    queryKey: ["/api/homepage-animations"],
  });

  // Mutation to update settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      // In a real implementation, this would save to a specific endpoint or the data field of the section
      console.log("Saving animation settings:", data);
      // Simulating API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      return data;
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/homepage-animations"] });
      toast({ title: "Success", description: "Animation settings saved" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generic Section Settings */}
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
                <div className="text-sm text-muted-foreground">
                  Toggle whether this whole section is visible to visitors.
                </div>
              </div>
              <Switch
                checked={sectionData.isActive ?? true}
                onCheckedChange={(checked) => handleUpdateSection({ isActive: checked })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="anim-section-title">Section Title (Internal/Display)</Label>
              <div className="flex gap-2">
                <Input
                  id="anim-section-title"
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

      <Card>
        <CardHeader>
          <CardTitle>Animation Controls</CardTitle>
          <CardDescription>
            Configure the visual effects and animations for the featured products section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 pb-4 border-b">
              <Button
                variant={activeTab === "dot-grid" ? "default" : "outline"}
                onClick={() => setActiveTab("dot-grid")}
              >
                Dot Grid
              </Button>
              <Button
                variant={activeTab === "liquid-glass" ? "default" : "outline"}
                onClick={() => setActiveTab("liquid-glass")}
              >
                Liquid Glass
              </Button>
              <Button
                variant={activeTab === "swipe" ? "default" : "outline"}
                onClick={() => setActiveTab("swipe")}
              >
                Swipe Interaction
              </Button>
            </div>

            {/* Content based on activeTab */}
            <div className="py-4 space-y-4">
              {activeTab === "dot-grid" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dot Grid Settings</h3>
                  <div className="space-y-2">
                    <Label>Grid Spacing</Label>
                    <Slider defaultValue={[20]} max={50} step={1} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dot Size</Label>
                    <Slider defaultValue={[2]} max={10} step={0.5} />
                  </div>
                </div>
              )}
              {activeTab === "liquid-glass" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Liquid Glass Distortion</h3>
                  <div className="space-y-2">
                    <Label>Distortion Strength</Label>
                    <Slider defaultValue={[0.5]} max={1} step={0.01} />
                  </div>
                </div>
              )}
              {activeTab === "swipe" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Swipe Thresholds</h3>
                  <div className="space-y-2">
                    <Label>Swipe Sensitivity</Label>
                    <Slider defaultValue={[50]} max={100} step={1} />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => updateSettingsMutation.mutate({})}>
                  <Save className="mr-2 h-4 w-4" /> Save Settings
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
