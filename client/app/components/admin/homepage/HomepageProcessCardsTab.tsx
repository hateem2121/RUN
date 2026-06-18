import type { HomepageProcessCard, InsertHomepageProcessCard, MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import { Edit, GripVertical, Image as ImageIcon, Layers, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassCard } from "@/components/admin/shared/GlassCard";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sortable, SortableItem, SortableItemHandle } from "@/components/ui/sortable";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminHomepageMutations } from "@/hooks/use-admin-homepage-mutations";
import { cn } from "@/lib/utils";

interface HomepageProcessCardsTabProps {
  cards: HomepageProcessCard[];
}

export function HomepageProcessCardsTab({ cards }: HomepageProcessCardsTabProps) {
  const { createProcessCard, updateProcessCard, deleteProcessCard, reorderProcessCards } =
    useAdminHomepageMutations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<HomepageProcessCard | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"create" | "edit">("create");

  const { data: mediaAssets = [] } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media-assets"],
  });

  // Local state for drag and drop
  const [orderedCards, setOrderedCards] = useState<HomepageProcessCard[]>(cards);

  // Sync local state with props when cards change
  useEffect(() => {
    setOrderedCards(cards);
  }, [cards]);

  const [newCard, setNewCard] = useState<InsertHomepageProcessCard>({
    title: "",
    description: "",
    step: 1,
    isActive: true,
  });

  const handleCreate = () => {
    createProcessCard.mutate(newCard, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewCard({ title: "", description: "", step: (cards.length || 0) + 1, isActive: true });
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this process phase?")) {
      deleteProcessCard.mutate(id);
    }
  };

  const handleReorder = (newOrder: HomepageProcessCard[]) => {
    setOrderedCards(newOrder);

    const updates = newOrder.map((card, index) => ({
      id: card.id,
      position: index,
      step: index + 1, // Also update step number logically
    }));

    reorderProcessCards.mutate(updates);
  };

  const handleMediaSelect = (assets: MediaAsset | MediaAsset[]) => {
    const media = Array.isArray(assets) ? assets[0] : assets;
    if (media) {
      if (mediaPickerTarget === "create") {
        setNewCard((prev) => ({ ...prev, imageId: media.id }));
      } else if (mediaPickerTarget === "edit" && editingCard) {
        setEditingCard((prev) => (prev ? { ...prev, imageId: media.id } : null));
      }
      setIsMediaPickerOpen(false);
    }
  };

  const openMediaPicker = (mode: "create" | "edit") => {
    setMediaPickerTarget(mode);
    setIsMediaPickerOpen(true);
  };

  const getMediaUrl = (id?: number | null) => {
    if (!id) return null;
    const media = Array.isArray(mediaAssets) ? mediaAssets.find((m) => m.id === id) : null;
    return media?.url || null;
  };

  return (
    <TabsContent value="process-cards" className="mt-0 focus-visible:outline-none outline-none">
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Process Phases</h2>
                <p className="text-sm text-admin-muted">
                  Sequence and manage the manufacturing methodology.
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setNewCard({ ...newCard, step: cards.length + 1 });
                setIsCreateOpen(true);
              }}
              className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold uppercase text-xxs tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all outline-none border-0"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Phase
            </Button>
          </div>

          <Sortable
            value={orderedCards}
            onValueChange={handleReorder}
            getItemValue={(item) => item.id}
            orientation="mixed" // Grid layout
          >
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {orderedCards.map((card) => {
                const imageUrl = getMediaUrl(card.imageId);
                return (
                  <SortableItem key={card.id} value={card.id} asChild>
                    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col h-full">
                      <div className="absolute top-3 left-3 z-20">
                        <SortableItemHandle asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-grab bg-black/40 backdrop-blur-md text-white/50 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Drag to reorder process ${card.step}`}
                          >
                            <GripVertical className="h-4 w-4" />
                          </Button>
                        </SortableItemHandle>
                      </div>

                      <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-black/40 backdrop-blur-md text-white hover:bg-white/20 border border-white/10"
                          onClick={() => setEditingCard(card)}
                          aria-label={`Edit ${card.title}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 bg-red-500/20 backdrop-blur-md text-red-400 hover:text-red-300 hover:bg-red-500/40 border border-red-500/20"
                          onClick={() => handleDelete(card.id)}
                          aria-label={`Delete ${card.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="aspect-custom-misc-38 relative bg-black/50 overflow-hidden flex items-center justify-center border-b border-white/5">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={card.title}
                            className="absolute inset-0 h-full w-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center">
                            <ImageIcon className="h-8 w-8 text-admin-muted mb-2 opacity-30 group-hover:opacity-50 transition-opacity" />
                            <span className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
                              No Media
                            </span>
                          </div>
                        )}
                        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />

                        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-xxs font-bold text-admin-muted group-hover:opacity-0 transition-opacity z-10">
                          Phase {card.step}
                        </div>
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xxs font-bold text-blue-400 uppercase tracking-widest">
                            Phase {card.step}
                          </span>
                          {!card.isActive && (
                            <span className="text-xxs font-bold text-admin-muted uppercase tracking-widest">
                              Inactive
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white tracking-tight mb-2 line-clamp-1">
                          {card.title}
                        </h3>
                        <p className="text-sm text-admin-muted line-clamp-3 flex-1">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </SortableItem>
                );
              })}
              {orderedCards.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <Layers className="h-10 w-10 text-admin-muted mb-4 opacity-50" />
                  <p className="text-white font-medium mb-1">No Process Phases</p>
                  <p className="text-sm text-admin-muted max-w-sm text-center">
                    Add phases to illustrate your manufacturing methodology on the global
                    storefront.
                  </p>
                </div>
              )}
            </div>
          </Sortable>
        </GlassCard>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-2xl bg-surface-black border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Deploy Process Phase
              </DialogTitle>
              <DialogDescription className="text-admin-muted">
                Define a new step in the manufacturing methodology.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="title"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Phase Title
                  </Label>
                  <Input
                    id="title"
                    value={newCard.title}
                    onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="step"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Sequence Number
                  </Label>
                  <Input
                    id="step"
                    type="number"
                    value={newCard.step}
                    onChange={(e) =>
                      setNewCard({ ...newCard, step: parseInt(e.target.value, 10) || 0 })
                    }
                    className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-11"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Phase Description
                </Label>
                <Textarea
                  id="description"
                  value={newCard.description || ""}
                  onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl min-h-custom-space-26 focus:ring-blue-500/50 resize-none"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                  <ImageIcon className="size-3 text-blue-400" /> Phase Visual
                </Label>
                <button
                  type="button"
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all cursor-pointer h-32",
                    newCard.imageId
                      ? "border-blue-500/30 bg-blue-500/5"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                  )}
                  onClick={() => openMediaPicker("create")}
                  aria-label="Select phase visual"
                >
                  {newCard.imageId ? (
                    <>
                      {getMediaUrl(newCard.imageId) ? (
                        <img
                          src={getMediaUrl(newCard.imageId) || ""}
                          alt="Phase visual preview"
                          className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity group-hover:opacity-30"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-900/20">
                          <ImageIcon className="h-8 w-8 text-blue-500/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/40 backdrop-blur-sm">
                        <span className="rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                          Change Visual
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="rounded-full bg-white/5 p-3 text-admin-muted group-hover:scale-110 group-hover:bg-white/10 group-hover:text-white transition-all">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-white">Select Visual</p>
                    </div>
                  )}
                </button>
              </div>
            </div>
            <DialogFooter className="border-t border-white/10 pt-4 mt-2">
              <Button
                onClick={handleCreate}
                disabled={createProcessCard.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
              >
                {createProcessCard.isPending ? "Deploying..." : "Deploy Phase"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {editingCard && (
          <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
            <DialogContent className="max-w-2xl bg-surface-black border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Modify Process Phase
                </DialogTitle>
                <DialogDescription className="text-admin-muted">
                  Update sequence, content, or visuals for this step.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-title"
                      className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                    >
                      Phase Title
                    </Label>
                    <Input
                      id="edit-title"
                      value={editingCard.title}
                      onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                      className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit-step"
                      className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                    >
                      Sequence Number
                    </Label>
                    <Input
                      id="edit-step"
                      type="number"
                      value={editingCard.step}
                      onChange={(e) =>
                        setEditingCard({ ...editingCard, step: parseInt(e.target.value, 10) || 0 })
                      }
                      className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-description"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Phase Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingCard.description || ""}
                    onChange={(e) =>
                      setEditingCard({ ...editingCard, description: e.target.value })
                    }
                    className="bg-white/5 border-white/10 text-white rounded-xl min-h-custom-space-27 focus:ring-blue-500/50 resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1 flex items-center gap-2">
                    <ImageIcon className="size-3 text-blue-400" /> Phase Visual
                  </Label>
                  <button
                    type="button"
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border-2 border-dashed transition-all cursor-pointer h-32",
                      editingCard.imageId
                        ? "border-blue-500/30 bg-blue-500/5"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10",
                    )}
                    onClick={() => openMediaPicker("edit")}
                    aria-label="Change phase visual"
                  >
                    {editingCard.imageId ? (
                      <>
                        {getMediaUrl(editingCard.imageId) ? (
                          <img
                            src={getMediaUrl(editingCard.imageId) || ""}
                            alt="Phase visual preview"
                            className="absolute inset-0 h-full w-full object-cover opacity-50 transition-opacity group-hover:opacity-30"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-blue-900/20">
                            <ImageIcon className="h-8 w-8 text-blue-500/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/40 backdrop-blur-sm">
                          <span className="rounded-full border border-white/20 bg-black/50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
                            Change Visual
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="rounded-full bg-white/5 p-3 text-admin-muted group-hover:scale-110 group-hover:bg-white/10 group-hover:text-white transition-all">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-white">Select Visual</p>
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex items-center space-x-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <Switch
                    id="edit-isActive"
                    checked={editingCard.isActive ?? true}
                    onCheckedChange={(checked) =>
                      setEditingCard({ ...editingCard, isActive: checked })
                    }
                    className="data-custom-misc-39:bg-blue-500"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="edit-isActive"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                    >
                      Broadcast Status
                    </Label>
                    <p className="text-xs text-admin-muted">
                      Activate this phase on the global storefront
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t border-white/10 pt-4 mt-2">
                <Button
                  onClick={() => {
                    updateProcessCard.mutate({ id: editingCard.id, data: editingCard });
                    setEditingCard(null);
                  }}
                  disabled={updateProcessCard.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                >
                  Confirm Modification
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <StandardMediaSelectionDialog
          isOpen={isMediaPickerOpen}
          onClose={() => setIsMediaPickerOpen(false)}
          onSelect={handleMediaSelect}
          title="Select Narrative Visual"
          mediaPickerTarget="homepage-process-card"
          selectionMode="single"
        />
      </div>
    </TabsContent>
  );
}
