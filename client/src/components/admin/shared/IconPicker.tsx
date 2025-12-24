import {
  Droplets,
  Leaf,
  type LucideIcon,
  Recycle,
  Target,
  TreePine,
  TrendingUp,
  Wind,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  EnhancedDialog,
  EnhancedDialogContent,
  EnhancedDialogDescription,
  EnhancedDialogHeader,
  EnhancedDialogTitle,
} from "@/components/ui/enhanced-dialog";
import { Label } from "@/components/ui/label";

export interface IconOption {
  name: string;
  component: LucideIcon;
  label: string;
}

// Comprehensive icon library for sustainability content
export const SUSTAINABILITY_ICONS: IconOption[] = [
  { name: "Leaf", component: Leaf, label: "Leaf (Default)" },
  { name: "Droplets", component: Droplets, label: "Water/Droplets" },
  { name: "Wind", component: Wind, label: "Wind/Air" },
  { name: "Recycle", component: Recycle, label: "Recycle" },
  { name: "TreePine", component: TreePine, label: "Tree/Pine" },
  { name: "Target", component: Target, label: "Target/Goal" },
  { name: "TrendingUp", component: TrendingUp, label: "Trending Up" },
];

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (iconName: string) => void;
  currentIcon?: string;
  title?: string;
}

export function IconPicker({
  isOpen,
  onClose,
  onSelect,
  currentIcon = "Leaf",
  title = "Select Icon",
}: IconPickerProps) {
  const [selectedIcon, setSelectedIcon] = useState<string>(currentIcon);

  const handleSelect = () => {
    onSelect(selectedIcon);
    onClose();
  };

  return (
    <EnhancedDialog open={isOpen} onOpenChange={onClose}>
      <EnhancedDialogContent contentType="form" aria-describedby="icon-picker-description">
        <EnhancedDialogHeader>
          <EnhancedDialogTitle>{title}</EnhancedDialogTitle>
          <EnhancedDialogDescription id="icon-picker-description">
            Choose an icon that best represents your content
          </EnhancedDialogDescription>
        </EnhancedDialogHeader>

        <div className="space-y-4">
          <Label className="font-medium text-base">Available Icons</Label>
          <div className="grid grid-cols-3 gap-3">
            {SUSTAINABILITY_ICONS.map((icon) => {
              const IconComponent = icon.component;
              const isSelected = selectedIcon === icon.name;

              return (
                <button
                  key={icon.name}
                  onClick={() => setSelectedIcon(icon.name)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:scale-105 ${
                    isSelected
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className={`rounded-lg p-2 ${isSelected ? "bg-green-100" : "bg-white"}`}>
                    <IconComponent
                      className={`h-6 w-6 ${isSelected ? "text-green-600" : "text-gray-600"}`}
                    />
                  </div>
                  <span
                    className={`text-center font-medium text-xs leading-tight ${
                      isSelected ? "text-green-700" : "text-gray-700"
                    }`}
                  >
                    {icon.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div className="border-t pt-4">
            <Label className="text-gray-600 text-sm">Preview</Label>
            <div className="mt-2 flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              {(() => {
                const PreviewIcon =
                  SUSTAINABILITY_ICONS.find((i) => i.name === selectedIcon)?.component || Leaf;
                return (
                  <>
                    <div className="rounded-lg bg-green-100 p-2">
                      <PreviewIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Sample Content</div>
                      <div className="text-gray-600 text-sm">This is how your icon will appear</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSelect} className="flex-1 bg-green-600 hover:bg-green-700">
            Select Icon
          </Button>
        </div>
      </EnhancedDialogContent>
    </EnhancedDialog>
  );
}

// Utility function to get icon component by name
export function getIconComponent(iconName: string | null | undefined): LucideIcon {
  const icon = SUSTAINABILITY_ICONS.find((i) => i.name === iconName);
  return icon?.component || Leaf;
}

// Helper component for displaying selected icon
interface IconDisplayProps {
  iconName: string | null | undefined;
  className?: string;
  showBackground?: boolean;
}

export function IconDisplay({
  iconName,
  className = "w-5 h-5",
  showBackground = false,
}: IconDisplayProps) {
  const IconComponent = getIconComponent(iconName);

  if (showBackground) {
    return (
      <div className="rounded-lg bg-green-100 p-2">
        <IconComponent className={`${className} text-green-600`} />
      </div>
    );
  }

  return <IconComponent className={`${className} text-green-600`} />;
}
