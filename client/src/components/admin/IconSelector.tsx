import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  EnhancedDialog, 
  EnhancedDialogContent, 
  EnhancedDialogHeader, 
  EnhancedDialogTitle,
  EnhancedDialogFooter,
  EnhancedDialogClose
} from "@/components/ui/enhanced-dialog";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { useQuery } from "@tanstack/react-query";
import type { MediaAsset } from "@shared/schema";
import { MediaQueryKeys } from "@/lib/media-query-keys";

interface IconSelectorProps {
  value?: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  placeholder?: string;
  allowCustom?: boolean;
}

const predefinedIcons = [
  { value: "BarChart3", label: "Bar Chart", icon: "📊" },
  { value: "TrendingUp", label: "Trending Up", icon: "📈" },
  { value: "Package", label: "Package", icon: "📦" },
  { value: "Users", label: "Users", icon: "👥" },
  { value: "Zap", label: "Lightning", icon: "⚡" },
  { value: "Globe", label: "Globe", icon: "🌍" },
  { value: "Award", label: "Award", icon: "🏆" },
  { value: "Shield", label: "Shield", icon: "🛡️" },
  { value: "Building2", label: "Building", icon: "🏢" },
  { value: "Truck", label: "Truck", icon: "🚚" },
  { value: "Leaf", label: "Leaf", icon: "🍃" },
  { value: "Recycle", label: "Recycle", icon: "♻️" },
];


export const IconSelector = React.memo(function IconSelector({ 
  value, 
  onChange, 
  label = "Icon", 
  placeholder = "Select an icon",
  allowCustom = true 
}: IconSelectorProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("predefined");
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const { data: mediaResponse } = useQuery<{ data: MediaAsset[] }>({
    queryKey: MediaQueryKeys.list,
  });
  
  const mediaAssets = mediaResponse?.data || [];
  const imageAssets = mediaAssets.filter((asset: MediaAsset) => asset.type === 'image');

  const getCurrentIconDisplay = () => {
    // Check if it's a predefined icon
    const predefinedIcon = predefinedIcons.find(icon => icon.value === value);
    if (predefinedIcon) {
      return (
        <div className="flex items-center gap-2">
          <span>{predefinedIcon.icon}</span>
          <span>{predefinedIcon.label}</span>
        </div>
      );
    }

    // Check if it's a custom media asset
    if (typeof value === 'number') {
      const mediaAsset = imageAssets.find((asset: MediaAsset) => asset.id === value);
      if (mediaAsset) {
        return (
          <div className="flex items-center gap-2">
            <img 
              src={`/api/media/${value}/content`} 
              alt="Custom icon" 
              className="w-5 h-5 object-cover rounded"
            />
            <span>{mediaAsset.originalName || mediaAsset.filename}</span>
          </div>
        );
      }
    }

    return placeholder;
  };

  const handlePredefinedIconSelect = (iconValue: string) => {
    console.log("Predefined icon selected:", iconValue);
    onChange(iconValue);
    setIsDialogOpen(false);
  };

  const handleCustomIconSelect = (assets: MediaAsset[] | MediaAsset) => {
    // Handle both single asset and array cases from StandardMediaSelectionDialog
    const asset = Array.isArray(assets) ? assets[0] : assets;
    if (asset) {
      console.log("Custom icon selected:", asset.id);
      onChange(asset.id);
      setIsDialogOpen(false);
      setIsMediaPickerOpen(false);
    }
  };

  const handleOpenCustomSelection = () => {
    setIsMediaPickerOpen(true);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={() => setIsDialogOpen(true)}
        >
          {getCurrentIconDisplay()}
        </Button>
        
        <EnhancedDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <EnhancedDialogContent contentType="form" preferredSize="2xl">
            <EnhancedDialogHeader>
              <EnhancedDialogTitle>Select Icon</EnhancedDialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose from predefined icons or upload a custom image to represent your content
              </p>
            </EnhancedDialogHeader>
            
            <div className="flex-1 overflow-hidden">
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
                <TabsList className={`grid w-full ${allowCustom ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <TabsTrigger value="predefined">Predefined Icons</TabsTrigger>
                  {allowCustom && <TabsTrigger value="custom">Custom Icons</TabsTrigger>}
                </TabsList>
                
                <TabsContent value="predefined" className="mt-4 flex-1 overflow-hidden">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto">
                    {predefinedIcons.map((icon) => (
                      <Card 
                        key={icon.value}
                        className={`cursor-pointer transition-all hover:bg-accent ${
                          value === icon.value ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handlePredefinedIconSelect(icon.value)}
                        data-testid={`icon-option-${icon.value}`}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl mb-2">{icon.icon}</div>
                          <div className="text-sm font-medium">{icon.label}</div>
                          <div className="text-xs text-muted-foreground">{icon.value}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                {allowCustom && (
                  <TabsContent value="custom" className="mt-4 flex-1 overflow-hidden">
                    <div className="text-center py-8">
                      <Button 
                        onClick={handleOpenCustomSelection}
                        data-testid="button-browse-media"
                      >
                        Browse Media Library
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        Select a custom image from your media library
                      </p>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
            
            <EnhancedDialogFooter>
              <EnhancedDialogClose asChild>
                <Button variant="outline" data-testid="button-cancel">
                  Cancel
                </Button>
              </EnhancedDialogClose>
            </EnhancedDialogFooter>
          </EnhancedDialogContent>
        </EnhancedDialog>
        
        {allowCustom && (
          <StandardMediaSelectionDialog
            isOpen={isMediaPickerOpen}
            onClose={() => setIsMediaPickerOpen(false)}
            onSelect={handleCustomIconSelect}
            title="Select Custom Icon"
            mediaPickerTarget="iconSelector"
            selectionMode="single"
          />
        )}
      </div>
    </div>
  );
});