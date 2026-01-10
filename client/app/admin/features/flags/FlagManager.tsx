import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  percentage?: number;
  description?: string;
  updatedAt: string;
}

export default function FlagManager() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFlagKey, setNewFlagKey] = useState("");
  const [newFlagDesc, setNewFlagDesc] = useState("");

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/feature-flags/detailed");
      if (!res.ok) throw new Error("Failed to load flags");
      const data = await res.json();
      setFlags(data.flags);
    } catch (_err) {
      toast.error("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggleFlag = async (key: string, currentState: boolean) => {
    try {
      // Optimistic update
      setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !currentState } : f)));

      const res = await fetch(`/api/v1/feature-flags/${key}/toggle`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to toggle");
      toast.success(`Flag ${key} ${!currentState ? "enabled" : "disabled"}`);
    } catch (_err) {
      // Revert
      setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: currentState } : f)));
      toast.error("Failed to update flag");
    }
  };

  const createFlag = async () => {
    if (!newFlagKey) return;
    try {
      const res = await fetch(`/api/v1/feature-flags/${newFlagKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: false,
          description: newFlagDesc || "Custom feature flag",
        }),
      });

      if (!res.ok) throw new Error("Failed to create flag");

      toast.success("Flag created");
      setNewFlagKey("");
      setNewFlagDesc("");
      fetchFlags();
    } catch (_err) {
      toast.error("Failed to create flag");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-end gap-4 border-b pb-6">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="key">New Flag Key</Label>
              <Input
                id="key"
                placeholder="e.g. enableNewCheckout"
                value={newFlagKey}
                onChange={(e) => setNewFlagKey(e.target.value)}
              />
            </div>
            <div className="grid flex-2 gap-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                placeholder="Description of the feature"
                value={newFlagDesc}
                onChange={(e) => setNewFlagDesc(e.target.value)}
              />
            </div>
            <Button onClick={createFlag} disabled={!newFlagKey}>
              <Plus className="mr-2 h-4 w-4" /> Add Flag
            </Button>
          </div>

          <div className="space-y-4">
            {flags.length === 0 && (
              <p className="text-muted-foreground text-center">No flags found.</p>
            )}

            {flags.map((flag) => (
              <div
                key={flag.key}
                className="bg-card flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{flag.key}</span>
                    {flag.percentage !== undefined && (
                      <Badge variant="secondary">{flag.percentage}% Rollout</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{flag.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm ${flag.enabled ? "font-medium text-green-500" : "text-muted-foreground"}`}
                  >
                    {flag.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => toggleFlag(flag.key, flag.enabled)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
