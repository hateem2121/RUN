import type { SustainabilityGoal } from "@shared/schema";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle, Circle, Target } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { calculateGoalProgress } from "@/lib/sustainability-utils";

gsap.registerPlugin(ScrollTrigger);

interface GoalsSectionProps {
  goals: SustainabilityGoal[];
  title?: string | undefined;
  description?: string | undefined;
}

/* ─────────────────────────────────────────────
   Timeline Dot (status indicator)
   ───────────────────────────────────────────── */
function TimelineDot({ progress }: { progress: number }) {
  if (progress >= 100) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00C97B] shadow-[0_0_12px_rgba(0,201,123,0.4)]">
        <CheckCircle className="h-4 w-4 text-white" />
      </div>
    );
  }
  if (progress > 0) {
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00C97B] shadow-[0_0_12px_rgba(0,201,123,0.3)]">
        <Target className="h-4 w-4 text-white" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-[#00C97B]/40 bg-transparent">
      <Circle className="h-3 w-3 text-[#00C97B]/40" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Goal Card (branching from timeline)
   ───────────────────────────────────────────── */
function GoalCard({ goal, progress }: { goal: SustainabilityGoal; progress: number }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    gsap.fromTo(
      bar,
      { width: "0%" },
      {
        width: `${Math.min(progress, 100)}%`,
        duration: 1.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: bar.parentElement,
          start: "top 85%",
        },
      },
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === bar.parentElement) t.kill();
      });
    };
  }, [progress]);

  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl p-6 transition-all duration-300 hover:bg-white/[0.07] hover:border-[#00C97B]/20">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-white">{goal.title}</h3>
          {goal.targetYear && (
            <span className="font-medium text-sm text-[#00C97B]">{goal.targetYear}</span>
          )}
        </div>

        {goal.category && (
          <span className="mb-3 inline-block rounded-full bg-[#00C97B]/10 px-3 py-1 font-medium text-[#00C97B] text-xs">
            {goal.category}
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-[#68869A]">Progress</span>
          <span className="font-medium text-sm text-white">{progress.toFixed(1)}%</span>
        </div>
        <div
          className="h-2 w-full rounded-full bg-white/[0.08] overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goal.title} progress`}
        >
          <div
            ref={barRef}
            className="h-full rounded-full bg-gradient-to-r from-[#00C97B] to-[#00C97B]/70 w-0"
          />
        </div>
      </div>

      <div className="mb-4 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#68869A]">Current:</span>
          <span className="font-medium text-white">
            {goal.currentValue || "0"} {goal.unit}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#68869A]">Target:</span>
          <span className="font-medium text-white">
            {goal.targetValue} {goal.unit}
          </span>
        </div>
      </div>

      {goal.description && (
        <p className="text-sm text-[#E3DFD6]/70 leading-relaxed">{goal.description}</p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Goals Section — Vertical Timeline
   ───────────────────────────────────────────── */
export function GoalsSection({
  goals,
  title = "Our Sustainability Goals",
  description = "Track our progress toward achieving ambitious sustainability targets and environmental commitments.",
}: GoalsSectionProps) {
  const goalsWithProgress = useMemo(
    () =>
      goals.map((goal) => ({
        ...goal,
        progress: calculateGoalProgress(goal.currentValue, goal.targetValue),
      })),
    [goals],
  );

  return (
    <section className="relative bg-[#0F0F0F] py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 font-bold font-neue-stance text-3xl text-white">{title}</h2>
          <p className="mx-auto max-w-3xl text-lg text-[#E3DFD6]">{description}</p>
        </div>

        {/* Timeline Layout */}
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-[#00C97B]/60 via-[#00C97B]/30 to-transparent" />

            {/* Goal items */}
            <div className="space-y-8">
              {goalsWithProgress.map((goal, index) => (
                <div key={goal.id} className="relative flex gap-6 items-start">
                  {/* Timeline dot */}
                  <div className="shrink-0 relative z-10">
                    <TimelineDot progress={goal.progress} />
                    {/* Connector to card */}
                    {index < goalsWithProgress.length - 1 && (
                      <div className="absolute left-1/2 top-8 -translate-x-1/2 w-px h-8 bg-[#00C97B]/20" />
                    )}
                  </div>

                  {/* Goal card */}
                  <div className="flex-1 pb-2">
                    <GoalCard goal={goal} progress={goal.progress} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
