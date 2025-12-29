import type { Accessory } from "@shared/schema";
import { motion } from "framer-motion";
import { Package, Settings, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { ResourceSkeleton } from "@/components/resources/ResourceSkeleton";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { SEOMeta } from "@/components/seo-meta";
import { Typography } from "@/components/ui/typography";
import { useResourceBatch } from "@/hooks/resources/useResourceBatch";
import { useDebounce } from "@/hooks/use-debounce";

export default function Accessories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedAccessories, setExpandedAccessories] = useState<Set<number>>(new Set());

  const { accessories, isLoading } = useResourceBatch(["accessory"]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter accessories based on search
  const filteredAccessories = useMemo(() => {
    if (!debouncedSearchTerm) return accessories;

    const term = debouncedSearchTerm.toLowerCase();
    return accessories.filter(
      (acc) =>
        acc.name.toLowerCase().includes(term) ||
        acc.type?.toLowerCase().includes(term) ||
        acc.category?.toLowerCase().includes(term) ||
        acc.description?.toLowerCase().includes(term),
    );
  }, [accessories, debouncedSearchTerm]);

  const toggleExpanded = (id: number) => {
    setExpandedAccessories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getCategoryIcon = (category: string | undefined) => {
    switch (category?.toLowerCase()) {
      case "hardware":
        return Settings;
      case "customization":
        return Wrench;
      default:
        return Package;
    }
  };

  const getAccessoryDetails = (accessory: Accessory) => (
    <div className="space-y-3 text-sm">
      {accessory.specifications && accessory.specifications.length > 0 && (
        <div>
          <span className="font-medium text-foreground/80">Specifications:</span>
          <ul className="mt-2 space-y-1">
            {accessory.specifications.map((spec: string, index: number) => (
              <li key={index} className="relative pl-4 text-muted-foreground">
                <span className="absolute left-0">•</span>
                {spec}
              </li>
            ))}
          </ul>
        </div>
      )}
      {accessory.description && (
        <div>
          <span className="font-medium text-foreground/80">Details:</span>
          <Typography.P className="mt-1 text-muted-foreground">
            {accessory.description}
          </Typography.P>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-b from-muted/30 to-background">
      <SEOMeta
        title="Accessories - Components & Customization | RUN APPAREL"
        description="Browse our comprehensive range of sportswear accessories including zippers, buttons, labels, and customization options for professional manufacturing."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <Typography.H1 className="mb-4 font-bold text-4xl text-foreground md:text-5xl">
            Accessories & Components
          </Typography.H1>
          <Typography.P className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Premium components and customization options for professional sportswear manufacturing
          </Typography.P>

          <div className="mt-8 flex justify-center gap-6">
            <div className="text-center">
              <div className="font-bold text-3xl text-blue-600">{accessories.length}</div>
              <div className="text-muted-foreground text-sm">Total Accessories</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-3xl text-purple-600">
                {new Set(accessories.map((a) => a.category).filter(Boolean)).size}
              </div>
              <div className="text-muted-foreground text-sm">Categories</div>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <div className="mx-auto mb-12 max-w-2xl">
          <ResourceSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search accessories..."
          />
        </div>

        {/* Accessories Grid */}
        {isLoading ? (
          <ResourceSkeleton count={6} columns={3} />
        ) : (
          <ResourceGrid
            items={filteredAccessories}
            columns={3}
            emptyState={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                <Typography.H3 className="mb-2 font-semibold text-foreground text-xl">
                  {searchTerm ? "No accessories found" : "No accessories available"}
                </Typography.H3>
                <Typography.P className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "Check back later for updates"}
                </Typography.P>
              </motion.div>
            }
            renderItem={(accessory) => {
              const Icon = getCategoryIcon(accessory.category || undefined);
              return (
                <ResourceCard
                  key={accessory.id}
                  title={accessory.name}
                  subtitle={accessory.type || undefined}
                  description={accessory.description || undefined}
                  icon={<Icon className="h-5 w-5" />}
                  tags={[accessory.category || "Uncategorized"]}
                  isExpanded={expandedAccessories.has(accessory.id)}
                  onToggleExpand={() => toggleExpanded(accessory.id)}
                  expandedContent={getAccessoryDetails(accessory)}
                  badges={accessory.isActive ? [{ label: "Available", variant: "default" }] : []}
                />
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
