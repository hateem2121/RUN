import { useGSAP } from "@gsap/react";
import type { ManufacturingProcess, MediaAsset } from "@shared/schema";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useRef } from "react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";
import { cn } from "@/lib/utils";

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProductionBlueprintProps {
  mediaAssets: MediaAsset[];
  processes: ManufacturingProcess[];
}

export function ProductionBlueprint({ mediaAssets, processes }: ProductionBlueprintProps) {
  const containerRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Create horizontal scroll effect for desktop if there are enough items
      // Ensure the section scrolls horizontally when pinned
      if (!scrollContainerRef.current || !containerRef.current || !timelineRef.current) return;

      const sections = gsap.utils.toArray(timelineRef.current.children);
      if (sections.length === 0) return;

      // Optional: Add horizontal scroll interaction for desktop
      // Since the design specifies "Scroll", let's bind it to mouse wheel if possible,
      // or standard overflow-x-auto works gracefully. We use a purely native scroll with GSAP animations.

      (sections as HTMLElement[]).forEach((section) => {
        // Find the inner wipe-reveal class to animate properly
        const reveal = section.querySelector(".wipe-reveal");
        if (reveal) {
          gsap
            .timeline({
              scrollTrigger: {
                trigger: section,
                start: "left center", // Trigger when left side of the card reaches the center of the viewport
                horizontal: true,
                scroller: scrollContainerRef.current,
              },
            })
            .fromTo(
              reveal.querySelector(".after-element-proxy") || reveal,
              { x: "-100%" },
              { x: "100%", duration: 1.2, ease: "power3.inOut" },
            );
        }
      });
    },
    { scope: containerRef },
  );

  // Helper to map assets
  const getAssetUrl = (mediaId?: string | number | null) => {
    if (!mediaId) return undefined;
    const asset = Array.isArray(mediaAssets)
      ? mediaAssets.find((a) => a.id.toString() === mediaId.toString())
      : undefined;
    return asset ? `/api/media/${asset.id}` : undefined;
  };

  // We map the processes into the 5 phases from Stitch design. If CMS data is missing, we use fallbacks.
  const defaultPhases = [
    {
      title: "Sourcing",
      id: "MAT-SRC-V1",
      icon: "settings",
      fallbackImg:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAF4WKIdwKo98NdEfObT09sdNBLC-klCKK3kvoEOLWkCVEu3iD6BydqGU4bchU38D188A5me9f3NnP56SPP2WVNmyim31t-_yEI5Mjf-kKrUWyWM_aR9BVnOyiBYR2ZZagACJxAFqcCLb6IF8hVmRyuIhYoY-VlpkTG1gUuDkkJaM91tIcFcYHVqIO9MxWf5U_fxExNzcaIAcSxEpl26NT5Z6FVGSunmHV-GCurTd8osUY6kuZHFdlAr2rm7K-SIwYKUtS0x0B2LwQ",
      subtitle: "Phase One [Initiation]",
      desc: "Procurement of high-performance technical fabrics from certified global partners. Carbon footprint analysis performed on every batch.",
    },
    {
      title: "Digital CAD",
      id: "CAD-OPT-X9",
      icon: "memory",
      fallbackImg:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBz2kl-YSpRjaZ3UBYwhFMtfXbUveJ_Lc5AcQsXaqCZxtYFvSlXyb7b2hmSXHxq8Iu6QAwX6QPHwEInP0khko8-gLWp6y4si7Sh4rzWty72Rxd7L9puSVFiuM2kz4zRsERJl8LE9rqK2h91vYeqgV0mDR9IocpzEto4Uj4mGFYreW4rdmA3MBQTQJVT8iFhur8VhcmLtTtnLevBihcsfLeMKboT17JEXdjAD1Q9s5MHwBnhu7mgg5ixROVo3LtDv7mn4CMRaJKXANg",
      subtitle: "Phase Two [Computation]",
      desc: "AI-assisted pattern making to maximize fabric utilization and fit precision. Generative design algorithms reduce waste by 18%.",
    },
    {
      title: "Laser Cutting",
      id: "LSR-CUT-04",
      icon: "timeline",
      fallbackImg:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBpfzfBrLypdt1gV090zWKQHhV5eZIArUeVVTQ3-SJt3RjKc91elzRFkP9y7B8kV6mxfLPikQCl9LAkNmPPbq1Qd394q3og06iPPRaXcGjZ7gwEY2k_jb2k6NKx5izZe6ICx-8SbMHWDpq-h48QxH5WaebqxZM5OAMpVgsxZUTQDuXLcrZlr47XD6BR4 ExO2uGZk-Z7kHYn1wjSGYwOJr0mXliYvp95E9fgYSgJRYbgLU2SFBgy4yxc4nlFUXzzUbMWqTKIK4iA5y0",
      subtitle: "Phase Three [Fabrication]",
      desc: "Automated high-speed laser cutting for sealed edges and micron-level accuracy. Zero-contact cutting preserves fabric integrity.",
    },
    {
      title: "Assembly",
      id: "ULT-BND-S2",
      icon: "precision_manufacturing",
      fallbackImg:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBSbQxWzMLW3rKCeT-K6lxQWsVtQGBhyWXSfDQ-D0IWwOcd9QWVzyfnBxSduxBAhficXFeGaWeo0dp6z5HAE1rtF6NAUeC5wulLbAnO-qL0BWlAwFKNJJR5oZ39qBA4aTX3o_NFwOjshlM2bZdLm_FQHlbofrvUYci3Do51CbibVth7STyQUrujC1-7FsbH5gRtdf-fHr0oyEhrflGAqGv2yzxgCz-g5TvfKckEJwEpd3mVisTwXxi_1ocLchnyJJ2G3dzriXbpZPI",
      subtitle: "Phase Four [Construction]",
      desc: "Ultrasonic bonding and flatlock stitching for seamless, chafe-free construction. Robotic arms assist in complex curvilinear seams.",
    },
    {
      title: "Finishing",
      id: "QC-FIN-99",
      icon: "verified_user",
      fallbackImg:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAbXYG3LxM4pJfU0wiQZ_O2Re3P19g4ghMDn7D4EXNqOCeJIB0SNxOMJRvLxdLaoAXRmhGmqy_FogK-U8iXFojAs-ZmYkHNNvw0hnC9mn0MVTmdeoZpbDKL1jRo87tmez0NlKPYrASWZC4X8tUVjsYr7Rq-TmPoHkDZxgn2rw0z77iqUyZpKiJBT4OVS8a8IL19KCK5EiTsc5IIPo7wauvKMmO1xCPm6DMY5kforeq-BdSLr__4maBRjl6lnHoZCMQ6YFfjyTXrAyE",
      subtitle: "Phase Five [Verification]",
      desc: "Rigorous QC checks, steam finishing, and sustainable packaging protocols. Final product scanned against digital twin for variance.",
    },
  ];

  const displayPhases =
    processes.length >= 5
      ? processes.slice(0, 5).map((p, i) => ({
          title: p.title,
          id: `PHS-0${i + 1}`,
          icon: defaultPhases[i]?.icon,
          fallbackImg: getAssetUrl((p as ManufacturingProcess).imageId) || defaultPhases[i]?.fallbackImg || "",
          subtitle: defaultPhases[i]?.subtitle || "",
          desc: p.description || "",
        }))
      : defaultPhases;

  return (
    <ManufacturingErrorBoundary>
      <section
        ref={containerRef}
        className="py-24 border-b border-white/5 relative overflow-hidden bg-[#0A0A0A]"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(212,168,83,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(212,168,83,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        {/* Header Area */}
        <div className="max-w-7xl mx-auto px-6 mb-16 flex flex-col md:flex-row justify-between md:items-end relative z-20">
          <div>
            <h2 className="text-4xl md:text-5xl font-neue-stance font-bold text-white uppercase tracking-tighter italic skew-x-[-2deg]">
              Production Blueprint
            </h2>
            <p className="text-[#D4A853] mt-3 font-mono text-sm tracking-wider uppercase border-l-4 border-[#D4A853] pl-3 ml-1 font-bold">
              Sequence: 001-A to 005-E
            </p>
          </div>

          {/* Timeline Mini-Map (Desktop) */}
          <div className="hidden md:flex flex-col items-end">
            <div className="bg-[#121212] border border-[#D4A853]/20 p-2 mb-2 shadow-lg shadow-black/50">
              <div className="flex items-center space-x-1 font-mono text-[10px] uppercase text-[#68869A] mb-2 border-b border-white/5 pb-1 justify-between px-1">
                <span>Process Monitor</span>
                <span className="w-1.5 h-1.5 bg-[#D4A853] rounded-none rotate-45 animate-pulse"></span>
              </div>
              <div className="flex items-center space-x-4">
                {[1, 2, 3, 4, 5].map((num, i) => (
                  <div key={num} className="flex items-center">
                    <div className="group cursor-pointer">
                      <div className="w-2 h-1 bg-gray-700 mb-1 group-hover:bg-[#D4A853]/50 transition-colors"></div>
                      <div className="text-[10px] text-gray-500 font-bold">0{num}</div>
                    </div>
                    {i < 4 && <div className="w-4 h-[1px] bg-white/10 ml-4"></div>}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] font-mono text-[#D4A853] uppercase font-bold tracking-wider">
              Interactive Timeline
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 right-12 z-30 hidden md:block opacity-50 transition-opacity duration-300 pointer-events-none">
          <div className="bg-black/90 backdrop-blur-md border border-[#D4A853]/50 text-[#D4A853] px-5 py-3 flex items-center gap-3 pointer-events-auto shadow-[0_0_20px_rgba(212,168,83,0.15)] skew-x-[-10deg]">
            <span className="text-xs font-bold uppercase tracking-widest font-mono skew-x-[10deg]">
              Scroll Horizontally
            </span>
          </div>
        </div>

        {/* Custom CSS for Wipe Reveal directly in component scope */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              ".blueprint-corner { position: absolute; width: 15px; height: 15px; border: 2px solid #D4A853; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }" +
              ".blueprint-corner-tl { top: 0; left: 0; border-right: none; border-bottom: none; }" +
              ".blueprint-corner-tr { top: 0; right: 0; border-left: none; border-bottom: none; }" +
              ".blueprint-corner-bl { bottom: 0; left: 0; border-right: none; border-top: none; }" +
              ".blueprint-corner-br { bottom: 0; right: 0; border-left: none; border-top: none; }" +
              ".group:hover .blueprint-corner { width: 100%; height: 100%; border-color: rgba(212, 168, 83, 0.6); border-width: 1px; background-color: rgba(212, 168, 83, 0.05); }" +
              ".wipe-reveal { position: relative; overflow: hidden; }" +
              ".wipe-reveal::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #121212; transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.65, 0, 0.35, 1); z-index: 10; }" +
              ".group:hover .wipe-reveal::after { transform: translateX(200%); }" +
              "@keyframes wipe-in { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }" +
              ".animate-wipe::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; animation: wipe-in 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards; background: linear-gradient(90deg, transparent, #D4A853 50%, transparent); opacity: 0.2; z-index: 11; pointer-events: none; }" +
              ".dotted-line-amber { background-image: linear-gradient(to right, rgba(212,168,83,0.3) 33%, rgba(255,255,255,0) 0%); background-position: bottom; background-size: 12px 2px; background-repeat: repeat-x; }" +
              ".tech-grid-bg-amber { background-image: linear-gradient(rgba(212,168,83, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83, 0.1) 1px, transparent 1px); background-size: 20px 20px; }",
          }}
        />

        {/* Horizontal Scroll Area */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto pb-16 pl-6 md:pl-[calc((100vw-1280px)/2)] pr-6 relative z-10 w-full scrollbar-hide no-scrollbar flex"
        >
          <div ref={timelineRef} className="flex w-max relative pt-12">
            {/* Connecting line */}
            <div className="absolute top-[80px] left-0 w-full h-[1px] border-t-2 border-dotted border-transparent z-0 pointer-events-none dotted-line-amber"></div>

            {/* Timeline Items */}
            {displayPhases.map((phase, idx) => (
              <div
                key={idx}
                className="w-[380px] md:w-[420px] group relative mr-8 md:mr-16 shrink-0"
              >
                {/* Number & Header */}
                <div className="flex items-center mb-6 relative z-10 pl-6">
                  <div
                    className={cn(
                      "absolute left-6 -top-3 w-4 h-4 bg-[#0A0A0A] border-2 rotate-45 z-20 transition-colors",
                      idx === 0
                        ? "border-[#D4A853]"
                        : "border-gray-700 group-hover:border-[#D4A853]",
                    )}
                  ></div>
                  <div
                    className={cn(
                      "text-7xl font-neue-stance font-black transition-colors bg-[#0A0A0A] pr-6 relative z-10 leading-none italic skew-x-[-5deg]",
                      idx === 0 ? "text-[#D4A853]" : "text-gray-800 group-hover:text-[#D4A853]",
                    )}
                  >
                    0{idx + 1}
                  </div>
                  <div className="flex flex-col ml-4 bg-[#0A0A0A] py-1">
                    <span
                      className={cn(
                        "text-xs font-mono font-bold uppercase tracking-widest mb-1 transition-colors",
                        idx === 0 ? "text-[#D4A853]" : "text-[#E3DFD6] group-hover:text-[#D4A853]",
                      )}
                    >
                      {phase.subtitle.split(" ")[0]} {phase.subtitle.split(" ")[1]}
                    </span>
                    <span className="text-xs font-mono text-[#68869A] uppercase">
                      {phase.subtitle.substring(
                        phase.subtitle.indexOf("["),
                        phase.subtitle.indexOf("]") + 1,
                      )}
                    </span>
                  </div>
                </div>

                {/* Content Card */}
                <div className="h-[480px] md:h-[520px] w-full bg-[#121212] border border-white/5 relative group-hover:border-[#D4A853]/60 transition-colors duration-500 p-2">
                  <div className="blueprint-corner blueprint-corner-tl"></div>
                  <div className="blueprint-corner blueprint-corner-tr"></div>
                  <div className="blueprint-corner blueprint-corner-bl"></div>
                  <div className="blueprint-corner blueprint-corner-br"></div>

                  <div
                    className={cn(
                      "h-full w-full relative overflow-hidden bg-black/50 wipe-reveal",
                      idx === 0 ? "animate-wipe" : "",
                    )}
                  >
                    <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold px-2 py-0.5 bg-black/80 backdrop-blur-sm transition-colors border",
                          idx === 0
                            ? "text-[#D4A853] border-[#D4A853]/50"
                            : "text-gray-500 group-hover:text-[#D4A853] border-white/10 group-hover:border-[#D4A853]/30",
                        )}
                      >
                        {phase.id}
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <img
                        alt={phase.title || ""}
                        className={cn(
                          "absolute inset-0 w-full h-full object-cover transition-all duration-700 scale-100 group-hover:scale-105",
                          idx === 0
                            ? "opacity-60 contrast-125"
                            : "opacity-40 grayscale contrast-125 group-hover:grayscale-0 group-hover:opacity-60",
                        )}
                        src={phase.fallbackImg}
                      />
                      <div className="absolute inset-0 tech-grid-bg-amber opacity-20 pointer-events-none"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent opacity-90"></div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 border-t border-[#D4A853]/10 bg-black/90 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-neue-stance font-bold uppercase tracking-wider text-2xl italic">
                          {phase.title}
                        </h3>
                      </div>
                      <p
                        className={cn(
                          "text-[#E3DFD6] text-sm leading-relaxed font-light border-l-2 pl-4 transition-colors",
                          idx === 0
                            ? "border-[#D4A853]"
                            : "border-white/20 group-hover:border-[#D4A853]",
                        )}
                      >
                        {phase.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
