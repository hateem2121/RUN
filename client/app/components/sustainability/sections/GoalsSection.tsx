import type { SustainabilityGoal } from "@shared/index";
import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { calculateGoalProgress } from "@/lib/sustainability-utils";
import { cn } from "@/lib/utils";

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
      <div className={cn("md:w-custom-space-228 md:text-right", !isEven && "md:order-last")}>
        <span
          className={cn(
            "text-5xl font-bold font-neue-stance",
            isDone ? "text-custom-misc-287 opacity-40" : "text-white opacity-20",
          )}
        >
          {goal.targetYear || `${2025 + index * 3}`}
        </span>
      </div>

      {/* Timeline Node - center */}
      <div className="absolute left-custom-space-229 md:left-1/2 md:-translate-x-1/2 z-10 mt-2 md:mt-0">
        {isDone ? (
          <div className="w-4 h-4 rounded-full bg-custom-misc-288 shadow-custom-misc-289" />
        ) : isInProgress ? (
          <div className="w-4 h-4 rounded-full border-2 border-custom-misc-290 bg-custom-misc-291" />
        ) : (
          <div className="w-4 h-4 rounded-full border-2 border-gray-600 bg-custom-misc-292" />
        )}
      </div>

      {/* Right-side visually (Content for even, Year for odd) */}
      <div className={cn("pl-8 md:pl-0 md:w-custom-space-230", !isEven && "md:text-right")}>
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
              isDone ? "bg-custom-misc-293" : isInProgress ? "bg-custom-misc-294" : "bg-gray-600",
            )}
          />
        </div>

        <span
          className={cn(
            "text-xs mt-1 block font-mono",
            isDone ? "text-custom-misc-295" : isInProgress ? "text-white/60" : "text-gray-500",
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
      className="relative py-24 px-6 lg:px-10 overflow-hidden bg-custom-misc-296 text-white border-t border-custom-misc-297"
    >
      {/* Right-side fade accent */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-custom-misc-298/8 to-transparent pointer-events-none" />

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
