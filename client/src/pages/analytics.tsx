import { ArrowLeft, Download, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { ProductAnalytics } from "@/components/products/ProductAnalytics";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AnalyticsPage() {
  const { toast } = useToast();

  const handleExportData = () => {
    const analytics = localStorage.getItem('productAnalytics') || '{}';
    const blob = new Blob([analytics], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `product-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Analytics exported",
      description: "Analytics data has been downloaded successfully.",
    });
  };

  const handleRefreshData = () => {
    // In real app, this would fetch fresh data from API
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/products">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Products
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold">Product Analytics Dashboard</h1>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefreshData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="default" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="container mx-auto px-4 py-8">
        <ProductAnalytics />
      </div>
    </div>
  );
}