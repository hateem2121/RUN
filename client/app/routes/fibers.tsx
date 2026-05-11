import { RouteErrorBoundary } from "@/components/shared/RouteErrorBoundary";
import { RouteHydrateFallback } from "@/components/shared/RouteHydrateFallback";

export { RouteErrorBoundary as ErrorBoundary, RouteHydrateFallback as HydrateFallback };

import { useGSAP } from "@gsap/react";
import type { Fiber } from "@shared/index";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { Beaker, ChevronDown, ChevronUp, Leaf, Search, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLoaderData } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { getPropertiesArray } from "@/lib/fiber-utils";
import { apiRequest, getQueryClient } from "@/lib/queryClient";
import type { Route } from "./+types/fibers";

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["/api/fibers"],
    queryFn: () => apiRequest("/api/fibers"),
  });
  return { dehydratedState: dehydrate(queryClient) };
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Fibers - Raw Materials & Properties | RUN APPAREL" },
    {
      name: "description",
      content:
        "Discover our comprehensive range of natural and synthetic fibers used in sportswear manufacturing.",
    },
  ];
}

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
    if (isExpanded) {
      gsap.fromTo(
        panelRef.current,
        { height: 0, opacity: 0 },
        { height: "auto", opacity: 1, duration: 0.3, ease: "power2.out" },
      );
    } else {
      gsap.to(panelRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => setShouldRender(false),
      });
    }
  }, [isExpanded, shouldRender]);

  if (!shouldRender) return null;

  return (
    <div ref={panelRef} className="overflow-hidden">
      {children}
    </div>
  );
}

