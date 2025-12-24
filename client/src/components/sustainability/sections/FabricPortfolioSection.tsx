import type { Fabric, MediaAsset, SustainabilityFabricPortfolio } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo } from "react";

export function FabricPortfolioSection({
  mediaAssets = [],
}: {
  mediaAssets?: MediaAsset[];
}) {
  const { data: fabricsData = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
  });

  const { data: fabricPortfolioData } = useQuery<SustainabilityFabricPortfolio>(
    {
      queryKey: ["/api/sustainability-fabric-portfolio"],
    },
  );

  const sustainableFabrics = useMemo(() => {
    const activeFabrics = fabricsData.filter((fabric) => fabric.isActive);
    const selectedIds = fabricPortfolioData?.selectedFabricIds;

    if (selectedIds && selectedIds.length > 0) {
      return selectedIds
        .map((id) => activeFabrics.find((fabric) => fabric.id === id))
        .filter((fabric): fabric is Fabric => fabric !== undefined)
        .slice(0, 6);
    }

    return activeFabrics.slice(0, 6);
  }, [fabricsData, fabricPortfolioData?.selectedFabricIds]);

  if (sustainableFabrics.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-stone-600">
          Sustainable fabric portfolio coming soon...
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {sustainableFabrics.map((fabric, index) => {
        const fabricImage = mediaAssets.find(
          (asset) => asset.id === fabric.visualSwatchId,
        );
        return (
          <motion.div
            key={fabric.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white rounded-xl overflow-hidden shadow-lg border border-stone-200 hover:shadow-xl transition-shadow-sm duration-300"
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
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h3 className="text-xl font-semibold text-stone-900 mb-3">
                {fabric.name}
              </h3>

              {fabric.description && (
                <p className="text-stone-600 leading-relaxed mb-4">
                  {fabric.description}
                </p>
              )}

              <div className="space-y-2">
                {fabric.fabricType && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Type:</span>
                    <span className="text-stone-700 font-medium">
                      {fabric.fabricType}
                    </span>
                  </div>
                )}

                {fabric.weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-500">Weight:</span>
                    <span className="text-stone-700 font-medium">
                      {fabric.weight}
                    </span>
                  </div>
                )}

                {fabric.keyApplications &&
                  fabric.keyApplications.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-stone-500 mb-2">
                        Applications:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {fabric.keyApplications
                          .slice(0, 3)
                          .map((app, appIndex) => (
                            <span
                              key={appIndex}
                              className="px-2 py-1 text-xs bg-stone-100 text-stone-700 rounded-full"
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
