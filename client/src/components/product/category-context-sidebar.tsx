/**
 * Category Context Sidebar Component
 * Shows category hierarchy and related navigation
 */

// import { Filter } from "lucide-react";
// import { cn } from "@/lib/utils";
import type { Category, Product } from "@shared/schema";

interface CategoryContextSidebarProps {
	currentCategory: Category | null;
	subcategory: Category | null;
	categoryTree: Category[];
	currentProductId: number;
	categoryProducts: Product[];
}

export function CategoryContextSidebar({}: CategoryContextSidebarProps) {
	// Filter out current product from category products
	// const otherProducts = categoryProducts.filter(p => p.id !== currentProductId);

	return null;
}
