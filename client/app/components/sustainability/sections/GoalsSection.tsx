import type { SustainabilityGoal } from "@shared/schema";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { calculateGoalProgress } from "@/lib/sustainability-utils";

export function GoalsSection({
  goals,
  title = "Our Sustainability Goals",
  description = "Track our progress toward achieving ambitious sustainability targets and environmental commitments.",
}: {
  goals: SustainabilityGoal[];
  title?: string | undefined;
  description?: string | undefined;
}) {
  const goalsWithProgress = useMemo(
    () =>
      goals.map((goal) => ({
        ...goal,
        progress: calculateGoalProgress(goal.currentValue, goal.targetValue),
      })),
    [goals],
  );

  return (
    <section className="relative bg-stone-50 py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-bold font-neue-stance text-3xl text-stone-900">{title}</h2>
          <p className="mx-auto max-w-3xl text-lg text-stone-600">{description}</p>
        </motion.div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {goalsWithProgress.map((goal, index) => {
            const progress = goal.progress;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="rounded-xl border border-stone-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-stone-900">{goal.title}</h3>
                    <span className="font-medium text-sm text-stone-600">{goal.targetYear}</span>
                  </div>

                  {goal.category && (
                    <span className="mb-3 inline-block rounded-full bg-stone-200 px-3 py-1 font-medium text-stone-800 text-xs">
                      {goal.category}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-stone-600">Progress</span>
                    <span className="font-medium text-sm text-stone-900">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2 bg-stone-200" />
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">Current:</span>
                    <span className="font-medium text-stone-900">
                      {goal.currentValue || "0"} {goal.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-600">Target:</span>
                    <span className="font-medium text-stone-900">
                      {goal.targetValue} {goal.unit}
                    </span>
                  </div>
                </div>

                {goal.description && (
                  <p className="text-sm text-stone-600 leading-relaxed">{goal.description}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
