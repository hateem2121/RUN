import type { SizeChart } from "@shared/schema";
import { motion } from "framer-motion";
import { Info, Ruler, User } from "lucide-react";
import { useMemo, useState } from "react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { ResourceSkeleton } from "@/components/resources/ResourceSkeleton";
import { Badge } from "@/components/ui/badge";
// Button import removed as unused
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useResourceBatch } from "@/hooks/resources/useResourceBatch";
import { useDebounce } from "@/hooks/use-debounce";
import type { Route } from "./+types/size-charts";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Size Charts - International Sizing Standards | RUN APPAREL" },
    {
      name: "description",
      content:
        "Comprehensive size charts for various sportswear categories and regions to ensure perfect fit.",
    },
  ];
}

export default function SizeCharts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCharts, setExpandedCharts] = useState<Set<number>>(new Set());

  const { sizeCharts, isLoading } = useResourceBatch(["sizechart"]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter size charts based on search
  const filteredCharts = useMemo(() => {
    if (!debouncedSearchTerm) {
      return sizeCharts;
    }

    const term = debouncedSearchTerm.toLowerCase();
    return sizeCharts.filter(
      (chart) =>
        chart.name.toLowerCase().includes(term) ||
        chart.category?.toLowerCase().includes(term) ||
        chart.region?.toLowerCase().includes(term) ||
        chart.gender?.toLowerCase().includes(term),
    );
  }, [sizeCharts, debouncedSearchTerm]);

  const toggleExpanded = (id: number) => {
    setExpandedCharts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getChartIcon = (gender: string | undefined) => {
    switch (gender?.toLowerCase()) {
      case "men":
      case "women":
      case "unisex":
        return User;
      case "kids":
        return Info;
      default:
        return Ruler;
    }
  };

  const getSizeTable = (chart: SizeChart) => {
    // Parse measurements data
    const measurements = chart.measurements as Record<string, Record<string, string>> | null;

    if (!measurements) {
      return null;
    }

    // Get all sizes (columns) and measurement points (rows)
    const sizes = Object.keys(measurements);
    if (sizes.length === 0) {
      return null;
    }
    const firstSize = sizes[0];
    if (!firstSize) {
      return null;
    }

    // Get measurement points from the first size entry
    const firstMeasurement = measurements[firstSize];
    if (!firstMeasurement) {
      return null;
    }
    const points = Object.keys(firstMeasurement);

    return (
      <ScrollArea className="h-full w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Measurement</TableHead>
              {sizes.map((size) => (
                <TableHead key={size} className="text-center">
                  {size}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {points.map((point) => (
              <TableRow key={point}>
                <TableCell className="font-medium">{point}</TableCell>
                {sizes.map((size) => (
                  <TableCell key={`${size}-${point}`} className="text-center">
                    {measurements[size]?.[point] || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <div className="from-muted/30 to-background min-h-screen bg-linear-to-b">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <Typography.H1 className="text-foreground mb-4 text-4xl font-bold md:text-5xl">
            Size Specifications
          </Typography.H1>
          <Typography.P className="text-muted-foreground mx-auto max-w-3xl text-lg">
            Standardized sizing guides for global markets and various product categories
          </Typography.P>

          <div className="mt-8 flex justify-center gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{sizeCharts.length}</div>
              <div className="text-muted-foreground text-sm">Size Guides</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {new Set(sizeCharts.map((c) => c.region).filter(Boolean)).size}
              </div>
              <div className="text-muted-foreground text-sm">Regions</div>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="mx-auto mb-12 max-w-2xl">
          <ResourceSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by category, region, or gender..."
          />
        </div>

        {/* Size Charts Grid */}
        {isLoading ? (
          <ResourceSkeleton count={6} columns={2} />
        ) : (
          <ResourceGrid
            items={filteredCharts}
            columns={2}
            emptyState={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <Ruler className="text-muted-foreground/50 mx-auto mb-4 h-16 w-16" />
                <Typography.H3 className="text-foreground mb-2 text-xl font-semibold">
                  {searchTerm ? "No size charts found" : "No size charts available"}
                </Typography.H3>
                <Typography.P className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "Check back later for updates"}
                </Typography.P>
              </motion.div>
            }
            renderItem={(chart) => {
              const Icon = getChartIcon(chart.gender || undefined);
              return (
                <ResourceCard
                  key={chart.id}
                  title={chart.name}
                  subtitle={chart.category || undefined}
                  description={
                    chart.description ||
                    `Standard ${chart.region || "Global"} sizing for ${chart.gender || "Unisex"} ${chart.category || "sportswear"}`
                  }
                  icon={<Icon className="h-5 w-5" />}
                  tags={[
                    chart.gender || "Unisex",
                    chart.region || "Global",
                    (chart.unit as string) || "CM",
                  ]}
                  isExpanded={expandedCharts.has(chart.id)}
                  onToggleExpand={() => toggleExpanded(chart.id)}
                  expandedContent={
                    <div className="mt-4">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-foreground/80 text-sm font-medium">Measurements</span>
                        <Badge variant="outline" className="text-xs">
                          Units: {chart.unit || "CM"}
                        </Badge>
                      </div>
                      <div className="overflow-x-auto">{getSizeTable(chart)}</div>
                    </div>
                  }
                  badges={
                    chart.region
                      ? [
                          {
                            label: chart.region,
                            variant: "secondary",
                            // icon removed as it is not supported by ResourceCard badges
                          },
                        ]
                      : []
                  }
                />
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
