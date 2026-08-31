import { MoveRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";

export function FactoryGallery() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const totalSlides = 8; // Number of mock slides

  const handleScroll = useCallback(() => {
    if (scrollRef.current && scrollRef.current.children.length > 0) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const firstChild = scrollRef.current.children[0] as HTMLElement;
      const cardWidth = firstChild.clientWidth;
      // Calculate current index (1-indexed) based on scroll position
      const newIndex = Math.round(scrollLeft / cardWidth) + 1;
      // Clamp index between 1 and total slides to avoid bugs
      setCurrentIndex(Math.min(Math.max(1, newIndex), totalSlides));
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const galleries = [
    {
      title: "Main Assembly",
      subtitle: "Sector 04",
      camMsg: "Cam 01 • Floor A",
      img: "/images/manufacturing/factory-floor-cam1.webp",
      h: "h-[600px]",
    },
    {
      title: "Textile Audit",
      subtitle: "Micro Inspection",
      camMsg: "Cam 02 • Detail",
      img: "/images/manufacturing/factory-floor-cam2.webp",
      h: "h-[540px]",
    },
    {
      title: "Expert Craft",
      subtitle: "Technician Level 4",
      camMsg: "Cam 03 • Staff",
      img: "/images/manufacturing/factory-floor-cam3.webp",
      h: "h-[600px]",
    },
    {
      title: "Automated Loom",
      subtitle: "Sector 02",
      camMsg: "Cam 04 • Machine",
      img: "/images/manufacturing/factory-floor-cam4.webp",
      h: "h-[540px]",
    },
    {
      title: "Thread Supply",
      subtitle: "Inventory Control",
      camMsg: "Cam 05 • Material",
      img: "/images/manufacturing/factory-floor-cam5.webp",
      h: "h-[600px]",
    },
    {
      title: "Floor Overview",
      subtitle: "All Sectors",
      camMsg: "Cam 06 • Overview",
      img: "/images/manufacturing/factory-floor-cam6.webp",
      h: "h-[540px]",
    },
    {
      title: "Final Prep",
      subtitle: "Shipping Dock",
      camMsg: "Cam 07 • Packaging",
      img: "/images/manufacturing/factory-floor-cam7.webp",
      h: "h-[600px]",
    },
    {
      title: "Facility View",
      subtitle: "Main Entrance",
      camMsg: "Cam 08 • Exterior",
      img: "/images/manufacturing/factory-floor-cam8.webp",
      h: "h-[540px]",
    },
  ];

  return (
    <ManufacturingErrorBoundary>
      <section className="py-24 border-t border-white/5 bg-manufacturing-bg overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-manufacturing-accent/10 via-manufacturing-bg to-manufacturing-bg pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row justify-between items-end relative z-10 gap-6">
          <div>
            <h2 className="text-4xl font-neue-stance font-bold text-white uppercase mb-2 italic skew-x-[-2deg]">
              Factory Floor <span className="text-manufacturing-accent">Live</span>
            </h2>
            <div className="flex items-center gap-2 text-manufacturing-muted text-xs font-mono uppercase tracking-widest mt-4">
              <div className="flex items-center gap-1 border-b border-gray-600 pb-1">
                <MoveRight className="text-manufacturing-accent w-4 h-4 rotate-180" />
                <div className="w-8 h-[2px] bg-manufacturing-accent/80"></div>
                <MoveRight className="text-manufacturing-accent w-4 h-4" />
              </div>
              <span className="ml-2 font-bold text-manufacturing-accent">
                Drag / Scroll to Explore
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pointer-events-none md:pointer-events-auto">
            <div className="flex items-center space-x-2 text-white font-mono text-sm px-4 py-2 bg-black/80 backdrop-blur-sm skew-x-[-12deg] shadow-lg shadow-manufacturing-accent/10">
              <span className="text-manufacturing-accent animate-pulse font-black italic">●</span>
              <span className="tracking-widest font-black italic text-manufacturing-accent text-lg">
                0{currentIndex} / 0{totalSlides}
              </span>
            </div>
          </div>
        </div>

        {/* Gallery Slider */}
        <section
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label="Factory facilities live photo gallery"
          className="overflow-x-auto pb-12 pl-6 md:pl-[calc((100vw-1280px)/2)] pr-6 flex items-end gap-6 snap-x snap-mandatory h-[650px] scrollbar-hide no-scrollbar relative z-10 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-manufacturing-accent"
        >
          {galleries.map((item, idx) => (
            <div
              key={idx}
              className={`min-w-[400px] md:min-w-[500px] ${item.h} relative group snap-center shrink-0 bg-manufacturing-card border border-white/10 overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,83,0.1)] hover:border-manufacturing-accent/50`}
            >
              <div className="absolute top-4 left-4 z-20 text-[10px] font-mono uppercase tracking-widest text-manufacturing-accent border border-manufacturing-accent bg-black/80 px-2 py-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">
                {item.camMsg}
              </div>

              <div className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay opacity-60 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>

              <img
                alt={item.title}
                className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105"
                src={item.img}
                onError={(e) => {
                  e.currentTarget.src = "/images/placeholders/product-placeholder.webp";
                }}
                loading="lazy"
                decoding="async"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-manufacturing-bg via-manufacturing-bg/40 to-transparent opacity-80 z-10"></div>

              <div className="absolute bottom-0 left-0 w-full p-6 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-3xl font-neue-stance font-black text-white uppercase tracking-wider mb-1 italic skew-x-[-5deg]">
                  {item.title}
                </h3>
                <p className="text-manufacturing-accent text-xs font-mono uppercase tracking-widest font-bold">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </section>
      </section>
    </ManufacturingErrorBoundary>
  );
}
