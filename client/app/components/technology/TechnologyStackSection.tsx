import { useGSAP } from "@gsap/react";
import type { EquipmentVM, InnovationVM } from "@shared/viewmodels";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useRef, useState } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface TechnologyStackSectionProps {
  innovations: InnovationVM[];
  equipment: EquipmentVM[];
}

type TabType = "all" | "innovations" | "equipment";

export function TechnologyStackSection({ innovations, equipment }: TechnologyStackSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const sectionRef = useRef<HTMLElement>(null);

  const displayedItems = (() => {
    let items: Array<{
      type: "innovation" | "equipment";
      id: string;
      data: InnovationVM | EquipmentVM;
      isFeatured?: boolean;
    }> = [];

    let featuredInnovation = null;
    let remainingInnovations = innovations;

    if (activeTab === "all" || activeTab === "innovations") {
      if (innovations.length > 0) {
        featuredInnovation = innovations[0];
        remainingInnovations = innovations.slice(1);
        if (featuredInnovation) {
          items.push({
            type: "innovation",
            id: `featured-${featuredInnovation.id}`,
            data: featuredInnovation,
            isFeatured: true,
          });
        }
      }
      items = [
        ...items,
        ...remainingInnovations.map((inv) => ({
          type: "innovation" as const,
          id: `inv-${inv.id}`,
          data: inv,
        })),
      ];
    }

    if (activeTab === "all" || activeTab === "equipment") {
      items = [
        ...items,
        ...equipment.map((eq) => ({ type: "equipment" as const, id: `eq-${eq.id}`, data: eq })),
      ];
    }

    return items;
  })();

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".tech-card-wrapper");
      if (cards.length > 0) {
        gsap.fromTo(
          cards,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
            },
          },
        );
      }
    },
    { scope: sectionRef, dependencies: [activeTab] },
  );

  return (
    <section ref={sectionRef} className="py-24 px-6 relative max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16 relative z-10">
        <Typography.H2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 uppercase tracking-tight mb-8">
          Our Technology <span className="text-[#00D4FF]">Stack</span>
        </Typography.H2>


        {/* Filter Bar */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-full bg-white/60 p-1 border border-black/5 backdrop-blur-md shadow-sm">
            {[
              { id: "all", label: "All" },
              { id: "innovations", label: "Innovations" },
              { id: "equipment", label: "Equipment" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  "px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-colors duration-300 relative",
                  activeTab === tab.id ? "text-white" : "text-slate-500 hover:text-slate-900",
                )}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-[#00D4FF] rounded-full shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>


      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr relative z-10"
      >
        <AnimatePresence mode="popLayout">
          {displayedItems.map((item) => {
            const isFeatured = item.isFeatured;
            const data = item.data;
            const categoryLabel = item.type.toUpperCase();

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                key={item.id}
                className={cn(
                  "tech-card-wrapper w-full h-full",
                  isFeatured ? "lg:col-span-2" : "col-span-1",
                )}
              >
                <div
                  className={cn(
                    "flex flex-col h-full bg-white/60 backdrop-blur-xl border border-black/5 rounded-xl overflow-hidden group hover:border-[#00D4FF]/30 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-100/50",
                    "border-l-[3px] border-l-[#00D4FF]",
                  )}
                >

                  {isFeatured ? (
                    <div className="flex flex-col md:flex-row h-full min-h-[360px]">
                      <div className="w-full md:w-1/2 relative bg-slate-100 min-h-[200px] overflow-hidden">
                        {data.imageId ? (
                          <OptimizedImage
                            mediaId={data.imageId}
                            alt={data.name || "Innovation"}
                            className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/10 to-slate-200" />
                        )}
                        <div className="absolute inset-0 bg-[#00D4FF]/5 pointer-events-none"></div>
                      </div>

                      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center relative">
                        <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-3 block">
                          {categoryLabel}
                        </span>
                        <Typography.H3 className="text-3xl font-display font-bold text-slate-900 uppercase tracking-tight leading-none mb-4">
                          {(data as InnovationVM).name}
                        </Typography.H3>
                        <Typography.P className="text-sm text-slate-600 leading-relaxed mb-8">
                          {(data as InnovationVM).description ||
                            "Cutting-edge proprietary technology engineered for performance."}
                        </Typography.P>
                        <div className="mt-auto flex items-center gap-3 border-t border-black/5 pt-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-[#00D4FF]/5 rounded text-[#0088AA] border border-[#00D4FF]/20">
                            {(data as InnovationVM).status || "Active"}
                          </span>
                          <span className="text-[10px] text-[#00D4FF] font-bold tracking-widest uppercase flex items-center gap-1">
                            FEATURED <span className="material-symbols-outlined text-xs">star</span>
                          </span>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="p-8 flex flex-col h-full relative">
                      <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mb-3 block">
                        {categoryLabel}
                      </span>
                      <Typography.H4 className="text-xl font-bold text-slate-900 uppercase font-display tracking-tight mb-3">
                        {data.name}
                      </Typography.H4>
                      <Typography.P className="text-xs text-slate-600 leading-relaxed mb-6 line-clamp-4">
                        {item.type === "innovation"
                          ? (data as InnovationVM).shortDescription || (data as InnovationVM).description
                          : `${(data as EquipmentVM).brand} ${(data as EquipmentVM).model ? "• " + (data as EquipmentVM).model : ""}`}
                      </Typography.P>

                      <div className="mt-auto pt-4 border-t border-black/5 flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-slate-50 rounded text-slate-600 border border-slate-200">
                          {item.type === "innovation"
                            ? (data as InnovationVM).status || "Active"
                            : `${(data as EquipmentVM).quantity || 1} Units`}
                        </span>
                      </div>
                    </div>

                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
