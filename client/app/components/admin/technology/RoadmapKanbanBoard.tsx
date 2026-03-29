import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { RoadmapColumn } from "./RoadmapColumn";
import type { TechnologyRoadmap } from "./TechnologyRoadmapManagement";

interface RoadmapKanbanBoardProps {
  items: TechnologyRoadmap[];
  onEdit: (item: TechnologyRoadmap) => void;
  onDelete: (id: number) => void;
  onReorder: (items: TechnologyRoadmap[]) => void;
  onStatusChange: (id: number, status: string) => void;
}

const COLUMNS = [
  { id: "planned", title: "Strategic Pipeline", color: "text-[#68869A]" },
  { id: "active", title: "Active Execution", color: "text-[#00D4FF]" },
  { id: "validated", title: "Validated Innovation", color: "text-emerald-400" },
  { id: "complete", title: "Mission Complete", color: "text-[#D4A853]" },
];

export function RoadmapKanbanBoard({
  items,
  onEdit,
  onDelete,
  onReorder,
  onStatusChange,
}: RoadmapKanbanBoardProps) {
  const [, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const itemsByStatus = useMemo(() => {
    const groups: Record<string, TechnologyRoadmap[]> = {
      planned: [],
      active: [],
      validated: [],
      complete: [],
    };

    items.forEach((item) => {
      const status = item.status || "planned";
      if (status in groups) {
        groups[status]!.push(item);
      } else {
        groups.planned!.push(item);
      }
    });

    // Sort each group by position
    Object.keys(groups).forEach((key) => {
      groups[key]?.sort((a, b) => (a.position || 0) - (b.position || 0));
    });

    return groups;
  }, [items]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const dragActiveId = active.id as number;
    const overId = over.id as number | string;

    // Find the item being dragged
    const activeItem = items.find((i) => i.id === dragActiveId);
    if (!activeItem) return;

    const activeStatus = activeItem.status || "planned";

    // If over a column or an item in a different column
    let overStatus: string = typeof overId === "string" ? overId : String(overId);
    if (typeof overId === "number") {
      const overItem = items.find((i) => i.id === overId);
      overStatus = overItem?.status || "planned";
    }

    if (activeStatus !== overStatus && COLUMNS.some((c) => c.id === overStatus)) {
      onStatusChange(dragActiveId, overStatus);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dragActiveId = active.id as number;
    const overId = over.id as number;

    if (dragActiveId !== overId) {
      const activeItem = items.find((i) => i.id === dragActiveId);
      const overItem = items.find((i) => i.id === overId);

      if (activeItem && overItem && activeItem.status === overItem.status) {
        const status = activeItem.status || "planned";
        const columnItems = itemsByStatus[status] || [];
        const oldIndex = columnItems.findIndex((i) => i.id === dragActiveId);
        const newIndex = columnItems.findIndex((i) => i.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reorderedColumn = arrayMove(columnItems, oldIndex, newIndex);

          // Map back to global items while updating positions
          const updatedItems = items.map((item) => {
            const colItem = reorderedColumn.find((ri) => ri.id === item.id);
            if (colItem) {
              return { ...item, position: reorderedColumn.indexOf(colItem) };
            }
            return item;
          });

          onReorder(updatedItems);
        }
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <RoadmapColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            items={itemsByStatus[column.id] || []}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </DndContext>
  );
}
