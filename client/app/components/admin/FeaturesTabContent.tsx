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
      <Card className="glass-premium">
        <CardHeader className="border-b border-emerald-500/10 mb-6 pb-6">
          <CardTitle className="text-xl font-bold text-white tracking-tight">
            Sustainability Features
          </CardTitle>
          <CardDescription className="text-sm text-admin-muted">
            Manage the highlighted sustainability features section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="featuresTitle"
                className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
              >
                Section Title
              </Label>
              <Input
                id="featuresTitle"
                value={localForm.featuresTitle || ""}
                onChange={(e) => onLocalUpdate({ featuresTitle: e.target.value })}
                className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-500/50"
                placeholder="e.g., Our Sustainability Features"
              />
            </div>
            <div>
              <Label
                htmlFor="featuresDescription"
                className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
              >
                Section Description
              </Label>
              <Textarea
                id="featuresDescription"
                value={localForm.featuresDescription || ""}
                onChange={(e) => onLocalUpdate({ featuresDescription: e.target.value })}
                className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-500/50 resize-none min-h-[80px]"
                placeholder="Description for the features section"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                Highlighted Features
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addFeature}
                className="bg-white/5 border-white/10 text-admin-muted hover:bg-white/10 hover:text-white rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Feature
              </Button>
            </div>

            {highlightedFeatures.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] py-8 text-center text-admin-muted backdrop-blur-xl">
                No features added yet. Click "Add Feature" to start.
              </div>
            ) : (
              <div className="grid gap-4">
                {highlightedFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl transition-all hover:border-emerald-500/30"
                  >
                    <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg"
                        onClick={() => removeFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-4 max-w-[90%]">
                      <div>
                        <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Title
                        </Label>
                        <Input
                          value={feature.title}
                          onChange={(e) => updateFeature(index, "title", e.target.value)}
                          className="bg-white/5 border-white/10 text-white rounded-lg focus:ring-emerald-500/50 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                          Description
                        </Label>
                        <Textarea
                          value={feature.description}
                          onChange={(e) => updateFeature(index, "description", e.target.value)}
                          className="bg-white/5 border-white/10 text-white rounded-lg focus:ring-emerald-500/50 resize-none mt-1"
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
        <div className="flex justify-end border-t border-white/10 p-6">
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold tracking-widest uppercase text-xxs h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            {isPending ? "Connecting..." : "Sync Feature Config"}
          </Button>
        </div>
      </Card>
    </TabsContent>
  );
}
