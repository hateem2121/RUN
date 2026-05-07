import type { ManufacturingCapability, MediaAsset } from "@shared/index";
import {
  ArrowRight,
  Bot,
  Cpu,
  Factory,
  FlaskConical,
  Recycle,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import { ManufacturingErrorBoundary } from "@/components/error-boundaries/manufacturing-error-boundary";
import { cn, sanitizeContent } from "@/lib/utils";

interface PublicCapabilitySectionProps {
  capabilities: ManufacturingCapability[];
  mediaAssets: MediaAsset[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Factory,
  FlaskConical,
  Recycle,
  Truck,
  Bot,
  ShieldCheck,
  Cpu,
  Zap,
};

interface CapabilityDisplayItem {
  title: string;
  description: string;
  icon: string;
  category: string;
  capacity?: string | null;
  unit?: string | null;
  imageId?: number | null;
  imageSrc?: string;
  isLarge?: boolean;
  isVertical?: boolean;
}

export function PublicCapabilitySection({
  capabilities,
  mediaAssets,
}: PublicCapabilitySectionProps) {
  // Define default capabilities as fallback if CMS is empty
  const defaultCapabilities: CapabilityDisplayItem[] = [
    {
      title: "End-to-End Production",
      description:
        "From initial concept sketches to global logistics distribution, we handle every aspect of the manufacturing lifecycle with vertical integration.",
      icon: "Factory",
      category: "Production",
      capacity: "1.2M",
      unit: "Units/Year",
      isLarge: true,
      imageSrc:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuAtNGvbhTJVoxjoTyyBn0N9sS6O35fJ_9_P01val3Qk3jSLYkk-MVbo1ftuCvb4ukMUISy8ZAYtRUOT6P1aWdTgCyaH1zEm2XKRRuh9kiXPFGpu1t6d8DNUzSFJu_U3xOmoG78TBTzXcMNFFmeCPFzdw4vuVbQ7BN53DctWGGloTApOMEONfEQBi3EzLdoKfUUiXGkexXRD6nRRvdR4ar2PiJifRSzwvBZGCbIggtEeKFtXxEKrh_6Ve0F9Ggnzv8edEHH_9Go_diQ",
    },
    {
      title: "R&D Lab",
      description: "In-house material testing for durability, elasticity, and wicking properties.",
      icon: "FlaskConical",
      category: "Research",
    },
    {
      title: "Sustainable Tech",
      description: "Waterless dyeing & recycled polymer processing.",
      icon: "Recycle",
      category: "Sustainability",
    },
    {
      title: "Global Logistics",
      description:
        "Optimized supply chain management ensuring on-time delivery across 45 countries.",
      icon: "Truck",
      category: "Supply Chain",
      isVertical: true,
    },
    {
      title: "Robotics",
      description: "Automated arms for consistent assembly.",
      icon: "Bot",
      category: "Automation",
    },
    {
      title: "QC Protocols",
      description: "Zero-tolerance policy for defects.",
      icon: "ShieldCheck",
      category: "Quality",
    },
  ];

  // Map dynamic data or use defaults
  const displayCapabilities: CapabilityDisplayItem[] =
    capabilities.length > 0
      ? capabilities.slice(0, 6).map((cap, i) => {
          const defaultCap = (defaultCapabilities[i] || defaultCapabilities[0])!;
          return {
            ...defaultCap,
            title: cap.title || cap.name,
            description: cap.description || defaultCap.description,
            icon: cap.icon || defaultCap.icon,
            category: cap.category || defaultCap.category,
            capacity: cap.capacity,
            unit: cap.unit,
            imageId: cap.imageId,
          };
        })
      : defaultCapabilities;

  const getAssetUrl = (mediaId?: number | null) => {
    if (!mediaId) return undefined;
    const asset = Array.isArray(mediaAssets)
      ? mediaAssets.find((a) => a.id === mediaId)
      : undefined;
    return asset ? `/api/media/${asset.id}` : undefined;
  };

  return (
    <ManufacturingErrorBoundary>
      <section className="py-24 max-w-7xl mx-auto px-6 bg-manufacturing-bg">
        <div className="mb-16 text-center">
          <span className="text-manufacturing-accent font-mono text-xs uppercase tracking-widest border border-manufacturing-accent/30 px-3 py-1 rounded-none font-bold">
            Core Competencies
          </span>
          <h2 className="text-5xl font-neue-stance font-bold text-white uppercase mt-6 italic tracking-tighter skew-x-[-2deg]">
            Capabilities
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 grid-rows-none lg:grid-rows-2 gap-6 min-h-[800px] lg:min-h-[600px]">
          {displayCapabilities.map((cap, idx) => {
            const Icon = iconMap[cap.icon || ""] || Factory;
            const isLarge = idx === 0;
            const isVertical = idx === 3;
            const imgSrc = cap.imageId ? getAssetUrl(cap.imageId) : cap.imageSrc;

            return (
              <div
                key={idx}
                className={cn(
                  "border border-white/5 bg-white/[0.04] p-8 relative overflow-hidden group backdrop-blur-xl transition-all duration-500 hover:border-manufacturing-accent/40 hover:bg-white/[0.06]",
                  isLarge ? "col-span-2 row-span-1 lg:row-span-2" : "col-span-2 lg:col-span-1",
                  isVertical ? "row-span-1 lg:row-span-2" : "row-span-1",
                )}
              >
                <div className="absolute top-0 right-0 p-4 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Icon className="size-8 md:size-10 text-manufacturing-accent" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-end">
                  <h3
                    className={cn(
                      "font-neue-stance font-bold text-white mb-4 italic uppercase tracking-wider",
                      isLarge ? "text-3xl" : "text-xl",
                    )}
                  >
                    {sanitizeContent(cap.title)}
                  </h3>
                  <p
                    className={cn(
                      "text-manufacturing-body mb-6 font-light leading-relaxed",
                      isLarge ? "max-w-md" : "text-sm",
                    )}
                  >
                    {sanitizeContent(cap.description)}
                  </p>

                  {isLarge && (
                    <a
                      className="text-manufacturing-accent text-sm font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2 group/link cursor-pointer w-fit"
                      href="#contact"
                    >
                      Learn More{" "}
                      <ArrowRight className="size-4 transform transition-transform group-hover/link:translate-x-1" />
                    </a>
                  )}

                  {isVertical && (
                    <div className="h-24 w-full bg-manufacturing-bg/50 rounded-sm mt-4 relative overflow-hidden border border-manufacturing-accent/10">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--color-manufacturing-accent)_0%,_transparent_70%)]"></div>
                      <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 bg-manufacturing-accent rotate-45 animate-pulse"></div>
                      <div
                        className="absolute top-1/3 left-1/2 w-1.5 h-1.5 bg-manufacturing-accent rotate-45 animate-pulse"
                        style={{ animationDelay: "0.5s" }}
                      ></div>
                      <div
                        className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-manufacturing-accent rotate-45 animate-pulse"
                        style={{ animationDelay: "1s" }}
                      ></div>
                    </div>
                  )}
                </div>

                {isLarge && imgSrc && (
                  <>
                    <div className="absolute inset-0 z-0 bg-gradient-to-t from-manufacturing-bg/95 via-transparent to-transparent"></div>
                    <img
                      alt={cap.title}
                      className="absolute inset-0 w-full h-full object-cover -z-10 opacity-30 mix-blend-overlay group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0"
                      src={imgSrc}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </ManufacturingErrorBoundary>
  );
}
