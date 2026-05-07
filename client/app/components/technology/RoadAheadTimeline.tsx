import type { ResearchVM, RoadmapVM } from "@shared/viewmodels";
import { gsap } from "@/lib/gsap";
import React from "react";
import { cn } from "@/lib/utils";

interface RoadAheadTimelineProps {
  roadmap: RoadmapVM[];
  research: ResearchVM[];
  className?: string;
}

type TimelineNode = {
  id: number;
  title: string;
  description: string;
  timeline: string;
  type: "roadmap" | "research";
  status?: string | undefined;
  isCurrent: boolean;
};

export function RoadAheadTimeline({ roadmap, research, className }: RoadAheadTimelineProps) {
  const sectionRef = React.useRef<HTMLElement>(null);

  // Merge and sort timeline nodes
  const nodes: TimelineNode[] = React.useMemo(() => {
    const roadmapNodes: TimelineNode[] = roadmap.map((r, i) => ({
      id: r.id,
      title: r.name,
      description: r.description,
      timeline: r.timeline || "TBD",
      type: "roadmap" as const,
      isCurrent: i === 0,
    }));

    const researchNodes: TimelineNode[] = research.map((r) => ({
      id: r.id,
      title: r.name,
      description: r.description,
      timeline: r.status || "Ongoing",
      type: "research" as const,
      status: r.status,
      isCurrent: false,
    }));

    return [...roadmapNodes, ...researchNodes].slice(0, 4);
  }, [roadmap, research]);

  // GSAP scroll-triggered stagger animation
  React.useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".timeline-node", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.15,
        ease: "power2.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (nodes.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={cn("py-32 px-6 max-w-7xl mx-auto relative overflow-hidden", className)}
    >
      {/* Vertical HUD text — left side */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:block">
        <span className="micro-copy opacity-20 dark:text-[#00D4FF] -rotate-90 origin-left whitespace-nowrap block">
          TIMELINE.JS_SYSTEM_V.03
        </span>
      </div>

      {/* Centered Section Header — Stitch style */}
      <h2 className="text-5xl md:text-6xl font-neue-stance font-bold text-black dark:text-white uppercase mb-24 text-center tracking-tight">
        The Road{" "}
        <span className="text-[#0047AB] dark:text-[#00D4FF] dark:drop-shadow-[0_0_10px_rgba(0,212,255,0.5)]">
          Ahead
        </span>
      </h2>

      {/* 4-column grid with connecting line */}
      <div className="relative">
        {/* Horizontal connecting line — visible on md+ at center of circles */}
        <div className="absolute top-[32px] left-0 right-0 h-px bg-slate-200 dark:bg-white/[0.08] hidden md:block"></div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {nodes.map((node, index) => (
            <div
              key={node.id}
              className={cn(
                "timeline-node relative flex flex-col items-center group",
                index === 1 && "opacity-80",
                index >= 2 && "opacity-60",
                "hover:!opacity-100",
              )}
            >
              {/* Medium circle node — Stitch w-12 h-12 */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full border flex items-center justify-center z-10 mb-8 transition-all shadow-sm",
                  node.isCurrent
                    ? "bg-white dark:bg-[#0A0A0A] border-[#0047AB] dark:border-[#00D4FF] timeline-pulse shadow-xl dark:shadow-[0_0_20px_rgba(0,212,255,0.3)]"
                    : "bg-slate-50 dark:bg-white/[0.04] backdrop-blur-xl border-slate-200 dark:border-white/[0.08] group-hover:border-[#0047AB] dark:group-hover:border-[#00D4FF] dark:group-hover:bg-[#0A0A0A] dark:group-hover:shadow-[0_0_15px_rgba(0,212,255,0.2)]",
                )}
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    node.isCurrent
                      ? "bg-[#0047AB] dark:bg-[#00D4FF] dark:shadow-[0_0_8px_#00D4FF]"
                      : "bg-slate-300 dark:bg-slate-600 group-hover:bg-[#0047AB] dark:group-hover:bg-[#00D4FF] dark:group-hover:shadow-[0_0_8px_#00D4FF]",
                  )}
                ></div>
              </div>

              {/* Card content */}
              <div
                className={cn(
                  "lab-card p-8 w-full border-l-0 group-hover:opacity-100 transition-all rounded-xl dark:backdrop-blur-xl",
                  node.isCurrent
                    ? "border-t-2 border-t-[#0047AB] dark:border-t-[#00D4FF] dark:bg-white/[0.04] border border-transparent dark:border-white/[0.08]"
                    : "border-t-2 border-t-slate-100 dark:border-t-white/[0.08] dark:bg-white/[0.02] border border-transparent dark:border-white/[0.08]",
                )}
              >
                {/* Current milestone badge */}
                {node.isCurrent && (
                  <span className="tech-badge !bg-[#0047AB] dark:!bg-[#00D4FF] !text-white dark:!text-black !border-[#0047AB] dark:!border-[#00D4FF] mb-4 block w-fit dark:shadow-[0_0_10px_rgba(0,212,255,0.4)]">
                    Current Milestone
                  </span>
                )}

                {/* Timeline tag */}
                <span className="text-[10px] text-slate-400 font-mono mb-2 block font-bold">
                  {node.timeline}
                </span>

                <h4 className="text-black dark:text-white font-bold uppercase text-lg mb-3 font-neue-stance">
                  {node.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#E3DFD6] font-light leading-relaxed font-helvetica">
                  {node.description}
                </p>

                {/* Status indicator for research */}
                {node.type === "research" && node.status && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/10 flex items-center gap-2">
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        node.status === "Ongoing" ? "bg-amber-400" : "bg-green-500",
                      )}
                    ></div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                      {node.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
