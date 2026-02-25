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
  }, [totalSlides]);

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
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2n18iVqGoufFvJFKPuEL20VfE1U1wyvSpDtCr3yffzJjgunoyuS1tj14wj9Ezvg7DLmajnfJcofAaGXDm0-XeR0tEolcCuBkWEA6ErETI-P9R8WM8yDKDqRvAaR_Ii0TUWR5KzdmssukbVNNssmaN8lvC5a1YfS3yJGDd5-j_ISfdN752uaTyvDRa_EtNboGw9gAVoQ8SkYPjwuuhd0UcqT2K2cCPerj7M2h0Y7IT6dKE3PAtdOjChY8-TRdkOrGKYVWm0Ry_cis",
      h: "h-[600px]",
    },
    {
      title: "Textile Audit",
      subtitle: "Micro Inspection",
      camMsg: "Cam 02 • Detail",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKk0UjiS1IFhcvopcCQI_fufULGOhNl9cA07UoogcPLYmkoc51-cZfUexrGnb23Z80jDdJDXYonCnntVGIvqE2nL-LVaab33PRJxXXxz2X8uYW1TUzFuieziS3G7n8rEXWzDwN1mZcbka7kSzDqYeola64LrFVAdXz2jH3fyeKCxqvF3HkXNFd0soCUz4L1FGpT0FQLQM3eHMoLo3OKj-oSoLT269492rkStFFWplJ-ju1UuZywi-YF_EBxRTiYOqA8bw4CLnI_5E",
      h: "h-[540px]",
    },
    {
      title: "Expert Craft",
      subtitle: "Technician Level 4",
      camMsg: "Cam 03 • Staff",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvEqIaLJR9F-3IvW5xGdtMkVi9B-3kK_nfNhG_zDOE55XM-KjlMFmUxypZPqjOy2FXM-C49uZNhTWnrIM2AQrVtv6QIQ49WCI20jQ_oeYHGaiLMsOrw2hvZstE4gOMPdIlZpT2_6YMJ7Fdq70GciCwtwpneA0IWVGm_YXAfUyHJdZrcOoFTWW4du5hQxr0HJPKlr0q8YTY0jwWUvk8yd-m1h9Czp02-ofAHTHJ0jgSXuw9zGHTAOkNf0ec1Xf7zA_GhKxEbJ4IaB8",
      h: "h-[600px]",
    },
    {
      title: "Automated Loom",
      subtitle: "Sector 02",
      camMsg: "Cam 04 • Machine",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOL2PIqcRGBO2TgfVf1iQdoEmLIWktgqCAjhzuUj4IVhN8xprZaaTgcbaLX27E-ww0FaHcNjrzuvj0KZx52Dzndj1BYlRgZimO7eeG9Mj05br1deVh8zCNTY_CYO-t0KlKdQE-uwYWxUaJl5rl74jsJ4GguKyOpc6PrSTsyUO9CJmkWtpbN9cMiFHilR0_37a_vxOnOKe0aTHKP-ai_TgxibtD7pXildES8NGVWknLagjK5GCMtBps0yfAF0BGWIaCI2-jjISa0JA",
      h: "h-[540px]",
    },
    {
      title: "Thread Supply",
      subtitle: "Inventory Control",
      camMsg: "Cam 05 • Material",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB5zUjvs1-poD4u6dLowI6hv-BpKDbdW3XhOeYEVUbKTb79ar-kW_JXrABl1SdDjaglxPccdf1bUkmgtnOyGCa65kj_Ug8T6hpXBIc0SR8Y_RYmreEps81Kaf18BzhjC_l8wobAM2tRh0VfNrqKMev0weEt2hl7Xoa5ezICqzi-t7hgW0136ly2ex5yXV3AjYqG6mdI844aWwSVRnRTzMJBg5j6yzqfxrGIQT4vjsoUv3qElFPto1fkRnJuSRXz43R6hxbQIlGWh3Q",
      h: "h-[600px]",
    },
    {
      title: "Floor Overview",
      subtitle: "All Sectors",
      camMsg: "Cam 06 • Overview",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPmyeBGxLULjFgKrR2yT9URZkwGhc3fAWRf_7A5hdtQP-huDEa62pSGKo3TyE_EQ-U8r1QbGlkpuuU9LlrznJBn5emPZtnvKrJI4wIqLtzJatFpByG3Kc4Wr0ZyxaNwK3MtnX7yKSpYxAK71tMIFEx8RsMTPDAPAhlCH-eeDhkQX7stSFUCWOyK7EpxEooRLsTzfp7ovZ5Kjq_2gfzJunsof35utMoJifE8x4pOLeiXy1riL-Z6wCEHLz3w5dv4zJJvE5kGPQbakQ",
      h: "h-[540px]",
    },
    {
      title: "Final Prep",
      subtitle: "Shipping Dock",
      camMsg: "Cam 07 • Packaging",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAbXYG3LxM4pJfU0wiQZ_O2Re3P19g4ghMDn7D4EXNqOCeJIB0SNxOMJRvLxdLaoAXRmhGmqy_FogK-U8iXFojAs-ZmYkHNNvw0hnC9mn0MVTmdeoZpbDKL1jRo87tmez0NlKPYrASWZC4X8tUVjsYr7Rq-TmPoHkDZxgn2rw0z77iqUyZpKiJBT4OVS8a8IL19KCK5EiTsc5IIPo7wauvKMmO1xCPm6DMY5kforeq-BdSLr__4maBRjl6lnHoZCMQ6YFfjyTXrAyE",
      h: "h-[600px]",
    },
    {
      title: "Facility View",
      subtitle: "Main Entrance",
      camMsg: "Cam 08 • Exterior",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAtNGvbhTJVoxjoTyyBn0N9sS6O35fJ_9_P01val3Qk3jSLYkk-MVbo1ftuCvb4ukMUISy8ZAYtRUOT6P1aWdTgCyaH1zEm2XKRRuh9kiXPFGpu1t6d8DNUzSFJu_U3xOmoG78TBTzXcMNFFmeCPFzdw4vuVbQ7BN53DctWGGloTApOMEONfEQBi3EzLdoKfUUiXGkexXRD6nRRvdR4ar2PiJifRSzwvBZGCbIggtEeKFtXxEKrh_6Ve0F9Ggnzv8edEHH_9Go_diQ",
      h: "h-[540px]",
    },
  ];

  return (
    <ManufacturingErrorBoundary>
      <section className="py-24 border-t border-white/5 bg-[#0A0A0A] overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#D4A853]/10 via-[#0A0A0A] to-[#0A0A0A] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row justify-between items-end relative z-10 gap-6">
          <div>
            <h2 className="text-4xl font-neue-stance font-bold text-white uppercase mb-2 italic skew-x-[-2deg]">
              Factory Floor <span className="text-[#D4A853]">Live</span>
            </h2>
            <div className="flex items-center gap-2 text-[#68869A] text-xs font-mono uppercase tracking-widest mt-4">
              <div className="flex items-center gap-1 border-b border-gray-600 pb-1">
                <MoveRight className="text-[#D4A853] w-4 h-4 rotate-180" />
                <div className="w-8 h-[2px] bg-[#D4A853]/80"></div>
                <MoveRight className="text-[#D4A853] w-4 h-4" />
              </div>
              <span className="ml-2 font-bold text-[#D4A853]">Drag / Scroll to Explore</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pointer-events-none md:pointer-events-auto">
            <div className="flex items-center space-x-2 text-white font-mono text-sm border-l-4 border-[#D4A853] px-4 py-2 bg-black/80 backdrop-blur-sm skew-x-[-12deg] shadow-lg shadow-[#D4A853]/10">
              <span className="text-[#D4A853] animate-pulse font-black italic">●</span>
              <span className="tracking-widest font-black italic text-[#D4A853] text-lg">
                0{currentIndex} / 0{totalSlides}
              </span>
            </div>
          </div>
        </div>

        {/* Gallery Slider */}
        <div
          ref={scrollRef}
          className="overflow-x-auto pb-12 pl-6 md:pl-[calc((100vw-1280px)/2)] pr-6 flex items-end gap-6 snap-x snap-mandatory h-[650px] scrollbar-hide no-scrollbar relative z-10"
        >
          {galleries.map((item, idx) => (
            <div
              key={idx}
              className={`min-w-[400px] md:min-w-[500px] ${item.h} relative group snap-center flex-shrink-0 bg-[#121212] border border-white/10 overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,83,0.1)] hover:border-[#D4A853]/50`}
            >
              <div className="absolute top-4 left-4 z-20 text-[10px] font-mono uppercase tracking-widest text-[#D4A853] border border-[#D4A853] bg-black/80 px-2 py-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">
                {item.camMsg}
              </div>

              <div className="absolute inset-0 z-10 pointer-events-none mix-blend-overlay opacity-60 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 400 400%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>

              <img
                alt={item.title}
                className="w-full h-full object-cover grayscale opacity-60 group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105"
                src={item.img}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-transparent opacity-80 z-10"></div>

              <div className="absolute bottom-0 left-0 w-full p-6 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="text-3xl font-neue-stance font-black text-white uppercase tracking-wider mb-1 italic skew-x-[-5deg]">
                  {item.title}
                </h3>
                <p className="text-[#D4A853] text-xs font-mono uppercase tracking-widest font-bold">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
