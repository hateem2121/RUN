import type { MediaAsset } from "@shared/schema";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";

interface PublicCaseStudySectionProps {
  caseStudies?: any[];
  mediaAssets?: MediaAsset[];
}

export function PublicCaseStudySection({
  caseStudies = [],
  mediaAssets = [],
}: PublicCaseStudySectionProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const getAssetUrl = (mediaId?: string | number | null) => {
    if (!mediaId) return undefined;
    const asset = Array.isArray(mediaAssets)
      ? mediaAssets.find((a) => a.id.toString() === mediaId.toString())
      : undefined;
    return asset ? `/api/media/${asset.id}` : undefined;
  };

  const defaultProjects = [
    {
      title: "Olympus Track Club",
      tag: "Teamwear Series",
      desc: "Developed ultra-lightweight, aerodynamic kits for the 2025 championships. Our proprietary woven structure reduced drag by 4% while maintaining thermal regulation.",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKk0UjiS1IFhcvopcCQI_fufULGOhNl9cA07UoogcPLYmkoc51-cZfUexrGnb23Z80jDdJDXYonCnntVGIvqE2nL-LVaab33PRJxXXxz2X8uYW1TUzFuieziS3G7n8rEXWzDwN1mZcbka7kSzDqYeola64LrFVAdXz2jH3fyeKCxqvF3HkXNFd0soCUz4L1FGpT0FQLQM3eHMoLo3OKj-oSoLT269492rkStFFWplJ-ju1UuZywi-YF_EBxRTiYOqA8bw4CLnI_5E",
      stats: [
        { label: "Fabric Weight", val: "85 GSM" },
        { label: "Units Delivered", val: "1,200" },
        { label: "Production Time", val: "18 Days" },
      ],
    },
    {
      title: "Alpine Expedition",
      tag: "Outerwear Shells",
      desc: "Engineered 3-layer waterproof, breathable shells capable of withstanding extreme high-altitude conditions. Fully seam-taped with laser-cut vents.",
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOL2PIqcRGBO2TgfVf1iQdoEmLIWktgqCAjhzuUj4IVhN8xprZaaTgcbaLX27E-ww0FaHcNjrzuvj0KZx52Dzndj1BYlRgZimO7eeG9Mj05br1deVh8zCNTY_CYO-t0KlKdQE-uwYWxUaJl5rl74jsJ4GguKyOpc6PrSTsyUO9CJmkWtpbN9cMiFHilR0_37a_vxOnOKe0aTHKP-ai_TgxibtD7pXildES8NGVWknLagjK5GCMtBps0yfAF0BGWIaCI2-jjISa0JA",
      stats: [
        { label: "Water Rating", val: "20k mm" },
        { label: "Units Delivered", val: "450" },
        { label: "Production Time", val: "24 Days" },
      ],
    },
  ];

  const displayProjects =
    caseStudies.length > 0
      ? (caseStudies as Array<{
        title: string;
        category?: string;
        excerpt?: string;
        featuredImageId?: string | number;
        clientName?: string;
        year?: string;
      }>).map((cs: any) => ({
          title: cs.title,
          tag: cs.type || "Case Study",
          desc: cs.description || "High performance apparel manufacturing.",
          img: getAssetUrl(cs.imageId) || defaultProjects[0]?.img || "",
          stats: [
            { label: "Client", val: cs.client || "Confidential" },
            { label: "Year", val: cs.year || "2024" },
          ],
        }))
      : defaultProjects;

  const currentProject = displayProjects[activeIdx];

  const nextProject = () => setActiveIdx((prev) => (prev + 1) % displayProjects.length);
  const prevProject = () =>
    setActiveIdx((prev) => (prev === 0 ? displayProjects.length - 1 : prev - 1));

  if (!currentProject) return null;

  return (
    <ManufacturingErrorBoundary>
      <section className="py-24 bg-[#0A0A0A] relative border-b border-white/5">
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="gridPattern" height="40" patternUnits="userSpaceOnUse" width="40">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#D4A853"
                  strokeOpacity="0.2"
                  strokeWidth="1"
                ></path>
              </pattern>
            </defs>
            <rect fill="url(#gridPattern)" height="100%" width="100%"></rect>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between md:items-end mb-16 gap-6">
            <div>
              <span className="text-[#D4A853] font-mono text-xs uppercase tracking-widest font-bold">
                Featured Case Studies
              </span>
              <h2 className="text-5xl md:text-6xl font-neue-stance font-bold text-white uppercase mt-4 italic tracking-tighter skew-x-[-2deg]">
                Recent Projects
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={prevProject}
                aria-label="Previous project"
                className="w-12 h-12 flex items-center justify-center border border-[#D4A853]/30 bg-black/50 text-[#D4A853] hover:bg-[#D4A853] hover:text-black transition-colors skew-x-[-10deg]"
              >
                <ChevronLeft className="w-6 h-6 skew-x-[10deg]" />
              </button>
              <button
                onClick={nextProject}
                aria-label="Next project"
                className="w-12 h-12 flex items-center justify-center border border-[#D4A853]/30 bg-black/50 text-[#D4A853] hover:bg-[#D4A853] hover:text-black transition-colors skew-x-[-10deg]"
              >
                <ChevronRight className="w-6 h-6 skew-x-[10deg]" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border border-white/10 bg-[#121212]/80 backdrop-blur-md shadow-2xl">
            {/* Image Side */}
            <div className="lg:col-span-3 pb-[60%] lg:pb-0 relative overflow-hidden group">
              <img
                key={currentProject.img}
                alt={currentProject.title}
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-105"
                src={currentProject.img}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#121212] hidden lg:block opacity-90"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent lg:hidden opacity-90"></div>
              <div className="absolute top-6 left-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                <span className="text-[10px] uppercase font-mono tracking-widest text-white/70 font-bold bg-black/50 px-2 py-0.5 border border-white/10 backdrop-blur-md">
                  REC
                </span>
              </div>
            </div>

            {/* Content Side */}
            <div className="lg:col-span-2 p-8 md:p-12 flex flex-col justify-center relative z-10">
              <span className="text-xs font-mono uppercase tracking-widest text-[#D4A853] mb-4 font-bold border-l-2 border-[#D4A853] pl-3">
                {currentProject.tag}
              </span>

              <h3 className="text-4xl font-neue-stance font-bold text-white uppercase italic tracking-wider mb-6 leading-tight">
                {currentProject.title}
              </h3>

              <p className="text-[#E3DFD6] mb-10 leading-relaxed font-light text-sm md:text-base">
                {currentProject.desc}
              </p>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-10 border-t border-white/5 pt-8">
                {currentProject.stats.map((stat, i) => (
                  <div key={i}>
                    <div className="text-[10px] uppercase text-[#68869A] font-mono mb-1 font-bold">
                      {stat.label}
                    </div>
                    <div className="text-white font-neue-stance font-medium text-xl italic">
                      {stat.val}
                    </div>
                  </div>
                ))}
              </div>

              <a
                className="inline-flex items-center justify-between w-full border border-white/10 bg-white/[0.02] hover:bg-[#D4A853] hover:text-black text-white px-6 py-4 uppercase text-xs tracking-widest font-bold transition-all duration-300 group cursor-pointer"
                href="/case-studies"
              >
                <span>View Full Specs</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
