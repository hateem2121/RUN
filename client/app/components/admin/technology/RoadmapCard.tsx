import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, GripVertical, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TechnologyRoadmap } from "./TechnologyRoadmapManagement";

interface RoadmapCardProps {
  item: TechnologyRoadmap;
  onEdit: (item: TechnologyRoadmap) => void;
  onDelete: (id: number) => void;
}

export function RoadmapCard({ item, onEdit, onDelete }: RoadmapCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-300 backdrop-blur-md",
        isDragging
          ? "z-50 border-[#00D4FF] bg-white/[0.08] shadow-[0_0_30px_rgba(0,212,255,0.2)] scale-[1.02]"
          : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.06]",
      )}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab text-admin-foreground/20 transition-colors hover:text-[#00D4FF]/40 active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <h4 className="flex-1 text-sm font-bold tracking-tight text-white leading-tight">
            {item.title}
          </h4>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              aria-label="Action button"
              type="button"
              onClick={() => onEdit(item)}
              className="text-admin-foreground/40 hover:text-[#00D4FF]"
              title="Edit Milestone"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label="Action button"
              type="button"
              onClick={() => onDelete(item.id)}
              className="text-admin-foreground/40 hover:text-red-400"
              title="Delete Milestone"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-[#00D4FF]/20 bg-[#00D4FF]/5 text-[#00D4FF] text-[9px] uppercase tracking-wider h-5"
          >
            {item.timeline}
          </Badge>
          {item.priority && (
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] uppercase tracking-wider h-5",
                item.priority === "high"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : item.priority === "medium"
                    ? "bg-brand-manufacturing/10 text-brand-manufacturing border-brand-manufacturing/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20",
              )}
            >
              {item.priority}
            </Badge>
          )}
        </div>

        <p className="line-clamp-2 text-admin-foreground/40 text-[11px] leading-relaxed italic">
          {item.description}
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-white/5">
          <div className="flex -space-x-1.5 overflow-hidden">
            <div className="size-5 rounded-full border border-surface-black bg-white/5 flex items-center justify-center">
              <Zap className="size-2.5 text-[#00D4FF]/60" />
            </div>
          </div>

          <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">
            ID: {item.id}
          </span>
        </div>
      </div>
    </div>
  );
}
