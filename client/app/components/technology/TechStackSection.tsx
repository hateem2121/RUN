import type { EquipmentVM, InnovationVM } from "@shared/viewmodels";
import { useState } from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

interface TechStackSectionProps {
  innovations: InnovationVM[];
  equipment: EquipmentVM[];
}

type TabType = "all" | "innovations" | "equipment";

export function TechStackSection({ innovations, equipment }: TechStackSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const displayedInnovations =
    activeTab === "all" || activeTab === "innovations" ? innovations : [];
  const displayedEquipment = activeTab === "all" || activeTab === "equipment" ? equipment : [];

  return (
    <section className="py-24 px-6 relative max-w-7xl mx-auto">
      <div className="absolute top-0 right-6 p-4 opacity-50 border border-white/10 bg-black/40 backdrop-blur">
        <span className="text-[10px] font-mono text-[#00D4FF] px-2 py-1">
          SECURE CONNECTION ESTABLISHED
        </span>
      </div>

      <div className="text-center mb-16">
        <Typography.H2 className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-tight mb-4">
          Technology Stack
        </Typography.H2>
        <div className="w-16 h-1 bg-[#00D4FF] mx-auto"></div>
      </div>

      <div className="flex justify-center mb-16">
        <div className="inline-flex rounded-full bg-black/40 p-1 border border-white/10 shadow-sm backdrop-blur-md">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors",
              activeTab === "all"
                ? "bg-[#00D4FF] text-black shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5",
            )}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("innovations")}
            className={cn(
              "px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors",
              activeTab === "innovations"
                ? "bg-[#00D4FF] text-black shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5",
            )}
          >
            Innovations
          </button>
          <button
            onClick={() => setActiveTab("equipment")}
            className={cn(
              "px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors",
              activeTab === "equipment"
                ? "bg-[#00D4FF] text-black shadow-md"
                : "text-white/60 hover:text-white hover:bg-white/5",
            )}
          >
            Equipment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
        {displayedInnovations.map((innovation, idx) => (
          <div
            key={innovation.id}
            className={cn(
              "p-8 relative overflow-hidden group flex flex-col justify-between rounded-xl bg-black/30 border backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
              idx === 0 && activeTab === "all"
                ? "lg:col-span-2 min-h-[340px] md:flex-row p-0 border-white/10 hover:border-[#00D4FF]/50"
                : "border-white/10 hover:border-[#00D4FF]/50 border-l-[3px] border-l-[#00D4FF]",
            )}
          >
            {/* Featured Item layout (first innovation when All is selected) */}
            {idx === 0 && activeTab === "all" ? (
              <>
                <div className="w-full md:w-1/2 relative h-64 md:h-auto overflow-hidden bg-black/50">
                  {innovation.imageId ? (
                    <OptimizedImage
                      mediaId={innovation.imageId}
                      alt={innovation.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 mix-blend-screen"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/20 to-black/80" />
                  )}
                  <div className="absolute inset-0 bg-[#00D4FF]/10 mix-blend-overlay"></div>
                </div>
                <div className="w-full md:w-1/2 p-10 flex flex-col justify-center relative z-20 bg-black/40">
                  <div className="mb-4">
                    <span className="text-[10px] font-mono text-[#00D4FF] uppercase tracking-widest border border-[#00D4FF]/20 px-2 py-1 rounded mb-4 inline-block bg-[#00D4FF]/10">
                      Featured Tech
                    </span>
                    <Typography.H3 className="text-3xl font-display font-bold text-white uppercase tracking-tight leading-none">
                      {innovation.name}
                    </Typography.H3>
                  </div>
                  <Typography.P className="text-sm text-white/70 leading-relaxed mb-8 font-light">
                    {innovation.description ||
                      "Cutting-edge proprietary technology engineered for maximum performance output."}
                  </Typography.P>

                  {innovation.technicalDetails && (
                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 mt-auto">
                      <div>
                        <span className="text-[10px] text-white/40 font-mono uppercase block mb-1">
                          Status
                        </span>
                        <span className="text-lg text-[#00D4FF] font-bold font-mono">
                          {innovation.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 font-mono uppercase block mb-1">
                          Category
                        </span>
                        <span className="text-lg text-[#00D4FF] font-bold font-mono">
                          {innovation.category}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-4 right-4 text-[#00D4FF] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                </div>
              </>
            ) : (
              /* Standard Innovation Card */
              <>
                <div>
                  <span className="text-[10px] text-[#00D4FF] font-bold font-mono tracking-widest uppercase mb-2 block">
                    Innovation
                  </span>
                  <div className="flex justify-between items-start mb-3">
                    <Typography.H4 className="text-xl font-bold text-white uppercase font-display tracking-tight">
                      {innovation.name}
                    </Typography.H4>
                    <span className="material-symbols-outlined text-white/30 group-hover:text-[#00D4FF] transition-colors text-xl">
                      science
                    </span>
                  </div>
                  <Typography.P className="text-xs text-white/60 leading-relaxed mb-6 font-light line-clamp-3">
                    {innovation.shortDescription || innovation.description}
                  </Typography.P>
                </div>
                <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-auto">
                  <span className="text-[10px] text-white/40 font-mono uppercase">Category</span>
                  <span className="text-xs text-white font-bold font-mono">
                    {innovation.category}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 text-[#00D4FF] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider">Details</span>
                  <span className="material-symbols-outlined text-sm">add</span>
                </div>
              </>
            )}
          </div>
        ))}

        {displayedEquipment.map((eq) => (
          <div
            key={eq.id}
            className="p-8 relative overflow-hidden group flex flex-col justify-between rounded-xl bg-black/30 border border-white/10 border-l-[3px] border-l-[#D4A853] hover:border-[#D4A853]/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div>
              <span className="text-[10px] text-[#D4A853] font-bold font-mono tracking-widest uppercase mb-2 block">
                Equipment
              </span>
              <div className="flex justify-between items-start mb-3">
                <Typography.H4 className="text-xl font-bold text-white uppercase font-display tracking-tight">
                  {eq.name}
                </Typography.H4>
                <span className="material-symbols-outlined text-white/30 group-hover:text-[#D4A853] transition-colors text-xl">
                  precision_manufacturing
                </span>
              </div>
              <Typography.P className="text-xs text-white/60 leading-relaxed mb-6 font-light">
                {eq.brand} • {eq.model}
                {eq.category && (
                  <span className="block mt-1 opacity-70">Category: {eq.category}</span>
                )}
              </Typography.P>
            </div>
            <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-auto">
              <span className="text-[10px] text-white/40 font-mono uppercase">Quantity</span>
              <span className="text-xs text-[#D4A853] font-bold font-mono">
                {eq.quantity} Units
              </span>
            </div>
            <div className="absolute bottom-4 right-4 text-[#D4A853] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Specs</span>
              <span className="material-symbols-outlined text-sm">settings</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
