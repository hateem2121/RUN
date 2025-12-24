/**
 * Product Navigation Component
 * Previous/Next product navigation within category
 */

import type { Product } from "@shared/schema";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductNavigationProps {
	previousProduct: Product | null;
	nextProduct: Product | null;
	className?: string;
}

export function ProductNavigation({
	previousProduct,
	nextProduct,
	className,
}: ProductNavigationProps) {
	if (!previousProduct && !nextProduct) {
		return null;
	}

	return (
		<div className={cn("flex items-center justify-between py-6", className)}>
			<div className="flex-1">
				{previousProduct && (
					<Link
						href={
							(previousProduct as any).canonicalUrl ||
							`/products/${previousProduct.slug}`
						}
					>
						<Button variant="ghost" className="group">
							<ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
							<div className="text-left">
								<div className="text-xs text-gray-500">Previous</div>
								<div className="text-sm font-medium truncate max-w-[150px]">
									{previousProduct.name}
								</div>
							</div>
						</Button>
					</Link>
				)}
			</div>

			<div className="flex-1 text-right">
				{nextProduct && (
					<Link
						href={
							(nextProduct as any).canonicalUrl ||
							`/products/${nextProduct.slug}`
						}
					>
						<Button variant="ghost" className="group">
							<div className="text-right">
								<div className="text-xs text-gray-500">Next</div>
								<div className="text-sm font-medium truncate max-w-[150px]">
									{nextProduct.name}
								</div>
							</div>
							<ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
						</Button>
					</Link>
				)}
			</div>
		</div>
	);
}
