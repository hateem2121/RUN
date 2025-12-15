import { useState } from "react";
import { motion } from "framer-motion";
import { Ruler, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SEOMeta } from "@/components/seo-meta";
import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceSkeleton } from "@/components/resources/ResourceSkeleton";
import { useResourceBatch } from "@/hooks/resources/useResourceBatch";
import { useDebounce } from "@/hooks/use-debounce";
import type { SizeChart } from "@shared/schema";
import { useMemo } from "react";

export default function SizeCharts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCharts, setExpandedCharts] = useState<Set<number>>(new Set());
  const [selectedUnit, setSelectedUnit] = useState<'metric' | 'imperial'>('metric');

  const { sizeCharts, isLoading } = useResourceBatch(['sizechart']);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter size charts based on search
  const filteredCharts = useMemo(() => {
    if (!debouncedSearchTerm) return sizeCharts;

    const term = debouncedSearchTerm.toLowerCase();
    return sizeCharts.filter(chart =>
      chart.name.toLowerCase().includes(term) ||
      (chart.region && chart.region.toLowerCase().includes(term)) ||
      (chart.category && chart.category.toLowerCase().includes(term))
    );
  }, [sizeCharts, debouncedSearchTerm]);

  // Group size charts by region
  const groupedCharts = filteredCharts.reduce((acc, chart) => {
    const region = chart.region || 'Unknown';
    if (!acc[region]) acc[region] = [];
    acc[region].push(chart);
    return acc;
  }, {} as Record<string, SizeChart[]>);

  const toggleExpanded = (id: number) => {
    setExpandedCharts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };



  const convertMeasurement = (value: number | null, unit: 'metric' | 'imperial'): string => {
    if (!value) return '-';
    if (unit === 'imperial') {
      return `${(value / 2.54).toFixed(1)}"`;
    }
    return `${value} cm`;
  };

  const getSizeChartDetails = (chart: SizeChart) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Measurement Unit:</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectedUnit === 'metric' ? 'default' : 'outline'}
            onClick={() => setSelectedUnit('metric')}
          >
            Metric
          </Button>
          <Button
            size="sm"
            variant={selectedUnit === 'imperial' ? 'default' : 'outline'}
            onClick={() => setSelectedUnit('imperial')}
          >
            Imperial
          </Button>
        </div>
      </div>

      {chart.measurements && chart.measurements.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Size</TableHead>
                <TableHead>Chest</TableHead>
                <TableHead>Waist</TableHead>
                <TableHead>Hip</TableHead>
                <TableHead>Length</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chart.measurements.map((measurement: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{measurement.size}</TableCell>
                  <TableCell>{convertMeasurement(measurement.chest, selectedUnit)}</TableCell>
                  <TableCell>{convertMeasurement(measurement.waist, selectedUnit)}</TableCell>
                  <TableCell>{convertMeasurement(measurement.hip, selectedUnit)}</TableCell>
                  <TableCell>{convertMeasurement(measurement.length, selectedUnit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {chart.fitNotes && (
        <div className="mt-4">
          <span className="font-medium text-gray-700">Fit Notes:</span>
          <p className="text-sm text-gray-600 mt-1">{chart.fitNotes}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SEOMeta
        title="Size Charts - International Sizing Standards | RUN APPAREL"
        description="Access comprehensive international size charts for sportswear including US, EU, UK, and Asian sizing standards with detailed measurements."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            International Size Charts
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive sizing standards for global sportswear manufacturing
          </p>

          <div className="flex justify-center gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{sizeCharts.length}</div>
              <div className="text-sm text-gray-600">Size Standards</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">
                {Object.keys(groupedCharts).length}
              </div>
              <div className="text-sm text-gray-600">Regions</div>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <ResourceSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search size charts..."
          />
        </div>

        {/* Size Charts */}
        {isLoading ? (
          <ResourceSkeleton count={6} columns={2} />
        ) : (
          <>
            {Object.entries(groupedCharts).length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Ruler className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No size charts found' : 'No size charts available'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm ? 'Try adjusting your search terms' : 'Check back later for updates'}
                </p>
              </motion.div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedCharts).map(([region, charts]) => (
                  <div key={region}>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Globe className="w-6 h-6 text-gray-600" />
                      {region} Standards
                    </h2>
                    <ResourceGrid
                      items={charts}
                      columns={2}
                      renderItem={(chart) => (
                        <ResourceCard
                          key={chart.id}
                          title={chart.name}
                          subtitle={`${chart.region || 'Unknown'} Standard`}
                          icon={<Ruler className="w-5 h-5" />}
                          tags={chart.category ? [chart.category] : []}
                          isExpanded={expandedCharts.has(chart.id)}
                          onToggleExpand={() => toggleExpanded(chart.id)}
                          expandedContent={getSizeChartDetails(chart)}
                          badges={chart.isActive ? [{ label: "Active", variant: "default" }] : []}
                        />
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}