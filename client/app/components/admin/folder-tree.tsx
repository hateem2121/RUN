import type { folders } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, getQueryClient } from "@/lib/queryClient";

type FolderType = typeof folders.$inferSelect;

import { ChevronDown, ChevronRight, Edit2, Folder, FolderOpen, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FolderWithChildren extends FolderType {
  children?: FolderWithChildren[];
}

interface FolderTreeProps {
  selectedFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
  onDrop?: (mediaIds: number[], folderId: number) => void;
}

export default function FolderTree({ selectedFolderId, onFolderSelect, onDrop }: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderType | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [dragOverFolder, setDragOverFolder] = useState<number | null>(null);

  const { toast } = useToast();

  // Fetch folder tree
  const { data: folderTree = [], isLoading } = useQuery<FolderWithChildren[]>({
    queryKey: ["/api/folders/tree"],
  });

  // Create folder mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string | undefined; parentId?: number }) =>
      apiRequest("/api/folders", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/folders/tree"] });
      toast({ title: "Folder created successfully" });
      setCreateDialogOpen(false);
      setFolderName("");
      setFolderDescription("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create folder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update folder mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; description?: string } }) =>
      apiRequest(`/api/folders/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/folders/tree"] });
      toast({ title: "Folder updated successfully" });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update folder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete folder mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/folders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/folders/tree"] });
      toast({ title: "Folder deleted successfully" });
      setDeleteDialogOpen(false);
      if (selectedFolderId === selectedFolder?.id) {
        onFolderSelect(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete folder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleFolder = (folderId: number) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleDragOver = (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, folderId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);

    const mediaIds = e.dataTransfer.getData("mediaIds");
    if (mediaIds && onDrop) {
      const ids = JSON.parse(mediaIds);
      onDrop(ids, folderId);
    }
  };

  const renderFolder = (folder: FolderWithChildren, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;
    const isDragOver = dragOverFolder === folder.id;

    return (
      <div key={folder.id}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onFolderSelect(folder.id);
                }
              }}
              className={cn(
                "hover:bg-accent focus-visible:ring-ring flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                isSelected && "bg-accent",
                isDragOver && "bg-primary/10 ring-primary ring-2",
              )}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => onFolderSelect(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
            >
              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(folder.id);
                  }}
                  className="hover:bg-accent-foreground/10 rounded p-0.5"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              )}
              {!hasChildren && <div className="w-4" />}
              {isExpanded ? (
                <FolderOpen className="text-muted-foreground h-4 w-4" />
              ) : (
                <Folder className="text-muted-foreground h-4 w-4" />
              )}
              <span className="flex-1 truncate text-sm">{folder.name}</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => {
                setSelectedFolder(folder);
                setFolderName("");
                setFolderDescription("");
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Subfolder
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setSelectedFolder(folder);
                setFolderName(folder.name);
                setFolderDescription(folder.description || "");
                setEditDialogOpen(true);
              }}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setSelectedFolder(folder);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {isExpanded && hasChildren && (
          <div>{folder.children?.map((child) => renderFolder(child, level + 1))}</div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-6 w-3/4 rounded bg-neutral-200" />
          <div className="ml-4 h-6 w-1/2 rounded bg-neutral-200" />
          <div className="ml-4 h-6 w-2/3 rounded bg-neutral-200" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto border-r p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium">Folders</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedFolder(null);
              setFolderName("");
              setFolderDescription("");
              setCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* All Media */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onFolderSelect(null);
            }
          }}
          className={cn(
            "hover:bg-accent focus-visible:ring-ring mb-2 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
            selectedFolderId === null && "bg-accent",
          )}
          onClick={() => onFolderSelect(null)}
        >
          <div className="w-4" />
          <Folder className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">All Media</span>
        </div>

        {/* Folder Tree */}
        <div className="space-y-1">{folderTree.map((folder) => renderFolder(folder))}</div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedFolder ? `Create Subfolder in "${selectedFolder.name}"` : "Create Folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Folder Name</Label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Description (optional)</Label>
              <Input
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Enter folder description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                createMutation.mutate({
                  name: folderName,
                  ...(folderDescription ? { description: folderDescription } : {}),
                  ...(selectedFolder?.id ? { parentId: selectedFolder.id } : {}),
                });
              }}
              disabled={!folderName.trim() || createMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Folder Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Folder Name</Label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Description (optional)</Label>
              <Input
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Enter folder description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedFolder) {
                  updateMutation.mutate({
                    id: selectedFolder.id,
                    data: {
                      name: folderName,
                      ...(folderDescription ? { description: folderDescription } : {}),
                    },
                  });
                }
              }}
              disabled={!folderName.trim() || updateMutation.isPending}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete the folder "{selectedFolder?.name}"? This folder must be
            empty before it can be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedFolder) {
                  deleteMutation.mutate(selectedFolder.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
