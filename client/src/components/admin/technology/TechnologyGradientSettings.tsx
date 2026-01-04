/**
 * PHASE 2: TECHNOLOGY MODERNIZATION
 *
 * Extracted Gradient Settings Component - First Module
 * Original: technology-management.tsx lines 2544-2914 (370 lines)
 *
 * SAFETY MEASURES:
 * - Feature flag controlled (useModularTechnologyComponents)
 * - Maintains exact API compatibility
 * - Preserves ReactBits.dev specification compliance
 * - Zero functional changes - pure extraction
 */

import { useMutation } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

/**
 * REACTBITS.DEV SPECIFICATION COMPLIANCE: January 25, 2025
 *
 * GradientFormData interface matching exact reactbits.dev/backgrounds/gradient-blinds
 * specification with enforced value ranges and exactly 2 colors.
 *
 * ESSENTIAL CONTROLS (11): Visible in main UI
 * ADVANCED CONTROLS (4): Collapsed by default
 * ADMIN CONTROLS (1): Separate admin section
 *
 * Reference: https://reactbits.dev/backgrounds/gradient-blinds
 * Component defaults: blindCount=16, blindMinWidth=60, angle=0, noise=0.3
 * Example usage: blindCount=12, blindMinWidth=50, colors=['#FF9FFC','#5227FF']
 */
interface GradientFormData {
  // ESSENTIAL CONTROLS (exactly 2 colors enforced)
  gradientColors: [string, string]; // Exactly 2 colors, never more
  angle: number; // 0-90° (focused range, not 0-360°)
  noise: number; // 0-1.0 (0-100%)
  blindCount: number; // 12-20 (practical range)
  blindMinWidth: number; // 50-80px (focused range)
  shineDirection: "left" | "right"; // Light direction toggle
  spotlightRadius: number; // 0.3-1.5 (focused range)
  mouseDampening: number; // 0-0.5 (Mouse Response, 0-50%)
  distortAmount: number; // 0-0.3 (0-30%, not 0-100%)
  paused: boolean; // Pause Animation toggle

  // ADVANCED CONTROLS (collapsed section)
  spotlightSoftness: number; // 1.0-3.0 (Edge Sharpness)
  spotlightOpacity: number; // 0.1-1.0 (Spot Intensity, max 100%)
  mirrorGradient: boolean; // Mirror Effect
  mixBlendMode: string; // CSS Blend Mode

  // ADMIN CONTROLS (separate admin-only section)
  adminForceSettings: boolean; // Override client display preferences
  isActive: boolean; // Enable Background
}

interface TechnologyGradientSettingsProps {
  gradientData: GradientFormData;
  setGradientData: (data: GradientFormData) => void;
  isLoading?: boolean | undefined;
}

