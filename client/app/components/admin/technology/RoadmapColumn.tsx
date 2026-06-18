import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { RoadmapCard } from "./RoadmapCard";
import type { TechnologyRoadmap } from "./TechnologyRoadmapManagement";

interface RoadmapColumnProps {
  id: string;
  title: string;
  color: string;
  items: TechnologyRoadmap[];
  onEdit: (item: TechnologyRoadmap) => void;
  onDelete: (id: number) => void;
}

export function RoadmapColumn({ id, title, color, items, onEdit, onDelete }: RoadmapColumnProps) {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: "Column",
    },
  });

  return (
    <div className="flex flex-col gap-4 min-w-custom-space-104">
      <div className="flex items-center gap-2 px-2">
        <div className={cn("size-2 rounded-full", color.replace("text-", "bg-"))} title={title} />
        <h3 className={cn("text-xs font-black uppercase tracking-widest", color)}>{title}</h3>
        <span className="ml-auto text-xxs font-bold text-admin-muted bg-white/5 px-1.5 py-0.5 rounded">
          {items.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-3 p-2 rounded-2xl bg-white/[0.02] border border-white/[0.05] min-h-custom-space-105"
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <RoadmapCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
          ))}
          {items.length === 0 && (
            <div className="flex flex-1 items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-xl">
              <p className="text-xxs font-bold text-admin-muted uppercase tracking-widest leading-relaxed">
                Drop milestones here to prioritize
              </p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
