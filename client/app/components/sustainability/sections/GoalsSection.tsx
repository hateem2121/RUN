import { useGSAP } from "@gsap/react";
import type { SustainabilityGoal } from "@shared/index";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useMemo, useRef } from "react";
import { calculateGoalProgress } from "@/lib/sustainability-utils";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface GoalsSectionProps {
  goals: SustainabilityGoal[];
  title?: string | undefined;
  description?: string | undefined;
}

function RoadmapItem({
  goal,
  progress,
  index,
}: {
  goal: SustainabilityGoal;
  progress: number;
  index: number;
}) {
  const barRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isEven = index % 2 === 0;

  const isDone = progress >= 100;
  const isInProgress = progress > 0 && progress < 100;

  useGSAP(
    () => {
      // Fade up the whole item
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      });

      // Animate the progress bar width
      if (barRef.current) {
        gsap.fromTo(
          barRef.current,
          { width: "0%" },
          {
            width: `${Math.min(progress, 100)}%`,
            duration: 1.5,
            ease: "power2.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }

      // Count-up on percentage text
      const percentEl = containerRef.current?.querySelector(".goal-percent") as HTMLElement | null;
      if (percentEl && progress > 0 && progress < 100) {
        const pObj = { val: 0 };
        gsap.to(pObj, {
          val: progress,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
          onUpdate: () => {
            percentEl.textContent = `${Math.floor(pObj.val)}% Complete`;
          },
        });
      }
    },
    { scope: containerRef, dependencies: [progress] },
  );

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 group"
    >
      {/* Vertical center connecting line */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -translate-x-1/2 group-last:bottom-auto group-last:h-full" />

      {/* Left-side visually (Year for even, Content for odd) */}
      <div className={cn("md:w-[45%] md:text-right", !isEven && "md:order-last")}>
        <span
          className={cn(
            "text-5xl font-bold font-neue-stance",
            isDone ? "text-[color:var(--s-primary)] opacity-40" : "text-white opacity-20",
          )}
        >
          {goal.targetYear || `${2025 + index * 3}`}
        </span>
      </div>

      {/* Timeline Node - center */}
      <div className="absolute left-[-9px] md:left-1/2 md:-translate-x-1/2 z-10 mt-2 md:mt-0">
        {isDone ? (
          <div className="w-4 h-4 rounded-full bg-[color:var(--s-primary)] shadow-[0_0_15px_rgba(0,199,123,0.6)]" />
        ) : isInProgress ? (
          <div className="w-4 h-4 rounded-full border-2 border-[color:var(--s-primary)] bg-[color:var(--s-bg-card)]" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-gray-600 bg-[color:var(--s-bg-card)]" />
        )}
      </div>

      {/* Right-side visually (Content for even, Year for odd) */}
      <div className={cn("pl-8 md:pl-0 md:w-[45%]", !isEven && "md:text-right")}>
        <h3 className="text-xl font-bold text-white mb-2">{goal.title}</h3>
        {goal.description && <p className="text-sm mb-3 text-white/60">{goal.description}</p>}

        <div
          className={cn(
            "w-full h-1.5 bg-white/10 rounded-full overflow-hidden",
            !isEven && "md:ml-auto",
          )}
        >
          <div
            ref={barRef}
            className={cn(
              "h-full rounded-full w-0",
              isDone
                ? "bg-[color:var(--s-primary)]"
                : isInProgress
                  ? "bg-[color:var(--s-primary)]"
                  : "bg-gray-600",
            )}
          />
        </div>

        <span
          className={cn(
            "text-xs mt-1 block font-mono",
            isDone
              ? "text-[color:var(--s-primary)]"
              : isInProgress
                ? "text-white/60"
                : "text-gray-500",
          )}
        >
          {isDone ? (
            "Complete"
          ) : isInProgress ? (
            <span className="goal-percent">0% Complete</span>
          ) : (
            "Initiation Phase"
          )}
        </span>
      </div>
    </div>
  );
}

export function GoalsSection({
  goals,
  title = "2030 Sustainability Roadmap",
  description = "Track our progress toward achieving ambitious sustainability targets and environmental commitments.",
}: GoalsSectionProps) {
  const containerRef = useRef<HTMLElement>(null);

  const goalsWithProgress = useMemo(
    () =>
      goals.map((goal) => ({
        ...goal,
        progress: calculateGoalProgress(goal.currentValue, goal.targetValue),
      })),
    [goals],
  );

  return (
    <section
      ref={containerRef}
      className="relative py-24 px-6 lg:px-10 overflow-hidden bg-[color:var(--s-bg)] text-white border-t border-[color:var(--s-border-card)]"
    >
      {/* Right-side fade accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[color:var(--s-primary)]/8 to-transparent pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        <h2 className="mb-4 text-center text-3xl md:text-4xl font-bold font-neue-stance text-white">
          {title}
        </h2>
        <p className="mb-16 text-center text-white/60 max-w-2xl mx-auto">{description}</p>

        {/* Timeline rows */}
        <div className="relative border-l-2 border-white/10 ml-4 md:ml-0 md:pl-0 md:border-none space-y-12">
          {goalsWithProgress.map((goal, index) => (
            <RoadmapItem key={goal.id} goal={goal} progress={goal.progress} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
