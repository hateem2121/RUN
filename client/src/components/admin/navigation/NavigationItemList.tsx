import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { MediaAsset, NavigationItem } from "@shared/schema";
import { Edit, GripVertical, Trash2 } from "lucide-react";
import { memo } from "react";
import { NavigationIcon } from "@/components/navigation/navigation-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface NavigationItemWithMedia extends NavigationItem {
  mediaIcon?: MediaAsset;
}

interface NavigationItemListProps {
  items: NavigationItemWithMedia[];
  onEdit: (item: NavigationItem) => void;
  onDelete: (id: number) => void;
  onReorder: (items: { id: number; sortOrder: number }[]) => void;
}

const SortableNavigationItem = memo(function SortableNavigationItem({
  item,
  onEdit,
  onDelete,
}: {
  item: NavigationItemWithMedia;
  onEdit: (item: NavigationItem) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={`${isDragging ? "shadow-lg" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div
            className="cursor-grab p-1 text-muted-foreground hover:text-foreground/80 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="relative flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
            <NavigationIcon
              iconType={item.iconType as "media" | "fallback"}
              {...(item.mediaIcon ? { mediaIcon: item.mediaIcon } : {})}
              {...(item.fallbackIcon ? { fallbackIcon: item.fallbackIcon } : {})}
              className="h-8 w-8"
              useAbsolutePositioning={false}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              {/* Fallback for legacy label field or missing title */}
              <h3 className="font-medium">{item.title || item.label || "Untitled"}</h3>
              <Badge variant={item.isActive ? "default" : "secondary"}>
                {item.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {/* Fallback for legacy url field or missing href */}
            <p className="text-muted-foreground text-sm">{item.href || item.url || "#"}</p>
            <p className="text-muted-foreground/70 text-xs">Order: {item.sortOrder}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export function NavigationItemList({
  items,
  onEdit,
  onDelete,
  onReorder,
}: NavigationItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over?.id);

      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      const reorderData = reorderedItems.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      }));

      onReorder(reorderData);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {items.map((item) => (
            <SortableNavigationItem key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