export default function Fibers() {
  const loaderData = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFibers, setExpandedFibers] = useState<Set<number>>(new Set());
  const heroRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: fibersResponse, isLoading } = useQuery<Fiber[]>({
    queryKey: ["/api/fibers"],
    queryFn: () => apiRequest("/api/fibers"),
  });

  const fibers = Array.isArray(fibersResponse) ? fibersResponse : [];

  // Hero entrance animation
  useGSAP(() => {
    if (!heroRef.current) return;
    gsap.from(heroRef.current, { opacity: 0, y: 20, duration: 0.5, ease: "power2.out" });
  }, []);

  // Animate content when it loads
  useGSAP(() => {
    if (!contentRef.current || isLoading) return;
    gsap.from(contentRef.current.querySelectorAll(".fiber-category-group"), {
      opacity: 0,
      y: 20,
      duration: 0.4,
      stagger: 0.08,
      ease: "power2.out",
    });
  }, [isLoading]);

  // Filter fibers based on search
  const filteredFibers = useMemo(() => {
    if (!searchTerm) {
      return fibers;
    }

    const term = searchTerm.toLowerCase();
    return fibers.filter((fiber) => {
      const propertiesArray = getPropertiesArray(fiber.properties);
      const searchableContent = [fiber.name, fiber.type, fiber.description, ...propertiesArray]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableContent.includes(term);
    });
  }, [fibers, searchTerm]);

  // Group fibers by type
  const groupedFibers = filteredFibers.reduce(
    (acc, fiber) => {
      const type = fiber.type || "Other";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(fiber);
      return acc;
    },
    {} as Record<string, Fiber[]>,
  );

  const toggleExpanded = (id: number) => {
    setExpandedFibers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "natural":
        return Leaf;
      case "synthetic":
        return Beaker;
      default:
        return Sparkles;
    }
  };

  const getSustainabilityBadge = (score: number | null | undefined) => {
    if (!score) {
      return null;
    }

    if (score >= 4) {
      return (
        <Badge className="bg-green-600 text-white">
          <Leaf className="mr-1 h-3 w-3" />
          Eco-Friendly
        </Badge>
      );
    } else if (score >= 3) {
      return <Badge className="bg-yellow-600 text-white">Moderate Impact</Badge>;
    } else {
      return <Badge className="bg-orange-600 text-white">High Impact</Badge>;
    }
  };

  return (
    <HydrationBoundary state={loaderData?.dehydratedState}>
      <div className="min-h-screen bg-linear-to-b from-muted/30 to-background">
        {/* Hero Section */}
        <section className="px-4 pt-24 pb-12">
          <div className="mx-auto max-w-7xl">
            <div ref={heroRef} className="mb-8 text-center">
              <Typography.H1 className="mb-4 font-bold text-4xl text-foreground md:text-5xl">
                Fiber Materials Library
              </Typography.H1>
              <Typography.P className="mx-auto max-w-3xl text-lg text-muted-foreground">
                Understanding the building blocks of high-performance sportswear fabrics
              </Typography.P>

              <div className="mt-8 flex justify-center gap-6">
                <div className="text-center">
                  <div className="font-bold text-3xl text-purple-600">{fibers.length}</div>
                  <div className="text-muted-foreground text-sm">Total Fibers</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-3xl text-green-600">
                    {
                      fibers.filter((f) => f.sustainabilityScore && f.sustainabilityScore >= 4)
                        .length
                    }
                  </div>
                  <div className="text-muted-foreground text-sm">Eco-Friendly</div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search fibers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="py-6 pl-10 text-base"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Fibers Grid */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-7xl">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="h-64 animate-pulse">
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
            ) : Object.entries(groupedFibers).length > 0 ? (
              <div ref={contentRef} className="space-y-8">
                {Object.entries(groupedFibers).map(([type, typeFibers]) => (
                  <div key={type} className="fiber-category-group">
                    <Typography.H2 className="mb-4 flex items-center gap-2 font-semibold text-foreground/90 text-xl">
                      {(() => {
                        const Icon = getTypeIcon(type);
                        return <Icon className="h-5 w-5" />;
                      })()}
                      {type} Fibers
                    </Typography.H2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {typeFibers.map((fiber) => {
                        const isExpanded = expandedFibers.has(fiber.id);

                        return (
                          <div
                            key={fiber.id}
                            className="transition-transform duration-200 hover:-translate-y-1"
                          >
                            <Card
                              data-testid="fiber-card"
                              className="h-full cursor-pointer transition-shadow-sm hover:shadow-lg"
                              onClick={() => toggleExpanded(fiber.id)}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="font-semibold text-base">
                                      {fiber.name}
                                    </CardTitle>
                                    <div className="mt-2 flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {fiber.type}
                                      </Badge>
                                      {fiber.sustainabilityScore && (
                                        <div className="flex items-center">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`h-3 w-3 ${i < (fiber.sustainabilityScore || 0) ? "fill-current text-green-500" : "text-muted-foreground/50"}`}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
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
                                {fiber.properties &&
                                  getPropertiesArray(fiber.properties).length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-1">
                                      {getPropertiesArray(fiber.properties)
                                        .slice(0, 3)
                                        .map((prop, idx) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {prop}
                                          </Badge>
                                        ))}
                                      {getPropertiesArray(fiber.properties).length > 3 &&
                                        !isExpanded && (
                                          <Badge variant="outline" className="text-xs">
                                            +{getPropertiesArray(fiber.properties).length - 3} more
                                          </Badge>
                                        )}
                                    </div>
                                  )}

                                <ExpandPanel isExpanded={isExpanded}>
                                  <div className="space-y-3 border-t pt-3">
                                    {fiber.description && (
                                      <Typography.P className="text-foreground/80 text-sm">
                                        {fiber.description}
                                      </Typography.P>
                                    )}

                                    {fiber.properties &&
                                      getPropertiesArray(fiber.properties).length > 3 && (
                                        <div className="space-y-1">
                                          <Typography.P className="font-semibold text-foreground/80 text-xs">
                                            All Properties:
                                          </Typography.P>
                                          <div className="flex flex-wrap gap-1">
                                            {getPropertiesArray(fiber.properties).map(
                                              (prop, idx) => (
                                                <Badge
                                                  key={idx}
                                                  variant="secondary"
                                                  className="text-xs"
                                                >
                                                  {prop}
                                                </Badge>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {fiber.sustainabilityScore && (
                                      <div className="space-y-2">
                                        <Typography.P className="font-semibold text-foreground/80 text-xs">
                                          Sustainability Assessment:
                                        </Typography.P>
                                        {getSustainabilityBadge(fiber.sustainabilityScore)}
                                        {fiber.environmentalImpact && (
                                          <Typography.P className="mt-1 text-muted-foreground text-xs">
                                            {fiber.environmentalImpact}
                                          </Typography.P>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </ExpandPanel>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Sparkles className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                <Typography.H3 className="mb-2 font-semibold text-foreground text-xl">
                  No fibers found
                </Typography.H3>
                <Typography.P className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "No fibers have been added yet"}
                </Typography.P>
              </div>
            )}
          </div>
        </section>
      </div>
    </HydrationBoundary>
  );
}
