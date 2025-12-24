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
import { useResourceBatch } from "@/hooks/resources/useResourceBatch";
import { useResourceSearch } from "@/hooks/resources/useResourceSearch";

const resourceCategories = [
  {
    id: 'certifications',
    title: 'Certifications',
    description: 'Quality and compliance standards',
    icon: Shield,
    href: '/resources/certifications',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 'accessories',
    title: 'Accessories',
    description: 'Components and customization options',
    icon: Package,
    href: '/resources/accessories',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 'size-charts',
    title: 'Size Charts',
    description: 'International sizing standards',
    icon: Ruler,
    href: '/resources/size-charts',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'fabrics',
    title: 'Fabrics',
    description: 'Material specifications and properties',
    icon: Shirt,
    href: '/resources/fabrics',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 'fibers',
    title: 'Fibers',
    description: 'Raw material characteristics',
    icon: Sparkles,
    href: '/resources/fibers',
    color: 'from-indigo-500 to-purple-600'
  }
];

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch all resource data using batch endpoint
  const { certificates, accessories, sizeCharts, fabrics, fibers, isLoading } = useResourceBatch('all');

  // Use debounced search
  const { searchResults, isSearching } = useResourceSearch(searchTerm, {
    certificates,
    accessories,
    sizeCharts,
    fabrics,
    fibers
  });

  // Calculate totals for animated counters
  const totalResources = useMemo(() =>
    certificates.length + accessories.length + sizeCharts.length + fabrics.length + fibers.length,
    [certificates, accessories, sizeCharts, fabrics, fibers]
  );

  // Filter search results by tab
  const filteredResults = activeTab === 'all'
    ? searchResults
    : searchResults.filter(result => {
      const tabMap: Record<string, string> = {
        certificates: 'certificate',
        accessories: 'accessory',
        'size-charts': 'sizechart',
        fabrics: 'fabric',
        fibers: 'fiber'
      };
      return result.type === tabMap[activeTab];
    });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'certificate': return <Shield className="w-5 h-5" />;
      case 'accessory': return <Package className="w-5 h-5" />;
      case 'sizechart': return <Ruler className="w-5 h-5" />;
      case 'fabric': return <Shirt className="w-5 h-5" />;
      case 'fiber': return <Sparkles className="w-5 h-5" />;
      default: return null;
    }
  };

  const getResourceUrl = (type: string) => {
    const urlMap: Record<string, string> = {
      certificate: '/resources/certifications',
      accessory: '/resources/accessories',
      sizechart: '/resources/size-charts',
      fabric: '/resources/fabrics',
      fiber: '/resources/fibers'
    };
    return urlMap[type] || '/resources';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SEOMeta
        title="Resources - Technical Specifications & Materials | RUN APPAREL"
        description="Explore our comprehensive resource library including certifications, accessories, size charts, fabrics, and fiber specifications for sportswear manufacturing."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Resources Hub
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Access technical specifications, material properties, and industry standards
          </p>

          {/* Statistics */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="text-center">
              <AnimatedCounter
                value={totalResources}
                className="text-3xl font-bold text-gray-900"
              />
              <div className="text-sm text-gray-600">Total Resources</div>
            </div>
            <div className="text-center">
              <AnimatedCounter
                value={5}
                className="text-3xl font-bold text-purple-600"
              />
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </motion.div>

        {/* Search Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <ResourceSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search across all resources..."
            className="mb-6"
          />

          {searchTerm && (
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Found <span className="font-semibold">{filteredResults.length}</span> results
                {isSearching && " (searching...)"}
              </p>
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
        ) : (
          <>
            {searchTerm ? (
              /* Search Results */
              <ResourceGrid
                items={filteredResults}
                columns={3}
                emptyState={
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms or browse by category below
                    </p>
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
                    onToggleExpand={() => { }}
                    badges={[
                      { label: result.type.charAt(0).toUpperCase() + result.type.slice(1), variant: "secondary" }
                    ]}
                    expandedContent={
                      <Link href={getResourceUrl(result.type)}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                          <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                      </Link>
                    }
                  />
                )}
              />
            ) : (
              /* Resource Categories Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resourceCategories.map((category, index) => {
                  const Icon = category.icon;
                  const count =
                    category.id === 'certifications' ? certificates.length :
                      category.id === 'accessories' ? accessories.length :
                        category.id === 'size-charts' ? sizeCharts.length :
                          category.id === 'fabrics' ? fabrics.length :
                            category.id === 'fibers' ? fibers.length : 0;

                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {category.id === 'fabrics' ? (
                        <Link href={category.href}>
                          <HoverCard3D>
                            <Card className="h-full hover:shadow-lg transition-all cursor-pointer overflow-hidden group">
                              <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                  <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
                                    <Icon className="w-6 h-6" />
                                  </div>
                                  <Badge variant="secondary">{count} items</Badge>
                                </div>
                                <CardTitle className="text-xl">{category.title}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-gray-600 mb-4">{category.description}</p>
                                <Button className="w-full group-hover:translate-x-1 transition-transform">
                                  Browse {category.title}
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </CardContent>
                            </Card>
                          </HoverCard3D>
                        </Link>
                      ) : (
                        <Link href={category.href}>
                          <Card className="h-full hover:shadow-lg transition-all cursor-pointer group">
                            <CardHeader>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`p-3 rounded-lg bg-gradient-to-br ${category.color} text-white`}>
                                  <Icon className="w-6 h-6" />
                                </div>
                                <Badge variant="secondary">{count} items</Badge>
                              </div>
                              <CardTitle className="text-xl">{category.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-600 mb-4">{category.description}</p>
                              <Button className="w-full group-hover:translate-x-1 transition-transform">
                                Browse {category.title}
                                <ArrowRight className="w-4 h-4 ml-2" />
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
          </>
        )}
      </div>
    </div>
  );
}