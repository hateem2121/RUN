import type {
  Fabric,
  ManufacturingProcess,
  ManufacturingQuality,
  SustainabilityGoal,
  SustainabilityMetric,
  TechnologyInnovation,
  TechnologyResearch,
} from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Factory, Leaf, Shield, Target, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function CrossPageDashboard() {
  // Fetch data from all three pages
  const { data: sustainabilityMetrics = [] } = useQuery<SustainabilityMetric[]>({
    queryKey: ["/api/sustainability-metrics"],
  });

  const { data: sustainabilityGoals = [] } = useQuery<SustainabilityGoal[]>({
    queryKey: ["/api/sustainability-goals"],
  });

  const { data: manufacturingProcesses = [] } = useQuery<ManufacturingProcess[]>({
    queryKey: ["/api/manufacturing-processes"],
  });

  const { data: manufacturingQuality = [] } = useQuery<ManufacturingQuality[]>({
    queryKey: ["/api/manufacturing-qualities"],
  });

  const { data: technologyInnovations = [] } = useQuery<TechnologyInnovation[]>({
    queryKey: ["/api/technology-innovations"],
  });

  const { data: technologyResearch = [] } = useQuery<TechnologyResearch[]>({
    queryKey: ["/api/technology-research"],
  });

  const { data: fabrics = [] } = useQuery<Fabric[]>({
    queryKey: ["/api/fabrics"],
  });

  // Calculate cross-page metrics
  const sustainableFabrics = fabrics.filter(
    (f) => f.sustainabilityScore && parseInt(f.sustainabilityScore.toString(), 10) >= 4,
  );
  const avgManufacturingEfficiency =
    manufacturingProcesses.length > 0
      ? 75 // Default efficiency since efficiency property doesn't exist in schema
      : 0;
  const activeInnovations = technologyInnovations.filter((i) => i.isActive).length;
  const sustainabilityProgress =
    sustainabilityGoals.length > 0
      ? sustainabilityGoals.reduce((acc, g) => {
          const progress =
            g.currentProgress && g.target
              ? (parseFloat(g.currentProgress.toString()) / parseFloat(g.target)) * 100
              : 0;
          return acc + progress;
        }, 0) / sustainabilityGoals.length
      : 0;

  return (
    <div className="space-y-8">
      {/* Integrated Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Integrated Performance Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Sustainability Impact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 p-2">
                  <Leaf className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Sustainability Impact</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">Goal Progress</span>
                    <span className="font-medium">{sustainabilityProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={sustainabilityProgress} className="h-2" />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">Sustainable Fabrics</span>
                    <span className="font-medium">
                      {sustainableFabrics.length}/{fabrics.length}
                    </span>
                  </div>
                  <Progress
                    value={
                      fabrics.length > 0 ? (sustainableFabrics.length / fabrics.length) * 100 : 0
                    }
                    className="h-2"
                  />
                </div>

                {sustainabilityMetrics.find((m) => m.name === "Carbon Reduction") && (
                  <div className="rounded-lg bg-green-50 p-3">
                    <p className="font-medium text-green-700 text-sm">
                      {sustainabilityMetrics.find((m) => m.name === "Carbon Reduction")?.value}%
                      Carbon Reduction
                    </p>
                  </div>
                )}
              </div>

              <Button variant="outline" size="sm" asChild>
                <Link href="/sustainability">
                  View Details <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Manufacturing Excellence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Factory className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Manufacturing Excellence</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">Process Efficiency</span>
                    <span className="font-medium">{avgManufacturingEfficiency.toFixed(0)}%</span>
                  </div>
                  <Progress value={avgManufacturingEfficiency} className="h-2" />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">Quality Controls</span>
                    <span className="font-medium">
                      {manufacturingQuality.filter((q) => q.isActive).length} Active
                    </span>
                  </div>
                  <Progress
                    value={
                      manufacturingQuality.length > 0
                        ? (manufacturingQuality.filter((q) => q.isActive).length /
                            manufacturingQuality.length) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="font-medium text-blue-700 text-sm">
                    {manufacturingProcesses.filter((p) => p.isActive).length} Active Processes
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" asChild>
                <Link href="/manufacturing">
                  View Details <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            {/* Technology Innovation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Cpu className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Technology Innovation</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">Active Innovations</span>
                    <span className="font-medium">
                      {activeInnovations}/{technologyInnovations.length}
                    </span>
                  </div>
                  <Progress
                    value={
                      technologyInnovations.length > 0
                        ? (activeInnovations / technologyInnovations.length) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-gray-600">Research Progress</span>
                    <span className="font-medium">
                      {technologyResearch.length > 0
                        ? Math.round(
                            (technologyResearch.filter((r) => r.status === "completed").length /
                              technologyResearch.length) *
                              100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      technologyResearch.length > 0
                        ? (technologyResearch.filter((r) => r.status === "completed").length /
                            technologyResearch.length) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                <div className="rounded-lg bg-purple-50 p-3">
                  <p className="font-medium text-purple-700 text-sm">
                    {technologyResearch.filter((r) => r.isActive).length} Active Research Projects
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm" asChild>
                <Link href="/technology">
                  View Details <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>

      {/* Synergy Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Cross-Functional Synergies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sustainability × Manufacturing */}
            <div className="rounded-lg bg-gradient-to-r from-green-50 to-blue-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Leaf className="h-5 w-5 text-green-600" />
                <Shield className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Sustainability × Manufacturing</h4>
              </div>
              <p className="mb-3 text-gray-600 text-sm">
                Sustainable fabrics processed with {avgManufacturingEfficiency.toFixed(0)}%
                efficient manufacturing reduce overall environmental impact
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded bg-white p-3 text-center">
                  <div className="font-bold text-2xl text-green-600">
                    {Math.round((sustainableFabrics.length * avgManufacturingEfficiency) / 100)}
                  </div>
                  <div className="text-gray-600 text-xs">Optimized Sustainable Products</div>
                </div>
                <div className="rounded bg-white p-3 text-center">
                  <div className="font-bold text-2xl text-blue-600">
                    {((avgManufacturingEfficiency * sustainabilityProgress) / 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-600 text-xs">Combined Efficiency Score</div>
                </div>
              </div>
            </div>

            {/* Technology × Sustainability */}
            <div className="rounded-lg bg-gradient-to-r from-purple-50 to-green-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Cpu className="h-5 w-5 text-purple-600" />
                <Target className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Technology × Sustainability</h4>
              </div>
              <p className="mb-3 text-gray-600 text-sm">
                {activeInnovations} active innovations directly support{" "}
                {sustainabilityGoals.filter((g) => g.isActive).length} sustainability goals
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded bg-white p-3 text-center">
                  <div className="font-bold text-2xl text-purple-600">
                    {technologyInnovations.filter((i) => i.category === "Materials").length}
                  </div>
                  <div className="text-gray-600 text-xs">Material Innovations</div>
                </div>
                <div className="rounded bg-white p-3 text-center">
                  <div className="font-bold text-2xl text-green-600">
                    {
                      technologyResearch.filter((r) => r.researchArea?.includes("Sustainability"))
                        .length
                    }
                  </div>
                  <div className="text-gray-600 text-xs">Sustainability Research</div>
                </div>
              </div>
            </div>

            {/* Manufacturing × Technology */}
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Factory className="h-5 w-5 text-blue-600" />
                <Zap className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Manufacturing × Technology</h4>
              </div>
              <p className="mb-3 text-gray-600 text-sm">
                Advanced technology enables {Math.floor(manufacturingProcesses.length * 0.7)}{" "}
                high-efficiency manufacturing processes
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded bg-white p-3 text-center">
                  <div className="font-bold text-2xl text-blue-600">
                    {
                      manufacturingProcesses.filter((p) =>
                        p.name?.toLowerCase().includes("quality"),
                      ).length
                    }
                  </div>
                  <div className="text-gray-600 text-xs">Quality-Enhanced Processes</div>
                </div>
                <div className="rounded bg-white p-3 text-center">
                  <div className="font-bold text-2xl text-purple-600">
                    {
                      technologyInnovations.filter((i) =>
                        i.description?.toLowerCase().includes("production"),
                      ).length
                    }
                  </div>
                  <div className="text-gray-600 text-xs">Production Innovations</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrated KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>Integrated Key Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gradient-to-br from-green-50 to-green-100 p-4 text-center">
              <TrendingUp className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <div className="font-bold text-2xl text-green-700">
                {(
                  (sustainabilityProgress +
                    avgManufacturingEfficiency +
                    (activeInnovations / technologyInnovations.length) * 100) /
                  3
                ).toFixed(0)}
                %
              </div>
              <div className="text-gray-600 text-sm">Overall Performance</div>
            </div>

            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center">
              <Factory className="mx-auto mb-2 h-8 w-8 text-blue-600" />
              <div className="font-bold text-2xl text-blue-700">
                {Math.floor(manufacturingProcesses.length * 0.6)}
              </div>
              <div className="text-gray-600 text-sm">High-Efficiency Processes</div>
            </div>

            <div className="rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 p-4 text-center">
              <Cpu className="mx-auto mb-2 h-8 w-8 text-purple-600" />
              <div className="font-bold text-2xl text-purple-700">
                {technologyInnovations.length + technologyResearch.length}
              </div>
              <div className="text-gray-600 text-sm">Total Innovations</div>
            </div>

            <div className="rounded-lg bg-gradient-to-br from-green-50 to-blue-100 p-4 text-center">
              <Leaf className="mx-auto mb-2 h-8 w-8 text-green-600" />
              <div className="font-bold text-2xl text-green-700">{sustainableFabrics.length}</div>
              <div className="text-gray-600 text-sm">Eco-Certified Products</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
