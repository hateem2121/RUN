import type { HomepageSlogan, InsertHomepageSlogan } from "@shared/index";
import { Edit, GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useAdminHomepageMutations } from "@/hooks/use-admin-homepage-mutations";

interface HomepageSlogansTabProps {
  slogans: HomepageSlogan[];
}

export function HomepageSlogansTab({ slogans }: HomepageSlogansTabProps) {
  const { createSlogan, updateSlogan, deleteSlogan, reorderSlogans } = useAdminHomepageMutations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSlogan, setEditingSlogan] = useState<HomepageSlogan | null>(null);

  // Local state for drag and drop
  const [orderedSlogans, setOrderedSlogans] = useState<HomepageSlogan[]>(slogans);

  // Sync local state with props when slogans change (e.g. after fetch)
  useEffect(() => {
    setOrderedSlogans(slogans);
  }, [slogans]);

  // Create Form State
  const [newSlogan, setNewSlogan] = useState<InsertHomepageSlogan>({
    text: "",
    position: "top",
    isActive: true,
  });

  const handleCreate = () => {
    createSlogan.mutate(newSlogan, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewSlogan({ text: "", position: "top", isActive: true });
      },
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this slogan?")) {
      deleteSlogan.mutate(id);
    }
  };

  const handleReorder = (newOrder: HomepageSlogan[]) => {
    setOrderedSlogans(newOrder); // Immediate UI update

    // Create updates array for API
    const updates = newOrder.map((slogan, index) => ({
      id: slogan.id,
      position: index, // New position based on array index
    }));

    reorderSlogans.mutate(updates);
  };

  return (
    <TabsContent value="slogans" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Homepage Slogans</CardTitle>
            <CardDescription>
              Manage the animated slogans on the homepage. Drag to reorder.
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Slogan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Slogan</DialogTitle>
                <DialogDescription>
                  Create a new slogan to display on the homepage.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="text">Text</Label>
                  <Input
                    id="text"
                    value={newSlogan.text}
                    onChange={(e) => setNewSlogan({ ...newSlogan, text: e.target.value })}
                  />
                </div>
                {/* Add other fields as needed */}
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={createSlogan.isPending}>
                  {createSlogan.isPending ? "Creating..." : "Create Slogan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Sortable
              value={orderedSlogans}
              onValueChange={handleReorder}
              getItemValue={(item) => item.id}
            >
              <div className="space-y-4">
                {orderedSlogans.map((slogan) => (
                  <SortableItem key={slogan.id} value={slogan.id} asChild>
                    <div className="flex items-center justify-between rounded-lg border p-4 bg-card">
                      <div className="flex items-center gap-4">
                        <SortableItemHandle asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="cursor-grab"
                            aria-label={`Drag to reorder slogan: ${slogan.text}`}
                          >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        </SortableItemHandle>
                        <div>
                          <div className="font-medium">{slogan.text}</div>
                          <div className="text-muted-foreground text-sm">
                            {slogan.isActive ? (
                              <span className="text-green-600 dark:text-green-400">Active</span>
                            ) : (
                              <span className="text-muted-foreground">Inactive</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingSlogan(slogan)}
                          aria-label={`Edit slogan: ${slogan.text}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(slogan.id)}
                          aria-label={`Delete slogan: ${slogan.text}`}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </Sortable>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingSlogan && (
        <Dialog open={!!editingSlogan} onOpenChange={(open) => !open && setEditingSlogan(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Slogan</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-text">Text</Label>
                <Input
                  id="edit-text"
                  value={editingSlogan.text}
                  onChange={(e) => setEditingSlogan({ ...editingSlogan, text: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={editingSlogan.isActive ?? true}
                  onCheckedChange={(checked) =>
                    setEditingSlogan({ ...editingSlogan, isActive: checked })
                  }
                />
                <Label htmlFor="edit-isActive">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  updateSlogan.mutate({ id: editingSlogan.id, data: editingSlogan });
                  setEditingSlogan(null);
                }}
                disabled={updateSlogan.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </TabsContent>
  );
}
