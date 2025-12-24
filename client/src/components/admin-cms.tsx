import type {
	Accessory,
	Category,
	Certificate,
	Fabric,
	Fiber,
	MediaAsset,
	NavigationItem,
	Product,
	SizeChart,
} from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { MediaQueryKeys } from "@/lib/media-query-keys";

export default function AdminCMS() {
	// Enhanced data fetching with proper typing and error handling
	const { data: products } = useQuery<Product[]>({
		queryKey: ["/api/products"],
	});

	const { data: categories } = useQuery<Category[]>({
		queryKey: ["/api/categories"],
	});

	const { data: mediaResponse } = useQuery<{
		success: boolean;
		data: { data: MediaAsset[]; pagination: any };
	}>({
		queryKey: MediaQueryKeys.list,
	});
	const media = mediaResponse?.data?.data || [];

	const { data: fabrics } = useQuery<Fabric[]>({
		queryKey: ["/api/fabrics"],
	});

	const { data: fibers } = useQuery<Fiber[]>({
		queryKey: ["/api/fibers"],
	});

	const { data: certificates } = useQuery<Certificate[]>({
		queryKey: ["/api/certificates"],
	});

	const { data: sizeCharts } = useQuery<SizeChart[]>({
		queryKey: ["/api/size-charts"],
	});

	const { data: accessories } = useQuery<Accessory[]>({
		queryKey: ["/api/accessories"],
	});

	const { data: navigationItems } = useQuery<NavigationItem[]>({
		queryKey: ["/api/navigation-items"],
	});

	const { data: inquiryStats } = useQuery<{
		byStatus: Record<string, number>;
		bySource: Record<string, number>;
		recentCount: number;
	}>({
		queryKey: ["/api/admin/inquiries/stats"],
	});

	const modules = [
		{
			id: "products",
			name: "Product Management",
			description:
				"Create, update, categorize products with images and 3D files",
			icon: "fas fa-box",
			color: "bg-primary-100 text-primary-600",
			count: products?.length || 0,
		},
		{
			id: "categories",
			name: "Category Management",
			description: "Hierarchical structuring of products",
			icon: "fas fa-sitemap",
			color: "bg-orange-100 text-orange-600",
			count: categories?.length || 0,
		},
		{
			id: "media",
			name: "Media Library",
			description: "Centralized repository with tagging and search",
			icon: "fas fa-images",
			color: "bg-green-100 text-green-600",
			count: media?.length || 0,
		},
		{
			id: "fabrics",
			name: "Fabric Management",
			description: "Define fabric types, compositions, and properties",
			icon: "fas fa-tshirt",
			color: "bg-purple-100 text-purple-600",
			count: fabrics?.length || 0,
		},
		{
			id: "fibers",
			name: "Fiber Management",
			description: "Material traceability within fabrics",
			icon: "fas fa-dna",
			color: "bg-blue-100 text-blue-600",
			count: fibers?.length || 0,
		},
		{
			id: "certificates",
			name: "Certificate Management",
			description: "Compliance and sustainability certifications",
			icon: "fas fa-certificate",
			color: "bg-yellow-100 text-yellow-600",
			count: certificates?.length || 0,
		},
		{
			id: "sizeCharts",
			name: "Size Charts",
			description: "Create and assign size charts per category/region",
			icon: "fas fa-ruler-combined",
			color: "bg-indigo-100 text-indigo-600",
			count: sizeCharts?.length || 0,
		},
		{
			id: "accessories",
			name: "Printing & Accessories",
			description: "Manage customization options and embellishments",
			icon: "fas fa-palette",
			color: "bg-pink-100 text-pink-600",
			count: accessories?.length || 0,
		},
		{
			id: "navigation",
			name: "Website Navigation",
			description: "Manage floating dock navigation menu items",
			icon: "fas fa-compass",
			color: "bg-cyan-100 text-cyan-600",
			count: navigationItems?.length || 0,
		},
		{
			id: "contact",
			name: "Contact Management",
			description: "Manage contact page configuration and settings",
			icon: "fas fa-envelope",
			color: "bg-teal-100 text-teal-600",
			count: 1, // Contact Page Settings
		},
		{
			id: "inquiries",
			name: "Inquiry Management",
			description:
				"View, manage, and respond to customer inquiries and submissions",
			icon: "fas fa-inbox",
			color: "bg-sky-100 text-sky-600",
			count: Object.values(inquiryStats?.byStatus || {}).reduce(
				(sum, count) => sum + count,
				0,
			),
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
			description:
				"Manage company timeline, locations, statistics, and team message",
			icon: "fas fa-building",
			color: "bg-amber-100 text-amber-600",
			count: 6, // Hero, Timeline, Locations, Sections, Statistics, Team Message
		},
		{
			id: "sustainability",
			name: "Sustainability Management",
			description:
				"Manage sustainability hero, metrics, initiatives, and goals",
			icon: "fas fa-leaf",
			color: "bg-green-100 text-green-600",
			count: 4, // Hero, Metrics, Initiatives, Goals
		},
		{
			id: "manufacturing",
			name: "Manufacturing Management",
			description:
				"Manage manufacturing processes, capabilities, and quality control",
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
			color: "bg-gray-100 text-gray-600",
			count: 3, // Footer config, sections, links
		},
		{
			id: "storage-optimization",
			name: "Storage Optimization",
			description: "Analyze and optimize media storage, clean orphaned files",
			icon: "fas fa-database",
			color: "bg-slate-100 text-slate-600",
			count: 0, // Will be populated by storage stats
		},
	];

	return (
		<div className="max-w-7xl mx-auto">
			<div className="text-center mb-12">
				<h2 className="text-3xl font-neue-stance font-bold text-neutral-900 mb-4">
					Admin Management Portal
				</h2>
				<p className="text-lg text-neutral-600 max-w-2xl mx-auto">
					Comprehensive CMS with interconnected modules for complete product
					lifecycle management
				</p>
			</div>

			{/* CMS Module Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{modules.map((module) => (
					<Link
						key={module.id}
						href={
							module.id === "sizeCharts"
								? "/admin/size-charts"
								: `/admin/${module.id}`
						}
					>
						<Card className="admin-card cursor-pointer h-full">
							<CardContent className="p-6">
								<div
									className={`w-12 h-12 ${module.color.split(" ")[0]} rounded-lg flex items-center justify-center mb-4`}
								>
									<i
										className={`${module.icon} ${module.color.split(" ")[1]} text-xl`}
									></i>
								</div>
								<h3 className="text-lg font-neue-stance font-semibold text-neutral-900 mb-2">
									{module.name}
								</h3>
								<p className="text-sm text-neutral-600 mb-4">
									{module.description}
								</p>
								<div className="text-xs text-neutral-500">
									<span className="bg-neutral-100 px-2 py-1 rounded">
										{module.count} {module.count === 1 ? "Item" : "Items"}
									</span>
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
