import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Category, InsertCategory } from "@shared/index";
import {
  BarChart3,
  Download,
  Eye,
  Grid3X3,
  List,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Trash2,
  TreePine,
} from "lucide-react";
import { GlassCard } from "@/components/admin/shared/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Consolidated hook
import useCategoryOperationsConsolidated from "@/hooks/admin/categories/useCategoryOperationsConsolidated";

// New consolidated components
import { CategoryForm } from "./categories/CategoryForm";
import { CategoryList } from "./categories/CategoryList";

export function CategoryManagementSimplified() {
  const {
    categories,
    filteredCategories,
    deletedCategories,
    isLoading,
    isLoadingDeleted,
    deletedCategoriesError,
    retryDeletedCategories,
    uiState,
    updateUIState,
    selectedCount,
    getProductCount,
    toggleSelection,
    clearSelection,
    selectAll,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    openRestoreDialog,
    openHardDeleteDialog,
    closeDialogs,
    createCategory,
    updateCategory,
    deleteCategory,
    restoreCategory,
    hardDeleteCategory,
    reorderCategories,
    handleBulkAction,
  } = useCategoryOperationsConsolidated();

  // Data operations
  const handleCreateCategory = async (data: InsertCategory) => {
    try {
      await createCategory(data);
    } catch (_error) {}
  };

  const handleUpdateCategory = async (data: Partial<InsertCategory>) => {
    if (!uiState.editingCategory) {
      return;
    }
    try {
      await updateCategory({ id: uiState.editingCategory.id, data });
    } catch (_error) {}
  };

  const handleDeleteCategory = async () => {
    if (!uiState.deletingCategory) {
      return;
    }
    try {
      await deleteCategory(uiState.deletingCategory.id);
    } catch (_error) {}
  };

  const handleRestoreCategory = async () => {
    if (!uiState.restoringCategory) {
      return;
    }
    try {
      await restoreCategory(uiState.restoringCategory.id);
    } catch (_error) {}
  };

  const handleHardDeleteCategory = async () => {
    if (!uiState.hardDeletingCategory) {
      return;
    }
    try {
      await hardDeleteCategory(uiState.hardDeletingCategory.id);
    } catch (_error) {}
  };

  // Render category view using consolidated CategoryList component
  const renderCategoryView = () => {
    return (
      <CategoryList
        categories={filteredCategories as Category[]}
        viewMode={uiState.viewMode === "list" ? "table" : uiState.viewMode}
        selectedCategories={uiState.selectedCategories}
        expandedCategories={uiState.expandedCategories || {}}
        isLoading={isLoading}
        getProductCount={getProductCount}
        onToggleSelection={toggleSelection}
        onToggleExpanded={(id: number) =>
          updateUIState({
            expandedCategories: {
              ...uiState.expandedCategories,
              [id]: !uiState.expandedCategories?.[id],
            },
          })
        }
        onEdit={openEditDialog}
        onDelete={openDeleteDialog}
        onReorder={reorderCategories}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header - Simplified */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <List className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Category Architecture</h1>
            <p className="text-sm text-[#68869A]">
              {filteredCategories.length} of {categories?.length || 0} categories
              {selectedCount > 0 && ` • ${selectedCount} selected`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => updateUIState({ showAdvancedMode: !uiState.showAdvancedMode })}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl h-11"
          >
            <Settings className="mr-2 h-4 w-4 text-[#68869A]" />
            {uiState.showAdvancedMode ? "Simple" : "Advanced"}
          </Button>
          <Button
            onClick={openCreateDialog}
            className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all outline-none border-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        </div>
      </div>

      {/* Search & Filters - Clean */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
          <Search className="h-4 w-4 text-[#68869A]" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Search & Filters
          </h2>
        </div>
        <div className="space-y-6">
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search categories..."
                value={uiState.searchTerm}
                onChange={(e) => updateUIState({ searchTerm: e.target.value })}
                className="w-full bg-white/5 border-white/10 text-white rounded-xl focus:ring-blue-500/50 h-11"
              />
            </div>
            <select
              value={uiState.filterStatus}
              onChange={(e) =>
                updateUIState({ filterStatus: e.target.value as "all" | "active" | "inactive" })
              }
              className="rounded-xl border border-white/10 bg-[#0A0A0A] text-white px-3 py-2 h-11 focus:ring-blue-500/50 outline-none"
            >
              <option value="all">All Categories</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 h-11">
              <Switch
                id="show-deleted"
                checked={uiState.showDeletedCategories}
                onCheckedChange={(checked) => updateUIState({ showDeletedCategories: checked })}
                data-testid="toggle-deleted-categories"
                className="data-[state=checked]:bg-blue-500"
              />
              <Label
                htmlFor="show-deleted"
                className="cursor-pointer whitespace-nowrap text-xs font-bold text-[#68869A] uppercase tracking-wider"
              >
                Show Deleted
              </Label>
            </div>
          </div>

          {/* View Mode & Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-[#68869A] uppercase tracking-widest">
                View:
              </span>
              <div className="flex gap-1 p-1 bg-white/5 rounded-lg border border-white/10">
                <Button
                  variant={uiState.viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => updateUIState({ viewMode: "list" })}
                  className={
                    uiState.viewMode === "list"
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "text-[#68869A] hover:text-white hover:bg-white/5"
                  }
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={uiState.viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => updateUIState({ viewMode: "grid" })}
                  className={
                    uiState.viewMode === "grid"
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "text-[#68869A] hover:text-white hover:bg-white/5"
                  }
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={uiState.viewMode === "tree" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => updateUIState({ viewMode: "tree" })}
                  className={
                    uiState.viewMode === "tree"
                      ? "bg-white/10 text-white hover:bg-white/20"
                      : "text-[#68869A] hover:text-white hover:bg-white/5"
                  }
                >
                  <TreePine className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-1">
                <Badge
                  variant="outline"
                  className="bg-transparent border-none text-blue-400 font-bold ml-2"
                >
                  {selectedCount} selected
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction("activate")}
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  Activate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction("deactivate")}
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  Deactivate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction("delete")}
                  className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-[#68869A] hover:text-white hover:bg-white/5 mr-1"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Selection Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              disabled={filteredCategories.length === 0}
              className="text-[#68869A] hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest"
            >
              Select All ({filteredCategories.length})
            </Button>
            {selectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-[#68869A] hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest"
              >
                Clear Selection
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Advanced Features - Hidden by default */}
      {uiState.showAdvancedMode && (
        <GlassCard className="p-6 border-blue-500/30 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-blue-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Advanced Features
            </h2>
          </div>
          <p className="text-[#68869A] text-sm mb-6">
            Additional tools for power users. These features are being simplified.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              disabled
              className="flex items-center gap-2 bg-white/5 border-white/10 text-white/50 h-11 rounded-xl"
            >
              <Download className="h-4 w-4" />
              Import/Export
            </Button>
            <Button
              variant="outline"
              disabled
              className="flex items-center gap-2 bg-white/5 border-white/10 text-white/50 h-11 rounded-xl"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button
              variant="outline"
              disabled
              className="flex items-center gap-2 bg-white/5 border-white/10 text-white/50 h-11 rounded-xl"
            >
              <Eye className="h-4 w-4" />
              Bulk Content
            </Button>
          </div>
          <p className="mt-4 text-[10px] text-blue-400 font-bold uppercase tracking-widest">
            Advanced features are being consolidated for a cleaner experience.
          </p>
        </GlassCard>
      )}

      {/* Categories List */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Categories Directory ({filteredCategories.length})
          </h2>
        </div>
        <div className="p-0">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={(filteredCategories as Category[]).map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {renderCategoryView()}
            </SortableContext>
          </DndContext>
        </div>
      </GlassCard>

      {/* Deleted Categories Section */}
      {uiState.showDeletedCategories && (
        <GlassCard className="p-6 border-red-500/30 bg-red-500/5">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="h-5 w-5 text-red-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Deleted Categories ({deletedCategories.length})
            </h2>
          </div>
          <p className="text-red-400/80 text-sm mb-6">
            {isLoadingDeleted
              ? "Loading deleted categories..."
              : deletedCategories.length > 0
                ? "These categories can be restored or permanently deleted."
                : "No deleted categories."}
          </p>

          <div>
            {deletedCategoriesError ? (
              <div className="py-8 text-center bg-black/20 rounded-xl border border-white/5">
                <p className="font-bold text-red-400">Failed to load deleted categories</p>
                <p className="mt-2 text-[#68869A] text-sm">
                  {(deletedCategoriesError as Error)?.message ||
                    "An error occurred while fetching deleted categories"}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryDeletedCategories()}
                    className="border-white/10 text-white hover:bg-white/10 rounded-xl h-9"
                    data-testid="button-retry-deleted-categories"
                  >
                    <RotateCcw className="mr-2 h-4 w-4 text-[#68869A]" />
                    Retry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUIState({ showDeletedCategories: false })}
                    className="border-white/10 text-white hover:bg-white/10 rounded-xl h-9"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : isLoadingDeleted ? (
              <div className="py-12 text-center bg-black/20 rounded-xl border border-white/5">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-red-500/20 border-t-red-500" />
              </div>
            ) : deletedCategories.length === 0 ? (
              <p className="py-12 text-center text-[#68869A] bg-black/20 rounded-xl border border-white/5">
                No deleted categories
              </p>
            ) : (
              <div className="space-y-3">
                {(deletedCategories as Category[]).map((category) => (
                  <div
                    key={category.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-4 transition-all gap-4"
                    data-testid={`deleted-category-${category.id}`}
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{category.name}</h3>
                      <p className="text-[#68869A] text-sm mt-0.5">{category.slug}</p>
                      {category.deletedAt && (
                        <p className="mt-2 text-red-400 text-[10px] font-bold uppercase tracking-widest">
                          Deleted: {new Date(category.deletedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRestoreDialog(category)}
                        className="flex-1 sm:flex-none bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20 rounded-xl"
                        data-testid={`button-restore-${category.id}`}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openHardDeleteDialog(category)}
                        className="flex-1 sm:flex-none bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl"
                        data-testid={`button-hard-delete-${category.id}`}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Permanently
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Dialogs */}
      <CategoryForm
        open={uiState.showCreateDialog || uiState.showEditDialog}
        onClose={closeDialogs}
        onSubmit={(data) => {
          if (uiState.editingCategory) {
            handleUpdateCategory(data);
          } else {
            handleCreateCategory(data as InsertCategory);
          }
        }}
        initialData={uiState.editingCategory}
        categories={(categories || []) as Category[]}
        isLoading={isLoading}
        mode={uiState.editingCategory ? "edit" : "create"}
      />

      <Dialog open={uiState.showDeleteDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent contentType="form" className="bg-[#0A0A0A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Delete Category</DialogTitle>
            <DialogDescription className="text-[#68869A]">
              Are you sure you want to delete "{uiState.deletingCategory?.name}
              "? This category will be moved to the deleted items and can be restored later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4 pt-4 border-t border-white/10 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialogs}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleDeleteCategory();
                closeDialogs();
              }}
              className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uiState.showRestoreDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent contentType="form" className="bg-[#0A0A0A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight">Restore Category</DialogTitle>
            <DialogDescription className="text-[#68869A]">
              Are you sure you want to restore "{uiState.restoringCategory?.name}"? This will make
              the category active again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4 pt-4 border-t border-white/10 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialogs}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleRestoreCategory();
                closeDialogs();
              }}
              className="bg-green-600 text-white hover:bg-green-700 rounded-xl"
              data-testid="button-confirm-restore"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uiState.showHardDeleteDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent contentType="form" className="bg-[#0A0A0A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-red-400">
              Permanently Delete Category
            </DialogTitle>
            <DialogDescription className="text-[#68869A]">
              <div className="space-y-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium">
                  ⚠️ WARNING: This action is irreversible!
                </div>
                <p>
                  Are you absolutely sure you want to permanently delete "
                  <strong className="text-white">{uiState.hardDeletingCategory?.name}</strong>"?
                </p>
                <p className="text-xs">
                  This will completely remove the category from the database. This action CANNOT be
                  undone.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4 pt-4 border-t border-white/10 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeDialogs}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleHardDeleteCategory();
                closeDialogs();
              }}
              className="bg-red-600 text-white hover:bg-red-700 rounded-xl"
              data-testid="button-confirm-hard-delete"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