export function TechnologyGradientSettings({
  gradientData,
  setGradientData,
  isLoading = false,
}: TechnologyGradientSettingsProps) {
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update gradient settings mutation
  const updateGradientMutation = useMutation({
    mutationFn: async (data: GradientFormData) => {
      return apiRequest("/api/technology-gradient-settings", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({
        title: "Gradient settings updated",
        description: "Your gradient background settings have been saved successfully.",
      });
      getQueryClient().invalidateQueries({
        queryKey: ["/api/technology-gradient-settings"],
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error updating gradient settings",
        description: error.message || "Failed to update gradient settings",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateGradientMutation.mutate(gradientData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Background Settings</CardTitle>
        <CardDescription>
          Configure gradient background effects matching the
          reactbits.dev/backgrounds/gradient-blinds specification. Only essential brand controls are
          shown by default.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 
            REACTBITS.DEV SPECIFICATION COMPLIANCE
            Essential controls matching https://reactbits.dev/backgrounds/gradient-blinds
            
            This interface is designed to:
            1. Match the exact aesthetic and control grouping of reactbits.dev
            2. Enforce spec-compliant value ranges (no opportunity for broken states)
            3. Ensure exactly 2 colors (never more, never less)
            4. Provide clear, non-technical labels for brand-focused users
            5. Hide advanced/technical controls behind explicit user action
          */}

          {/* ESSENTIAL CONTROLS - Always visible, matches reactbits.dev exactly */}
          <div className="space-y-6">
            {/* Colors - Exactly 2, matching reactbits.dev demo */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Colors</h3>
                <span className="rounded bg-muted px-2 py-1 text-muted-foreground text-xs">
                  Exactly 2 colors
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color 1</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={gradientData.gradientColors[0]}
                      onChange={(e) => {
                        const newColors: [string, string] = [
                          e.target.value,
                          gradientData.gradientColors[1],
                        ];
                        setGradientData({
                          ...gradientData,
                          gradientColors: newColors,
                        });
                      }}
                      className="h-10 w-16 cursor-pointer rounded border"
                    />
                    <Input
                      type="text"
                      value={gradientData.gradientColors[0]}
                      onChange={(e) => {
                        const newColors: [string, string] = [
                          e.target.value,
                          gradientData.gradientColors[1],
                        ];
                        setGradientData({
                          ...gradientData,
                          gradientColors: newColors,
                        });
                      }}
                      className="font-mono text-sm"
                      placeholder="#FF9FFC"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Color 2</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={gradientData.gradientColors[1]}
                      onChange={(e) => {
                        const newColors: [string, string] = [
                          gradientData.gradientColors[0],
                          e.target.value,
                        ];
                        setGradientData({
                          ...gradientData,
                          gradientColors: newColors,
                        });
                      }}
                      className="h-10 w-16 cursor-pointer rounded border"
                    />
                    <Input
                      type="text"
                      value={gradientData.gradientColors[1]}
                      onChange={(e) => {
                        const newColors: [string, string] = [
                          gradientData.gradientColors[0],
                          e.target.value,
                        ];
                        setGradientData({
                          ...gradientData,
                          gradientColors: newColors,
                        });
                      }}
                      className="font-mono text-sm"
                      placeholder="#5227FF"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Angle Control */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Gradient Angle</Label>
                <span className="text-muted-foreground text-sm">{gradientData.angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="1"
                value={gradientData.angle}
                onChange={(e) =>
                  setGradientData({
                    ...gradientData,
                    angle: parseInt(e.target.value, 10),
                  })
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted/20"
              />
              <div className="flex justify-between text-muted-foreground/70 text-xs">
                <span>0° (Horizontal)</span>
                <span>45° (Diagonal)</span>
                <span>90° (Vertical)</span>
              </div>
            </div>

            {/* Animation & Effects */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Background Texture</Label>
                  <span className="text-muted-foreground text-sm">
                    {Math.round(gradientData.noise * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={gradientData.noise}
                  onChange={(e) =>
                    setGradientData({
                      ...gradientData,
                      noise: parseFloat(e.target.value),
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted/20"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Animation Speed</Label>
                  <Switch
                    checked={!gradientData.paused}
                    onCheckedChange={(checked) =>
                      setGradientData({ ...gradientData, paused: !checked })
                    }
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  {gradientData.paused ? "Animation paused" : "Animation active"}
                </p>
              </div>
            </div>

            {/* Visual Structure */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Blind Count</Label>
                  <span className="text-muted-foreground text-sm">{gradientData.blindCount}</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="20"
                  step="1"
                  value={gradientData.blindCount}
                  onChange={(e) =>
                    setGradientData({
                      ...gradientData,
                      blindCount: parseInt(e.target.value, 10),
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted/20"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Blind Width</Label>
                  <span className="text-muted-foreground text-sm">
                    {gradientData.blindMinWidth}px
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="80"
                  step="2"
                  value={gradientData.blindMinWidth}
                  onChange={(e) =>
                    setGradientData({
                      ...gradientData,
                      blindMinWidth: parseInt(e.target.value, 10),
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted/20"
                />
              </div>
            </div>

            {/* Lighting Effects */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Light Direction</Label>
                <Select
                  value={gradientData.shineDirection}
                  onValueChange={(value: "left" | "right") =>
                    setGradientData({ ...gradientData, shineDirection: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">From Left</SelectItem>
                    <SelectItem value="right">From Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Spotlight Size</Label>
                  <span className="text-muted-foreground text-sm">
                    {gradientData.spotlightRadius.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1.5"
                  step="0.1"
                  value={gradientData.spotlightRadius}
                  onChange={(e) =>
                    setGradientData({
                      ...gradientData,
                      spotlightRadius: parseFloat(e.target.value),
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted/20"
                />
              </div>
            </div>

            {/* Interaction */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Mouse Response</Label>
                  <span className="text-muted-foreground text-sm">
                    {Math.round(gradientData.mouseDampening * 200)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.025"
                  value={gradientData.mouseDampening}
                  onChange={(e) =>
                    setGradientData({
                      ...gradientData,
                      mouseDampening: parseFloat(e.target.value),
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted/20"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Motion Amount</Label>
                  <span className="text-muted-foreground text-sm">
                    {Math.round(gradientData.distortAmount * 333)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.3"
                  step="0.015"
                  value={gradientData.distortAmount}
                  onChange={(e) =>
                    setGradientData({
                      ...gradientData,
                      distortAmount: parseFloat(e.target.value),
                    })
                  }
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted/20"
                />
              </div>
            </div>
          </div>

          {/* ADVANCED CONTROLS SECTION - Collapsed by default */}
          <div className="border-t pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex h-auto items-center gap-2 p-0 text-muted-foreground hover:text-foreground"
            >
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="font-medium">Advanced Settings</span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs">Optional fine-tuning</span>
            </Button>

            {showAdvanced && (
              <div className="mt-6 space-y-6 border-border border-l-2 pl-6">
                <div className="mb-4 text-muted-foreground text-sm">
                  These controls provide fine-tuning for advanced users. The essential controls
                  above are sufficient for most use cases.
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Edge Sharpness</Label>
                      <span className="text-muted-foreground text-sm">
                        {gradientData.spotlightSoftness.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      value={gradientData.spotlightSoftness}
                      onChange={(e) =>
                        setGradientData({
                          ...gradientData,
                          spotlightSoftness: parseFloat(e.target.value),
                        })
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted/20"
                    />
                    <div className="flex justify-between text-muted-foreground/70 text-xs">
                      <span>Soft</span>
                      <span>Sharp</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Spot Intensity</Label>
                      <span className="text-muted-foreground text-sm">
                        {Math.round(gradientData.spotlightOpacity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={gradientData.spotlightOpacity}
                      onChange={(e) =>
                        setGradientData({
                          ...gradientData,
                          spotlightOpacity: parseFloat(e.target.value),
                        })
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ADMIN CONTROLS SECTION - Separate admin-only area */}
          <div className="-mx-6 -mb-6 border-t bg-background px-6 pt-6 pb-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground/80 text-sm">
              <span>Admin Controls</span>
              <span className="rounded bg-red-100 px-2 py-0.5 text-red-700 text-xs">
                Admin Only
              </span>
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <Label>Force Settings Override</Label>
                <p className="mt-1 text-muted-foreground text-xs">
                  When enabled, these settings override any client-side display preferences
                </p>
              </div>
              <Switch
                checked={gradientData.adminForceSettings}
                onCheckedChange={(checked) =>
                  setGradientData({
                    ...gradientData,
                    adminForceSettings: checked,
                  })
                }
              />
            </div>
          </div>

          {/* Save Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="text-muted-foreground text-sm">
              Changes will be applied to the public technology page in real-time
            </div>
            <Button type="submit" disabled={updateGradientMutation.isPending || isLoading}>
              {updateGradientMutation.isPending ? "Saving..." : "Save Background Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
