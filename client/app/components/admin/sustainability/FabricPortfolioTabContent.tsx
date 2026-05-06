import type { Fabric, UnifiedSustainability } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { Check, Layers, Save, Search, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

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
    <TabsContent value="fabric-portfolio" className="outline-none">
      <Card className="glass-premium p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Sovereign Fabric Portfolio
            </h2>
            <p className="text-sm text-admin-muted">
              Curate the premium material library to showcase sustainable textile innovation
            </p>
          </div>
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isPending}
            className={cn(
              "font-bold uppercase text-xxs tracking-widest h-11 px-6 rounded-xl transition-all active:scale-95 shadow-lg",
              hasUnsavedChanges
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20"
                : "bg-white/5 text-admin-muted border border-white/10 cursor-not-allowed",
            )}
          >
            {isPending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white mr-2" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Sync Portfolio
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="fabricPortfolioTitle"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Section Headline
                </Label>
                <Input
                  id="fabricPortfolioTitle"
                  value={localForm.fabricPortfolioTitle || ""}
                  onChange={(e) => onLocalUpdate({ fabricPortfolioTitle: e.target.value })}
                  placeholder="e.g., Material Sovereignty"
                  className="bg-white/5 border-white/10 text-white rounded-xl py-6 focus:ring-emerald-500/50 placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="fabricPortfolioDescription"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Narrative Context
                </Label>
                <Textarea
                  id="fabricPortfolioDescription"
                  value={localForm.fabricPortfolioDescription || ""}
                  onChange={(e) => onLocalUpdate({ fabricPortfolioDescription: e.target.value })}
                  placeholder="Describe the philosophical foundation of your material selection..."
                  rows={6}
                  className="bg-white/5 border-white/10 text-white rounded-xl min-h-[150px] focus:ring-emerald-500/50 placeholder:text-white/20 resize-none"
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Shield className="size-4" />
                </div>
                <span className="text-xxs font-bold text-white uppercase tracking-widest">
                  Global Selection Sync
                </span>
              </div>
              <p className="text-xs text-admin-muted leading-relaxed">
                Changes made here influence the public fabric gallery. Ensure all selected materials
                meet the current sustainability compliance protocols.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col h-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1">
                  Material Index
                </Label>
                <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                  <span className="text-xxs font-bold text-white">
                    {selectedFabricIds.length} Initialised
                  </span>
                </div>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-admin-muted" />
                <Input
                  placeholder="Search materials..."
                  className="pl-10 h-10 bg-white/5 border-white/10 text-white rounded-xl focus:ring-emerald-500/50 text-xs placeholder:text-white/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <Card className="glass-premium flex-1 min-h-[400px] border-white/5 relative overflow-hidden flex flex-col">
              <ScrollArea className="flex-1">
                {isLoadingFabrics ? (
                  <div className="p-20 flex flex-col items-center justify-center text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500/50 border-t-emerald-500 mb-4" />
                    <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
                      Accessing Material Database...
                    </p>
                  </div>
                ) : filteredFabrics.length === 0 ? (
                  <div className="p-20 flex flex-col items-center justify-center text-center">
                    <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center mb-4">
                      <Layers className="h-6 w-6 text-admin-muted/40" />
                    </div>
                    <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
                      No matching materials found
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredFabrics.map((fabric) => (
                      <button
                        key={fabric.id}
                        type="button"
                        onClick={() =>
                          handleFabricToggle(fabric.id, !selectedFabricIds.includes(fabric.id))
                        }
                        className={cn(
                          "flex w-full items-center gap-4 rounded-xl p-3 cursor-pointer transition-all duration-200 group border text-left",
                          selectedFabricIds.includes(fabric.id)
                            ? "bg-emerald-500/10 border-emerald-500/30"
                            : "bg-transparent border-transparent hover:bg-white/5",
                        )}
                      >
                        <div
                          className={cn(
                            "size-5 rounded flex items-center justify-center transition-all duration-300",
                            selectedFabricIds.includes(fabric.id)
                              ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/40"
                              : "bg-white/5 border border-white/10 group-hover:border-emerald-500/50",
                          )}
                        >
                          <Check
                            className={cn(
                              "size-3.5 stroke-[3] transition-opacity",
                              selectedFabricIds.includes(fabric.id) ? "opacity-100" : "opacity-0",
                            )}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4
                            className={cn(
                              "text-sm font-bold tracking-tight transition-colors",
                              selectedFabricIds.includes(fabric.id)
                                ? "text-white"
                                : "text-admin-foreground",
                            )}
                          >
                            {fabric.name}
                          </h4>
                          {fabric.fabricType && (
                            <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest mt-0.5">
                              {fabric.fabricType}
                            </p>
                          )}
                        </div>

                        {fabric.isActive && (
                          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">
                              Active
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
                  Total Indexed: {fabrics.length}
                </span>
                <span className="text-xxs font-bold text-emerald-400 uppercase tracking-widest">
                  Showing: {filteredFabrics.length}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
}
