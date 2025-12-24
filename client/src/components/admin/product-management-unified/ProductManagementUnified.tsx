import type { Product } from "@shared/schema";
import { lazy, Suspense, useState } from "react";
import { ProductErrorBoundary } from "@/components/admin/ProductErrorBoundary";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ProductGrid } from "./core/ProductGrid";
import { PerformanceMonitor } from "./PerformanceMonitor";

// Lazy load advanced components
const ProductDetailsPanel = lazy(() => import("./shared/ProductDetailsPanel"));
const ProductCreateEditModal = lazy(
	() => import("./admin/ProductCreateEditModal"),
);

type ProductManagementUnifiedProps = {};

function ModuleLoader() {
	return (
		<div className="flex items-center justify-center h-32">
			<div className="text-center">
				<div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
				<p className="text-sm text-gray-600">Loading...</p>
			</div>
		</div>
	);
}

export function ProductManagementUnified(
	_props: ProductManagementUnifiedProps,
) {
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [editingProduct, setEditingProduct] = useState<Product | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [showDetailsPanel, setShowDetailsPanel] = useState(false);

	const handleProductSelect = (product: Product) => {
		setSelectedProduct(product);
		setShowDetailsPanel(true);
	};

	const handleProductEdit = (product: Product) => {
		setEditingProduct(product);
	};

	const handleProductCreate = () => {
		setIsCreating(true);
	};

	const handleCloseDetails = () => {
		setShowDetailsPanel(false);
		setSelectedProduct(null);
	};

	const handleCloseEdit = () => {
		setEditingProduct(null);
		setIsCreating(false);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Performance Monitor - Development Only */}
			{process.env.NODE_ENV === "development" && <PerformanceMonitor />}

			<div className="container mx-auto px-4 py-8">
				<ErrorBoundary
					fallback={
						<div className="text-center py-12">
							<p className="text-red-600">
								Something went wrong loading the product management system.
							</p>
							<button
								onClick={() => {
									// Force re-render by changing location
									const currentLocation = window.location.pathname;
									window.history.replaceState(null, "", "/temp");
									window.history.replaceState(null, "", currentLocation);
									window.dispatchEvent(new PopStateEvent("popstate"));
								}}
								className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
							>
								Reload Page
							</button>
						</div>
					}
				>
					<div className="flex gap-6">
						{/* Main Product Grid */}
						<div
							className={`transition-all duration-300 ${showDetailsPanel ? "w-2/3" : "w-full"}`}
						>
							<ProductErrorBoundary>
								<ProductGrid
									onProductSelect={handleProductSelect}
									onProductEdit={handleProductEdit}
									onProductCreate={handleProductCreate}
								/>
							</ProductErrorBoundary>
						</div>

						{/* Details Panel */}
						{showDetailsPanel && selectedProduct && (
							<div className="w-1/3 border-l border-gray-200 pl-6">
								<Suspense fallback={<ModuleLoader />}>
									<ProductDetailsPanel
										product={selectedProduct}
										onClose={handleCloseDetails}
										onEdit={() => handleProductEdit(selectedProduct)}
									/>
								</Suspense>
							</div>
						)}
					</div>

					{/* Create/Edit Modal */}
					{(isCreating || editingProduct) && (
						<ProductErrorBoundary>
							<Suspense fallback={<ModuleLoader />}>
								<ProductCreateEditModal
									product={editingProduct}
									isOpen={true}
									onClose={handleCloseEdit}
								/>
							</Suspense>
						</ProductErrorBoundary>
					)}
				</ErrorBoundary>
			</div>
		</div>
	);
}

export default ProductManagementUnified;
