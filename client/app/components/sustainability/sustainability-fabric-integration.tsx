import { useGSAP } from "@gsap/react";
import type { Fabric } from "@shared/index";
import { useQuery } from "@tanstack/react-query";
import gsap from "gsap";
import { ArrowRight, Award, BarChart3, Leaf, TrendingUp } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SustainabilityScore {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

function getSustainabilityLevel(score: number): SustainabilityScore {
  if (score >= 4) {
    return {
      score,
      label: "Excellent",
      color: "text-green-700",
      bgColor: "bg-green-100",
    };
  }
  if (score >= 3) {
    return {
      score,
      label: "Good",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
    };
  }
  if (score >= 2) {
    return {
      score,
      label: "Fair",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
    };
  }
  return {
    score,
    label: "Needs Improvement",
    color: "text-red-700",
    bgColor: "bg-red-100",
  };
}

export function SustainabilityFabricIntegration() {
  const { data: fabrics = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
  });
  const statsGridRef = useRef<HTMLDivElement>(null);
  const fabricListRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (statsGridRef.current) {
        gsap.from(statsGridRef.current.children, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.1,
        });
      }
    },
    { scope: statsGridRef },
  );

  useGSAP(
    () => {
      if (fabricListRef.current) {
        gsap.from(fabricListRef.current.children, {
          opacity: 0,
          x: -20,
          duration: 0.4,
          stagger: 0.1,
        });
      }
    },
    { scope: fabricListRef },
  );

  // Helper function to extract numeric score from various formats
  const parseScore = (scoreString: string): number => {
    if (!scoreString) {
      return 0;
    }

    // Handle star format: "⭐⭐⭐ (3/5 stars)"
    const starMatch = scoreString.match(/\((\d+)\/\d+\s*stars?\)/i);
    if (starMatch?.[1]) {
      return parseInt(starMatch[1], 10);
    }

    // Handle numeric format: "3", "4"
    const numericScore = parseInt(scoreString, 10);
    return Number.isNaN(numericScore) ? 0 : numericScore;
  };

  // Calculate sustainability statistics
  const totalFabrics = fabrics.length;
  const fabricsWithValidScores = fabrics.filter(
    (f) => f.sustainabilityScore && parseScore(String(f.sustainabilityScore)) > 0,
  );
  const sustainableFabrics = fabrics.filter(
    (f) => f.sustainabilityScore && parseScore(String(f.sustainabilityScore)) >= 4,
  );
  const avgScore =
    fabricsWithValidScores.length > 0
      ? fabricsWithValidScores.reduce(
          (acc, f) => acc + parseScore(String(f.sustainabilityScore)),
          0,
        ) / fabricsWithValidScores.length
      : 0;

  // Find top sustainable fabrics
  const topSustainableFabrics = fabrics
    .filter((f) => f.sustainabilityScore && parseScore(String(f.sustainabilityScore)) >= 4)
    .sort(
      (a, b) =>
        parseScore(String(b.sustainabilityScore || "")) -
        parseScore(String(a.sustainabilityScore || "")),
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div ref={statsGridRef} className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div>
          <Card className="border-green-200 bg-linear-to-br from-white to-green-50">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <Leaf className="h-8 w-8 text-green-600" />
                <span className="font-bold text-2xl text-green-600">{totalFabrics}</span>
              </div>
              <h3 className="font-medium text-foreground">Total Fabrics</h3>
              <p className="mt-1 text-muted-foreground text-sm">In our portfolio</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-green-200 bg-linear-to-br from-white to-green-50">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <Award className="h-8 w-8 text-green-600" />
                <span className="font-bold text-2xl text-green-600">
                  {sustainableFabrics.length}
                </span>
              </div>
              <h3 className="font-medium text-foreground">Eco-Certified</h3>
              <p className="mt-1 text-muted-foreground text-sm">4+ sustainability score</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-green-200 bg-linear-to-br from-white to-green-50">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <span className="font-bold text-2xl text-green-600">{avgScore.toFixed(1)}/5</span>
              </div>
              <h3 className="font-medium text-foreground">Average Score</h3>
              <p className="mt-1 text-muted-foreground text-sm">Sustainability rating</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-green-200 bg-linear-to-br from-white to-green-50">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center justify-between">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <span className="font-bold text-2xl text-green-600">
                  {totalFabrics > 0
                    ? Math.round((sustainableFabrics.length / totalFabrics) * 100)
                    : 0}
                  %
                </span>
              </div>
              <h3 className="font-medium text-foreground">Sustainable</h3>
              <p className="mt-1 text-muted-foreground text-sm">Of total fabrics</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Sustainable Fabrics */}
      {topSustainableFabrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Sustainable Fabrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={fabricListRef} className="space-y-3">
              {topSustainableFabrics.map((fabric, index) => {
                const level = getSustainabilityLevel(
                  parseScore(String(fabric.sustainabilityScore || "")),
                );

                return (
                  <div
                    key={fabric.id}
                    className="flex items-center justify-between rounded-lg border border-green-200 p-3 transition-colors hover:bg-green-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{fabric.name}</h4>
                        <p className="text-muted-foreground text-sm">
                          {fabric.weight} GSM • {fabric.weaveTypes}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Leaf
                              key={i}
                              className={`h-4 w-4 ${
                                i < parseScore(String(fabric.sustainabilityScore || ""))
                                  ? "fill-green-600 text-green-600"
                                  : "text-muted-foreground/50"
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs ${level.color}`}>{level.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-center">
              <Button variant="outline" asChild>
                <Link to="/admin/fabrics">
                  View All Fabrics
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
