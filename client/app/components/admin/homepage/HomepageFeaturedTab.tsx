import type {
  HomepageFeaturedProductsSettings,
  InsertHomepageFeaturedProductsSettings,
} from "@shared/schema";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { useAdminHomepageMutations } from "@/hooks/use-admin-homepage-mutations";

interface HomepageFeaturedTabProps {
  settings: HomepageFeaturedProductsSettings | undefined;
}

export function HomepageFeaturedTab({ settings }: HomepageFeaturedTabProps) {
  const { updateFeaturedSettings } = useAdminHomepageMutations();
  const [formData, setFormData] = useState<Partial<InsertHomepageFeaturedProductsSettings>>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        title: settings.title || "Featured Products",
        maxProducts: settings.maxProducts ?? 8,
        autoSelect: settings.autoSelect ?? true,
        sortBy: settings.sortBy || "featured",
        isEnabled: settings.isEnabled ?? true,
      });
      setIsDirty(false);
    }
  }, [settings]);

  const handleChange = (field: keyof InsertHomepageFeaturedProductsSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateFeaturedSettings.mutate(formData, {
      onSuccess: () => setIsDirty(false),
    });
  };

  return (
    <TabsContent value="featured" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Featured Products</CardTitle>
          <CardDescription>
            Configure how featured products are displayed on the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="isEnabled"
              checked={formData.isEnabled ?? true}
              onCheckedChange={(checked) => handleChange("isEnabled", checked)}
            />
            <Label htmlFor="isEnabled">Enable Featured Products Section</Label>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => handleChange("title", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="maxProducts">Max Products</Label>
                <Input
                  id="maxProducts"
                  type="number"
                  value={formData.maxProducts ?? 8}
                  onChange={(e) => handleChange("maxProducts", parseInt(e.target.value, 10) || 0)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sortBy">Sort By</Label>
                <Select
                  value={formData.sortBy || "featured"}
                  onValueChange={(value) => handleChange("sortBy", value)}
                >
                  <SelectTrigger id="sortBy">
                    <SelectValue placeholder="Select sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoSelect"
                checked={formData.autoSelect ?? true}
                onCheckedChange={(checked) => handleChange("autoSelect", checked)}
              />
              <Label htmlFor="autoSelect">Auto-select products (based on sorting)</Label>
            </div>
            {!formData.autoSelect && (
              <div className="text-sm text-amber-600">
                Manual selection is not yet implemented in this UI. Please use auto-select for now.
              </div>
            )}
          </div>
        </CardContent>
        <div className="flex justify-end border-t p-4">
          <Button onClick={handleSave} disabled={!isDirty || updateFeaturedSettings.isPending}>
            {updateFeaturedSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>
    </TabsContent>
  );
}
