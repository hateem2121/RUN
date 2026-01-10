import {
  type InsertNavigationItem,
  insertNavigationItemSchema,
  type MediaAsset,
  type NavigationItem,
} from "@shared/schema";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconBrandTabler,
  IconBuildingStore,
  IconCategory,
  IconCertificate,
  IconCpu,
  IconDatabase,
  IconFileFilled,
  IconHeart,
  IconHome,
  IconInfoCircle,
  IconLeaf,
  IconMail,
  IconMenu2,
  IconMinus,
  IconNavigation,
  IconPalette,
  IconPhone,
  IconPhoto,
  IconPlus,
  IconRuler,
  IconSearch,
  IconSettings,
  IconShirt,
  IconShoppingCart,
  IconStar,
  IconTool,
  IconUser,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { Image } from "lucide-react";
import { useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
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
import { useToast } from "@/hooks/use-toast";
import { MediaQueryKeys } from "@/lib/media-query-keys";

// Common navigation icons with their display names
const TABLER_ICONS = [
  { value: "IconHome", label: "Home", component: IconHome },
  {
    value: "IconShoppingCart",
    label: "Shopping Cart",
    component: IconShoppingCart,
  },
  { value: "IconCategory", label: "Categories", component: IconCategory },
  { value: "IconShirt", label: "Products", component: IconShirt },
  { value: "IconPhoto", label: "Media", component: IconPhoto },
  { value: "IconBolt", label: "Accessories", component: IconBolt },
  { value: "IconLeaf", label: "Sustainability", component: IconLeaf },
  { value: "IconTool", label: "Manufacturing", component: IconTool },
  { value: "IconCpu", label: "Technology", component: IconCpu },
  { value: "IconBuildingStore", label: "Store", component: IconBuildingStore },
  { value: "IconMail", label: "Contact", component: IconMail },
  { value: "IconPhone", label: "Phone", component: IconPhone },
  { value: "IconInfoCircle", label: "About", component: IconInfoCircle },
  { value: "IconUser", label: "Profile", component: IconUser },
  { value: "IconSettings", label: "Settings", component: IconSettings },
  { value: "IconHeart", label: "Favorites", component: IconHeart },
  { value: "IconStar", label: "Featured", component: IconStar },
  { value: "IconSearch", label: "Search", component: IconSearch },
  { value: "IconMenu2", label: "Menu", component: IconMenu2 },
  { value: "IconNavigation", label: "Navigation", component: IconNavigation },
  { value: "IconDatabase", label: "Database", component: IconDatabase },
  { value: "IconFileFilled", label: "Files", component: IconFileFilled },
  {
    value: "IconCertificate",
    label: "Certificates",
    component: IconCertificate,
  },
  { value: "IconRuler", label: "Size Charts", component: IconRuler },
  { value: "IconPalette", label: "Design", component: IconPalette },
  { value: "IconBrandTabler", label: "Dashboard", component: IconBrandTabler },
  { value: "IconArrowRight", label: "Arrow Right", component: IconArrowRight },
  { value: "IconArrowLeft", label: "Arrow Left", component: IconArrowLeft },
  { value: "IconPlus", label: "Add", component: IconPlus },
  { value: "IconMinus", label: "Remove", component: IconMinus },
];

interface NavigationFormProps {
  item?: NavigationItem;
  onSubmit: (data: InsertNavigationItem) => void;
  onCancel: () => void;
}

export function NavigationForm({ item, onSubmit, onCancel }: NavigationFormProps) {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<InsertNavigationItem>({
    // Primary fields for validation schema
    title: item?.label || item?.title || "",
    href: item?.url || item?.href || "",
    // Keep label for TypeScript compatibility with database type
    label: item?.label || item?.title || "",
    iconType: (item?.iconType as "media" | "fallback") || "fallback",
    iconSize: (item?.iconSize as "small" | "medium" | "large") || "medium",
    fallbackIcon: item?.fallbackIcon || "IconHome",
    mediaIconId: item?.mediaIconId || null,
    isActive: item?.isActive ?? true,
    sortOrder: item?.sortOrder || 0,
    showOnDesktop: item?.showOnDesktop ?? true,
    showOnMobile: item?.showOnMobile ?? true,
  });

  const { data: mediaResponse } = useQuery<{
    success: boolean;
    data: { data: MediaAsset[]; pagination: any };
  }>({
    queryKey: MediaQueryKeys.list,
  });

  const mediaAssets = mediaResponse?.data?.data || [];
  const imageAssets = mediaAssets.filter((asset) => asset.type === "image");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation before API submission
    const validation = insertNavigationItemSchema.safeParse(formData);

    if (!validation.success) {
      // Display validation errors
      const errors = validation.error.issues
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: errors,
      });
      return;
    }

    // Validation passed - proceed with submission
    onSubmit(formData);
  };

  const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (asset) {
      setFormData({ ...formData, mediaIconId: asset.id });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Navigation Title</Label>
          <Input
            id="title"
            value={formData.title || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                title: e.target.value,
                label: e.target.value,
              })
            }
            required
          />
        </div>

        <div>
          <Label htmlFor="href">Link URL</Label>
          <Input
            id="href"
            value={formData.href || ""}
            onChange={(e) => setFormData({ ...formData, href: e.target.value })}
            placeholder="/products"
            required
          />
        </div>

        <div>
          <Label htmlFor="iconType">Icon Type</Label>
          <Select
            value={formData.iconType || "fallback"}
            onValueChange={(value: "media" | "fallback") =>
              setFormData({ ...formData, iconType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fallback">Library Icon</SelectItem>
              <SelectItem value="media">Custom Media</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="iconSize">Icon Size</Label>
          <Select
            value={formData.iconSize || "medium"}
            onValueChange={(value: "small" | "medium" | "large") =>
              setFormData({ ...formData, iconSize: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select icon size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small (32×32px)</SelectItem>
              <SelectItem value="medium">Medium (48×48px)</SelectItem>
              <SelectItem value="large">Large (64×64px)</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-1 text-muted-foreground text-xs">
            Controls the maximum size of navigation icons in the floating dock
          </p>
        </div>

        {formData.iconType === "fallback" && (
          <div>
            <Label htmlFor="fallbackIcon">Select Icon</Label>
            <Select
              value={formData.fallbackIcon || ""}
              onValueChange={(value) => setFormData({ ...formData, fallbackIcon: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an icon">
                  {formData.fallbackIcon && (
                    <div className="flex items-center gap-2">
                      {(() => {
                        const selectedIcon = TABLER_ICONS.find(
                          (icon) => icon.value === formData.fallbackIcon,
                        );
                        if (selectedIcon) {
                          const IconComponent = selectedIcon.component;
                          return (
                            <>
                              <IconComponent className="h-4 w-4" />
                              <span>{selectedIcon.label}</span>
                            </>
                          );
                        }
                        return formData.fallbackIcon;
                      })()}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {TABLER_ICONS.map((icon) => {
                  const IconComponent = icon.component;
                  return (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{icon.label}</span>
                        <span className="ml-auto text-muted-foreground text-xs">{icon.value}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="mt-1 text-muted-foreground text-xs">
              Select from available Tabler Icons for navigation
            </p>
          </div>
        )}

        {formData.iconType === "media" && (
          <div>
            <Label htmlFor="mediaIcon">Select Media Icon</Label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsMediaPickerOpen(true)}
                data-testid="button-open-media-picker"
              >
                <Image className="mr-2 h-4 w-4" />
                {formData.mediaIconId ? "Change Icon" : "Browse Media Library"}
              </Button>
              {formData.mediaIconId && (
                <div className="flex items-center space-x-2 rounded-md bg-background p-2 dark:bg-neutral-800">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted/20">
                    <img
                      src={
                        imageAssets.find((a) => a.id === formData.mediaIconId)?.url ||
                        (formData.mediaIconId && formData.mediaIconId < 1000000000000
                          ? `/api/media/${formData.mediaIconId}/content`
                          : undefined)
                      }
                      alt={
                        imageAssets.find((a) => a.id === formData.mediaIconId)?.originalName ||
                        "Navigation icon"
                      }
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span
                    className="text-muted-foreground text-sm dark:text-muted-foreground/50"
                    data-testid="text-media-icon-preview"
                  >
                    {imageAssets.find((a) => a.id === formData.mediaIconId)?.originalName}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({ ...formData, mediaIconId: null })}
                    data-testid="button-remove-media-icon"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            value={formData.sortOrder?.toString() || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                sortOrder: e.target.value ? parseInt(e.target.value, 10) : undefined,
              })
            }
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive || false}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label htmlFor="isActive">Active</Label>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit">{item ? "Update" : "Create"} Navigation Item</Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>

      {/* StandardMediaSelectionDialog */}
      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Navigation Icon"
        mediaPickerTarget="navigation-icon"
        selectionMode="single"
        initialSelectedIds={[formData.mediaIconId!].filter(Boolean)}
      />
    </>
  );
}
