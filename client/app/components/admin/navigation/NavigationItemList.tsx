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
import type { MediaAsset, NavigationItem } from "@shared/index";
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
    <Card
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "shadow-2xl shadow-blue-500/10 border-blue-500/30 scale-[1.02]" : "border-white/5"} bg-[#0A0A0A] overflow-hidden group transition-all duration-200`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div
            className="cursor-grab p-1 text-[#68869A] hover:text-white transition-colors active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-blue-500/30 transition-colors shadow-inner">
            <NavigationIcon
              iconType={item.iconType as "media" | "fallback"}
              {...(item.mediaIcon ? { mediaIcon: item.mediaIcon } : {})}
              {...(item.fallbackIcon ? { fallbackIcon: item.fallbackIcon } : {})}
              className="h-6 w-6 text-white"
              useAbsolutePositioning={false}
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white tracking-tight">
                {item.title || item.label || "Untitled"}
              </h3>
              <Badge
                variant="outline"
                className={
                  item.isActive
                    ? "bg-green-500/10 text-green-400 border-green-500/20 font-bold uppercase tracking-widest text-[10px]"
                    : "bg-white/5 text-[#68869A] border-white/10 font-bold uppercase tracking-widest text-[10px]"
                }
              >
                {item.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-[#68869A] text-sm mt-1">{item.href || item.url || "#"}</p>
            <p className="text-[#68869A]/50 text-[10px] mt-1 font-mono uppercase tracking-wider font-bold">
              Sort Order: <span className="text-white/70">{item.sortOrder}</span>
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(item)}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-8 w-8 p-0 rounded-lg transition-colors"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(item.id)}
              className="bg-white/5 border-white/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 h-8 w-8 p-0 rounded-lg transition-colors"
            >
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
