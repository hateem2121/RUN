import type { Category, Fabric, Product } from "@shared/schema";
import {
	Archive,
	Calendar,
	Filter,
	Layers,
	Package,
	Search,
	Star,
	X,
	// Tag,
	// clearSearch
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
// Phase 2: Import debounced search hook
import { useDebouncedSearch } from "../shared/hooks";

interface ProductAdvancedFiltersProps {
	products: Product[];
	categories: Category[];
	fabrics: Fabric[];
	onFilteredProductsChange: (products: Product[]) => void;
}

export function ProductAdvancedFilters({
	products,
	categories,
	fabrics,
	onFilteredProductsChange,
}: ProductAdvancedFiltersProps) {
	// Phase 2: Replace useState search with debounced search hook
	const {
		searchQuery,
		setSearchQuery,
		filteredItems: searchFilteredProducts,
		isSearching,
		// clearSearch
	} = useDebouncedSearch(
		products,
		["name", "sku", "description", "shortDescription", "tags"],
		300,
	);

	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [fabricFilter, setFabricFilter] = useState<string>("all");
	const [featuredFilter, setFeaturedFilter] = useState<string>("all");
	const [sortBy, setSortBy] = useState<string>("name");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	// Phase 2/3: Advanced Features - Complex Filtering System with debounced search
	const filteredAndSortedProducts = useMemo(() => {
		// Start with search-filtered products from the debounced hook
		const filtered = searchFilteredProducts.filter((product) => {
			// Status filter
			const matchesStatus =
				statusFilter === "all" ||
				(statusFilter === "active" && product.isActive) ||
				(statusFilter === "inactive" && !product.isActive);

			// Category filter
			const matchesCategory =
				categoryFilter === "all" ||
				product.categoryId?.toString() === categoryFilter;

			// Fabric filter
			const matchesFabric =
				fabricFilter === "all" || product.fabricId?.toString() === fabricFilter;

			// Featured filter
			const matchesFeatured =
				featuredFilter === "all" ||
				(featuredFilter === "featured" && product.isFeatured) ||
				(featuredFilter === "not-featured" && !product.isFeatured);

			return (
				matchesStatus && matchesCategory && matchesFabric && matchesFeatured
			);
		});

		// Sorting
		filtered.sort((a, b) => {
			let aValue, bValue;

			switch (sortBy) {
				case "name":
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
					break;
				case "sku":
					aValue = a.sku.toLowerCase();
					bValue = b.sku.toLowerCase();
					break;
				case "created":
					aValue = a.id; // Using ID as proxy for creation order
					bValue = b.id;
					break;
				case "category": {
					const aCat = categories.find((c) => c.id === a.categoryId);
					const bCat = categories.find((c) => c.id === b.categoryId);
					aValue = aCat?.name.toLowerCase() || "";
					bValue = bCat?.name.toLowerCase() || "";
					break;
				}
				case "fabric": {
					const aFab = fabrics.find((f) => f.id === a.fabricId);
					const bFab = fabrics.find((f) => f.id === b.fabricId);
					aValue = aFab?.name.toLowerCase() || "";
					bValue = bFab?.name.toLowerCase() || "";
					break;
				}
				case "status":
					aValue = a.isActive ? "active" : "inactive";
					bValue = b.isActive ? "active" : "inactive";
					break;
				default:
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
			}

			if (sortOrder === "asc") {
				return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
			} else {
				return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
			}
		});

		return filtered;
	}, [
		products,
		categories,
		fabrics,
		searchQuery,
		statusFilter,
		categoryFilter,
		fabricFilter,
		featuredFilter,
		sortBy,
		sortOrder,
	]);

	// Update filtered products when filters change
	React.useEffect(() => {
		onFilteredProductsChange(filteredAndSortedProducts);
	}, [
		searchFilteredProducts,
		statusFilter,
		categoryFilter,
		fabricFilter,
		featuredFilter,
		sortBy,
		sortOrder,
		onFilteredProductsChange,
	]);

	const clearAllFilters = () => {
		setSearchQuery("");
		setStatusFilter("all");
		setCategoryFilter("all");
		setFabricFilter("all");
		setFeaturedFilter("all");
		setSortBy("name");
		setSortOrder("asc");
	};

	const hasActiveFilters =
		searchQuery ||
		statusFilter !== "all" ||
		categoryFilter !== "all" ||
		fabricFilter !== "all" ||
		featuredFilter !== "all" ||
		sortBy !== "name" ||
		sortOrder !== "asc";

	const activeFilterCount = [
		searchQuery && "search",
		statusFilter !== "all" && "status",
		categoryFilter !== "all" && "category",
		fabricFilter !== "all" && "fabric",
		featuredFilter !== "all" && "featured",
		(sortBy !== "name" || sortOrder !== "asc") && "sort",
	].filter(Boolean).length;

	return (
		<div className="bg-white border rounded-lg p-6 mb-6">
			<div className="flex items-center justify-between mb-4">
				<div className="flex items-center space-x-2">
					<Filter className="h-5 w-5 text-gray-500" />
					<h3 className="text-lg font-medium">Advanced Filters</h3>
					{hasActiveFilters && (
						<Badge variant="secondary">
							{activeFilterCount} active filter
							{activeFilterCount !== 1 ? "s" : ""}
						</Badge>
					)}
				</div>

				{hasActiveFilters && (
					<Button variant="outline" size="sm" onClick={clearAllFilters}>
						<X className="h-4 w-4 mr-2" />
						Clear All
					</Button>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Search products..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-10 sm:text-sm"
						aria-label="Search products"
						role="searchbox"
						aria-describedby="search-help"
					/>
					{isSearching && (
						<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
							<div
								className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"
								aria-label="Searching..."
							></div>
						</div>
					)}
				</div>

				{/* Status Filter */}
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger>
						<div className="flex items-center space-x-2">
							<Archive className="h-4 w-4" />
							<SelectValue placeholder="All Status" />
						</div>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Status</SelectItem>
						<SelectItem value="active">Active Only</SelectItem>
						<SelectItem value="inactive">Inactive Only</SelectItem>
					</SelectContent>
				</Select>

				{/* Category Filter */}
				<Select value={categoryFilter} onValueChange={setCategoryFilter}>
					<SelectTrigger>
						<div className="flex items-center space-x-2">
							<Package className="h-4 w-4" />
							<SelectValue placeholder="All Categories" />
						</div>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						{categories.map((category) => (
							<SelectItem key={category.id} value={category.id.toString()}>
								{category.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Fabric Filter */}
				<Select value={fabricFilter} onValueChange={setFabricFilter}>
					<SelectTrigger>
						<div className="flex items-center space-x-2">
							<Layers className="h-4 w-4" />
							<SelectValue placeholder="All Fabrics" />
						</div>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Fabrics</SelectItem>
						{fabrics.map((fabric) => (
							<SelectItem key={fabric.id} value={fabric.id.toString()}>
								{fabric.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				{/* Featured Filter */}
				<Select value={featuredFilter} onValueChange={setFeaturedFilter}>
					<SelectTrigger>
						<div className="flex items-center space-x-2">
							<Star className="h-4 w-4" />
							<SelectValue placeholder="All Products" />
						</div>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Products</SelectItem>
						<SelectItem value="featured">Featured Only</SelectItem>
						<SelectItem value="not-featured">Not Featured</SelectItem>
					</SelectContent>
				</Select>

				{/* Sort By */}
				<Select value={sortBy} onValueChange={setSortBy}>
					<SelectTrigger>
						<div className="flex items-center space-x-2">
							<Calendar className="h-4 w-4" />
							<SelectValue placeholder="Sort by..." />
						</div>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="name">Name</SelectItem>
						<SelectItem value="sku">SKU</SelectItem>
						<SelectItem value="created">Created Date</SelectItem>
						<SelectItem value="category">Category</SelectItem>
						<SelectItem value="fabric">Fabric</SelectItem>
						<SelectItem value="status">Status</SelectItem>
					</SelectContent>
				</Select>

				{/* Sort Order */}
				<Select
					value={sortOrder}
					onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
				>
					<SelectTrigger>
						<SelectValue placeholder="Order..." />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="asc">Ascending</SelectItem>
						<SelectItem value="desc">Descending</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Results Summary */}
			<div className="flex items-center justify-between text-sm text-gray-600">
				<span>
					Showing {filteredAndSortedProducts.length} of {products.length}{" "}
					products
				</span>

				{hasActiveFilters && (
					<div className="flex items-center space-x-2">
						<span>Filtered by:</span>
						<div className="flex space-x-1">
							{searchQuery && (
								<Badge variant="outline" className="text-xs">
									Search
								</Badge>
							)}
							{statusFilter !== "all" && (
								<Badge variant="outline" className="text-xs">
									Status
								</Badge>
							)}
							{categoryFilter !== "all" && (
								<Badge variant="outline" className="text-xs">
									Category
								</Badge>
							)}
							{fabricFilter !== "all" && (
								<Badge variant="outline" className="text-xs">
									Fabric
								</Badge>
							)}
							{featuredFilter !== "all" && (
								<Badge variant="outline" className="text-xs">
									Featured
								</Badge>
							)}
							{(sortBy !== "name" || sortOrder !== "asc") && (
								<Badge variant="outline" className="text-xs">
									Sort
								</Badge>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
