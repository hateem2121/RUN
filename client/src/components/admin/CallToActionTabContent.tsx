import type { UnifiedSustainability } from "@shared/schema";
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

interface CallToActionTabContentProps {
  localForm: Partial<UnifiedSustainability>;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
  onSave: () => void;
}

export function CallToActionTabContent({
  localForm,
  hasUnsavedChanges,
  isPending,
  onLocalUpdate,
  onSave,
}: CallToActionTabContentProps) {
  return (
    <TabsContent value="cta" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Call to Action Section</CardTitle>
          <CardDescription>
            Manage the bottom Call to Action (CTA) section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="callToActionTitle">Title</Label>
            <Input
              id="callToActionTitle"
              value={localForm.callToActionTitle || ""}
              onChange={(e) =>
                onLocalUpdate({ callToActionTitle: e.target.value })
              }
              placeholder="e.g., Join Our Sustainable Journey"
            />
          </div>
          <div>
            <Label htmlFor="callToActionDescription">Description</Label>
            <Textarea
              id="callToActionDescription"
              value={localForm.callToActionDescription || ""}
              onChange={(e) =>
                onLocalUpdate({ callToActionDescription: e.target.value })
              }
              placeholder="Description for the CTA section"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="callToActionButtonText">Button Text</Label>
              <Input
                id="callToActionButtonText"
                value={localForm.callToActionButtonText || ""}
                onChange={(e) =>
                  onLocalUpdate({ callToActionButtonText: e.target.value })
                }
                placeholder="e.g., Get Started"
              />
            </div>
            <div>
              <Label htmlFor="callToActionButtonLink">Button Link</Label>
              <Input
                id="callToActionButtonLink"
                value={localForm.callToActionButtonLink || ""}
                onChange={(e) =>
                  onLocalUpdate({ callToActionButtonLink: e.target.value })
                }
                placeholder="e.g., /contact"
              />
            </div>
          </div>
        </CardContent>
        <div className="flex justify-end p-4 border-t">
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? "Saving..." : "Save CTA Section"}
          </Button>
        </div>
      </Card>
    </TabsContent>
  );
}
