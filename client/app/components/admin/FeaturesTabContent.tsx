import type { UnifiedSustainability } from "@shared/index";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface FeaturesTabContentProps {
  localForm: Partial<UnifiedSustainability>;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
  onSave: () => void;
}

interface Feature {
  title: string;
  description: string;
}

export function FeaturesTabContent(props: FeaturesTabContentProps) {
  const { localForm, hasUnsavedChanges, isPending, onLocalUpdate, onSave } = props;
  const highlightedFeatures = (localForm.data?.highlightedFeatures as Feature[]) || [];

  const addFeature = () => {
    const newFeature = {
      title: "New Feature",
      description: "Feature description",
    };
    onLocalUpdate({
      data: {
        ...localForm.data,
        highlightedFeatures: [...highlightedFeatures, newFeature],
      },
    });
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const updatedFeatures = [...highlightedFeatures];
    updatedFeatures[index] = { ...updatedFeatures[index], [field]: value } as Feature;
    onLocalUpdate({
      data: {
        ...localForm.data,
        highlightedFeatures: updatedFeatures,
      },
    });
  };

  const removeFeature = (index: number) => {
    const updatedFeatures = highlightedFeatures.filter((_, i) => i !== index);
    onLocalUpdate({
      data: {
        ...localForm.data,
        highlightedFeatures: updatedFeatures,
      },
    });
  };

  return (
    <TabsContent value="features" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sustainability Features</CardTitle>
          <CardDescription>Manage the highlighted sustainability features section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="featuresTitle">Section Title</Label>
              <Input
                id="featuresTitle"
                value={localForm.featuresTitle || ""}
                onChange={(e) => onLocalUpdate({ featuresTitle: e.target.value })}
                placeholder="e.g., Our Sustainability Features"
              />
            </div>
            <div>
              <Label htmlFor="featuresDescription">Section Description</Label>
              <Textarea
                id="featuresDescription"
                value={localForm.featuresDescription || ""}
                onChange={(e) => onLocalUpdate({ featuresDescription: e.target.value })}
                placeholder="Description for the features section"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Highlighted Features</Label>
              <Button variant="outline" size="sm" onClick={addFeature}>
                <Plus className="mr-2 h-4 w-4" />
                Add Feature
              </Button>
            </div>

            {highlightedFeatures.length === 0 ? (
              <div className="rounded-lg border bg-stone-50 py-8 text-center text-stone-500">
                No features added yet. Click "Add Feature" to start.
              </div>
            ) : (
              <div className="grid gap-4">
                {highlightedFeatures.map((feature, index) => (
                  <div key={index} className="group relative rounded-lg border bg-stone-50 p-4">
                    <div className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-stone-500 text-xs">Title</Label>
                        <Input
                          value={feature.title}
                          onChange={(e) => updateFeature(index, "title", e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-stone-500 text-xs">Description</Label>
                        <Textarea
                          value={feature.description}
                          onChange={(e) => updateFeature(index, "description", e.target.value)}
                          className="bg-white"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <div className="flex justify-end border-t p-4">
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? "Saving..." : "Save Features Section"}
          </Button>
        </div>
      </Card>
    </TabsContent>
  );
}
