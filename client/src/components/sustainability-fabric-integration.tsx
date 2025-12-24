import type { Fabric } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Award, BarChart3, Leaf, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SustainabilityScore {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

function getSustainabilityLevel(score: number): SustainabilityScore {
  if (score >= 4)
    return {
      score,
      label: "Excellent",
      color: "text-green-700",
      bgColor: "bg-green-100",
    };
  if (score >= 3)
    return {
      score,
      label: "Good",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
    };
  if (score >= 2)
    return {
      score,
      label: "Fair",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
    };
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

  // Helper function to extract numeric score from various formats
  const parseScore = (scoreString: string): number => {
    if (!scoreString) return 0;

    // Handle star format: "⭐⭐⭐ (3/5 stars)"
    const starMatch = scoreString.match(/\((\d+)\/\d+\s*stars?\)/i);
    if (starMatch && starMatch[1]) {
      return parseInt(starMatch[1]);
    }

    // Handle numeric format: "3", "4"
    const numericScore = parseInt(scoreString);
    return isNaN(numericScore) ? 0 : numericScore;
  };

  // Calculate sustainability statistics
  const totalFabrics = fabrics.length;
  const fabricsWithValidScores = fabrics.filter(
    (f) =>
      f.sustainabilityScore && parseScore(String(f.sustainabilityScore)) > 0,
  );
  const sustainableFabrics = fabrics.filter(
    (f) =>
      f.sustainabilityScore && parseScore(String(f.sustainabilityScore)) >= 4,
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
    .filter(
      (f) =>
        f.sustainabilityScore && parseScore(String(f.sustainabilityScore)) >= 4,
    )
    .sort(
      (a, b) =>
        parseScore(String(b.sustainabilityScore || "")) -
        parseScore(String(a.sustainabilityScore || "")),
    )
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-green-200 bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Leaf className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {totalFabrics}
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Total Fabrics</h3>
              <p className="text-sm text-gray-600 mt-1">In our portfolio</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-green-200 bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {sustainableFabrics.length}
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Eco-Certified</h3>
              <p className="text-sm text-gray-600 mt-1">
                4+ sustainability score
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-green-200 bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {avgScore.toFixed(1)}/5
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Average Score</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sustainability rating
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-green-200 bg-gradient-to-br from-white to-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  {totalFabrics > 0
                    ? Math.round(
                        (sustainableFabrics.length / totalFabrics) * 100,
                      )
                    : 0}
                  %
                </span>
              </div>
              <h3 className="font-medium text-gray-900">Sustainable</h3>
              <p className="text-sm text-gray-600 mt-1">Of total fabrics</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Sustainable Fabrics */}
      {topSustainableFabrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Sustainable Fabrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topSustainableFabrics.map((fabric, index) => {
                const level = getSustainabilityLevel(
                  parseScore(String(fabric.sustainabilityScore || "")),
                );

                return (
                  <motion.div
                    key={fabric.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-700 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {fabric.name}
                        </h4>
                        <p className="text-sm text-gray-600">
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
                              className={`w-4 h-4 ${
                                i <
                                parseScore(
                                  String(fabric.sustainabilityScore || ""),
                                )
                                  ? "text-green-600 fill-green-600"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs ${level.color}`}>
                          {level.label}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-center">
              <Button variant="outline" asChild>
                <Link href="/admin/fabrics">
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
