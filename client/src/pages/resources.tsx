import { motion } from "framer-motion";
import { ArrowRight, Filter, Package, Ruler, Shield, Shirt, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { ResourceGrid } from "@/components/resources/ResourceGrid";
import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { ResourceSkeleton } from "@/components/resources/ResourceSkeleton";
import { SEOMeta } from "@/components/seo-meta";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard3D } from "@/components/ui/hover-card-3d";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { useResourceBatch } from "@/hooks/resources/useResourceBatch";
import { useResourceSearch } from "@/hooks/resources/useResourceSearch";

const resourceCategories = [
  {
    id: "certifications",
    title: "Certifications",
    description: "Quality and compliance standards",
    icon: Shield,
    href: "/resources/certifications",
    color: "from-green-500 to-emerald-600",
  },
  {
    id: "accessories",
    title: "Accessories",
    description: "Components and customization options",
    icon: Package,
    href: "/resources/accessories",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "size-charts",
    title: "Size Charts",
    description: "International sizing standards",
    icon: Ruler,
    href: "/resources/size-charts",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "fabrics",
    title: "Fabrics",
    description: "Material specifications and properties",
    icon: Shirt,
    href: "/resources/fabrics",
    color: "from-orange-500 to-red-600",
  },
  {
    id: "fibers",
    title: "Fibers",
    description: "Raw material characteristics",
    icon: Sparkles,
    href: "/resources/fibers",
    color: "from-indigo-500 to-purple-600",
  },
];

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all resource data using batch endpoint
  const { certificates, accessories, sizeCharts, fabrics, fibers, isLoading } =
    useResourceBatch("all");

  // Use debounced search
  const { searchResults, isSearching } = useResourceSearch(searchTerm, {
    certificates,
    accessories,
    sizeCharts,
    fabrics,
    fibers,
  });

  // Calculate totals for animated counters
  const totalResources = useMemo(
    () =>
      certificates.length + accessories.length + sizeCharts.length + fabrics.length + fibers.length,
    [certificates, accessories, sizeCharts, fabrics, fibers],
  );

  // Filter search results by tab
  const filteredResults =
    activeTab === "all"
      ? searchResults
      : searchResults.filter((result) => {
          const tabMap: Record<string, string> = {
            certificates: "certificate",
            accessories: "accessory",
            "size-charts": "sizechart",
            fabrics: "fabric",
            fibers: "fiber",
          };
          return result.type === tabMap[activeTab];
        });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "certificate":
        return <Shield className="h-5 w-5" />;
      case "accessory":
        return <Package className="h-5 w-5" />;
      case "sizechart":
        return <Ruler className="h-5 w-5" />;
      case "fabric":
        return <Shirt className="h-5 w-5" />;
      case "fiber":
        return <Sparkles className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getResourceUrl = (type: string) => {
    const urlMap: Record<string, string> = {
      certificate: "/resources/certifications",
      accessory: "/resources/accessories",
      sizechart: "/resources/size-charts",
      fabric: "/resources/fabrics",
      fiber: "/resources/fibers",
    };
    return urlMap[type] || "/resources";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SEOMeta
        title="Resources - Technical Specifications & Materials | RUN APPAREL"
        description="Explore our comprehensive resource library including certifications, accessories, size charts, fabrics, and fiber specifications for sportswear manufacturing."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <Typography.H1 className="mb-4 font-bold text-4xl text-gray-900 md:text-5xl">
            Resources Hub
          </Typography.H1>
          <Typography.P className="mx-auto max-w-3xl text-gray-600 text-lg">
            Access technical specifications, material properties, and industry standards
          </Typography.P>

          {/* Statistics */}
          <div className="mt-8 flex justify-center gap-8">
            <div className="text-center">
              <AnimatedCounter
                value={totalResources}
                className="font-bold text-3xl text-gray-900"
              />
              <div className="text-gray-600 text-sm">Total Resources</div>
            </div>
            <div className="text-center">
              <AnimatedCounter value={5} className="font-bold text-3xl text-purple-600" />
              <div className="text-gray-600 text-sm">Categories</div>
            </div>
          </div>
        </motion.div>

        {/* Search Section */}
        <div className="mx-auto mb-12 max-w-3xl">
          <ResourceSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search across all resources..."
            className="mb-6"
          />

          {searchTerm && (
            <div className="mb-6 flex items-center justify-between">
              <Typography.P className="text-gray-600 text-sm">
                Found <span className="font-semibold">{filteredResults.length}</span> results
                {isSearching && " (searching...)"}
              </Typography.P>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="certificates">Certificates</TabsTrigger>
                  <TabsTrigger value="accessories">Accessories</TabsTrigger>
                  <TabsTrigger value="size-charts">Size Charts</TabsTrigger>
                  <TabsTrigger value="fabrics">Fabrics</TabsTrigger>
                  <TabsTrigger value="fibers">Fibers</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <ResourceSkeleton count={6} columns={3} />
        ) : searchTerm ? (
          /* Search Results */
          <ResourceGrid
            items={filteredResults}
            columns={3}
            emptyState={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <Filter className="mx-auto mb-4 h-16 w-16 text-gray-300" />
                <Typography.H3 className="mb-2 font-semibold text-gray-900 text-xl">
                  No results found
                </Typography.H3>
                <Typography.P className="text-gray-600">
                  Try adjusting your search terms or browse by category below
                </Typography.P>
              </motion.div>
            }
            renderItem={(result) => (
              <ResourceCard
                key={`${result.type}-${result.id}`}
                title={result.title}
                subtitle={result.subtitle}
                description={result.description}
                icon={getResourceIcon(result.type)}
                tags={result.tags}
                isExpanded={false}
                onToggleExpand={() => {}}
                badges={[
                  {
                    label: result.type.charAt(0).toUpperCase() + result.type.slice(1),
                    variant: "secondary",
                  },
                ]}
                expandedContent={
                  <Link href={getResourceUrl(result.type)}>
                    <Button variant="outline" size="sm" className="w-full">
                      View Details
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </Link>
                }
              />
            )}
          />
        ) : (
          /* Resource Categories Grid */
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resourceCategories.map((category, index) => {
              const Icon = category.icon;
              const count =
                category.id === "certifications"
                  ? certificates.length
                  : category.id === "accessories"
                    ? accessories.length
                    : category.id === "size-charts"
                      ? sizeCharts.length
                      : category.id === "fabrics"
                        ? fabrics.length
                        : category.id === "fibers"
                          ? fibers.length
                          : 0;

              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {category.id === "fabrics" ? (
                    <Link href={category.href}>
                      <HoverCard3D>
                        <Card className="group h-full cursor-pointer overflow-hidden transition-all hover:shadow-lg">
                          <CardHeader>
                            <div className="mb-2 flex items-center justify-between">
                              <div
                                className={`rounded-lg bg-gradient-to-br p-3 ${category.color} text-white`}
                              >
                                <Icon className="h-6 w-6" />
                              </div>
                              <Badge variant="secondary">{count} items</Badge>
                            </div>
                            <CardTitle className="text-xl">{category.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Typography.P className="mb-4 text-gray-600">
                              {category.description}
                            </Typography.P>
                            <Button className="w-full transition-transform group-hover:translate-x-1">
                              Browse {category.title}
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      </HoverCard3D>
                    </Link>
                  ) : (
                    <Link href={category.href}>
                      <Card className="group h-full cursor-pointer transition-all hover:shadow-lg">
                        <CardHeader>
                          <div className="mb-2 flex items-center justify-between">
                            <div
                              className={`rounded-lg bg-gradient-to-br p-3 ${category.color} text-white`}
                            >
                              <Icon className="h-6 w-6" />
                            </div>
                            <Badge variant="secondary">{count} items</Badge>
                          </div>
                          <CardTitle className="text-xl">{category.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Typography.P className="mb-4 text-gray-600">
                            {category.description}
                          </Typography.P>
                          <Button className="w-full transition-transform group-hover:translate-x-1">
                            Browse {category.title}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
