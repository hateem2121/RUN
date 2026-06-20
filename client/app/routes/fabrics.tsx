import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

import { useGSAP } from "@gsap/react";
import type { Certificate, CompositionSet, Fabric, Fiber, MediaAsset } from "@shared/index";
import { dehydrate, HydrationBoundary, keepPreviousData, useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { ChevronDown, ChevronUp, Layers, Leaf, Loader2, Search, Shirt, Wind } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router";
// CLEANED: Removed deprecated use-infinite-scroll - using traditional pagination
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard3D } from "@/components/ui/hover-card-3d";
import { Input } from "@/components/ui/input";
import { LazyUnifiedModelViewer } from "@/components/ui/LazyUnifiedModelViewer";
import { ModelViewerErrorBoundary } from "@/components/ui/ModelViewerErrorBoundary";
import { Progress } from "@/components/ui/progress";
import { Typography } from "@/components/ui/typography";
import { MediaUrlBuilder } from "@/lib/media-url-builder";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Route } from "./+types/fabrics";

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["/api/resources/batch?types=fabric,fiber,certificate"],
    queryFn: () => apiRequest("/api/resources/batch?types=fabric,fiber,certificate"),
  });
  return { dehydratedState: dehydrate(queryClient) };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Fabrics - Premium Sportswear Materials | RUN APPAREL" },
    {
      name: "description",
      content:
        "Explore our extensive collection of high-performance fabrics for sportswear manufacturing.",
    },
  ];
}

// Helper to get the default composition from a fabric
const getDefaultComposition = (fabric: Fabric): CompositionSet | null => {
  const compositions = fabric.properties?.compositions;
  if (!compositions || compositions.length === 0) {
    return null;
  }
  // Find the default composition or use the first one
  const defaultComp = compositions.find((c) => c.isDefault);
  return defaultComp || compositions[0] || null;
};

// Expand panel component with GSAP height animation
function ExpandPanel({
  isExpanded,
  children,
}: {
  isExpanded: boolean;
  children: React.ReactNode;
}): React.ReactElement | null {
  const [shouldRender, setShouldRender] = useState(isExpanded);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!panelRef.current || !shouldRender) return;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isExpanded) {
      if (isReduced) {
        gsap.set(panelRef.current, { height: "auto", opacity: 1 });
      } else {
        gsap.fromTo(
          panelRef.current,
          { height: 0, opacity: 0 },
          { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" },
        );
      }
    } else {
      if (isReduced) {
        gsap.set(panelRef.current, { height: 0, opacity: 0 });
        setShouldRender(false);
      } else {
        gsap.to(panelRef.current, {
          height: 0,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => setShouldRender(false),
        });
      }
    }
  }, [isExpanded, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div ref={panelRef} className="overflow-hidden">
      {children}
    </div>
  );
}

