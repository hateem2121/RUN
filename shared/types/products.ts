import type { Accessory, Certificate, SizeChart } from "../schemas/catalog.js";
import type { Category } from "../schemas/categories.js";
import type { Fabric, Fiber } from "../schemas/materials.js";
import type { ProductDetail } from "../schemas/products.js";

export interface ProductDetailWithContext {
  product: ProductDetail & { canonicalUrl: string | null };
  context: {
    category: Category | null;
    subcategory: Category | null;
    categoryTree: Category[];
    breadcrumb: Array<{ id: number; name: string; url: string }>;
    fabric: Fabric | null;
    certificates: Certificate[];
    sizeChart: SizeChart | null;
    accessories: Accessory[];
    fibers: Fiber[];
  };
}
