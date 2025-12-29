import type { LogoAnimationSettings } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { RefreshCw, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

export function LogoAnimationSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Partial<LogoAnimationSettings>>({
    showFrequency: false,
    duration: 2000,
    drawStagger: "100",
    drawEasing: "easeInOutQuad",
    motionEnabled: true,
    skipButtonEnabled: true,
    animationDurationMultiplier: "1.0",
    customCssClass: "",
    debugMode: false,
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/logo-animation-settings"],
    enabled: true,
  });

  // Update local state when data is fetched
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<LogoAnimationSettings>) => {
      return apiRequest("/api/logo-animation-settings", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      getQueryClient().invalidateQueries({
        queryKey: ["/api/logo-animation-settings"],
      });
      toast({
        title: "Settings saved",
        description: "Logo animation settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const easingOptions = [
    "linear",
    "easeInQuad",
    "easeOutQuad",
    "easeInOutQuad",
    "easeInCubic",
    "easeOutCubic",
    "easeInOutCubic",
    "easeInQuart",
    "easeOutQuart",
    "easeInOutQuart",
    "easeInExpo",
    "easeOutExpo",
    "easeInOutExpo",
  ];

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Logo Animation Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Configure SVG logo animations for the homepage landing
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          className="flex items-center gap-2"
        >
          {saveSettingsMutation.isPending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="draw">Draw Animation</TabsTrigger>
          <TabsTrigger value="motion">Motion Animation</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Animation Control</CardTitle>
              <CardDescription>Main animation settings and visibility controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Logo Animation</Label>
                  <p className="text-muted-foreground text-sm">
                    Show animated logo on homepage loading
                  </p>
                </div>
                <Switch
                  checked={settings.isActive ?? true}
                  onCheckedChange={(checked) => setSettings({ ...settings, isActive: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Show Frequency</Label>
                <Switch
                  checked={settings.showFrequency ?? false}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, showFrequency: checked })
                  }
                />
                <p className="text-muted-foreground text-sm">Show frequency indicator</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Skip Button</Label>
                  <p className="text-muted-foreground text-sm">Allow users to skip the animation</p>
                </div>
                <Switch
                  checked={settings.skipButtonEnabled ?? false}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, skipButtonEnabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="multiplier">Animation Speed Multiplier</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="multiplier"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={[parseFloat(settings.animationDurationMultiplier ?? "1.0")]}
                    onValueChange={([value]) =>
                      value !== undefined &&
                      setSettings({
                        ...settings,
                        animationDurationMultiplier: value.toFixed(1),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="w-12 text-right text-sm">
                    {parseFloat(settings.animationDurationMultiplier ?? "1.0").toFixed(1)}x
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Overall animation speed (0.5x = slower, 2x = faster)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="draw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SVG Line Drawing Animation</CardTitle>
              <CardDescription>
                Configure the initial line drawing effect using createDrawable
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="duration">Animation Duration (ms)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="duration"
                    min={500}
                    max={5000}
                    step={100}
                    value={[settings.duration ?? 2000]}
                    onValueChange={([value]) => setSettings({ ...settings, duration: value })}
                    className="flex-1"
                  />
                  <span className="w-16 text-right text-sm">{settings.duration ?? 2000}ms</span>
                </div>
                <p className="text-muted-foreground text-sm">Total animation duration</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="drawStagger">Stagger Delay (ms)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="drawStagger"
                    min={0}
                    max={500}
                    step={10}
                    value={[parseFloat(settings.drawStagger ?? "100")]}
                    onValueChange={([value]) =>
                      value !== undefined &&
                      setSettings({
                        ...settings,
                        drawStagger: value.toFixed(0),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="w-16 text-right text-sm">
                    {parseFloat(settings.drawStagger ?? "100").toFixed(0)}ms
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  Delay between drawing each path element
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="easing">Draw Easing Function</Label>
                <Select
                  value={settings.drawEasing ?? "easeInOutQuad"}
                  onValueChange={(value) => setSettings({ ...settings, drawEasing: value })}
                >
                  <SelectTrigger id="easing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {easingOptions.map((easing) => (
                      <SelectItem key={easing} value={easing}>
                        {easing}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-sm">Animation easing curve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="motion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Motion Path Animation</CardTitle>
              <CardDescription>Configure floating elements using createMotionPath</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Motion Elements</Label>
                  <p className="text-muted-foreground text-sm">
                    Show floating animated elements after logo draw
                  </p>
                </div>
                <Switch
                  checked={settings.motionEnabled ?? true}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, motionEnabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motionElements">Motion Elements (comma-separated)</Label>
                <input
                  id="motionElements"
                  type="text"
                  value={(settings.motionElements ?? []).join(", ")}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      motionElements: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., circle, square, triangle"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  disabled={!settings.motionEnabled}
                />
                <p className="text-muted-foreground text-sm">Elements to animate (string array)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motionSpeed">Motion Speed (ms)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="motionSpeed"
                    min={1000}
                    max={10000}
                    step={100}
                    value={[parseFloat(settings.motionSpeed ?? "3000")]}
                    onValueChange={([value]) =>
                      value !== undefined &&
                      setSettings({
                        ...settings,
                        motionSpeed: value.toFixed(0),
                      })
                    }
                    className="flex-1"
                    disabled={!settings.motionEnabled}
                  />
                  <span className="w-16 text-right text-sm">
                    {parseFloat(settings.motionSpeed ?? "3000").toFixed(0)}ms
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">Duration of motion path animations</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Developer options and custom styling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="cssClass">Custom CSS Class</Label>
                <input
                  id="cssClass"
                  type="text"
                  value={settings.customCssClass || ""}
                  onChange={(e) => setSettings({ ...settings, customCssClass: e.target.value })}
                  placeholder="e.g., logo-animation-custom"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <p className="text-muted-foreground text-sm">
                  Additional CSS class for custom styling
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Mode</Label>
                  <p className="text-muted-foreground text-sm">
                    Show animation phase indicators and timing info
                  </p>
                </div>
                <Switch
                  checked={settings.debugMode ?? false}
                  onCheckedChange={(checked) => setSettings({ ...settings, debugMode: checked })}
                />
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <h4 className="mb-2 font-medium text-amber-900">Animation Phases</h4>
                <ol className="list-inside list-decimal space-y-1 text-amber-800 text-sm">
                  <li>Logo SVG line drawing (createDrawable)</li>
                  <li>Motion path elements animation (createMotionPath)</li>
                  <li>Final position and fade to static logo</li>
                </ol>
                <p className="mt-3 text-amber-700 text-sm">
                  Animations load homepage content in the background to improve perceived
                  performance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
