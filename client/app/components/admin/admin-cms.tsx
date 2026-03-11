import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { CrossPageDashboard } from "./cross-page-dashboard";

export default function AdminCMS() {
  // Single query for all module counts
  const { data: stats } = useQuery<Record<string, number>>({
    queryKey: ["/api/v1/admin/dashboard/stats"],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const modules = [
    {
      id: "products",
      name: "Product Management",
      description: "Create, update, categorize products with images and 3D files",
      icon: "fas fa-box",
      color: "bg-primary-100 text-primary-600",
      count: stats?.products || 0,
    },
    {
      id: "categories",
      name: "Category Management",
      description: "Hierarchical structuring of products",
      icon: "fas fa-sitemap",
      color: "bg-orange-100 text-orange-600",
      count: stats?.categories || 0,
    },
    {
      id: "media",
      name: "Media Library",
      description: "Centralized repository with tagging and search",
      icon: "fas fa-images",
      color: "bg-green-100 text-green-600",
      count: stats?.media || 0,
    },
    {
      id: "fabrics",
      name: "Fabric Management",
      description: "Define fabric types, compositions, and properties",
      icon: "fas fa-tshirt",
      color: "bg-purple-100 text-purple-600",
      count: stats?.fabrics || 0,
    },
    {
      id: "fibers",
      name: "Fiber Management",
      description: "Material traceability within fabrics",
      icon: "fas fa-dna",
      color: "bg-blue-100 text-blue-600",
      count: stats?.fibers || 0,
    },
    {
      id: "certificates",
      name: "Certificate Management",
      description: "Compliance and sustainability certifications",
      icon: "fas fa-certificate",
      color: "bg-yellow-100 text-yellow-600",
      count: stats?.certificates || 0,
    },
    {
      id: "sizeCharts",
      name: "Size Charts",
      description: "Create and assign size charts per category/region",
      icon: "fas fa-ruler-combined",
      color: "bg-indigo-100 text-indigo-600",
      count: stats?.sizeCharts || 0,
    },
    {
      id: "accessories",
      name: "Printing & Accessories",
      description: "Manage customization options and embellishments",
      icon: "fas fa-palette",
      color: "bg-pink-100 text-pink-600",
      count: stats?.accessories || 0,
    },
    {
      id: "navigation",
      name: "Website Navigation",
      description: "Manage floating dock navigation menu items",
      icon: "fas fa-compass",
      color: "bg-cyan-100 text-cyan-600",
      count: stats?.navigationItems || 0,
    },
    {
      id: "contact",
      name: "Contact Management",
      description: "Manage contact page configuration and settings",
      icon: "fas fa-envelope",
      color: "bg-teal-100 text-teal-600",
      count: stats?.contactPages || 1, // Contact Page Settings
    },
    {
      id: "inquiries",
      name: "Inquiry Management",
      description: "View, manage, and respond to customer inquiries and submissions",
      icon: "fas fa-inbox",
      color: "bg-sky-100 text-sky-600",
      count: stats?.inquiries || 0,
    },
    {
      id: "homepage",
      name: "Homepage Management",
      description: "Manage homepage hero, slogans, process cards, and more",
      icon: "fas fa-home",
      color: "bg-orange-100 text-orange-600",
      count: 5, // Hero, Slogans, Process Cards, Featured Products, Sustainability
    },
    {
      id: "about",
      name: "About Us Management",
      description: "Manage company timeline, locations, statistics, and team message",
      icon: "fas fa-building",
      color: "bg-amber-100 text-amber-600",
      count: 6, // Hero, Timeline, Locations, Sections, Statistics, Team Message
    },
    {
      id: "sustainability",
      name: "Sustainability Management",
      description: "Manage sustainability hero, metrics, initiatives, and goals",
      icon: "fas fa-leaf",
      color: "bg-green-100 text-green-600",
      count: 4, // Hero, Metrics, Initiatives, Goals
    },
    {
      id: "manufacturing",
      name: "Manufacturing Management",
      description: "Manage manufacturing processes, capabilities, and quality control",
      icon: "fas fa-industry",
      color: "bg-blue-100 text-blue-600",
      count: 4, // Hero, Processes, Capabilities, Quality
    },
    {
      id: "technology",
      name: "Technology Management",
      description: "Manage technology innovations, equipment, and research",
      icon: "fas fa-microchip",
      color: "bg-purple-100 text-purple-600",
      count: 4, // Hero, Innovations, Equipment, Research
    },
    {
      id: "footer",
      name: "Footer Management",
      description: "Configure footer sections, links, and contact information",
      icon: "fas fa-columns",
      color: "bg-muted text-muted-foreground",
      count: 3, // Footer config, sections, links
    },
    {
      id: "storage-optimization",
      name: "Storage Optimization",
      description: "Analyze and optimize media storage, clean orphaned files",
      icon: "fas fa-database",
      color: "bg-slate-100 text-slate-600",
      count: stats?.storage || 0, // Will be populated by storage stats
    },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-12 text-center">
        <h2 className="mb-4 font-bold font-neue-stance text-3xl text-neutral-900">
          Admin Management Portal
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-neutral-600">
          Comprehensive CMS with interconnected modules for complete product lifecycle management
        </p>
      </div>

      <div className="mb-12">
        <CrossPageDashboard />
      </div>

      {/* CMS Module Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={module.id === "sizeCharts" ? "/admin/size-charts" : `/admin/${module.id}`}
              className="block h-full"
            >
              <Card className="admin-card h-full cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div
                    className={`h-12 w-12 ${module.color.split(" ")[0]} center-flex mb-4 rounded-lg`}
                  >
                    <i className={`${module.icon} ${module.color.split(" ")[1]} text-xl`}></i>
                  </div>
                  <h3 className="mb-2 font-neue-stance font-semibold text-lg text-neutral-900">
                    {module.name}
                  </h3>
                  <p className="mb-4 text-neutral-600 text-sm">{module.description}</p>
                  <div className="text-neutral-500 text-xs">
                    <span className="rounded bg-neutral-100 px-2 py-1">
                      {module.count} {module.count === 1 ? "Item" : "Items"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
