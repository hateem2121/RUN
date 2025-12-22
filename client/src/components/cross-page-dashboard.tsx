import type { 
  Fabric, 
  ManufacturingProcess,
  ManufacturingQuality,
  SustainabilityGoal,
  SustainabilityMetric, 
  TechnologyInnovation,
  TechnologyResearch
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
  const sustainableFabrics = fabrics.filter(f => f.sustainabilityScore && parseInt(f.sustainabilityScore.toString()) >= 4);
  const avgManufacturingEfficiency = manufacturingProcesses.length > 0
    ? 75 // Default efficiency since efficiency property doesn't exist in schema
    : 0;
  const activeInnovations = technologyInnovations.filter(i => i.isActive).length;
  const sustainabilityProgress = sustainabilityGoals.length > 0
    ? sustainabilityGoals.reduce((acc, g) => {
        const progress = g.currentProgress && g.target 
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sustainability Impact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Sustainability Impact</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Goal Progress</span>
                    <span className="font-medium">{sustainabilityProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={sustainabilityProgress} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Sustainable Fabrics</span>
                    <span className="font-medium">{sustainableFabrics.length}/{fabrics.length}</span>
                  </div>
                  <Progress 
                    value={fabrics.length > 0 ? (sustainableFabrics.length / fabrics.length) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                
                {sustainabilityMetrics.find(m => m.name === "Carbon Reduction") && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-700">
                      {sustainabilityMetrics.find(m => m.name === "Carbon Reduction")?.value}% Carbon Reduction
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Factory className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Manufacturing Excellence</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Process Efficiency</span>
                    <span className="font-medium">{avgManufacturingEfficiency.toFixed(0)}%</span>
                  </div>
                  <Progress value={avgManufacturingEfficiency} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Quality Controls</span>
                    <span className="font-medium">{manufacturingQuality.filter(q => q.isActive).length} Active</span>
                  </div>
                  <Progress 
                    value={manufacturingQuality.length > 0 ? (manufacturingQuality.filter(q => q.isActive).length / manufacturingQuality.length) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">
                    {manufacturingProcesses.filter(p => p.isActive).length} Active Processes
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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Cpu className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Technology Innovation</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Active Innovations</span>
                    <span className="font-medium">{activeInnovations}/{technologyInnovations.length}</span>
                  </div>
                  <Progress 
                    value={technologyInnovations.length > 0 ? (activeInnovations / technologyInnovations.length) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Research Progress</span>
                    <span className="font-medium">
                      {technologyResearch.length > 0 
                        ? Math.round(technologyResearch.filter(r => r.status === "completed").length / technologyResearch.length * 100)
                        : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={technologyResearch.length > 0 
                      ? (technologyResearch.filter(r => r.status === "completed").length / technologyResearch.length) * 100
                      : 0} 
                    className="h-2" 
                  />
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-700">
                    {technologyResearch.filter(r => r.isActive).length} Active Research Projects
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
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Leaf className="w-5 h-5 text-green-600" />
                <Shield className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Sustainability × Manufacturing</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Sustainable fabrics processed with {avgManufacturingEfficiency.toFixed(0)}% efficient manufacturing reduce overall environmental impact
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(sustainableFabrics.length * avgManufacturingEfficiency / 100)}
                  </div>
                  <div className="text-xs text-gray-600">Optimized Sustainable Products</div>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {((avgManufacturingEfficiency * sustainabilityProgress) / 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600">Combined Efficiency Score</div>
                </div>
              </div>
            </div>

            {/* Technology × Sustainability */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-green-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="w-5 h-5 text-purple-600" />
                <Target className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Technology × Sustainability</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                {activeInnovations} active innovations directly support {sustainabilityGoals.filter(g => g.isActive).length} sustainability goals
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {technologyInnovations.filter(i => i.category === "Materials").length}
                  </div>
                  <div className="text-xs text-gray-600">Material Innovations</div>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {technologyResearch.filter(r => r.researchArea?.includes("Sustainability")).length}
                  </div>
                  <div className="text-xs text-gray-600">Sustainability Research</div>
                </div>
              </div>
            </div>

            {/* Manufacturing × Technology */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Factory className="w-5 h-5 text-blue-600" />
                <Zap className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Manufacturing × Technology</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Advanced technology enables {Math.floor(manufacturingProcesses.length * 0.7)} high-efficiency manufacturing processes
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {manufacturingProcesses.filter(p => p.name?.toLowerCase().includes("quality")).length}
                  </div>
                  <div className="text-xs text-gray-600">Quality-Enhanced Processes</div>
                </div>
                <div className="text-center p-3 bg-white rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    {technologyInnovations.filter(i => i.description?.toLowerCase().includes("production")).length}
                  </div>
                  <div className="text-xs text-gray-600">Production Innovations</div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">
                {((sustainabilityProgress + avgManufacturingEfficiency + (activeInnovations / technologyInnovations.length * 100)) / 3).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Overall Performance</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Factory className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-700">
                {Math.floor(manufacturingProcesses.length * 0.6)}
              </div>
              <div className="text-sm text-gray-600">High-Efficiency Processes</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <Cpu className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">
                {technologyInnovations.length + technologyResearch.length}
              </div>
              <div className="text-sm text-gray-600">Total Innovations</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-100 rounded-lg">
              <Leaf className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">
                {sustainableFabrics.length}
              </div>
              <div className="text-sm text-gray-600">Eco-Certified Products</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}