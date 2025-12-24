import type { UnifiedSustainability } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface SectionHeadersTabContentProps {
  localForm: Partial<UnifiedSustainability>;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
  onSave: () => void;
}

export function SectionHeadersTabContent({
  localForm,
  hasUnsavedChanges,
  isPending,
  onLocalUpdate,
  onSave,
}: SectionHeadersTabContentProps) {
  return (
    <TabsContent value="headers" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Section Headers</CardTitle>
          <CardDescription>
            Manage titles and descriptions for various sections of the page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Metrics Section */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="font-medium text-lg">Metrics Section</h3>
            <div>
              <Label htmlFor="metricsTitle">Title</Label>
              <Input
                id="metricsTitle"
                value={localForm.metricsTitle || ""}
                onChange={(e) => onLocalUpdate({ metricsTitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="metricsDescription">Description</Label>
              <Textarea
                id="metricsDescription"
                value={localForm.metricsDescription || ""}
                onChange={(e) => onLocalUpdate({ metricsDescription: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Initiatives Section */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="font-medium text-lg">Initiatives Section</h3>
            <div>
              <Label htmlFor="initiativesTitle">Title</Label>
              <Input
                id="initiativesTitle"
                value={localForm.initiativesTitle || ""}
                onChange={(e) => onLocalUpdate({ initiativesTitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="initiativesDescription">Description</Label>
              <Textarea
                id="initiativesDescription"
                value={localForm.initiativesDescription || ""}
                onChange={(e) => onLocalUpdate({ initiativesDescription: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Certifications Section */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="font-medium text-lg">Certifications Section</h3>
            <div>
              <Label htmlFor="certificationsTitle">Title</Label>
              <Input
                id="certificationsTitle"
                value={localForm.certificationsTitle || ""}
                onChange={(e) => onLocalUpdate({ certificationsTitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="certificationsDescription">Description</Label>
              <Textarea
                id="certificationsDescription"
                value={localForm.certificationsDescription || ""}
                onChange={(e) => onLocalUpdate({ certificationsDescription: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="certificationsFooterNote">Footer Note</Label>
              <Textarea
                id="certificationsFooterNote"
                value={localForm.certificationsFooterNote || ""}
                onChange={(e) => onLocalUpdate({ certificationsFooterNote: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Goals Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Goals Section</h3>
            <div>
              <Label htmlFor="goalsTitle">Title</Label>
              <Input
                id="goalsTitle"
                value={localForm.goalsTitle || ""}
                onChange={(e) => onLocalUpdate({ goalsTitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="goalsDescription">Description</Label>
              <Textarea
                id="goalsDescription"
                value={localForm.goalsDescription || ""}
                onChange={(e) => onLocalUpdate({ goalsDescription: e.target.value })}
                rows={2}
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
            {isPending ? "Saving..." : "Save Section Headers"}
          </Button>
        </div>
      </Card>
    </TabsContent>
  );
}
