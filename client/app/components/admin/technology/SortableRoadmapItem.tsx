import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronRight, Edit2, GripVertical, Milestone, Target, Trash2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TechnologyRoadmap {
  id: number;
  title: string;
  timeline: string;
  description?: string;
  impact?: string[];
  imageId?: number | null;
  videoId?: number | null;
  isActive?: boolean;
}

interface SortableRoadmapItemProps {
  item: TechnologyRoadmap;
  onEdit: (item: TechnologyRoadmap) => void;
  onDelete: (id: number) => void;
}

export function SortableRoadmapItem({ item, onEdit, onDelete }: SortableRoadmapItemProps) {
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
        "group relative overflow-hidden rounded-2xl border transition-all duration-300",
        isDragging
          ? "z-50 border-[#00D4FF] bg-white/[0.08] shadow-[0_0_30px_rgba(0,212,255,0.2)]"
          : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.06] hover:shadow-2xl",
      )}
    >
      {/* Status Accent Link */}
      <div
        className={cn(
          "absolute top-0 left-0 h-full w-1",
          item.isActive ? "bg-[#00D4FF]" : "bg-[#68869A]/30",
        )}
      />

      <div className="flex p-5 sm:p-6">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mr-2 flex cursor-grab items-center justify-center self-stretch text-admin-foreground/20 transition-colors hover:text-[#00D4FF]/40 active:cursor-grabbing"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        <div className="flex flex-1 flex-col gap-6 sm:flex-row sm:items-center">
          {/* Milestone Icon */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-[#00D4FF] ring-1 ring-white/10 transition-transform group-hover:scale-110">
            {item.isActive ? (
              <Zap className="h-6 w-6" />
            ) : (
              <Milestone className="h-6 w-6 text-admin-muted" />
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight text-white">{item.title}</h3>
              <Badge
                variant="outline"
                className="border-[#00D4FF]/20 bg-[#00D4FF]/5 text-[#00D4FF] text-xxs uppercase tracking-widest"
              >
                {item.timeline}
              </Badge>
              {!item.isActive && (
                <Badge
                  variant="outline"
                  className="border-white/10 bg-white/5 text-admin-foreground/40 text-xxs uppercase tracking-widest"
                >
                  Archived
                </Badge>
              )}
            </div>

            <p className="line-clamp-2 max-w-2xl text-admin-foreground/60 text-sm leading-relaxed">
              {item.description ||
                "Future technology milestone focusing on platform ecosystem growth and manufacturer integration."}
            </p>

            {item.impact && item.impact.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {item.impact.slice(0, 3).map((imp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 rounded-full bg-white/[0.03] px-2.5 py-1 ring-1 ring-white/5"
                  >
                    <Target className="h-3 w-3 text-[#00D4FF]/60" />
                    <span className="text-admin-foreground/50 text-[11px] font-medium">{imp}</span>
                  </div>
                ))}
                {item.impact.length > 3 && (
                  <span className="text-admin-foreground/30 text-xxs font-medium">
                    +{item.impact.length - 3} More
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2 self-start pt-1 sm:self-center sm:pt-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-white/[0.03] text-admin-foreground/40 transition-all hover:bg-[#00D4FF]/10 hover:text-[#00D4FF] active:scale-95"
              onClick={() => onEdit(item)}
              title="Edit Milestone"
              aria-label="Edit Milestone"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-white/[0.03] text-admin-foreground/40 transition-all hover:bg-red-500/10 hover:text-red-400 active:scale-95"
              onClick={() => onDelete(item.id)}
              title="Delete Milestone"
              aria-label="Delete Milestone"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="ml-2 h-8 w-px bg-white/10" />
            <div className="flex h-9 items-center px-2 text-[#00D4FF]">
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
