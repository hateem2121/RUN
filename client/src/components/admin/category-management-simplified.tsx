import { closestCenter, DndContext } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import CategoryForm from "./categories/CategoryForm";
import CategoryList from "./categories/CategoryList";

export default function CategoryManagementSimplified() {
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
  const handleCreateCategory = async (data: any) => {
    try {
      await createCategory(data);
    } catch (_error) {}
  };

  const handleUpdateCategory = async (data: any) => {
    if (!uiState.editingCategory) return;
    try {
      await updateCategory({ id: uiState.editingCategory.id, data });
    } catch (_error) {}
  };

  const handleDeleteCategory = async () => {
    if (!uiState.deletingCategory) return;
    try {
      await deleteCategory(uiState.deletingCategory.id);
    } catch (_error) {}
  };

  const handleRestoreCategory = async () => {
    if (!uiState.restoringCategory) return;
    try {
      await restoreCategory(uiState.restoringCategory.id);
    } catch (_error) {}
  };

  const handleHardDeleteCategory = async () => {
    if (!uiState.hardDeletingCategory) return;
    try {
      await hardDeleteCategory(uiState.hardDeletingCategory.id);
    } catch (_error) {}
  };

  // Render category view using consolidated CategoryList component
  const renderCategoryView = () => {
    return (
      <CategoryList
        categories={filteredCategories as any[]}
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
    <div className="space-y-6 p-6">
      {/* Header - Simplified */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Categories</h1>
          <p className="text-muted-foreground text-sm">
            {filteredCategories.length} of {categories?.length || 0} categories
            {selectedCount > 0 && ` • ${selectedCount} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
          <Button
            variant="outline"
            onClick={() => updateUIState({ showAdvancedMode: !uiState.showAdvancedMode })}
          >
            <Settings className="mr-2 h-4 w-4" />
            {uiState.showAdvancedMode ? "Simple" : "Advanced"}
          </Button>
        </div>
      </div>

      {/* Search & Filters - Clean */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search categories..."
                value={uiState.searchTerm}
                onChange={(e) => updateUIState({ searchTerm: e.target.value })}
                className="w-full"
              />
            </div>
            <select
              value={uiState.filterStatus}
              onChange={(e) => updateUIState({ filterStatus: e.target.value as any })}
              className="rounded-md border border-input px-3 py-2"
            >
              <option value="all">All Categories</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
              <Switch
                id="show-deleted"
                checked={uiState.showDeletedCategories}
                onCheckedChange={(checked) => updateUIState({ showDeletedCategories: checked })}
                data-testid="toggle-deleted-categories"
              />
              <Label htmlFor="show-deleted" className="cursor-pointer whitespace-nowrap text-sm">
                Show Deleted
              </Label>
            </div>
          </div>

          {/* View Mode & Bulk Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">View:</span>
              <div className="flex gap-1">
                <Button
                  variant={uiState.viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateUIState({ viewMode: "list" })}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={uiState.viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateUIState({ viewMode: "grid" })}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={uiState.viewMode === "tree" ? "default" : "outline"}
                  size="sm"
                  onClick={() => updateUIState({ viewMode: "tree" })}
                >
                  <TreePine className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedCount} selected</Badge>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("activate")}>
                  Activate
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction("deactivate")}>
                  Deactivate
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleBulkAction("delete")}>
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Selection Controls */}
          <div className="flex items-center gap-4 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={selectAll}
              disabled={filteredCategories.length === 0}
            >
              Select All ({filteredCategories.length})
            </Button>
            {selectedCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Features - Hidden by default */}
      {uiState.showAdvancedMode && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 text-lg">
              <Settings className="h-5 w-5" />
              Advanced Features
            </CardTitle>
            <p className="text-amber-700 text-sm">
              Additional tools for power users. These features are being simplified.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" disabled className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Import/Export
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button variant="outline" disabled className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Bulk Content
              </Button>
            </div>
            <p className="mt-2 text-amber-700 text-sm">
              Advanced features are being consolidated for a cleaner experience.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({filteredCategories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          >
            <SortableContext
              items={filteredCategories.map((c: any) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {renderCategoryView()}
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      {/* Deleted Categories Section */}
      {uiState.showDeletedCategories && (
        <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <Trash2 className="h-5 w-5" />
              Deleted Categories ({deletedCategories.length})
            </CardTitle>
            <p className="text-red-700 text-sm dark:text-red-300">
              {isLoadingDeleted
                ? "Loading deleted categories..."
                : deletedCategories.length > 0
                  ? "These categories can be restored or permanently deleted."
                  : "No deleted categories."}
            </p>
          </CardHeader>
          <CardContent>
            {deletedCategoriesError ? (
              <div className="py-8 text-center">
                <p className="font-medium text-red-600 dark:text-red-400">
                  Failed to load deleted categories
                </p>
                <p className="mt-2 text-muted-foreground text-sm">
                  {(deletedCategoriesError as any)?.message ||
                    "An error occurred while fetching deleted categories"}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => retryDeletedCategories()}
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    data-testid="button-retry-deleted-categories"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUIState({ showDeletedCategories: false })}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : isLoadingDeleted ? (
              <div className="py-8 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-red-200 border-t-red-600" />
              </div>
            ) : deletedCategories.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No deleted categories</p>
            ) : (
              <div className="space-y-2">
                {deletedCategories.map((category: any) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4 dark:border-red-900 dark:bg-foreground"
                    data-testid={`deleted-category-${category.id}`}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground dark:text-foreground">
                        {category.name}
                      </h3>
                      <p className="text-muted-foreground text-sm dark:text-muted-foreground/70">
                        {category.slug}
                      </p>
                      {category.deletedAt && (
                        <p className="mt-1 text-red-600 text-xs dark:text-red-400">
                          Deleted: {new Date(category.deletedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRestoreDialog(category)}
                        className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                        data-testid={`button-restore-${category.id}`}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Restore
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openHardDeleteDialog(category)}
                        className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
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
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CategoryForm
        open={uiState.showCreateDialog || uiState.showEditDialog}
        onClose={closeDialogs}
        onSubmit={uiState.editingCategory ? handleUpdateCategory : handleCreateCategory}
        initialData={uiState.editingCategory}
        categories={(categories || []) as any[]}
        isLoading={isLoading}
        mode={uiState.editingCategory ? "edit" : "create"}
      />

      <Dialog open={uiState.showDeleteDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{uiState.deletingCategory?.name}
              "? This category will be moved to the deleted items and can be restored later.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleDeleteCategory();
                closeDialogs();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uiState.showRestoreDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle>Restore Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore "{uiState.restoringCategory?.name}"? This will make
              the category active again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleRestoreCategory();
                closeDialogs();
              }}
              className="bg-green-600 text-white hover:bg-green-700"
              data-testid="button-confirm-restore"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={uiState.showHardDeleteDialog} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent contentType="form">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">
              Permanently Delete Category
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-600 dark:text-red-400">
                  ⚠️ WARNING: This action is irreversible!
                </p>
                <p>
                  Are you absolutely sure you want to permanently delete "
                  {uiState.hardDeletingCategory?.name}"?
                </p>
                <p className="text-sm">
                  This will completely remove the category from the database. This action CANNOT be
                  undone.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={closeDialogs}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleHardDeleteCategory();
                closeDialogs();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
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
