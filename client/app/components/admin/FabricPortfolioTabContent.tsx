import type { Fabric, UnifiedSustainability } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";

interface FabricPortfolioTabContentProps {
  localForm: Partial<UnifiedSustainability>;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  onLocalUpdate: (updates: Partial<UnifiedSustainability>) => void;
  onSave: () => void;
}

export function FabricPortfolioTabContent({
  localForm,
  hasUnsavedChanges,
  isPending,
  onLocalUpdate,
  onSave,
}: FabricPortfolioTabContentProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: fabrics = [], isLoading: isLoadingFabrics } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
    queryFn: () => apiRequest("/api/fabrics"),
  });

  interface FabricPortfolioData {
    selectedFabricIds?: number[];
  }

  // Cast data to specific interface instead of any for better type safety
  const selectedFabricIds: number[] =
    (localForm.data as unknown as FabricPortfolioData)?.selectedFabricIds || [];

  const handleFabricToggle = (fabricId: number, checked: boolean) => {
    const currentIds = selectedFabricIds;
    let newIds: number[];

    if (checked) {
      newIds = [...currentIds, fabricId];
    } else {
      newIds = currentIds.filter((id) => id !== fabricId);
    }

    onLocalUpdate({
      data: {
        ...(localForm.data || {}),
        selectedFabricIds: newIds,
      },
    });
  };

  const filteredFabrics = fabrics.filter((fabric) =>
    fabric.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <TabsContent value="fabric-portfolio" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fabric Portfolio Section</CardTitle>
          <CardDescription>
            Manage the title, description, and selected fabrics for the portfolio section.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="fabricPortfolioTitle">Section Title</Label>
              <Input
                id="fabricPortfolioTitle"
                value={localForm.fabricPortfolioTitle || ""}
                onChange={(e) => onLocalUpdate({ fabricPortfolioTitle: e.target.value })}
                placeholder="e.g., Our Sustainable Fabrics"
              />
            </div>
            <div>
              <Label htmlFor="fabricPortfolioDescription">Section Description</Label>
              <Textarea
                id="fabricPortfolioDescription"
                value={localForm.fabricPortfolioDescription || ""}
                onChange={(e) => onLocalUpdate({ fabricPortfolioDescription: e.target.value })}
                placeholder="Description for the fabric portfolio section"
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Select Fabrics to Display</Label>
              <span className="text-sm text-muted-foreground">
                {selectedFabricIds.length} selected
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fabrics..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="rounded-md border p-1">
              <ScrollArea className="h-[300px]">
                {isLoadingFabrics ? (
                  <div className="flex h-full items-center justify-center p-4">
                    <p className="text-sm text-muted-foreground">Loading fabrics...</p>
                  </div>
                ) : filteredFabrics.length === 0 ? (
                  <div className="flex h-full items-center justify-center p-4">
                    <p className="text-sm text-muted-foreground">No fabrics found.</p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {filteredFabrics.map((fabric) => (
                      <div
                        key={fabric.id}
                        className="flex items-center space-x-3 rounded-md p-2 hover:bg-accent"
                      >
                        <Checkbox
                          id={`fabric-${fabric.id}`}
                          checked={selectedFabricIds.includes(fabric.id)}
                          onCheckedChange={(checked) =>
                            handleFabricToggle(fabric.id, checked as boolean)
                          }
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`fabric-${fabric.id}`}
                            className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {fabric.name}
                          </Label>
                          {fabric.fabricType && (
                            <p className="text-xs text-muted-foreground">{fabric.fabricType}</p>
                          )}
                        </div>
                        {fabric.isActive && (
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground">
                            Active
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
        <div className="flex justify-end border-t p-4">
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? "Saving..." : "Save Fabric Portfolio Section"}
          </Button>
        </div>
      </Card>
    </TabsContent>
  );
}
