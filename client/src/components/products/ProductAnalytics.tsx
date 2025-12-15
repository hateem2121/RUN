import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  TrendingUp, 
  Eye, 
  Package, 
  Filter,
  Search,
  Clock,
  MousePointer
} from "lucide-react";

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  avgTimeOnPage: string;
  bounceRate: number;
  productViews: { [key: string]: number };
  searchTerms: { term: string; count: number }[];
  filterUsage: { filter: string; count: number }[];
  viewModeUsage: { mode: string; percentage: number }[];
  conversionFunnel: {
    stage: string;
    count: number;
    percentage: number;
  }[];
}

export function ProductAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    pageViews: 0,
    uniqueVisitors: 0,
    avgTimeOnPage: "0:00",
    bounceRate: 0,
    productViews: {},
    searchTerms: [],
    filterUsage: [],
    viewModeUsage: [],
    conversionFunnel: []
  });

  // Load analytics from localStorage (in real app, this would be from API)
  useEffect(() => {
    const loadAnalytics = () => {
      const stored = localStorage.getItem('productAnalytics');
      if (stored) {
        setAnalytics(JSON.parse(stored));
      } else {
        // Initialize with sample data
        setAnalytics({
          pageViews: 1247,
          uniqueVisitors: 892,
          avgTimeOnPage: "2:34",
          bounceRate: 32.5,
          productViews: {
            "Pro Runner Tank Top": 234,
            "Elite Performance Shorts": 189,
            "Moisture-Wicking T-Shirt": 156,
            "Compression Leggings": 145,
            "Athletic Training Jacket": 98
          },
          searchTerms: [
            { term: "moisture wicking", count: 89 },
            { term: "compression", count: 67 },
            { term: "sustainable", count: 45 },
            { term: "quick dry", count: 34 },
            { term: "athletic", count: 28 }
          ],
          filterUsage: [
            { filter: "Category", count: 456 },
            { filter: "Fabric", count: 234 },
            { filter: "Tags", count: 189 },
            { filter: "Certificates", count: 123 },
            { filter: "Size Charts", count: 98 }
          ],
          viewModeUsage: [
            { mode: "Medium", percentage: 55 },
            { mode: "Large", percentage: 30 },
            { mode: "Small", percentage: 15 }
          ],
          conversionFunnel: [
            { stage: "Product List View", count: 1247, percentage: 100 },
            { stage: "Product Detail View", count: 823, percentage: 66 },
            { stage: "Inquiry Initiated", count: 234, percentage: 18.8 },
            { stage: "Contact Form Submitted", count: 89, percentage: 7.1 }
          ]
        });
      }
    };

    loadAnalytics();
  }, []);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="products">Products</TabsTrigger>
        <TabsTrigger value="behavior">User Behavior</TabsTrigger>
        <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Page Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.pageViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MousePointer className="w-4 h-4" />
                Unique Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Avg. Time on Page
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgTimeOnPage}</div>
              <p className="text-xs text-muted-foreground">Minutes:Seconds</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Bounce Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.bounceRate}%</div>
              <p className="text-xs text-muted-foreground">Visitors who left immediately</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>View Mode Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.viewModeUsage.map((mode) => (
              <div key={mode.mode}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{mode.mode} Grid</span>
                  <span className="text-sm text-muted-foreground">{mode.percentage}%</span>
                </div>
                <Progress value={mode.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="products" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Top Viewed Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.productViews)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([product, views], index) => (
                  <div key={product} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{product}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{views} views</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="behavior" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Popular Search Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.searchTerms.map((item) => (
                  <div key={item.term} className="flex justify-between items-center">
                    <span className="text-sm">{item.term}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.filterUsage.map((item) => (
                  <div key={item.filter} className="flex justify-between items-center">
                    <span className="text-sm">{item.filter}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="funnel" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.conversionFunnel.map((stage, index) => (
                <div key={stage.stage}>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-sm text-muted-foreground">
                      {stage.count} ({stage.percentage}%)
                    </span>
                  </div>
                  <Progress 
                    value={stage.percentage} 
                    className="h-3"
                  />
                  {index < analytics.conversionFunnel.length - 1 && (
                    <div className="text-center py-2">
                      <TrendingUp className="w-4 h-4 mx-auto text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}