export default function Component() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFabrics, setExpandedFabrics] = useState<Set<number>>(new Set());
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    data: batchData,
    isLoading,
    isPlaceholderData,
  } = useQuery<{ fabrics?: Fabric[]; fibers?: Fiber[]; certificates?: Certificate[] }>({
    queryKey: ["/api/resources/batch?types=fabric,fiber,certificate"],
    queryFn: () => apiRequest("/api/resources/batch?types=fabric,fiber,certificate"),
    placeholderData: keepPreviousData,
  });

  const fabrics = batchData?.fabrics || [];
  const fibers = batchData?.fibers || [];
  const certificates = batchData?.certificates || [];

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setPrefersReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Hero entrance animation
  useGSAP(() => {
    if (!heroRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(heroRef.current, { opacity: 1, y: 0 });
      return;
    }
    gsap.from(heroRef.current, { opacity: 0, y: 20, duration: 0.5, ease: "power2.out" });
  }, []);

  // Animate content when it loads
  useGSAP(() => {
    if (!contentRef.current || isLoading) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(contentRef.current.querySelectorAll(".fabric-category-group"), { opacity: 1, y: 0 });
      return;
    }
    gsap.from(contentRef.current.querySelectorAll(".fabric-category-group"), {
      opacity: 0,
      y: 20,
      duration: 0.4,
      stagger: 0.08,
      ease: "power2.out",
    });
  }, [isLoading]);

  // Filter fabrics based on search
  const filteredFabrics = fabrics.filter(
    (fabric) =>
      fabric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fabric.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fabric.weave?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // CLEANED: Traditional pagination - simplified display
  const displayedFabrics = filteredFabrics;
  // const loadMoreRef = { current: null };
  const isLoadingMore = false;
  const hasMore = false;

  // Group fabrics by weight category - use displayedFabrics instead of filteredFabrics
  const groupedFabrics = displayedFabrics.reduce(
    (acc, fabric) => {
      let category = "Other";
      const weight = parseInt(fabric.weight || "0", 10);

      if (weight < 150) {
        category = "Lightweight (< 150 GSM)";
      } else if (weight >= 150 && weight <= 300) {
        category = "Medium Weight (150-300 GSM)";
      } else if (weight > 300) {
        category = "Heavyweight (> 300 GSM)";
      }

      if (!acc[category]) {
        acc[category] = [];
      }
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
    if (category.includes("Lightweight")) {
      return Wind;
    }
    if (category.includes("Medium")) {
      return Layers;
    }
    if (category.includes("Heavy")) {
      return Shirt;
    }
    return Layers;
  };

  const getFiberName = (fiberId: number | null) => {
    if (fiberId === null) return "Unknown";
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
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <div className="min-h-screen bg-linear-to-b from-muted/30 to-background">
        {/* Hero Section */}
        <section className="px-4 pt-24 pb-12">
          <div className="mx-auto max-w-7xl">
            <div ref={heroRef} className="mb-8 text-center">
              <Typography.H1 className="mb-4 font-bold text-4xl text-foreground md:text-5xl">
                Premium Fabric Collection
              </Typography.H1>
              <Typography.P className="mx-auto max-w-3xl text-lg text-muted-foreground">
                High-performance fabrics engineered for superior comfort, durability, and
                sustainability
              </Typography.P>

              <div className="mt-8 flex justify-center gap-6">
                <div className="text-center">
                  <AnimatedCounter
                    value={fabrics.length}
                    className="font-bold text-3xl text-blue-600"
                    duration={1.5}
                  />
                  <div className="text-muted-foreground text-sm">Total Fabrics</div>
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
                  <div className="text-muted-foreground text-sm">Sustainable Options</div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
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
                    <div className="h-32 bg-muted"></div>
                    <CardHeader>
                      <div className="h-6 w-3/4 rounded bg-muted"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 rounded bg-muted"></div>
                        <div className="h-4 w-5/6 rounded bg-muted"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : Object.entries(groupedFabrics).length > 0 ? (
              <div
                ref={contentRef}
                className={cn(
                  "space-y-8 transition-opacity duration-200",
                  isPlaceholderData && "opacity-50",
                )}
              >
                {Object.entries(groupedFabrics)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([category, categoryFabrics]) => (
                    <div key={category} className="fabric-category-group">
                      <Typography.H2 className="mb-4 flex items-center gap-2 font-semibold text-foreground/90 text-xl">
                        {(() => {
                          const Icon = getCategoryIcon(category);
                          return <Icon className="h-5 w-5" />;
                        })()}
                        {category}
                      </Typography.H2>
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {categoryFabrics.map((fabric) => {
                          const isExpanded = expandedFabrics.has(fabric.id);
                          // SIMPLIFIED: composition is now a string

                          return (
                            <div
                              key={fabric.id}
                              className="transition-transform duration-200 hover:-translate-y-1"
                            >
                              <HoverCard3D maxRotation={10}>
                                <Card
                                  data-testid="fabric-card"
                                  className="h-full cursor-pointer overflow-hidden transition-shadow-sm hover:shadow-lg"
                                  onClick={() => toggleExpanded(fabric.id)}
                                >
                                  {/* Texture Preview / 3D Viewer */}
                                  <div className="relative h-48 overflow-hidden bg-muted/20">
                                    {fabric.visualSwatchId && !prefersReducedMotion ? (
                                      <ModelViewerErrorBoundary>
                                        <LazyUnifiedModelViewer
                                          asset={
                                            {
                                              id: fabric.visualSwatchId,
                                              originalName: `${fabric.name}.glb`,
                                              mimeType: "model/gltf-binary",
                                              url: MediaUrlBuilder.buildModelUrlSafe(
                                                fabric.visualSwatchId,
                                              ),
                                              type: "model",
                                              isActive: true,
                                              createdAt: new Date(),
                                              updatedAt: new Date(),
                                              storagePath: "",
                                              bucketName: "",
                                              filename: `${fabric.name.toLowerCase().replace(/\s+/g, "-")}.glb`,
                                              metadata: {},
                                            } as MediaAsset
                                          }
                                          className="h-full w-full"
                                        />
                                      </ModelViewerErrorBoundary>
                                    ) : (
                                      <div
                                        className="h-full w-full"
                                        style={{
                                          background: getTexturePattern(fabric),
                                          backgroundColor: "#f3f4f6",
                                        }}
                                      >
                                        <div className="absolute inset-0 bg-linear-to-b from-transparent to-white/50"></div>
                                      </div>
                                    )}
                                    <div className="absolute right-2 bottom-2 z-10">
                                      <Badge variant="secondary" className="text-xs">
                                        {fabric.weight} GSM
                                      </Badge>
                                    </div>
                                    {fabric.sustainabilityScore &&
                                      fabric.sustainabilityScore >= 4 && (
                                        <div className="absolute top-2 left-2 z-10">
                                          <Badge variant="default" className="bg-green-600 text-xs">
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
                                          <Typography.P className="mt-1 text-muted-foreground text-sm">
                                            {fabric.weave} Weave
                                          </Typography.P>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-2"
                                        aria-label={isExpanded ? "Collapse" : "Expand"}
                                        aria-expanded={isExpanded}
                                      >
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
                                          {defaultComp.fibers.slice(0, 2).map((fiber, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                              <span className="text-muted-foreground text-xs">
                                                {getFiberName(fiber.fiberId)}
                                              </span>
                                              <Progress
                                                value={Number(fiber.percentage) || 0}
                                                className="h-2 flex-1"
                                              />
                                              <span className="font-medium text-xs">
                                                {fiber.percentage}%
                                              </span>
                                            </div>
                                          ))}
                                          {defaultComp.fibers.length > 2 && !isExpanded && (
                                            <Typography.P className="text-muted-foreground/70 text-xs">
                                              +{defaultComp.fibers.length - 2} more fibers
                                            </Typography.P>
                                          )}
                                        </div>
                                      ) : null;
                                    })()}

                                    <ExpandPanel isExpanded={isExpanded}>
                                      <div className="space-y-3 border-t pt-3">
                                        {fabric.description && (
                                          <Typography.P className="text-foreground/80 text-sm">
                                            {fabric.description}
                                          </Typography.P>
                                        )}

                                        {/* All Fiber Compositions */}
                                        {(() => {
                                          const compositions = fabric.properties?.compositions;
                                          return compositions && compositions.length > 0 ? (
                                            <div className="space-y-2">
                                              <Typography.P className="font-semibold text-foreground/80 text-xs">
                                                Fiber Compositions:
                                              </Typography.P>
                                              {compositions.map((comp, idx) => (
                                                <div key={idx} className="rounded bg-muted/50 p-2">
                                                  <Typography.P className="mb-1 font-medium text-foreground/80 text-xs">
                                                    {comp.name}{" "}
                                                    {comp.isDefault && (
                                                      <Badge
                                                        variant="outline"
                                                        className="ml-1 text-xs"
                                                      >
                                                        Default
                                                      </Badge>
                                                    )}
                                                  </Typography.P>
                                                  {comp.fibers?.map((fiber, fidx) => (
                                                    <div
                                                      key={fidx}
                                                      className="flex items-center gap-2 text-xs"
                                                    >
                                                      <span className="text-muted-foreground">
                                                        {getFiberName(fiber.fiberId)}
                                                      </span>
                                                      <Progress
                                                        value={Number(fiber.percentage) || 0}
                                                        className="h-1 flex-1"
                                                      />
                                                      <span className="font-medium">
                                                        {fiber.percentage}%
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ))}
                                            </div>
                                          ) : null;
                                        })()}

                                        {/* Properties */}
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          {fabric.stretch && (
                                            <div>
                                              <span className="text-muted-foreground">
                                                Stretch:
                                              </span>
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
                                    </ExpandPanel>
                                  </CardContent>
                                </Card>
                              </HoverCard3D>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Layers className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                <Typography.H3 className="mb-2 font-semibold text-foreground text-xl">
                  No fabrics found
                </Typography.H3>
                <Typography.P className="text-muted-foreground">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "No fabrics have been added yet"}
                </Typography.P>
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div className="flex justify-center py-8">
                {isLoadingMore && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading more fabrics...</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </HydrationBoundary>
  );
}
