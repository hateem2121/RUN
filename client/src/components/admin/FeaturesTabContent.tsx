import type { UnifiedSustainability } from "@shared/schema";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function FeaturesTabContent({
  localForm,
  hasUnsavedChanges,
  isPending,
  onLocalUpdate,
  onSave,
}: FeaturesTabContentProps) {
  const highlightedFeatures = (localForm.data?.highlightedFeatures as any[]) || [];

  const addFeature = () => {
    const newFeature = { title: "New Feature", description: "Feature description" };
    onLocalUpdate({
      data: {
        ...localForm.data,
        highlightedFeatures: [...highlightedFeatures, newFeature],
      },
    });
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const updatedFeatures = [...highlightedFeatures];
    updatedFeatures[index] = { ...updatedFeatures[index], [field]: value };
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
          <CardDescription>
            Manage the highlighted sustainability features section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="featuresTitle">Section Title</Label>
              <Input
                id="featuresTitle"
                value={localForm.featuresTitle || ""}
                onChange={(e) =>
                  onLocalUpdate({ featuresTitle: e.target.value })
                }
                placeholder="e.g., Our Sustainability Features"
              />
            </div>
            <div>
              <Label htmlFor="featuresDescription">Section Description</Label>
              <Textarea
                id="featuresDescription"
                value={localForm.featuresDescription || ""}
                onChange={(e) =>
                  onLocalUpdate({ featuresDescription: e.target.value })
                }
                placeholder="Description for the features section"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Highlighted Features</Label>
              <Button variant="outline" size="sm" onClick={addFeature}>
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </div>
            
            {highlightedFeatures.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-stone-50 text-stone-500">
                No features added yet. Click "Add Feature" to start.
              </div>
            ) : (
              <div className="grid gap-4">
                {highlightedFeatures.map((feature, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-stone-50 relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-stone-500">Title</Label>
                        <Input
                          value={feature.title}
                          onChange={(e) => updateFeature(index, "title", e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-stone-500">Description</Label>
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
        <div className="flex justify-end p-4 border-t">
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
