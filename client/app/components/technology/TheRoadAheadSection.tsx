import type { ResearchVM, RoadmapVM } from "@shared/viewmodels";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface TheRoadAheadSectionProps {
  roadmap: RoadmapVM[];
  research: ResearchVM[];
}

// Unified node type to simplify rendering
interface TimelineNode {
  id: number;
  type: "milestone" | "research";
  title: string;
  subtitle: string | undefined;
  description: string;
  dateStr: string;
  status: string | undefined;
  isCurrent?: boolean;
}

export function TheRoadAheadSection({ roadmap, research }: TheRoadAheadSectionProps) {
  // Merge and sort roadmap/research nodes sequentially by some heuristic.
  // We'll mimic the layout from Stitch which has ~4 distinct visual states across the timeline.

  const nodes: TimelineNode[] = [
    ...roadmap.map((r) => ({
      id: r.id,
      type: "milestone" as const,
      title: r.name,
      subtitle: r.timeline,
      description: r.description,
      dateStr: r.timeline, // using timeline as the date marker
      status: "Milestone",
      isCurrent: r.timeline?.includes("2024") || false,
    })),
    ...research.map((r) => ({
      id: r.id,
      type: "research" as const,
      title: r.name,
      subtitle: r.status,
      description: r.description,
      dateStr: r.startDate || "Ongoing", // fallback
      status: r.status,
      isCurrent: r.status === "Ongoing",
    })),
  ];

  // Optional: sort nodes by some heuristic if date string parsing works
  // nodes.sort(...)

  // Limit to 4 for the clean demo look, or allow all to scroll. We'll show up to 4 for desktop view parity.
  const displayNodes = nodes.slice(0, 4);

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto relative">
      <div className="absolute top-0 right-6 text-[10px] font-mono text-white/40 border-l border-white/20 pl-2">
        TIMELINE.JS
      </div>
      <Typography.H2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase mb-20 text-center tracking-tight">
        The Road <span className="text-[#00D4FF]">Ahead</span>
      </Typography.H2>

      <div className="timeline-container relative pt-10">
        {/* Horizontal line for desktop */}
        <div className="hidden md:block absolute top-[52px] left-0 right-0 h-px bg-[#00D4FF]/20 z-0"></div>
        {/* Vertical line for mobile */}
        <div className="md:hidden absolute top-0 bottom-0 left-[23px] w-px bg-[#00D4FF]/30 z-0"></div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
          {displayNodes.map((node, index) => {
            // Distribute visual styles across nodes to mimic Stitch
            let nodeClass = "";
            let cardClass = "";
            let dotContent = null;

            if (index === 0) {
              // Active/Current
              nodeClass =
                "bg-[#00D4FF] shadow-[0_0_0_0_rgba(0,212,255,0.7)] animate-pulse border-white";
              cardClass = "bg-white border-gray-200 text-black";
              dotContent = (
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                </div>
              );
            } else if (index === 1) {
              // Next
              nodeClass =
                "bg-[#00D4FF] shadow-[0_0_0_4px_rgba(0,212,255,0.1)] border-[#00D4FF] group-hover:scale-125";
              cardClass = "bg-white border-gray-200 text-black opacity-90";
            } else {
              // Future
              nodeClass = "bg-black/50 border-white/30 group-hover:border-[#00D4FF]";
              cardClass =
                "bg-black/40 border-white/10 text-white opacity-70 hover:opacity-100 hover:bg-black/60 hover:border-white/30";
            }

            return (
              <div
                key={`${node.type}-${node.id}`}
                className="relative flex flex-row md:flex-col items-start md:items-center text-left md:text-center group gap-6 md:gap-0 pl-2 md:pl-0"
              >
                {/* Node Dot */}
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2 relative z-10 mb-6 flex-shrink-0 mt-6 md:mt-0 transition-all duration-300",
                    nodeClass,
                  )}
                />

                {/* Content Card */}
                <div
                  className={cn(
                    "mt-0 md:mt-4 p-6 border rounded-xl transition-all w-full relative overflow-hidden backdrop-blur-sm",
                    cardClass,
                  )}
                >
                  {dotContent}

                  {index === 0 && (
                    <span className="text-[10px] text-[#00D4FF] font-mono mb-2 block tracking-widest font-bold bg-[#00D4FF]/10 inline-block px-2 py-0.5 rounded">
                      CURRENT MILESTONE
                    </span>
                  )}

                  <span
                    className={cn(
                      "text-xs font-mono mb-2 block tracking-wider font-bold",
                      index < 2 ? "text-gray-600" : "text-white/50",
                    )}
                  >
                    {node.dateStr}
                  </span>

                  <Typography.H4
                    className={cn(
                      "font-bold uppercase text-lg mb-2 line-clamp-2",
                      index < 2 ? "text-black" : "text-white",
                    )}
                  >
                    {node.title}
                  </Typography.H4>

                  <Typography.P
                    className={cn(
                      "text-xs font-light line-clamp-3",
                      index < 2 ? "text-gray-500" : "text-white/60",
                    )}
                  >
                    {node.description}
                  </Typography.P>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
