import type { HomepageProcessCard, InsertHomepageProcessCard, MediaAsset } from "@shared/schema";
import { Edit, GripVertical, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { StandardMediaSelectionDialog } from "@/components/admin/shared/StandardMediaSelectionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sortable, SortableItem, SortableItemHandle } from "@/components/ui/sortable";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminHomepageMutations } from "@/hooks/use-admin-homepage-mutations";

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
    if (confirm("Are you sure you want to delete this card?")) {
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

  return (
    <TabsContent value="process-cards" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Process Cards</CardTitle>
            <CardDescription>
              Manage the manufacturing process steps displayed on the homepage. Drag to reorder.
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setNewCard({ ...newCard, step: cards.length + 1 })}>
                <Plus className="mr-2 h-4 w-4" /> Add Card
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Process Card</DialogTitle>
                <DialogDescription>Create a new step in the process flow.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newCard.title}
                      onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="step">Step Number</Label>
                    <Input
                      id="step"
                      type="number"
                      value={newCard.step}
                      onChange={(e) =>
                        setNewCard({ ...newCard, step: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCard.description || ""}
                    onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Image</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {newCard.imageId ? (
                      <span className="text-sm">Image Selected (ID: {newCard.imageId})</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No image selected</span>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openMediaPicker("create")}>
                      Select Image
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={createProcessCard.isPending}>
                  {createProcessCard.isPending ? "Creating..." : "Create Card"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Sortable
            value={orderedCards}
            onValueChange={handleReorder}
            getItemValue={(item) => item.id}
            orientation="mixed" // Grid layout
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {orderedCards.map((card) => (
                <SortableItem key={card.id} value={card.id} asChild>
                  <Card className="relative overflow-hidden group">
                    <div className="absolute top-2 left-2 z-10">
                      <SortableItemHandle asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <GripVertical className="h-4 w-4" />
                        </Button>
                      </SortableItemHandle>
                    </div>
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingCard(card)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(card.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {card.imageId ? (
                        <div className="flex flex-col items-center">
                          <ImageIcon className="h-8 w-8 opacity-50 mb-2" />
                          <span className="text-xs text-muted-foreground">ID: {card.imageId}</span>
                        </div>
                      ) : (
                        <ImageIcon className="h-10 w-10 opacity-20" />
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          Step {card.step}: {card.title}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {card.description}
                      </p>
                    </CardContent>
                  </Card>
                </SortableItem>
              ))}
            </div>
          </Sortable>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingCard && (
        <Dialog open={!!editingCard} onOpenChange={(open) => !open && setEditingCard(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Process Card</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingCard.title}
                    onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-step">Step Number</Label>
                  <Input
                    id="edit-step"
                    type="number"
                    value={editingCard.step}
                    onChange={(e) =>
                      setEditingCard({ ...editingCard, step: parseInt(e.target.value, 10) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingCard.description || ""}
                  onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Image</Label>
                <div className="mt-2 flex items-center gap-4">
                  {editingCard.imageId ? (
                    <span className="text-sm">Image Selected (ID: {editingCard.imageId})</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No image selected</span>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openMediaPicker("edit")}>
                    Change Image
                  </Button>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={editingCard.isActive ?? true}
                  onCheckedChange={(checked) =>
                    setEditingCard({ ...editingCard, isActive: checked })
                  }
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  updateProcessCard.mutate({ id: editingCard.id, data: editingCard });
                  setEditingCard(null);
                }}
                disabled={updateProcessCard.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <StandardMediaSelectionDialog
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Card Image"
        mediaPickerTarget="homepage-process-card"
        selectionMode="single"
      />
    </TabsContent>
  );
}
