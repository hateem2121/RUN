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
  title?: string;
  description?: string;
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
    <section className="py-20 bg-stone-50 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-stone-900 mb-4 font-neue-stance">
            {title}
          </h2>
          <p className="text-lg text-stone-600 max-w-3xl mx-auto">
            {description}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {goalsWithProgress.map((goal, index) => {
            const progress = goal.progress;

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-stone-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-stone-900">
                      {goal.title}
                    </h3>
                    <span className="text-sm font-medium text-stone-600">
                      {goal.targetYear}
                    </span>
                  </div>

                  {goal.category && (
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-stone-200 text-stone-800 rounded-full mb-3">
                      {goal.category}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-600">Progress</span>
                    <span className="text-sm font-medium text-stone-900">
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
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {goal.description}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
