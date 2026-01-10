import type { UnifiedSustainability } from "@shared/schema";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface HeroTabContentProps {
  localForm: Partial<UnifiedSustainability>;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
  onSave: () => void;
  onOpenMediaPicker: () => void;
}

export function HeroTabContent({
  localForm,
  hasUnsavedChanges,
  isPending,
  onLocalUpdate,
  onSave,
  onOpenMediaPicker,
}: HeroTabContentProps) {
  return (
    <TabsContent value="hero" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
          <CardDescription>Main hero section for the dedicated sustainability page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={localForm.data?.headline || ""}
              onChange={(e) =>
                onLocalUpdate({
                  data: { ...localForm.data, headline: e.target.value },
                })
              }
              placeholder="Main headline for sustainability page"
            />
          </div>
          <div>
            <Label htmlFor="subheadline">Subheadline</Label>
            <Textarea
              id="subheadline"
              value={localForm.data?.subheadline || ""}
              onChange={(e) =>
                onLocalUpdate({
                  data: {
                    ...localForm.data,
                    subheadline: e.target.value,
                  },
                })
              }
              placeholder="Supporting text for the headline"
              rows={3}
            />
          </div>
          <div>
            <Label>Background Media</Label>
            <div className="mt-2">
              {localForm.data?.backgroundMediaId ? (
                <div className="flex items-center gap-3">
                  <div className="text-muted-foreground text-sm">
                    Media ID: {localForm.data?.backgroundMediaId}
                  </div>
                  <Button variant="outline" size="sm" onClick={onOpenMediaPicker}>
                    Change Media
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={onOpenMediaPicker}>
                  <Plus className="mr-2 h-4 w-4" />
                  Select Background Media
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ctaText">CTA Text</Label>
              <Input
                id="ctaText"
                value={localForm.data?.ctaText || ""}
                onChange={(e) =>
                  onLocalUpdate({
                    data: { ...localForm.data, ctaText: e.target.value },
                  })
                }
                placeholder="Call-to-action button text"
              />
            </div>
            <div>
              <Label htmlFor="ctaLink">CTA Link</Label>
              <Input
                id="ctaLink"
                value={localForm.data?.ctaLink || ""}
                onChange={(e) =>
                  onLocalUpdate({
                    data: { ...localForm.data, ctaLink: e.target.value },
                  })
                }
                placeholder="Call-to-action link URL"
              />
            </div>
          </div>
        </CardContent>
        <div className="flex justify-end border-t p-4">
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? "Saving..." : "Save Hero Section"}
          </Button>
        </div>
      </Card>
    </TabsContent>
  );
}
