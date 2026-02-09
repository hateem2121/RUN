import type { ManufacturingProcess } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ManufacturingProcessFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: processes = [] } = useQuery<ManufacturingProcess[]>({
    queryKey: ["/api/manufacturing-processes"],
  });

  const activeProcesses = processes
    .filter((p) => p.isActive)
    .sort((a, b) => (a.position || 0) - (b.position || 0));

  useEffect(() => {
    if (!containerRef.current || activeProcesses.length === 0) {
      return;
    }

    const ctx = gsap.context(() => {
      // Animate process flow dots
      gsap.to(".process-dot", {
        scale: 1.2,
        opacity: 1,
        duration: 1,
        stagger: {
          each: 0.2,
          repeat: -1,
          yoyo: true,
        },
      });

      // Animate connecting lines
      gsap.fromTo(
        ".process-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1,
          stagger: 0.3,
          ease: "power2.inOut",
        },
      );

      // Animate flow particles
      activeProcesses.forEach((_, index) => {
        if (index < activeProcesses.length - 1) {
          gsap.to(`.particle-${index}`, {
            left: "100%",
            duration: 2,
            repeat: -1,
            ease: "none",
            delay: index * 0.5,
          });
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [activeProcesses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manufacturing Process Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative">
          {/* Process Steps */}
          <div className="relative flex items-center justify-between">
            {activeProcesses.map((process, index) => (
              <div key={process.id} className="relative flex-1">
                {/* Connecting Line */}
                {index < activeProcesses.length - 1 && (
                  <div className="absolute top-1/2 left-1/2 h-1 w-full -translate-y-1/2">
                    <div className="process-line h-full origin-left bg-linear-to-r from-blue-400 to-blue-600" />
                    {/* Flow Particle */}
                    <div
                      className={`particle-${index} absolute top-1/2 left-0 h-3 w-3 -translate-y-1/2 rounded-full bg-blue-400`}
                      style={{ boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)" }}
                    />
                  </div>
                )}

                {/* Process Node */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative z-default flex flex-col items-center"
                >
                  <div className="process-dot flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-600 font-bold text-white shadow-lg">
                    {index + 1}
                  </div>
                  <div className="mt-3 text-center">
                    <h4 className="font-medium text-foreground text-sm">{process.title}</h4>
                    {process.efficiency && (
                      <p className="mt-1 text-muted-foreground text-xs">
                        {process.efficiency}% Efficiency
                      </p>
                    )}
                    {process.duration && (
                      <p className="text-muted-foreground text-xs">{process.duration}</p>
                    )}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Process Details */}
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {activeProcesses.map((process, index) => (
              <motion.div
                key={process.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="rounded-lg border border-blue-200 bg-linear-to-br from-background to-blue-50 p-3"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-100 font-bold text-blue-600 text-sm">
                    {index + 1}
                  </div>
                  <h5 className="font-medium text-foreground text-sm">{process.category}</h5>
                </div>
                <p className="text-muted-foreground text-xs">{process.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Overall Metrics */}
          <div className="mt-6 rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="font-bold text-2xl text-blue-600">{activeProcesses.length}</div>
                <div className="text-muted-foreground text-xs">Active Processes</div>
              </div>
              <div>
                <div className="font-bold text-2xl text-blue-600">
                  {activeProcesses.length > 0
                    ? Math.round(
                        activeProcesses.reduce(
                          (acc, p) => acc + (typeof p.efficiency === "number" ? p.efficiency : 0),
                          0,
                        ) / activeProcesses.length,
                      )
                    : 0}
                  %
                </div>
                <div className="text-muted-foreground text-xs">Average Efficiency</div>
              </div>
              <div>
                <div className="font-bold text-2xl text-blue-600">
                  {
                    activeProcesses.filter(
                      (p) => (typeof p.efficiency === "number" ? p.efficiency : 0) >= 90,
                    ).length
                  }
                </div>
                <div className="text-muted-foreground text-xs">High-Performance</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
