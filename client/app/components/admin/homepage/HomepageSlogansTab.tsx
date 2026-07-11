import type { HomepageSlogan, InsertHomepageSlogan } from "@shared/index";
import { Edit, GripVertical, MessageSquareText, Plus, Trash2 } from "lucide-react";
import { useOptimistic, useState, useTransition } from "react";
import { DeleteConfirmationDialog } from "@/components/admin/shared/DeleteConfirmationDialog";
import { GlassCard } from "@/components/admin/shared/GlassCard";
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
import { useAdminHomepageMutations } from "@/hooks/use-admin-homepage-mutations";

interface HomepageSlogansTabProps {
  slogans: HomepageSlogan[];
}

export function HomepageSlogansTab({ slogans }: HomepageSlogansTabProps) {
  const { createSlogan, updateSlogan, deleteSlogan, reorderSlogans } = useAdminHomepageMutations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSlogan, setEditingSlogan] = useState<HomepageSlogan | null>(null);
  const [, startTransition] = useTransition();

  // Optimistic state for drag and drop
  const [optimisticSlogans, setOptimisticSlogans] = useOptimistic<
    HomepageSlogan[],
    HomepageSlogan[]
  >(slogans, (_state, newOrder) => newOrder);

  // Create Form State
  const [newSlogan, setNewSlogan] = useState<InsertHomepageSlogan>({
    text: "",
    position: null,
    isActive: true,
  });

  const handleCreate = () => {
    createSlogan.mutate(newSlogan, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewSlogan({ text: "", position: null, isActive: true });
      },
    });
  };

  const handleDelete = (id: number) => {
    deleteSlogan.mutate(id);
  };

  const handleReorder = (newOrder: HomepageSlogan[]) => {
    startTransition(() => {
      setOptimisticSlogans(newOrder); // Immediate UI update
    });

    // Create updates array for API
    const updates = newOrder.map((slogan, index) => ({
      id: slogan.id,
      position: index, // New position based on array index
    }));

    reorderSlogans.mutate(updates);
  };

  return (
    <TabsContent value="slogans" className="mt-0 focus-visible:outline-none outline-none">
      <div className="space-y-6">
        <GlassCard className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <MessageSquareText className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Kinetic Slogans</h2>
                <p className="text-sm text-admin-muted">
                  Manage animated text sequences. Drag to reorder.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold uppercase text-xxs tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all border-0"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Sequence
            </Button>
          </div>

          <div className="space-y-4">
            <Sortable
              value={optimisticSlogans}
              onValueChange={handleReorder}
              getItemValue={(item) => item.id}
            >
              <div className="space-y-3">
                {optimisticSlogans.map((slogan) => (
                  <SortableItem key={slogan.id} value={slogan.id} asChild>
                    <div className="group flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-4">
                        <SortableItemHandle asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-grab text-white/40 hover:text-white"
                            aria-label={`Drag to reorder slogan: ${slogan.text}`}
                          >
                            <GripVertical className="h-5 w-5" />
                          </Button>
                        </SortableItemHandle>
                        <div>
                          <div className="font-bold text-white tracking-tight">{slogan.text}</div>
                          <div className="text-xs uppercase tracking-widest mt-1">
                            {slogan.isActive ? (
                              <span className="text-blue-400">Active Broadcast</span>
                            ) : (
                              <span className="text-admin-muted">Inactive</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSlogan(slogan)}
                          aria-label={`Edit slogan: ${slogan.text}`}
                          className="h-9 px-3 text-admin-muted hover:text-white hover:bg-white/10"
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <DeleteConfirmationDialog
                          title="Confirm Deletion"
                          description="Are you sure you want to delete this slogan? This action cannot be undone."
                          onConfirm={() => handleDelete(slogan.id)}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Delete slogan: ${slogan.text}`}
                              className="h-9 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </SortableItem>
                ))}
                {optimisticSlogans.length === 0 && (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-white/10">
                    <MessageSquareText className="h-8 w-8 text-admin-muted mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium text-white mb-1">No sequences active</p>
                    <p className="text-xs text-admin-muted max-w-sm mx-auto">
                      Add kinetic slogans to engage users during initial page load and idle states.
                    </p>
                  </div>
                )}
              </div>
            </Sortable>
          </div>
        </GlassCard>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="bg-surface-black border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Deploy New Sequence
              </DialogTitle>
              <DialogDescription className="text-admin-muted">
                Configure a new kinetic text sequence for the hero section.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <Label
                  htmlFor="text"
                  className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                >
                  Sequence Text
                </Label>
                <Input
                  id="text"
                  value={newSlogan.text}
                  onChange={(e) => setNewSlogan({ ...newSlogan, text: e.target.value })}
                  className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-12"
                  placeholder="e.g., Engineer the Perfect Run"
                />
              </div>
            </div>
            <DialogFooter className="border-t border-white/10 pt-4 mt-2">
              <Button
                onClick={handleCreate}
                disabled={createSlogan.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
              >
                {createSlogan.isPending ? "Deploying..." : "Deploy Sequence"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        {editingSlogan && (
          <Dialog open={!!editingSlogan} onOpenChange={(open) => !open && setEditingSlogan(null)}>
            <DialogContent className="bg-surface-black border-white/10 text-white">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Modify Sequence
                </DialogTitle>
                <DialogDescription className="text-admin-muted">
                  Update sequence text and broadcast status.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <Label
                    htmlFor="edit-text"
                    className="text-xxs font-bold text-admin-muted uppercase tracking-widest pl-1"
                  >
                    Sequence Text
                  </Label>
                  <Input
                    id="edit-text"
                    value={editingSlogan.text}
                    onChange={(e) => setEditingSlogan({ ...editingSlogan, text: e.target.value })}
                    className="bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-12"
                  />
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <Switch
                    id="edit-isActive"
                    checked={editingSlogan.isActive ?? true}
                    onCheckedChange={(checked) =>
                      setEditingSlogan({ ...editingSlogan, isActive: checked })
                    }
                    className="data-custom-misc-41:bg-blue-500"
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label
                      htmlFor="edit-isActive"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white"
                    >
                      Broadcast Status
                    </Label>
                    <p className="text-xs text-admin-muted">
                      Activate this sequence on the global storefront
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="border-t border-white/10 pt-4 mt-2">
                <Button
                  onClick={() => {
                    updateSlogan.mutate({ id: editingSlogan.id, data: editingSlogan });
                    setEditingSlogan(null);
                  }}
                  disabled={updateSlogan.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                >
                  Confirm Modification
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TabsContent>
  );
}
