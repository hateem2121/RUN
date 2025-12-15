import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ManufacturingProcess } from "@shared/schema";

export function ManufacturingProcessFlow() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: processes = [] } = useQuery<ManufacturingProcess[]>({
    queryKey: ["/api/manufacturing-processes"],
  });
  
  const activeProcesses = processes.filter(p => p.isActive).sort((a, b) => (a.position || 0) - (b.position || 0));

  useEffect(() => {
    if (!containerRef.current || activeProcesses.length === 0) return;

    const ctx = gsap.context(() => {
      // Animate process flow dots
      gsap.to(".process-dot", {
        scale: 1.2,
        opacity: 1,
        duration: 1,
        stagger: {
          each: 0.2,
          repeat: -1,
          yoyo: true
        }
      });

      // Animate connecting lines
      gsap.fromTo(".process-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1,
          stagger: 0.3,
          ease: "power2.inOut"
        }
      );

      // Animate flow particles
      activeProcesses.forEach((_, index) => {
        if (index < activeProcesses.length - 1) {
          gsap.to(`.particle-${index}`, {
            left: "100%",
            duration: 2,
            repeat: -1,
            ease: "none",
            delay: index * 0.5
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
          <div className="flex justify-between items-center relative">
            {activeProcesses.map((process, index) => (
              <div key={process.id} className="relative flex-1">
                {/* Connecting Line */}
                {index < activeProcesses.length - 1 && (
                  <div className="absolute top-1/2 left-1/2 w-full h-1 -translate-y-1/2">
                    <div className="process-line h-full bg-gradient-to-r from-blue-400 to-blue-600 origin-left" />
                    {/* Flow Particle */}
                    <div 
                      className={`particle-${index} absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full left-0`}
                      style={{ boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)" }}
                    />
                  </div>
                )}
                
                {/* Process Node */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div className="process-dot w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div className="mt-3 text-center">
                    <h4 className="font-medium text-sm text-gray-900">{process.title}</h4>
                    {process.efficiency && (
                      <p className="text-xs text-gray-600 mt-1">{process.efficiency}% Efficiency</p>
                    )}
                    {process.duration && (
                      <p className="text-xs text-gray-500">{process.duration}</p>
                    )}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          {/* Process Details */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeProcesses.map((process, index) => (
              <motion.div
                key={process.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="p-3 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <h5 className="font-medium text-sm text-gray-900">{process.category}</h5>
                </div>
                <p className="text-xs text-gray-600">{process.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Overall Metrics */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {activeProcesses.length}
                </div>
                <div className="text-xs text-gray-600">Active Processes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {activeProcesses.length > 0 
                    ? Math.round(activeProcesses.reduce((acc, p) => acc + (typeof p.efficiency === 'number' ? p.efficiency : 0), 0) / activeProcesses.length)
                    : 0}%
                </div>
                <div className="text-xs text-gray-600">Average Efficiency</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {activeProcesses.filter(p => (typeof p.efficiency === 'number' ? p.efficiency : 0) >= 90).length}
                </div>
                <div className="text-xs text-gray-600">High-Performance</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}