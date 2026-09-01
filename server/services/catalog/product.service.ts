import {
  type InsertProduct,
  insertProductSchema,
  type Product,
  type ProductDetail,
  type ProductDetailWithContext,
  type ProductSummary,
} from "@run-remix/shared";
import { ResultAsync } from "neverthrow";
import { CacheOperations } from "../../lib/cache/cache-strategies.js";
import { AppError, DatabaseError, NotFoundError } from "../../lib/errors.js";
import { logger } from "../../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../../lib/resilience/circuit-breaker.js";
import { sanitizeHtml } from "../../lib/sanitize-html.js";
import { productRepository } from "../repositories/index.js";

class ProductService {
  /**
   * Lists products with pagination and filtering.
   */
  listProducts(params: {
    category?: string | undefined;
    active?: string | undefined;
    featured?: string | undefined;
    tag?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }): ResultAsync<
    {
      data: ProductSummary[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasMore: boolean;
      };
    },
    AppError
  > {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(params.limit || 20, 100);
    const offset = (page - 1) * limit;

    return ResultAsync.fromPromise(
      (async () => {
        let products: ProductSummary[] = [];
        let totalCount = 0;

        if (params.search) {
          const filters: Record<string, unknown> = {};
          if (params.category) filters.categoryId = parseInt(params.category, 10);
          if (params.active === "true") filters.isActive = true;
          else if (params.active === "false") filters.isActive = false;
          if (params.featured === "true") filters.isFeatured = true;
          else if (params.featured === "false") filters.isFeatured = false;

          products = await withCircuit(
            "search-products",
            () => productRepository.searchProducts(params.search!, filters, limit, offset),
            DB_CIRCUIT_OPTIONS,
          );
          totalCount = await withCircuit(
            "search-products-count",
            () => productRepository.searchProductsCount(params.search!, filters),
            DB_CIRCUIT_OPTIONS,
          );
        } else if (params.tag) {
          products = await withCircuit(
            "get-products-by-tag",
            () => productRepository.getProductsByTag(params.tag!, limit, offset),
            DB_CIRCUIT_OPTIONS,
          );
          totalCount = await withCircuit(
            "get-products-by-tag-count",
            () => productRepository.getProductsByTagCount(params.tag!),
            DB_CIRCUIT_OPTIONS,
          );
        } else if (params.category) {
          let categoryId = parseInt(params.category, 10);
          if (Number.isNaN(categoryId)) {
            const cat = await productRepository.getCategoryBySlug(params.category);
            if (cat) {
              categoryId = cat.id;
            }
          }

          if (!Number.isNaN(categoryId)) {
            products = await withCircuit(
              "get-products-by-category",
              () => productRepository.getProductsByCategory(categoryId, limit, offset),
              DB_CIRCUIT_OPTIONS,
            );
            totalCount = await withCircuit(
              "get-products-by-category-count",
              () => productRepository.getProductsByCategoryCount(categoryId),
              DB_CIRCUIT_OPTIONS,
            );
          }
        } else if (params.featured === "true") {
          products = await withCircuit(
            "get-featured-products",
            () => productRepository.getFeaturedProducts(limit, offset),
            DB_CIRCUIT_OPTIONS,
          );
          totalCount = await withCircuit(
            "get-featured-products-count",
            () => productRepository.getFeaturedProductsCount(),
            DB_CIRCUIT_OPTIONS,
          );
        } else {
          const result = await withCircuit(
            "get-products-summary",
            () => productRepository.getProductsSummary(limit, offset),
            DB_CIRCUIT_OPTIONS,
          );
          products = result.products;
          totalCount = result.totalCount;
        }

        const totalPages = Math.ceil(totalCount / limit);

        return {
          data: products,
          pagination: {
            page,
            limit,
            total: totalCount,
            pages: totalPages,
            hasMore: page < totalPages,
          },
        };
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError("Failed to list products", { cause: error });
      },
    );
  }

  /**
   * Fetches a single product by ID.
   */
  getProductById(id: number): ResultAsync<ProductDetail, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const product = await withCircuit(
          `get-product-${id}`,
          () => productRepository.getProduct(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!product) {
          throw new NotFoundError(`Product with ID ${id}`);
        }

        return product;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError(`Failed to fetch product ${id}`, { cause: error });
      },
    );
  }

  /**
   * Resolves a product by its URL path.
   */
  getProductByPath(path: string): ResultAsync<ProductDetailWithContext, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const productContext = await withCircuit(
          `get-product-by-path-${path}`,
          () => productRepository.getProductByPath(path),
          DB_CIRCUIT_OPTIONS,
        );

        if (!productContext) {
          throw new NotFoundError(`Product at path ${path}`);
        }

        return productContext;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError(`Failed to fetch product by path: ${path}`, { cause: error });
      },
    );
  }

  /**
   * Fetches 3D model metadata for a product.
   */
  get3DModelMetadata(id: number): ResultAsync<Record<string, unknown>, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const metadata = await withCircuit(
          `get-product-3d-model-${id}`,
          () => productRepository.get3DModelMetadata(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!metadata) {
          throw new NotFoundError(`3D model for product ${id}`);
        }

        return metadata;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError(`Failed to fetch 3D model metadata for product ${id}`, {
          cause: error,
        });
      },
    );
  }

  /**
   * Creates a new product.
   */
  createProduct(data: InsertProduct): ResultAsync<Product, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const parsed = insertProductSchema.parse(data);
        if (parsed.description) parsed.description = sanitizeHtml(parsed.description);

        const product = await withCircuit(
          "create-product",
          () => productRepository.createProduct(parsed as typeof data),
          DB_CIRCUIT_OPTIONS,
        );

        if (product && typeof product === "object" && "isErr" in product && product.isErr()) {
          throw product.error;
        }

        // Invalidate product & homepage caches on create
        await CacheOperations.invalidateProducts().catch((e) =>
          logger.error("[ProductService] invalidateProducts failed on create", e),
        );
        await CacheOperations.invalidateHomepage().catch((e) =>
          logger.error("[ProductService] invalidateHomepage failed on create", e),
        );

        return typeof product === "object" && "value" in product ? product.value : product;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError("Failed to create product", { cause: error });
      },
    );
  }

  /**
   * Updates an existing product.
   */
  updateProduct(id: number, data: Partial<InsertProduct>): ResultAsync<Product, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const parsed = insertProductSchema.partial().parse(data);
        if (parsed.description) parsed.description = sanitizeHtml(parsed.description);

        const product = await withCircuit(
          `update-product-${id}`,
          () => productRepository.updateProduct(id, parsed as typeof data),
          DB_CIRCUIT_OPTIONS,
        );

        if (!product) {
          throw new NotFoundError(`Product with ID ${id}`);
        }

        // Invalidate product & homepage caches on update
        await CacheOperations.invalidateProducts().catch((e) =>
          logger.error("[ProductService] invalidateProducts failed on update", e),
        );
        await CacheOperations.invalidateHomepage().catch((e) =>
          logger.error("[ProductService] invalidateHomepage failed on update", e),
        );

        return product;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError(`Failed to update product ${id}`, { cause: error });
      },
    );
  }

  /**
   * Deletes a product.
   */
  deleteProduct(id: number): ResultAsync<boolean, AppError> {
    return ResultAsync.fromPromise(
      (async () => {
        const success = await withCircuit(
          `delete-product-${id}`,
          () => productRepository.deleteProduct(id),
          DB_CIRCUIT_OPTIONS,
        );

        if (!success) {
          throw new NotFoundError(`Product with ID ${id}`);
        }

        // Invalidate product & homepage caches on delete
        await CacheOperations.invalidateProducts().catch((e) =>
          logger.error("[ProductService] invalidateProducts failed on delete", e),
        );
        await CacheOperations.invalidateHomepage().catch((e) =>
          logger.error("[ProductService] invalidateHomepage failed on delete", e),
        );

        return true;
      })(),
      (error) => {
        if (error instanceof AppError) return error;
        return new DatabaseError(`Failed to delete product ${id}`, { cause: error });
      },
    );
  }
}

export const productService = new ProductService();
