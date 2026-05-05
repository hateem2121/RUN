import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Category } from "@shared/index";
import React, { memo, useCallback, useState } from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryDisplay } from "./CategoryDisplay";

interface CategoryListProps {
  categories: Category[];
  viewMode: "table" | "grid" | "tree";
  selectedCategories: Record<number, boolean>;
  expandedCategories: Record<number, boolean>;
  isLoading: boolean;
  getProductCount: (id: number) => number;
  onToggleSelection: (id: number) => void;
  onToggleExpanded: (id: number) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onReorder?: (
    reorderData: Array<{
      id: number;
      sortOrder: number;
      parentId?: number | null;
    }>,
  ) => void;
}

// Helper to get parent category name
const getParentName = (category: Category, allCategories: Category[]) => {
  if (!category.parentId) {
    return undefined;
  }
  const parent = allCategories.find((c) => c.id === category.parentId);
  return parent?.name;
};

// Table view component
const CategoryTableView = memo(
  ({ categories, ...props }: CategoryListProps & { activeId?: number | null }) => (
    <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
      <Table>
        <TableHeader className="border-b border-white/5 bg-white/5">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-16 text-admin-muted font-bold uppercase tracking-wider text-xxs">
              Order
            </TableHead>
            <TableHead className="w-16 text-admin-muted font-bold uppercase tracking-wider text-xxs">
              Image
            </TableHead>
            <TableHead className="text-admin-muted font-bold uppercase tracking-wider text-xxs">
              Name
            </TableHead>
            <TableHead className="text-admin-muted font-bold uppercase tracking-wider text-xxs">
              Parent
            </TableHead>
            <TableHead className="text-admin-muted font-bold uppercase tracking-wider text-xxs">
              Products
            </TableHead>
            <TableHead className="text-admin-muted font-bold uppercase tracking-wider text-xxs">
              Status
            </TableHead>
            <TableHead className="w-16 text-admin-muted font-bold uppercase tracking-wider text-xxs">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <CategoryDisplay
              key={category.id}
              category={category}
              mode="table"
              isSelected={!!props.selectedCategories[category.id]}
              productCount={props.getProductCount(category.id)}
              parentName={getParentName(category, categories)}
              isLoading={props.isLoading}
              isDragging={props.activeId === category.id}
              enableDragDrop={!props.isLoading}
              onToggleSelection={props.onToggleSelection}
              onEdit={props.onEdit}
              onDelete={props.onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  ),
);

// Grid view component
const CategoryGridView = memo(
  ({ categories, ...props }: CategoryListProps & { activeId?: number | null }) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => (
        <CategoryDisplay
          key={category.id}
          category={category}
          mode="grid"
          isSelected={!!props.selectedCategories[category.id]}
          productCount={props.getProductCount(category.id)}
          isLoading={props.isLoading}
          isDragging={props.activeId === category.id}
          enableDragDrop={!props.isLoading}
          onToggleSelection={props.onToggleSelection}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
        />
      ))}
    </div>
  ),
);

// Tree view component with hierarchy support
const CategoryTreeView = memo(
  ({ categories, ...props }: CategoryListProps & { activeId?: number | null }) => {
    // Build hierarchy
    const buildHierarchy = (categories: Category[]): Category[] => {
      const categoryMap = new Map(
        categories.map((cat) => [cat.id, { ...cat, children: [] as Category[] }]),
      );
      const roots: Category[] = [];

      categories.forEach((category) => {
        const categoryWithChildren = categoryMap.get(category.id)!;

        if (category.parentId && categoryMap.has(category.parentId)) {
          const parent = categoryMap.get(category.parentId)!;
          parent.children = parent.children || [];
          parent.children.push(categoryWithChildren);
        } else {
          roots.push(categoryWithChildren);
        }
      });

      return roots;
    };

    const renderTreeItem = (
      category: Category & { children?: Category[] },
      depth = 0,
    ): React.ReactNode[] => {
      const items: React.ReactNode[] = [];

      items.push(
        <CategoryDisplay
          key={category.id}
          category={category}
          mode="tree"
          isSelected={!!props.selectedCategories[category.id]}
          isExpanded={!!props.expandedCategories[category.id]}
          depth={depth}
          productCount={props.getProductCount(category.id)}
          isLoading={props.isLoading}
          isDragging={props.activeId === category.id}
          enableDragDrop={!props.isLoading}
          onToggleSelection={props.onToggleSelection}
          onToggleExpanded={props.onToggleExpanded}
          onEdit={props.onEdit}
          onDelete={props.onDelete}
        />,
      );

      // Render children if expanded
      if (props.expandedCategories[category.id] && category.children?.length) {
        category.children.forEach((child) => {
          items.push(...renderTreeItem(child, depth + 1));
        });
      }

      return items;
    };

    const hierarchy = buildHierarchy(categories);

    return (
      <div className="space-y-1">{hierarchy.flatMap((category) => renderTreeItem(category))}</div>
    );
  },
);

// Main list component with drag and drop support
export function CategoryList(props: CategoryListProps) {
  const { categories, viewMode, onReorder } = props;
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);

  // Update local categories when props change
  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Calculate reorder data based on new positions
  const calculateReorderData = useCallback((newCategories: Category[]) => {
    return newCategories.map((category, index) => ({
      id: category.id,
      sortOrder: (index + 1) * 10, // Use 10, 20, 30, etc for sortOrder
      parentId: category.parentId,
    }));
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragOver = useCallback(() => {
    // Handle potential parent changes during drag-over
    // This could be enhanced for nested drag-drop between parents
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = localCategories.findIndex((c) => c.id === active.id);
      const newIndex = localCategories.findIndex((c) => c.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newCategories = arrayMove(localCategories, oldIndex, newIndex);
        setLocalCategories(newCategories);

        // Calculate new sort orders
        const reorderData = calculateReorderData(newCategories);

        // Call the reorder callback
        if (onReorder) {
          onReorder(reorderData);
        }
      }
    },
    [localCategories, calculateReorderData, onReorder],
  );

  const renderView = () => {
    const viewProps = { ...props, activeId, categories: localCategories };
    switch (viewMode) {
      case "grid":
        return <CategoryGridView {...viewProps} />;
      case "tree":
        return <CategoryTreeView {...viewProps} />;
      default:
        return <CategoryTableView {...viewProps} />;
    }
  };

  // Find the active category for drag overlay
  const activeCategory = activeId ? localCategories.find((c) => c.id === activeId) : null;

  return (
    <DndContext
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localCategories.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {renderView()}
      </SortableContext>
      <DragOverlay>
        {activeCategory && (
          <div className="rounded-xl border border-blue-500/50 bg-surface-black p-2 opacity-90 shadow-2xl shadow-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/50 border border-white/10 overflow-hidden">
                {(activeCategory as Category & { imageUrl?: string }).imageUrl ? (
                  <img
                    src={(activeCategory as Category & { imageUrl?: string }).imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs">📁</span>
                )}
              </div>
              <span className="font-bold text-white">{activeCategory.name}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Export individual view components for specific use cases
export { CategoryTableView, CategoryGridView, CategoryTreeView };
