import type { Fabric, MediaAsset } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Leaf, RotateCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface FabricPortfolioSectionProps {
  mediaAssets?: MediaAsset[];
  selectedFabricIds?: number[];
  fabrics?: Fabric[];
}

/* ─────────────────────────────────────────────
   Sustainability Score (leaf icons)
   ───────────────────────────────────────────── */
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
            i <= score ? "text-[#00C97B] fill-[#00C97B]" : "text-white/20",
          )}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Fabric Card (flip on click)
   ───────────────────────────────────────────── */
function FabricCard({
  fabric,
  fabricImage,
  index,
}: {
  fabric: Fabric;
  fabricImage?: MediaAsset | undefined;
  index: number;
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Derive a sustainability score from certifications count or a fallback
  const sustainabilityScore = useMemo(() => {
    if (fabric.certifications && Array.isArray(fabric.certifications)) {
      return Math.min(fabric.certifications.length + 2, 5);
    }
    return 3; // Default
  }, [fabric.certifications]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="snap-center shrink-0 w-72 md:w-80"
    >
      <div
        className="relative h-[420px] cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={toggleFlip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleFlip();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`${fabric.name} — click to ${isFlipped ? "see front" : "see details"}`}
      >
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── Front Side ── */}
          <div
            className="absolute inset-0 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl overflow-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            {/* Swatch Image */}
            {fabricImage && (
              <div className="h-44 overflow-hidden">
                <img
                  src={
                    fabricImage.url ||
                    (fabricImage.id && fabricImage.id < 1000000000000
                      ? `/api/media/${fabricImage.id}/content`
                      : undefined)
                  }
                  alt={`${fabric.name} sustainable fabric`}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            )}
            {!fabricImage && (
              <div className="h-44 bg-gradient-to-br from-[#00C97B]/10 to-[#00C97B]/5 flex items-center justify-center">
                <Leaf className="h-12 w-12 text-[#00C97B]/30" />
              </div>
            )}

            <div className="p-5">
              <h3 className="font-semibold text-white text-lg mb-1">{fabric.name}</h3>

              {/* Composition */}
              {fabric.properties?.composition && (
                <p className="text-sm text-[#E3DFD6]/70 mb-3 line-clamp-2">
                  {fabric.properties.composition}
                </p>
              )}

              {/* Certification badges */}
              {fabric.certifications &&
                Array.isArray(fabric.certifications) &&
                fabric.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(fabric.certifications as string[]).slice(0, 3).map((cert, ci) => (
                      <span
                        key={ci}
                        className="rounded-full bg-[#00C97B]/10 px-2 py-0.5 text-[10px] text-[#00C97B] font-medium"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                )}

              {/* Sustainability Score */}
              <div className="flex items-center justify-between">
                <SustainabilityScore score={sustainabilityScore} />
                <span className="text-[10px] text-[#68869A] flex items-center gap-1">
                  <RotateCw className="h-3 w-3" />
                  Tap to flip
                </span>
              </div>
            </div>
          </div>

          {/* ── Back Side (Technical specs) ── */}
          <div
            className="absolute inset-0 rounded-2xl bg-white/[0.06] border border-[#00C97B]/20 backdrop-blur-xl overflow-hidden p-6 flex flex-col justify-between"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div>
              <h3 className="font-semibold text-white text-lg mb-4 pb-3 border-b border-white/[0.08]">
                {fabric.name} — Specs
              </h3>

              <div className="space-y-3">
                {fabric.fabricType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#68869A]">Type</span>
                    <span className="font-medium text-white">{fabric.fabricType}</span>
                  </div>
                )}

                {fabric.weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#68869A]">Weight</span>
                    <span className="font-medium text-white">{fabric.weight}</span>
                  </div>
                )}

                {fabric.careInstructions && (
                  <div className="text-sm">
                    <span className="text-[#68869A] block mb-1">Care</span>
                    <span className="text-[#E3DFD6]/70 text-xs leading-relaxed">
                      {fabric.careInstructions}
                    </span>
                  </div>
                )}

                {fabric.description && (
                  <div className="text-sm">
                    <span className="text-[#68869A] block mb-1">Description</span>
                    <span className="text-[#E3DFD6]/70 text-xs leading-relaxed line-clamp-3">
                      {fabric.description}
                    </span>
                  </div>
                )}

                {fabric.keyApplications && fabric.keyApplications.length > 0 && (
                  <div className="text-sm">
                    <span className="text-[#68869A] block mb-1">Applications</span>
                    <div className="flex flex-wrap gap-1">
                      {fabric.keyApplications.slice(0, 4).map((app: string, ai: number) => (
                        <span
                          key={ai}
                          className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] text-[#E3DFD6]"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <span className="text-[10px] text-[#68869A] text-center flex items-center justify-center gap-1 pt-3 border-t border-white/[0.08]">
              <RotateCw className="h-3 w-3" />
              Tap to flip back
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Fabric Portfolio Section — Horizontal Scroll
   ───────────────────────────────────────────── */
export function FabricPortfolioSection({
  mediaAssets = [],
  selectedFabricIds = [],
  fabrics: initialFabrics,
}: FabricPortfolioSectionProps) {
  const [activeFilter, setActiveFilter] = useState<string>("All");

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

  // Derive unique categories from fabrics
  const categories = useMemo(() => {
    const cats = new Set<string>();
    sustainableFabrics.forEach((f) => {
      if (f.fabricType) cats.add(f.fabricType);
    });
    return ["All", ...Array.from(cats)];
  }, [sustainableFabrics]);

  // Filter fabrics by active category
  const filteredFabrics = useMemo(() => {
    if (activeFilter === "All") return sustainableFabrics;
    return sustainableFabrics.filter((f) => f.fabricType === activeFilter);
  }, [sustainableFabrics, activeFilter]);

  if (sustainableFabrics.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[#68869A]">Sustainable fabric portfolio coming soon...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Category Filter Bar */}
      {categories.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                activeFilter === cat
                  ? "bg-[#00C97B] text-white"
                  : "bg-white/[0.06] text-[#E3DFD6] hover:bg-white/[0.1] border border-white/[0.08]",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Horizontal scroll container */}
      <div
        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {filteredFabrics.map((fabric, index) => {
          const fabricImage = mediaAssets.find((asset) => asset.id === fabric.visualSwatchId);
          return (
            <FabricCard key={fabric.id} fabric={fabric} fabricImage={fabricImage} index={index} />
          );
        })}
      </div>
    </div>
  );
}
