import type { folders } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { EnhancedDialog, EnhancedDialogContent, EnhancedDialogFooter, EnhancedDialogHeader, EnhancedDialogTitle } from "@/components/ui/enhanced-dialog";
import { Input } from "@/components/ui/input";
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
    mutationFn: (data: { name: string; description?: string; parentId?: number }) =>
      apiRequest("/api/folders", { method: "POST", body: data }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/folders/tree"] });
      toast({ title: "Folder created successfully" });
      setCreateDialogOpen(false);
      setFolderName("");
      setFolderDescription("");
    },
    onError: (error: any) => {
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
      apiRequest(`/api/folders/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      getQueryClient().invalidateQueries({ queryKey: ["/api/folders/tree"] });
      toast({ title: "Folder updated successfully" });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
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
    onError: (error: any) => {
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
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors",
                isSelected && "bg-accent",
                isDragOver && "bg-primary/10 ring-2 ring-primary"
              )}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => onFolderSelect(folder.id)}
              onDragOver={(e) => handleDragOver(e, folder.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, folder.id)}
            >
              {hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(folder.id);
                  }}
                  className="p-0.5 hover:bg-accent-foreground/10 rounded"
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
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Folder className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm flex-1 truncate">{folder.name}</span>
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
              <Plus className="h-4 w-4 mr-2" />
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
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setSelectedFolder(folder);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-6 bg-neutral-200 rounded w-3/4" />
          <div className="h-6 bg-neutral-200 rounded w-1/2 ml-4" />
          <div className="h-6 bg-neutral-200 rounded w-2/3 ml-4" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-r h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm">Folders</h3>
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
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors mb-2",
            selectedFolderId === null && "bg-accent"
          )}
          onClick={() => onFolderSelect(null)}
        >
          <div className="w-4" />
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">All Media</span>
        </div>

        {/* Folder Tree */}
        <div className="space-y-1">
          {folderTree.map((folder) => renderFolder(folder))}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <EnhancedDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <EnhancedDialogContent>
          <EnhancedDialogHeader>
            <EnhancedDialogTitle>
              {selectedFolder ? `Create Subfolder in "${selectedFolder.name}"` : "Create Folder"}
            </EnhancedDialogTitle>
          </EnhancedDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Folder Name</label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Enter folder description"
              />
            </div>
          </div>
          <EnhancedDialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                createMutation.mutate({
                  name: folderName,
                  description: folderDescription || undefined,
                  parentId: selectedFolder?.id,
                });
              }}
              disabled={!folderName.trim() || createMutation.isPending}
            >
              Create
            </Button>
          </EnhancedDialogFooter>
        </EnhancedDialogContent>
      </EnhancedDialog>

      {/* Edit Folder Dialog */}
      <EnhancedDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <EnhancedDialogContent>
          <EnhancedDialogHeader>
            <EnhancedDialogTitle>Edit Folder</EnhancedDialogTitle>
          </EnhancedDialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Folder Name</label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Enter folder description"
              />
            </div>
          </div>
          <EnhancedDialogFooter>
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
                      description: folderDescription || undefined,
                    },
                  });
                }
              }}
              disabled={!folderName.trim() || updateMutation.isPending}
            >
              Update
            </Button>
          </EnhancedDialogFooter>
        </EnhancedDialogContent>
      </EnhancedDialog>

      {/* Delete Folder Dialog */}
      <EnhancedDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <EnhancedDialogContent>
          <EnhancedDialogHeader>
            <EnhancedDialogTitle>Delete Folder</EnhancedDialogTitle>
          </EnhancedDialogHeader>
          <p>
            Are you sure you want to delete the folder "{selectedFolder?.name}"? This folder must be
            empty before it can be deleted.
          </p>
          <EnhancedDialogFooter>
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
          </EnhancedDialogFooter>
        </EnhancedDialogContent>
      </EnhancedDialog>
    </>
  );
}