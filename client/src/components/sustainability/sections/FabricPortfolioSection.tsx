import type { Fabric, MediaAsset, SustainabilityFabricPortfolio } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useMemo } from "react";

export function FabricPortfolioSection({ mediaAssets = [] }: { mediaAssets?: MediaAsset[] }) {
  const { data: fabricsData = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
  });

  const { data: fabricPortfolioData } = useQuery<any>({
    queryKey: ["/api/sustainability-fabric-portfolio"],
  });

  const sustainableFabrics = useMemo(() => {
    const activeFabrics = fabricsData.filter((fabric) => fabric.isActive);
    const selectedIds = fabricPortfolioData?.selectedFabricIds;

    if (selectedIds && selectedIds.length > 0) {
      return selectedIds
        .map((id: any) => activeFabrics.find((fabric: any) => fabric.id === id))
        .filter((fabric: any): fabric is Fabric => fabric !== undefined)
        .slice(0, 6);
    }

    return activeFabrics.slice(0, 6);
  }, [fabricsData, fabricPortfolioData?.selectedFabricIds]);

  if (sustainableFabrics.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-stone-600">Sustainable fabric portfolio coming soon...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {sustainableFabrics.map((fabric: any, index: number) => {
        const fabricImage = mediaAssets.find((asset) => asset.id === fabric.visualSwatchId);
        return (
          <motion.div
            key={fabric.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="transition-shadow-sm overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg duration-300 hover:shadow-xl"
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
              <h3 className="mb-3 text-xl font-semibold text-stone-900">{fabric.name}</h3>

              {fabric.description && (
                <p className="mb-4 leading-relaxed text-stone-600">{fabric.description}</p>
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
                    <p className="mb-2 text-xs text-stone-500">Applications:</p>
                    <div className="flex flex-wrap gap-1">
                      {fabric.keyApplications.slice(0, 3).map((app: any, appIndex: number) => (
                        <span
                          key={appIndex}
                          className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-700"
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
