import { useGSAP } from "@gsap/react";
import type { MediaAsset } from "@shared/index";
import type { EquipmentVM, InnovationVM } from "@shared/viewmodels";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import React from "react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type FilterTab = "all" | "innovations" | "equipment";

interface TechnologyStackSectionProps {
  innovations: InnovationVM[];
  equipment: EquipmentVM[];
  mediaAssets?: Map<number, MediaAsset>;
  className?: string;
}

export function TechnologyStackSection({
  innovations,
  equipment,
  mediaAssets,
  className,
}: TechnologyStackSectionProps) {
  const [activeTab, setActiveTab] = React.useState<FilterTab>("all");
  const cardsRef = React.useRef<HTMLDivElement>(null);
  const sectionRef = React.useRef<HTMLElement>(null);
  const tabContentRef = React.useRef<HTMLDivElement>(null);

  // GSAP scroll-triggered stagger animation for cards
  React.useEffect(() => {
    if (!cardsRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".tech-stack-card", {
        scrollTrigger: {
          trigger: cardsRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, cardsRef);

    return () => ctx.revert();
  }, []);

  // GSAP count-up animation for stat values
  React.useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const statElements = sectionRef.current?.querySelectorAll(".stat-countup");
      if (!statElements?.length) return;

      statElements.forEach((el) => {
        const target = el.getAttribute("data-target") || "0";
        const suffix = el.getAttribute("data-suffix") || "";
        const prefix = el.getAttribute("data-prefix") || "";
        const numericValue = parseFloat(target.replace(/[^0-9.-]/g, ""));

        if (Number.isNaN(numericValue)) return;

        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none",
          },
          textContent: 0,
          duration: 1.5,
          ease: "power2.out",
          snap: { textContent: numericValue % 1 === 0 ? 1 : 0.1 },
          onUpdate: () => {
            const current = parseFloat(el.textContent || "0");
            el.textContent = `${prefix}${numericValue % 1 === 0 ? Math.round(current) : current.toFixed(1)}${suffix}`;
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animate tab content on tab change
  useGSAP(() => {
    if (!tabContentRef.current) return;
    gsap.from(tabContentRef.current, {
      opacity: 0,
      y: 10,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [activeTab]);

  const tabs: Array<{ id: FilterTab; label: string }> = [
    { id: "all", label: "All Systems" },
    { id: "innovations", label: "Innovations" },
    { id: "equipment", label: "Equipment" },
  ];

  const featured = innovations.length > 0 ? innovations[0] : null;
  const regularInnovations = innovations.slice(1);

  const filteredItems = React.useMemo(() => {
    if (activeTab === "innovations") return { innovations: regularInnovations, equipment: [] };
    if (activeTab === "equipment") return { innovations: [], equipment };
    return { innovations: regularInnovations, equipment };
  }, [activeTab, regularInnovations, equipment]);

  // Resolve media URL from mediaAssets map
  const getMediaUrl = (mediaId: number | undefined): string | null => {
    if (!mediaId || !mediaAssets) return null;
    const asset = mediaAssets.get(mediaId);
    if (!asset) return null;
    return asset.url || `/api/media/${asset.id}/content`;
  };

  return (
    <section ref={sectionRef} className={cn("py-32 px-6 relative max-w-7xl mx-auto", className)}>
      {/* HUD micro-copy — top-right */}
      <div className="absolute top-8 right-6 hidden md:block">
        <span className="micro-copy border border-slate-100 dark:border-[#00D4FF]/30 px-3 py-1 bg-white/50 dark:bg-[#00D4FF]/5 backdrop-blur dark:text-[#00D4FF]">
          ENCRYPTION: AES-256 SECURED
        </span>
      </div>

      {/* Centered section header — Stitch style */}
      <div className="text-center mb-20">
        <h2 className="text-5xl md:text-6xl font-neue-stance font-bold text-black dark:text-white uppercase tracking-tight mb-6">
          Technology Stack
        </h2>
        <div className="w-16 h-1 bg-[#0047AB] dark:bg-[#00D4FF] mx-auto shadow-sm dark:shadow-[0_0_10px_rgba(0,212,255,0.5)]"></div>
      </div>

      {/* Centered filter pill bar — Stitch style (no counts) */}
      <div className="flex justify-center mb-20">
        <div className="inline-flex rounded-full bg-transparent border border-slate-200 dark:border-white/[0.08] p-1 dark:bg-white/[0.02]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-10 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                activeTab === tab.id
                  ? "bg-[#0047AB] dark:bg-[#00D4FF] text-white dark:text-black shadow-[0_0_15px_rgba(0,71,171,0.5)] dark:shadow-[0_0_15px_rgba(0,212,255,0.5)]"
                  : "text-slate-500 dark:text-slate-400 hover:text-[#0047AB] dark:hover:text-white dark:hover:bg-white/5",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid — Stitch 3-column bento */}
      <div
        ref={cardsRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 auto-rows-fr"
      >
        {/* Featured Innovation Card — 2-col span */}
        {featured && (activeTab === "all" || activeTab === "innovations") && (
          <div className="lg:col-span-2 lab-card group flex flex-col md:flex-row border-l-4 !border-l-[#0047AB] dark:!border-l-[#00D4FF] bg-white dark:bg-white/[0.04] dark:backdrop-blur-xl border border-transparent dark:border-white/[0.08] shadow-lg dark:shadow-none overflow-hidden rounded-xl">
            <div className="scan-line"></div>
            {/* Image/Video half */}
            <div className="w-full md:w-1/2 bg-slate-50 dark:bg-black relative overflow-hidden min-h-[300px]">
              {featured.videoId && getMediaUrl(featured.videoId) ? (
                <video
                  src={getMediaUrl(featured.videoId) || undefined}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 group-hover:scale-110 transition-transform duration-1000 dark:mix-blend-luminosity dark:opacity-60 dark:group-hover:opacity-80"
                />
              ) : featured.imageId && getMediaUrl(featured.imageId) ? (
                <OptimizedImage
                  mediaId={featured.imageId}
                  src={getMediaUrl(featured.imageId) || undefined}
                  alt={featured.name}
                  imageClassName="absolute inset-0 w-full h-full object-cover grayscale opacity-80 group-hover:scale-110 transition-transform duration-1000 dark:mix-blend-luminosity dark:opacity-60 dark:group-hover:opacity-80"
                  className="absolute inset-0 w-full h-full"
                  priority={false}
                />
              ) : (
                <>
                  <div className="absolute inset-0 bg-grid-arctic dark:bg-grid-tech opacity-40 dark:opacity-20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-8xl text-[#0047AB] dark:text-[#00D4FF] opacity-10">
                      science
                    </span>
                  </div>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 dark:to-transparent"></div>
            </div>
            {/* Content half */}
            <div className="w-full md:w-1/2 p-12 flex flex-col relative z-20 bg-white dark:bg-transparent">
              <span className="tech-badge w-fit mb-6">Featured Innovation</span>
              <h3 className="text-4xl font-neue-stance font-bold text-black dark:text-white uppercase tracking-tight leading-none mb-6">
                {featured.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-[#E3DFD6] leading-relaxed mb-10 font-light font-helvetica">
                {featured.shortDescription || featured.description}
              </p>
              <div className="grid grid-cols-2 gap-8 border-t border-slate-100 dark:border-white/10 pt-8 mt-auto">
                <div>
                  <span className="micro-copy block mb-1">Airflow</span>
                  <span
                    className="text-2xl text-[#0047AB] dark:text-[#00D4FF] font-bold font-mono stat-countup"
                    data-target="98"
                    data-suffix="%"
                  >
                    98%
                  </span>
                </div>
                <div>
                  <span className="micro-copy block mb-1">Weight</span>
                  <span
                    className="text-2xl text-[#0047AB] dark:text-[#00D4FF] font-bold font-mono stat-countup"
                    data-target="15"
                    data-prefix="-"
                    data-suffix="g"
                  >
                    -15g
                  </span>
                </div>
              </div>
              <div className="mt-8 flex items-center gap-2 text-[#0047AB] dark:text-[#00D4FF] font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity dark:drop-shadow-[0_0_5px_rgba(0,212,255,0.8)]">
                View Details{" "}
                <span className="material-symbols-outlined text-sm">arrow_outward</span>
              </div>
            </div>
          </div>
        )}

        {/* Regular Innovation Cards + Equipment Cards */}
        <div ref={tabContentRef} className="contents">
          {filteredItems.innovations.map((innovation) => (
            <div
              key={`inn-${innovation.id}`}
              className="tech-stack-card lab-card p-10 group flex flex-col justify-between rounded-xl bg-white dark:bg-white/[0.04] dark:backdrop-blur-xl border border-slate-100 dark:border-white/[0.08] shadow-sm dark:shadow-none hover:shadow-md transition-shadow"
            >
              <div className="scan-line"></div>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="tech-badge">Innovation</span>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-500 group-hover:text-[#0047AB] dark:group-hover:text-[#00D4FF] transition-colors">
                    {innovation.iconName || "science"}
                  </span>
                </div>
                <h4 className="text-2xl font-bold text-black dark:text-white uppercase font-neue-stance tracking-tight mb-4">
                  {innovation.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#E3DFD6] leading-relaxed font-light font-helvetica">
                  {innovation.shortDescription || innovation.description}
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-white/10 pt-6 mt-8 flex justify-between items-end">
                <span className="micro-copy dark:text-[#68869A]">{innovation.category}</span>
                <span className="text-sm text-[#0047AB] dark:text-[#00D4FF] font-bold font-mono">
                  {innovation.status}
                </span>
              </div>
            </div>
          ))}

          {/* Equipment Cards */}
          {filteredItems.equipment.map((equip) => (
            <div
              key={`eq-${equip.id}`}
              className="tech-stack-card lab-card p-10 group flex flex-col justify-between rounded-xl bg-white dark:bg-white/[0.04] dark:backdrop-blur-xl border border-slate-100 dark:border-white/[0.08] shadow-sm dark:shadow-none hover:shadow-md transition-shadow !border-l-4 !border-l-slate-200 dark:!border-l-slate-700 hover:!border-l-[#0047AB] dark:hover:!border-l-[#00D4FF]"
            >
              <div className="scan-line"></div>
              <div>
                <div className="flex justify-between items-start mb-6">
                  <span className="tech-badge !text-slate-500 !bg-slate-50 !border-slate-100 dark:!text-slate-400 dark:!bg-white/5 dark:!border-white/10">
                    Equipment
                  </span>
                  <span className="material-symbols-outlined text-slate-300 dark:text-slate-500 group-hover:text-[#0047AB] dark:group-hover:text-[#00D4FF] transition-colors">
                    precision_manufacturing
                  </span>
                </div>
                <h4 className="text-2xl font-bold text-black dark:text-white uppercase font-neue-stance tracking-tight mb-4">
                  {equip.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#E3DFD6] leading-relaxed font-light font-helvetica">
                  {equip.brand}
                  {equip.model && ` / ${equip.model}`}
                </p>
              </div>
              <div className="border-t border-slate-100 dark:border-white/10 pt-6 mt-8 flex justify-between items-end">
                <span className="micro-copy dark:text-[#68869A]">Capacity</span>
                <span className="text-sm text-black dark:text-white font-bold font-mono">
                  {equip.capacity || `${equip.quantity}/HR`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
