import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, Layers, Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/admin/shared";
import { cn } from "@/lib/utils";

// Types
interface ResearchProject {
  name: string;
  status: "Planning" | "In Progress" | "Testing" | "Completed";
  progress: number;
}

interface TechnologyResearch {
  id: number;
  title: string;
  description?: string;
  researchArea?: string;
  status?: "Planning" | "In Progress" | "Testing" | "Completed" | "Ongoing";
  currentProjects?: ResearchProject[];
  isActive?: boolean;
  position?: number;
}

interface SortableResearchItemProps {
  research: TechnologyResearch;
  onEdit: (research: TechnologyResearch) => void;
  onDelete: (id: number) => void;
}

export function SortableResearchItem({ research, onEdit, onDelete }: SortableResearchItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: research.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const statusConfig = {
    Ongoing: {
      color: "bg-custom-color-61",
      label: "Active Research",
      badge: "bg-custom-color-62/10 text-custom-color-63 border-custom-color-64/20",
    },
    "In Progress": {
      color: "bg-custom-color-65",
      label: "In Progress",
      badge: "bg-custom-color-66/10 text-custom-color-67 border-custom-color-68/20",
    },
    Completed: {
      color: "bg-emerald-500",
      label: "Completed",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    Planning: {
      color: "bg-slate-600",
      label: "Planned",
      badge: "bg-slate-700 text-slate-400 border-slate-600",
    },
    Testing: {
      color: "bg-amber-500",
      label: "Testing",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
  }[research.status || "Ongoing"] || {
    color: "bg-slate-600",
    label: research.status || "Unknown",
    badge: "bg-slate-700 text-slate-400 border-slate-600",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center gap-6 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 transition-all hover:bg-white/[0.06] hover:border-custom-color-69/30 backdrop-blur-xl"
    >
      {/* Status Accent Bar */}
      <div
        className={cn(
          "h-16 w-1.5 shrink-0 rounded-full transition-all group-hover:shadow-custom-misc-93",
          statusConfig.color,
          statusConfig.color.includes("00D4FF") && "group-hover:shadow-custom-color-70",
        )}
      />

      <div className="flex-1 min-w-0 font-display">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="text-lg font-bold text-white tracking-wide truncate">{research.title}</h4>
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xxs font-black uppercase tracking-widest",
              statusConfig.badge,
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        {research.researchArea && (
          <p className="mb-2 text-xxs font-bold uppercase tracking-custom-misc-94 text-custom-color-71/70">
            Focus: {research.researchArea}
          </p>
        )}

        <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-admin-foreground/60">
          {research.description ||
            "Experimental research initiative exploring advanced material properties and biomechanical integration for high-performance footwear."}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-10 w-10 cursor-grab items-center justify-center rounded-lg text-white/20 transition-colors hover:bg-white/5 hover:text-white active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <Layers className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => onEdit(research)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-admin-foreground/40 transition-all hover:bg-custom-color-72/10 hover:text-custom-color-73"
          title="Edit item"
          aria-label="Edit item"
        >
          <Edit2 className="h-5 w-5" />
        </button>

        <DeleteConfirmationDialog
          onConfirm={() => onDelete(research.id)}
          title="Archive Research"
          description="Are you sure you want to deprioritize and archive this research initiative?"
          trigger={
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-admin-foreground/40 transition-all hover:bg-rose-500/10 hover:text-rose-500"
              title="Delete item"
              aria-label="Delete item"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          }
        />
      </div>
    </div>
  );
}
