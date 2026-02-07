
import { useState } from "react";
import { type HomepageSection } from "@shared/schema";
import { useAdminHomepageMutations } from "@/hooks/use-admin-homepage-mutations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface HomepageSectionsTabProps {
  sections: HomepageSection[];
}

export function HomepageSectionsTab({ sections }: HomepageSectionsTabProps) {
  const { updateSection } = useAdminHomepageMutations();
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);

  // Helper to get friendly name
  const getFriendlyName = (name: string) => {
    return name
      .replace(/-/g, " ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <TabsContent value="sections" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Homepage Sections</CardTitle>
          <CardDescription>Manage content for various homepage sections.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <div className="font-medium">{getFriendlyName(section.name)}</div>
                  <div className="text-muted-foreground text-sm line-clamp-1">
                    {section.content}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                        <Switch
                            checked={section.isActive ?? true}
                            onCheckedChange={(checked) => 
                                updateSection.mutate({ id: section.id, data: { isActive: checked } })
                            }
                        />
                        <span className="text-sm text-muted-foreground">{section.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  <Button variant="outline" size="sm" onClick={() => setEditingSection(section)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Content
                  </Button>
                </div>
              </div>
            ))}
            {sections.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                    No sections found. Sections are typically pre-seeded.
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingSection && (
        <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit {getFriendlyName(editingSection.name)}</DialogTitle>
              <DialogDescription>
                Update the content for this section.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-content">Content</Label>
                  <Textarea
                    id="edit-content"
                    className="min-h-[200px]"
                    value={editingSection.content || ""}
                    onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                  />
                </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => {
                   updateSection.mutate({ id: editingSection.id, data: { content: editingSection.content } });
                   setEditingSection(null);
                }}
                disabled={updateSection.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TabsContent>
  );
}
