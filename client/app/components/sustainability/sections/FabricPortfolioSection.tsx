import type { Fabric, MediaAsset } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { apiRequest } from "@/lib/queryClient";

interface FabricPortfolioSectionProps {
  mediaAssets?: MediaAsset[];
  selectedFabricIds?: number[];
  fabrics?: Fabric[];
}

export function FabricPortfolioSection({
  mediaAssets = [],
  selectedFabricIds = [],
  fabrics: initialFabrics,
}: FabricPortfolioSectionProps) {
  const { data: fabricsData = initialFabrics || [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
    queryFn: () => apiRequest("/api/fabrics"),
    enabled: !initialFabrics || initialFabrics.length === 0,
    staleTime: 5 * 60 * 1000,
  });

  const sustainableFabrics = useMemo(() => {
    // Filter by active fabrics first
    const activeFabrics = fabricsData.filter((fabric) => fabric.isActive);

    // If specific IDs are selected, filter by those
    if (selectedFabricIds && selectedFabricIds.length > 0) {
      return (
        selectedFabricIds
          .map((id) => activeFabrics.find((fabric) => fabric.id === id))
          .filter((fabric): fabric is Fabric => fabric !== undefined)
          // Keep the order of selection or just slice
          .slice(0, 6)
      );
    }

    // Default fallback: show first 6 active fabrics
    return activeFabrics.slice(0, 6);
  }, [fabricsData, selectedFabricIds]);

  if (sustainableFabrics.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-stone-600">Sustainable fabric portfolio coming soon...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {sustainableFabrics.map((fabric: Fabric, index: number) => {
        const fabricImage = mediaAssets.find((asset) => asset.id === fabric.visualSwatchId);
        return (
          <motion.div
            key={fabric.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg transition-shadow duration-300 hover:shadow-xl"
          >
            {fabricImage && (
              <div className="h-48 overflow-hidden">
                <img
                  src={
                    fabricImage.url ||
                    (fabricImage.id && fabricImage.id < 1000000000000
                      ? `/api/media/${fabricImage.id}/content`
                      : undefined)
                  }
                  alt={`${fabric.name} sustainable fabric`}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h3 className="mb-3 font-semibold text-stone-900 text-xl">{fabric.name}</h3>

              {fabric.description && (
                <p className="mb-4 text-stone-600 leading-relaxed">{fabric.description}</p>
              )}

              <div className="space-y-2">
                {fabric.fabricType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Type:</span>
                    <span className="font-medium text-stone-700">{fabric.fabricType}</span>
                  </div>
                )}

                {fabric.weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Weight:</span>
                    <span className="font-medium text-stone-700">{fabric.weight}</span>
                  </div>
                )}

                {fabric.keyApplications && fabric.keyApplications.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-2 text-stone-500 text-xs">Applications:</p>
                    <div className="flex flex-wrap gap-1">
                      {fabric.keyApplications.slice(0, 3).map((app: string, appIndex: number) => (
                        <span
                          key={appIndex}
                          className="rounded-full bg-stone-100 px-2 py-1 text-stone-700 text-xs"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
