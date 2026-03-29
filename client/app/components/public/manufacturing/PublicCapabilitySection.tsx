import type { ManufacturingCapability, MediaAsset } from "@shared/index";
import { ArrowRight, Bot, Factory, FlaskConical, Recycle, ShieldCheck, Truck } from "lucide-react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";

interface PublicCapabilitySectionProps {
  capabilities: ManufacturingCapability[];
  mediaAssets: MediaAsset[];
}

export function PublicCapabilitySection({}: PublicCapabilitySectionProps) {
  return (
    <ManufacturingErrorBoundary>
      <section className="py-24 max-w-7xl mx-auto px-6 bg-[#1A0000]">
        <div className="mb-16 text-center">
          <span className="text-[#FF4D00] font-mono text-xs uppercase tracking-widest border border-[#FF4D00]/30 px-3 py-1 rounded-none font-bold">
            Core Competencies
          </span>
          <h2 className="text-5xl font-neue-stance font-bold text-white uppercase mt-6 italic tracking-tighter skew-x-[-2deg]">
            Capabilities
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-none lg:grid-rows-2 gap-6 min-h-[800px] lg:min-h-[600px]">
          {/* Card 1: End-to-End Production (Large) */}
          <div className="col-span-2 row-span-1 lg:row-span-2 border border-white/5 bg-white/[0.04] p-8 relative overflow-hidden group backdrop-blur-xl transition-colors hover:border-[#FF4D00]/40">
            <div className="absolute top-0 right-0 p-4 opacity-40 group-hover:opacity-100 transition-opacity">
              <Factory className="size-10 text-[#FF4D00]" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-end">
              <h3 className="text-3xl font-neue-stance font-bold text-white mb-4 italic uppercase tracking-wider">
                End-to-End Production
              </h3>
              <p className="text-[#E3DFD6] mb-6 font-light leading-relaxed max-w-md">
                From initial concept sketches to global logistics distribution, we handle every
                aspect of the manufacturing lifecycle with vertical integration.
              </p>
              <a
                className="text-[#FF4D00] text-sm font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group/link cursor-pointer w-fit"
                href="#contact"
              >
                Learn More{" "}
                <ArrowRight className="size-4 transform transition-transform group-hover/link:translate-x-1" />
              </a>
            </div>
            <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#1A0000]/95 via-transparent to-transparent"></div>
            <img
              alt="Factory machinery"
              className="absolute inset-0 w-full h-full object-cover -z-10 opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtNGvbhTJVoxjoTyyBn0N9sS6O35fJ_9_P01val3Qk3jSLYkk-MVbo1ftuCvb4ukMUISy8ZAYtRUOT6P1aWdTgCyaH1zEm2XKRRuh9kiXPFGpu1t6d8DNUzSFJu_U3xOmoG78TBTzXcMNFFmeCPFzdw4vuVbQ7BN53DctWGGloTApOMEONfEQBi3EzLdoKfUUiXGkexXRD6nRRvdR4ar2PiJifRSzwvBZGCbIggtEeKFtXxEKrh_6Ve0F9Ggnzv8edEHH_9Go_diQ"
            />
          </div>

          {/* Card 2: R&D Lab (Small) */}
          <div className="col-span-2 lg:col-span-1 row-span-1 border border-white/5 bg-white/[0.04] p-6 relative overflow-hidden group backdrop-blur-xl hover:border-[#FF4D00]/60 transition-colors">
            <div className="flex flex-col h-full justify-between">
              <FlaskConical className="size-8 text-[#FF4D00] mb-4" />
              <div>
                <h3 className="text-xl font-neue-stance font-bold text-white mb-2 italic uppercase tracking-wider">
                  R&D Lab
                </h3>
                <p className="text-[#E3DFD6] text-sm leading-relaxed font-light">
                  In-house material testing for durability, elasticity, and wicking properties.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Sustainable Tech (Small) */}
          <div className="col-span-2 lg:col-span-1 row-span-1 border border-white/5 bg-white/[0.04] p-6 relative overflow-hidden group backdrop-blur-xl hover:border-[#FF4D00]/60 transition-colors">
            <div className="flex flex-col h-full justify-between">
              <Recycle className="size-8 text-[#FF4D00] mb-4" />
              <div>
                <h3 className="text-xl font-neue-stance font-bold text-white mb-2 italic uppercase tracking-wider">
                  Sustainable Tech
                </h3>
                <p className="text-[#E3DFD6] text-sm leading-relaxed font-light">
                  Waterless dyeing & recycled polymer processing.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Global Logistics (Medium Vertical) */}
          <div className="col-span-2 lg:col-span-1 row-span-1 lg:row-span-2 border border-white/5 bg-white/[0.04] p-6 relative overflow-hidden group backdrop-blur-xl hover:border-[#FF4D00]/60 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-40 group-hover:opacity-100 transition-opacity">
              <Truck className="size-8 text-[#FF4D00]" />
            </div>
            <div className="flex flex-col h-full justify-between relative z-10">
              <div className="mt-auto">
                <h3 className="text-2xl font-neue-stance font-bold text-white mb-2 italic uppercase tracking-wider">
                  Global Logistics
                </h3>
                <p className="text-[#E3DFD6] text-sm mb-4 font-light">
                  Optimized supply chain management ensuring on-time delivery across 45 countries.
                </p>
                <div className="h-24 w-full bg-[#1A0000]/50 rounded-sm mt-4 relative overflow-hidden border border-[#FF4D00]/10">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_#FF4D00_0%,_transparent_70%)]"></div>
                  <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 bg-[#FF4D00] rotate-45 animate-pulse"></div>
                  <div
                    className="absolute top-1/3 left-1/2 w-1.5 h-1.5 bg-[#FF4D00] rotate-45 animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                  <div
                    className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-[#FF4D00] rotate-45 animate-pulse"
                    style={{ animationDelay: "1s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Robotics (Small) */}
          <div className="col-span-1 lg:col-span-1 row-span-1 border border-white/5 bg-white/[0.04] p-6 relative overflow-hidden group backdrop-blur-xl hover:border-[#FF4D00]/60 transition-colors">
            <div className="flex flex-col h-full justify-between">
              <Bot className="size-8 text-[#FF4D00] mb-4" />
              <div>
                <h3 className="text-xl font-neue-stance font-bold text-white mb-2 italic uppercase tracking-wider">
                  Robotics
                </h3>
                <p className="text-[#E3DFD6] text-xs md:text-sm leading-relaxed font-light">
                  Automated arms for consistent assembly.
                </p>
              </div>
            </div>
          </div>

          {/* Card 6: QC Protocols (Small) */}
          <div className="col-span-1 lg:col-span-1 row-span-1 border border-white/5 bg-white/[0.04] p-6 relative overflow-hidden group backdrop-blur-xl hover:border-[#FF4D00]/60 transition-colors">
            <div className="flex flex-col h-full justify-between">
              <ShieldCheck className="size-8 text-[#FF4D00] mb-4" />
              <div>
                <h3 className="text-xl font-neue-stance font-bold text-white mb-2 italic uppercase tracking-wider">
                  QC Protocols
                </h3>
                <p className="text-[#E3DFD6] text-xs md:text-sm leading-relaxed font-light">
                  Zero-tolerance policy for defects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
