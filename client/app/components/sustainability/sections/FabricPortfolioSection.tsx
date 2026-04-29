import { useGSAP } from "@gsap/react";
import type { Fabric, MediaAsset } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Leaf, RotateCw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

interface FabricPortfolioSectionProps {
  mediaAssets?: MediaAsset[];
  selectedFabricIds?: number[];
  fabrics?: Fabric[];
}

function SustainabilityScore({ score }: { score: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Sustainability score: ${score} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Leaf
          key={i}
          className={cn(
            "h-3.5 w-3.5 transition-colors",
            i <= score
              ? "text-[color:var(--s-primary)] fill-[color:var(--s-primary)]"
              : "text-white/20",
          )}
        />
      ))}
    </div>
  );
}

function FabricCard({
  fabric,
  fabricImage,
}: {
  fabric: Fabric;
  fabricImage?: MediaAsset | undefined;
}) {
  const sustainabilityScore = useMemo(() => {
    if (fabric.certifications && Array.isArray(fabric.certifications)) {
      return Math.min(fabric.certifications.length + 2, 5);
    }
    return 3;
  }, [fabric.certifications]);

  const imageUrl =
    fabricImage?.url ||
    (fabricImage?.id && fabricImage.id < 1000000000000
      ? `/api/media/${fabricImage.id}/content`
      : undefined);

  return (
    <div className="fabric-card group snap-center shrink-0 w-[340px] h-[480px] perspective-1000">
      <div className="relative w-full h-full cursor-pointer card-inner">
        {/* ── Card Front ── */}
        <div className="card-front rounded-[2rem] overflow-hidden shadow-xl border border-[color:var(--s-border-card)] bg-[color:var(--s-bg-card)]">
          <div className="absolute inset-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`${fabric.name} sustainable fabric`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[color:var(--s-primary)]/10 to-[color:var(--s-primary)]/5 flex items-center justify-center">
                <Leaf className="h-16 w-16 text-[color:var(--s-primary)]/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          </div>

          {/* Badge */}
          {fabric.fabricType && (
            <div className="absolute top-4 right-4 z-10">
              <span className="bg-[color:var(--s-primary)]/90 text-black text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg">
                {fabric.fabricType.toUpperCase()}
              </span>
            </div>
          )}

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 w-full p-8 backdrop-blur-[2px]">
            <div className="flex flex-col gap-1 mb-4">
              <h3 className="text-3xl font-bold text-white leading-tight drop-shadow-lg">
                {fabric.name}
              </h3>
              {fabric.properties?.composition && (
                <p className="text-[color:var(--s-primary)] font-medium text-sm tracking-wide opacity-90 drop-shadow-md">
                  {fabric.properties.composition}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between border-t border-white/20 pt-4">
              <SustainabilityScore score={sustainabilityScore} />
              <span className="text-[10px] uppercase tracking-widest text-gray-300 flex items-center gap-1">
                Flip for Specs
                <RotateCw className="h-3 w-3 text-gray-400" />
              </span>
            </div>
          </div>
        </div>

        {/* ── Card Back (Technical specs) ── */}
        <div className="card-back rounded-[2rem] p-8 flex flex-col justify-between border border-[color:var(--s-primary)]/50 bg-[color:var(--s-bg-card)] shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Technical Specs</h3>
              <Leaf className="h-5 w-5 text-[color:var(--s-primary)]" />
            </div>

            <div className="space-y-4">
              {fabric.fabricType && (
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-sm text-[color:var(--s-text-muted)]">Type</span>
                  <span className="text-sm text-[color:var(--s-text-head)] font-mono">
                    {fabric.fabricType}
                  </span>
                </div>
              )}
              {fabric.weight && (
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-sm text-[color:var(--s-text-muted)]">Weight</span>
                  <span className="text-sm text-[color:var(--s-text-head)] font-mono">
                    {fabric.weight}
                  </span>
                </div>
              )}
              {fabric.certifications &&
                Array.isArray(fabric.certifications) &&
                fabric.certifications.length > 0 && (
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="text-sm text-[color:var(--s-text-muted)]">Certification</span>
                    <span className="text-sm text-[color:var(--s-primary)] font-mono">
                      {(fabric.certifications as string[]).slice(0, 2).join(", ")}
                    </span>
                  </div>
                )}
              {fabric.keyApplications && fabric.keyApplications.length > 0 && (
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-sm text-[color:var(--s-text-muted)]">Applications</span>
                  <span className="text-sm text-[color:var(--s-text-head)] font-mono text-right max-w-[140px]">
                    {(fabric.keyApplications as string[]).slice(0, 2).join(", ")}
                  </span>
                </div>
              )}
              {fabric.description && (
                <div className="p-4 bg-white/5 rounded-xl border border-[color:var(--s-border-card)] mt-4">
                  <p className="text-xs text-[color:var(--s-text-muted)] italic leading-relaxed line-clamp-3">
                    "{fabric.description}"
                  </p>
                </div>
              )}
            </div>
          </div>
          <button className="w-full py-3 rounded-xl bg-[color:var(--s-primary)] text-black font-bold text-sm hover:bg-white transition-colors flex items-center justify-center gap-2">
            Request Swatch <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterBtn({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  // Simple deterministic pattern for alternating leaf border radius mapping to Stitch design
  const isAlt = label.length % 2 === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-5 py-2 text-sm font-medium transition-all duration-300",
        isActive
          ? "bg-[color:var(--s-primary)] text-black font-bold shadow-[0_0_15px_rgba(0,199,123,0.3)] border-transparent"
          : "bg-[color:var(--s-bg-card)] text-[color:var(--s-text-muted)] hover:bg-[color:var(--s-bg-card-hover)] hover:text-[color:var(--s-text-head)] border border-[color:var(--s-border-card)]",
      )}
      style={{ borderRadius: isAlt ? "0.5rem 2rem 0.5rem 2rem" : "2rem 0.5rem 2rem 0.5rem" }}
    >
      {label}
    </button>
  );
}

export function FabricPortfolioSection({
  mediaAssets = [],
  selectedFabricIds = [],
  fabrics: initialFabrics,
}: FabricPortfolioSectionProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All"); // Mistake corrected below
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: fabricsData = initialFabrics || [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
    queryFn: () => apiRequest("/api/fabrics"),
    enabled: !initialFabrics || initialFabrics.length === 0,
    staleTime: 5 * 60 * 1000,
  });

  const sustainableFabrics = useMemo(() => {
    const activeFabrics = fabricsData.filter((fabric) => fabric.isActive);

    if (selectedFabricIds && selectedFabricIds.length > 0) {
      return selectedFabricIds
        .map((id) => activeFabrics.find((fabric) => fabric.id === id))
        .filter((fabric): fabric is Fabric => fabric !== undefined)
        .slice(0, 12);
    }

    return activeFabrics.slice(0, 12);
  }, [fabricsData, selectedFabricIds]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    sustainableFabrics.forEach((f) => {
      if (f.fabricType) cats.add(f.fabricType);
    });
    return ["All", ...Array.from(cats)];
  }, [sustainableFabrics]);

  const filteredFabrics = useMemo(() => {
    if (activeFilter === "All") return sustainableFabrics;
    return sustainableFabrics.filter((f) => f.fabricType === activeFilter);
  }, [sustainableFabrics, activeFilter]);

  useGSAP(
    () => {
      gsap.from(".fabric-card", {
        scrollTrigger: {
          trigger: ".fabric-scroll-container",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        x: 30,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
      });
    },
    { scope: containerRef, dependencies: [filteredFabrics] },
  );

  if (sustainableFabrics.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[color:var(--s-text-muted)]">Sustainable fabric portfolio coming soon...</p>
      </div>
    );
  }

  return (
    <div ref={containerRef}>
      {/* Category Filter Bar */}
      {categories.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 px-6 lg:px-10 mb-8 hide-scrollbar">
          {categories.map((cat) => (
            <FilterBtn
              key={cat}
              label={cat}
              isActive={activeFilter === cat}
              onClick={() => setActiveFilter(cat)}
            />
          ))}
        </div>
      )}

      {/* Horizontal scroll container with 3D flip cards */}
      <div
        className="fabric-scroll-container flex gap-6 overflow-x-auto pb-10 px-6 lg:px-10 snap-x snap-mandatory scroll-smooth hide-scrollbar"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {filteredFabrics.map((fabric) => {
          const fabricImage = mediaAssets.find((asset) => asset.id === fabric.visualSwatchId);
          return <FabricCard key={fabric.id} fabric={fabric} fabricImage={fabricImage} />;
        })}
      </div>
    </div>
  );
}
