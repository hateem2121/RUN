import type {
  HomepageFeaturedProductsSettings,
  InsertHomepageFeaturedProductsSettings,
} from "@shared/index";
import { Save, Settings2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/admin/shared/GlassCard";
import { Button } from "@/components/ui/button";
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

  const handleChange = <K extends keyof InsertHomepageFeaturedProductsSettings>(
    field: K,
    value: InsertHomepageFeaturedProductsSettings[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    updateFeaturedSettings.mutate(formData, {
      onSuccess: () => setIsDirty(false),
    });
  };

  return (
    <TabsContent value="featured" className="mt-0 focus-visible:outline-none outline-none">
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Showcase Configuration
                </h2>
                <p className="text-sm text-admin-muted">
                  Configure the primary product spotlight on the global storefront.
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!isDirty || updateFeaturedSettings.isPending}
              className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold uppercase text-xxs tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all outline-none border-0"
            >
              {updateFeaturedSettings.isPending ? (
                "Deploying Configuration..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Deploy Configuration
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-8 max-w-4xl">
            {/* Primary Settings */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled ?? true}
                  onCheckedChange={(checked) => handleChange("isEnabled", checked)}
                  className="data-[state=checked]:bg-blue-500"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="isEnabled"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                  >
                    Broadcast Status
                  </Label>
                  <p className="text-xs text-admin-muted">
                    Activate the product showcase section on the homepage
                  </p>
                </div>
              </div>

              <div className="grid gap-6 p-6 rounded-2xl border border-white/10 bg-white/[0.01]">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="h-4 w-4 text-admin-muted" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Display Parameters
                  </h3>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Showcase Heading
                  </Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => handleChange("title", e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="maxProducts"
                      className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                    >
                      Inventory Limit
                    </Label>
                    <Input
                      id="maxProducts"
                      type="number"
                      value={formData.maxProducts ?? 8}
                      onChange={(e) =>
                        handleChange("maxProducts", parseInt(e.target.value, 10) || 0)
                      }
                      className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="sortBy"
                      className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                    >
                      Curation Logic
                    </Label>
                    <Select
                      value={formData.sortBy || "featured"}
                      onValueChange={(value) => handleChange("sortBy", value)}
                    >
                      <SelectTrigger
                        id="sortBy"
                        className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-11"
                      >
                        <SelectValue placeholder="Select logic" />
                      </SelectTrigger>
                      <SelectContent className="bg-surface-black border-white/10 text-white">
                        <SelectItem
                          value="featured"
                          className="focus:bg-white/10 focus:text-white cursor-pointer"
                        >
                          Algorithm: Featured
                        </SelectItem>
                        <SelectItem
                          value="newest"
                          className="focus:bg-white/10 focus:text-white cursor-pointer"
                        >
                          Algorithm: Chronological (Newest)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-white/5">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="autoSelect"
                      checked={formData.autoSelect ?? true}
                      onCheckedChange={(checked) => handleChange("autoSelect", checked)}
                      className="data-[state=checked]:bg-blue-500"
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="autoSelect"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                      >
                        Dynamic Curation
                      </Label>
                      <p className="text-xs text-admin-muted">
                        Automatically select products based on the defined curation logic
                      </p>
                    </div>
                  </div>
                  {!formData.autoSelect && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 flex items-start gap-2">
                      <Settings2 className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>
                        Manual curation array is currently disabled. The system will fallback to the
                        dynamic curation algorithm.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </TabsContent>
  );
}
