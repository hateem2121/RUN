import type { Category } from "@shared/index";
import { Package } from "lucide-react";

interface CategoryDragOverlayProps {
  category: Category;
}

export default function CategoryDragOverlay({ category }: CategoryDragOverlayProps) {
  return (
    <div className="rotate-3 transform rounded-lg border border-blue-300 bg-white p-3 opacity-95 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-neutral-100">
          {category.primaryImageId ? (
            <img
              src={`/api/media/${category.primaryImageId}/content`}
              alt={category.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-200">
              <Package className="h-4 w-4 text-neutral-400" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-neutral-900 text-sm">{category.name}</div>
          <div className="text-neutral-500 text-xs">/{category.slug}</div>
        </div>
      </div>
    </div>
  );
}
