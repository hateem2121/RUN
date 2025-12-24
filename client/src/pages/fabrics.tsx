import type { Certificate, Fabric, Fiber } from "@shared/schema";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Layers, Leaf, Loader2, Search, Shirt, Wind } from "lucide-react";
import { useState } from "react";
import { SEOMeta } from "@/components/seo-meta";
// CLEANED: Removed deprecated use-infinite-scroll - using traditional pagination
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard3D } from "@/components/ui/hover-card-3d";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// Helper to get the default composition from a fabric
const getDefaultComposition = (fabric: Fabric) => {
  const compositions = (fabric.properties as any)?.compositions;
  if (!compositions || compositions.length === 0) {
    return null;
  }
  // Find the default composition or use the first one
  const defaultComp = compositions.find((c: any) => c.isDefault);
  return defaultComp || compositions[0];
};

export default function Fabrics() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFabrics, setExpandedFabrics] = useState<Set<number>>(new Set());

  const {
    data: fabricsResponse,
    isLoading,
    isPlaceholderData,
  } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
    placeholderData: keepPreviousData,
  });

  const fabrics = Array.isArray(fabricsResponse) ? fabricsResponse : [];

  const { data: fibers = [] } = useQuery<Fiber[]>({
    queryKey: ["/api/fibers"],
  });

  const { data: certificates = [] } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  // Filter fabrics based on search
  const filteredFabrics = fabrics.filter(
    (fabric) =>
      fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fabric.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fabric.weave?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // CLEANED: Traditional pagination - simplified display
  const displayedFabrics = filteredFabrics;
  const loadMoreRef = { current: null };
  const isLoadingMore = false;
  const hasMore = false;

  // Group fabrics by weight category - use displayedFabrics instead of filteredFabrics
  const groupedFabrics = displayedFabrics.reduce(
    (acc, fabric) => {
      let category = "Other";
      const weight = parseInt(fabric.weight || "0", 10);

      if (weight < 150) category = "Lightweight (< 150 GSM)";
      else if (weight >= 150 && weight <= 300) category = "Medium Weight (150-300 GSM)";
      else if (weight > 300) category = "Heavyweight (> 300 GSM)";

      if (!acc[category]) acc[category] = [];
      acc[category]?.push(fabric);
      return acc;
    },
    {} as Record<string, Fabric[]>,
  );

  const toggleExpanded = (id: number) => {
    setExpandedFabrics((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes("Lightweight")) return Wind;
    if (category.includes("Medium")) return Layers;
    if (category.includes("Heavy")) return Shirt;
    return Layers;
  };

  const getFiberName = (fiberId: number) => {
    const fiber = fibers.find((f) => f.id === fiberId);
    return fiber?.name || "Unknown";
  };

  const getCertificateNames = (certIds: number[]) => {
    return certIds
      .map((id) => {
        const cert = certificates.find((c) => c.id === id);
        return cert?.name || "";
      })
      .filter(Boolean);
  };

  // Create texture pattern preview
  const getTexturePattern = (fabric: Fabric) => {
    const patterns: Record<string, string> = {
      Plain:
        "repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 2px)",
      Twill:
        "repeating-linear-gradient(45deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 4px)",
      Satin: "radial-gradient(ellipse at center, #f3f4f6 0%, #e5e7eb 100%)",
      Jersey:
        "repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 2px, transparent 2px, transparent 4px)",
      Mesh: "repeating-conic-gradient(from 45deg, #e5e7eb 0deg 90deg, transparent 90deg 180deg)",
    };

    return patterns[fabric.weave || ""] || patterns.Plain;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SEOMeta
        title="Fabrics - Premium Sportswear Materials | RUN APPAREL"
        description="Explore our extensive collection of high-performance fabrics for sportswear manufacturing."
      />

      {/* Hero Section */}
      <section className="px-4 pt-24 pb-12">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="mb-4 font-bold text-4xl text-gray-900 md:text-5xl">
              Premium Fabric Collection
            </h1>
            <p className="mx-auto max-w-3xl text-gray-600 text-lg">
              High-performance fabrics engineered for superior comfort, durability, and
              sustainability
            </p>

            <div className="mt-8 flex justify-center gap-6">
              <div className="text-center">
                <AnimatedCounter
                  value={fabrics.length}
                  className="font-bold text-3xl text-blue-600"
                  duration={1.5}
                />
                <div className="text-gray-600 text-sm">Total Fabrics</div>
              </div>
              <div className="text-center">
                <AnimatedCounter
                  value={
                    fabrics.filter((f) => f.sustainabilityScore && f.sustainabilityScore >= 4)
                      .length
                  }
                  className="font-bold text-3xl text-green-600"
                  duration={1.5}
                />
                <div className="text-gray-600 text-sm">Sustainable Options</div>
              </div>
            </div>
          </motion.div>

          {/* Search Bar */}
          <div className="mx-auto max-w-2xl">
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <Input
                placeholder="Search fabrics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-6 pl-10 text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Fabrics Grid */}
      <section className="px-4 pb-20">
        <div className="mx-auto max-w-7xl">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="h-64 animate-pulse">
                  <div className="h-32 bg-gray-200"></div>
                  <CardHeader>
                    <div className="h-6 w-3/4 rounded bg-gray-200"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 rounded bg-gray-200"></div>
                      <div className="h-4 w-5/6 rounded bg-gray-200"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {Object.entries(groupedFabrics).length > 0 ? (
                <div
                  className={cn(
                    "space-y-8 transition-opacity duration-200",
                    isPlaceholderData && "opacity-50",
                  )}
                >
                  {Object.entries(groupedFabrics)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([category, categoryFabrics]) => (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800 text-xl">
                          {(() => {
                            const Icon = getCategoryIcon(category);
                            return <Icon className="h-5 w-5" />;
                          })()}
                          {category}
                        </h2>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {categoryFabrics.map((fabric) => {
                            const isExpanded = expandedFabrics.has(fabric.id);
                            // SIMPLIFIED: composition is now a string

                            return (
                              <motion.div
                                key={fabric.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.2 }}
                              >
                                <HoverCard3D maxRotation={10}>
                                  <Card
                                    className="h-full cursor-pointer overflow-hidden transition-shadow-sm hover:shadow-lg"
                                    onClick={() => toggleExpanded(fabric.id)}
                                  >
                                    {/* Texture Preview */}
                                    <div
                                      className="relative h-32"
                                      style={{
                                        background: getTexturePattern(fabric),
                                        backgroundColor: "#f3f4f6",
                                      }}
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50"></div>
                                      <div className="absolute right-2 bottom-2">
                                        <Badge variant="secondary" className="text-xs">
                                          {fabric.weight} GSM
                                        </Badge>
                                      </div>
                                      {fabric.sustainabilityScore &&
                                        fabric.sustainabilityScore >= 4 && (
                                          <div className="absolute top-2 left-2">
                                            <Badge
                                              variant="default"
                                              className="bg-green-600 text-xs"
                                            >
                                              <Leaf className="mr-1 h-3 w-3" />
                                              Eco
                                            </Badge>
                                          </div>
                                        )}
                                    </div>

                                    <CardHeader className="pb-3">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <CardTitle className="line-clamp-1 font-semibold text-base">
                                            {fabric.name}
                                          </CardTitle>
                                          {fabric.weave && (
                                            <p className="mt-1 text-gray-600 text-sm">
                                              {fabric.weave} Weave
                                            </p>
                                          )}
                                        </div>
                                        <Button variant="ghost" size="sm" className="ml-2">
                                          {isExpanded ? (
                                            <ChevronUp className="h-4 w-4" />
                                          ) : (
                                            <ChevronDown className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    </CardHeader>
                                    <CardContent>
                                      {/* Default Composition Preview */}
                                      {(() => {
                                        const defaultComp = getDefaultComposition(fabric);
                                        return defaultComp?.fibers &&
                                          defaultComp.fibers.length > 0 ? (
                                          <div className="mb-3 space-y-2">
                                            {defaultComp.fibers
                                              .slice(0, 2)
                                              .map((fiber: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                  <span className="text-gray-600 text-xs">
                                                    {getFiberName(fiber.fiberId)}
                                                  </span>
                                                  <Progress
                                                    value={fiber.percentage || 0}
                                                    className="h-2 flex-1"
                                                  />
                                                  <span className="font-medium text-xs">
                                                    {fiber.percentage}%
                                                  </span>
                                                </div>
                                              ))}
                                            {defaultComp.fibers.length > 2 && !isExpanded && (
                                              <p className="text-gray-500 text-xs">
                                                +{defaultComp.fibers.length - 2} more fibers
                                              </p>
                                            )}
                                          </div>
                                        ) : null;
                                      })()}

                                      <AnimatePresence>
                                        {isExpanded && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{
                                              height: "auto",
                                              opacity: 1,
                                            }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                          >
                                            <div className="space-y-3 border-t pt-3">
                                              {fabric.description && (
                                                <p className="text-gray-700 text-sm">
                                                  {fabric.description}
                                                </p>
                                              )}

                                              {/* All Fiber Compositions */}
                                              {(() => {
                                                const compositions = (fabric.properties as any)
                                                  ?.compositions;
                                                return compositions && compositions.length > 0 ? (
                                                  <div className="space-y-2">
                                                    <p className="font-semibold text-gray-700 text-xs">
                                                      Fiber Compositions:
                                                    </p>
                                                    {compositions.map((comp: any, idx: number) => (
                                                      <div
                                                        key={idx}
                                                        className="rounded bg-gray-50 p-2"
                                                      >
                                                        <p className="mb-1 font-medium text-gray-700 text-xs">
                                                          {comp.name}{" "}
                                                          {comp.isDefault && (
                                                            <Badge
                                                              variant="outline"
                                                              className="ml-1 text-xs"
                                                            >
                                                              Default
                                                            </Badge>
                                                          )}
                                                        </p>
                                                        {comp.fibers?.map(
                                                          (fiber: any, fidx: number) => (
                                                            <div
                                                              key={fidx}
                                                              className="flex items-center gap-2 text-xs"
                                                            >
                                                              <span className="text-gray-600">
                                                                {getFiberName(fiber.fiberId)}
                                                              </span>
                                                              <Progress
                                                                value={fiber.percentage || 0}
                                                                className="h-1 flex-1"
                                                              />
                                                              <span className="font-medium">
                                                                {fiber.percentage}%
                                                              </span>
                                                            </div>
                                                          ),
                                                        )}
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : null;
                                              })()}

                                              {/* Properties */}
                                              <div className="grid grid-cols-2 gap-2 text-xs">
                                                {fabric.stretch && (
                                                  <div>
                                                    <span className="text-gray-600">Stretch:</span>
                                                    <span className="ml-1 font-medium">
                                                      {fabric.stretch}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Certifications */}
                                              {fabric.certifications &&
                                                fabric.certifications.length > 0 && (
                                                  <div className="flex flex-wrap gap-1">
                                                    {getCertificateNames(
                                                      fabric.certifications.map(Number),
                                                    ).map((cert, idx) => (
                                                      <Badge
                                                        key={idx}
                                                        variant="outline"
                                                        className="text-xs"
                                                      >
                                                        {cert}
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                )}
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </CardContent>
                                  </Card>
                                </HoverCard3D>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-16 text-center"
                >
                  <Layers className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                  <h3 className="mb-2 font-semibold text-gray-900 text-xl">No fabrics found</h3>
                  <p className="text-gray-600">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "No fabrics have been added yet"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Infinite Scroll Trigger */}
          {hasMore && (
            <div ref={loadMoreRef} className="flex justify-center py-8">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more fabrics...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
