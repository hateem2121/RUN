import { useGSAP } from "@gsap/react";
import type { ResearchVM, RoadmapVM } from "@shared/viewmodels";
import gsap from "gsap";
import { Draggable } from "gsap/dist/Draggable";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useMemo, useRef } from "react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable, ScrollTrigger);
}

interface RoadAheadTimelineProps {
  roadmap: RoadmapVM[];
  research: ResearchVM[];
}

type TimelineNode = {
  id: string;
  type: "milestone" | "research";
  title: string;
  description: string;
  dateStr: string;
  sortValue: string;
  isCurrent: boolean;
  researchArea?: string | undefined;
  teamCount?: number | undefined;
  status?: string | undefined;
};

export function RoadAheadTimeline({ roadmap, research }: RoadAheadTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragTargetRef = useRef<HTMLDivElement>(null);

  const nodes: TimelineNode[] = useMemo(() => {
    const combined: TimelineNode[] = [
      ...roadmap.map((r) => ({
        id: `rm-${r.id}`,
        type: "milestone" as const,
        title: r.name,
        description: r.description,
        dateStr: r.timeline,
        sortValue: r.timeline || "9999",
        isCurrent: r.timeline ? r.timeline.includes("2024") || r.timeline.includes("2025") : false,
        status: "Planned",
      })),
      ...research.map((r) => ({
        id: `rs-${r.id}`,
        type: "research" as const,
        title: r.name,
        description: r.description,
        dateStr: r.startDate
          ? new Date(r.startDate).toLocaleDateString(undefined, { year: "numeric", month: "short" })
          : "Ongoing",
        sortValue: r.startDate || "9999",
        isCurrent: r.status === "Ongoing",
        researchArea: r.researchArea,
        status: r.status,
        teamCount: r.teamMembers?.length || 0,
      })),
    ];

    return combined.sort((a, b) => a.sortValue.localeCompare(b.sortValue));
  }, [roadmap, research]);

  useGSAP(
    () => {
      if (dragTargetRef.current && containerRef.current) {
        Draggable.create(dragTargetRef.current, {
          type: "x",
          bounds: containerRef.current,
          inertia: true,
          edgeResistance: 0.65,
        });

        const cards = gsap.utils.toArray<HTMLElement>(".timeline-node-card");
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: (_, el) => (el.classList.contains("node-above") ? 20 : -20) },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: containerRef.current,
                start: "top 75%",
              },
            },
          );
        }
      }
    },
    { scope: containerRef, dependencies: [nodes] },
  );

  return (
    <section className="py-24 overflow-hidden relative min-h-[600px]" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center relative z-10">
        <Typography.H2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 uppercase tracking-tight mb-4">
          The Road <span className="text-[#00D4FF]">Ahead</span>
        </Typography.H2>
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs max-w-xl mx-auto uppercase tracking-widest font-mono">
          <span className="material-symbols-outlined text-sm animate-pulse">swipe</span>
          Drag to explore timeline
        </div>
      </div>


      <div className="relative h-[480px] w-full cursor-grab active:cursor-grabbing pb-8 pr-20 overflow-visible z-10">
        <div
          ref={dragTargetRef}
          className="absolute inset-y-0 left-10 md:left-[10vw] flex items-center min-w-[200vw] sm:min-w-[150vw]"
        >
          {/* Continuous cyan timeline spine */}
          <div className="absolute left-0 right-0 h-[1px] bg-[#00D4FF]/20 z-0 shadow-[0_0_10px_rgba(0,212,255,0.1)] pointer-events-none"></div>


          {nodes.map((node, index) => {
            const isAbove = index % 2 === 0;
            const isCurrent = node.isCurrent;

            return (
              <div
                key={node.id}
                className="relative z-10 w-[300px] md:w-[380px] flex-shrink-0 flex items-center justify-center -ml-10"
              >
                {/* Visual Dot on line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full border-2 transition-all duration-300",
                      isCurrent
                        ? "bg-[#00D4FF] border-[#00D4FF] shadow-[0_0_15px_rgba(0,212,255,0.4)]"
                        : "bg-white border-[#00D4FF] shadow-[0_0_5px_rgba(0,212,255,0.1)]",
                    )}
                  />
                </div>


                {/* Floating Card */}
                <div
                  className={cn(
                    "timeline-node-card node-above absolute left-1/2 w-[260px] md:w-[320px] -translate-x-1/2",
                    isAbove ? "bottom-[40px] node-above" : "top-[40px] !node-above", // Keep class for GSAP select, but adjust manually below
                    "bg-white/60 backdrop-blur-xl border p-6 rounded-xl shadow-lg transition-all duration-500 hover:border-[#00D4FF]/30 hover:shadow-cyan-100/50 hover:shadow-xl",
                    isCurrent ? "border-[#00D4FF]/30" : "border-black/5",
                  )}
                  style={{ top: isAbove ? "auto" : "40px", bottom: isAbove ? "40px" : "auto" }}
                >

                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                      {node.type === "research" ? "RESEARCH" : "ROADMAP"}
                    </span>
                    <span className="text-[10px] font-mono text-[#0088AA] bg-[#00D4FF]/10 px-2 py-0.5 rounded border border-[#00D4FF]/20">
                      {node.dateStr}
                    </span>
                  </div>

                  <Typography.H4 className="text-lg font-bold text-slate-900 uppercase font-display tracking-tight mb-2">
                    {node.title}
                  </Typography.H4>

                  <Typography.P className="text-xs text-slate-600 leading-relaxed font-light mb-4 line-clamp-3">
                    {node.description}
                  </Typography.P>


                  <div className="flex flex-wrap gap-2 mt-auto border-t border-black/5 pt-4">
                    {node.type === "research" ? (
                      <>
                        <span className="text-[10px] uppercase font-mono px-2 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded">
                          {node.researchArea || "Core Tech"}
                        </span>
                        {(node.teamCount ?? 0) > 0 && (
                          <span className="text-[10px] uppercase font-mono px-2 py-1 bg-[#00D4FF]/5 border border-[#00D4FF]/10 text-[#0088AA] rounded flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">group</span>
                            {node.teamCount} STAFF
                          </span>
                        )}
                        <span className="text-[10px] uppercase font-mono px-2 py-1 text-slate-700 border border-slate-200 rounded">
                          {node.status}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] uppercase font-mono px-2 py-1 bg-slate-50 border border-slate-200 text-slate-500 rounded">
                        PHASE: {node.status || "PLANNED"}
                      </span>
                    )}
                  </div>

                </div>

                {/* Connecting stem line */}
                <div
                  className={cn(
                    "absolute left-1/2 w-[1px] bg-[#00D4FF]/30 -translate-x-1/2 pointer-events-none z-10",
                  )}
                  style={{
                    height: "24px",
                    top: isAbove ? "auto" : "10px",
                    bottom: isAbove ? "10px" : "auto",
                    transform: isAbove ? "translateY(100%)" : "translateY(-100%)",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
