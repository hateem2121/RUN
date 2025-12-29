import type { Product } from "@shared/schema";
import { lazy, Suspense, useState } from "react";
import { ProductErrorBoundary } from "@/components/admin/ProductErrorBoundary";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ProductGrid } from "./core/ProductGrid";
import { PerformanceMonitor } from "./PerformanceMonitor";

// Lazy load advanced components
const ProductDetailsPanel = lazy(() => import("./shared/ProductDetailsPanel"));
const ProductCreateEditModal = lazy(() => import("./admin/ProductCreateEditModal"));

type ProductManagementUnifiedProps = {};

function ModuleLoader() {
  return (
    <div className="flex h-32 items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-border border-t-blue-600" />
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function ProductManagementUnified(_props: ProductManagementUnifiedProps) {
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
    <div className="min-h-screen bg-background">
      {/* Performance Monitor - Development Only */}
      {process.env.NODE_ENV === "development" && <PerformanceMonitor />}

      <div className="container mx-auto px-4 py-8">
        <ErrorBoundary
          fallback={
            <div className="py-12 text-center">
              <p className="text-red-600">
                Something went wrong loading the product management system.
              </p>
              <button
                type="button"
                onClick={() => {
                  // Force re-render by changing location
                  const currentLocation = window.location.pathname;
                  window.history.replaceState(null, "", "/temp");
                  window.history.replaceState(null, "", currentLocation);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
                className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          }
        >
          <div className="flex gap-6">
            {/* Main Product Grid */}
            <div className={`transition-all duration-300 ${showDetailsPanel ? "w-2/3" : "w-full"}`}>
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
              <div className="w-1/3 border-border border-l pl-6">
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
