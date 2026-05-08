import { err, ok, type Result } from "neverthrow";
import type {
  InsertProduct,
  Product,
  ProductSummary,
  ProductWithContext,
} from "../../shared/index.js";
import { retryDbOperation } from "../lib/db/db-retry.js";
import { productRepository } from "../lib/db/repositories/index.js";
import { type AppError, DatabaseError, NotFoundError } from "../lib/errors.js";
import { logger } from "../lib/monitoring/logger.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";

/**
 * PRODUCT SERVICE
 * Handles business logic for product catalog operations.
 * Enforces Thin Controller pattern and Result-based error handling.
 */
export class ProductService {
  /**
   * Lists products with pagination and filtering.
   */
  async listProducts(params: {
    category?: string;
    active?: string;
    featured?: string;
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<
    Result<
      {
        products: ProductSummary[];
        totalCount: number;
      },
      AppError
    >
  > {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(params.limit || 20, 100);
    const offset = (page - 1) * limit;

    try {
      let products: ProductSummary[] = [];
      let totalCount = 0;

      if (params.search) {
        const filters: any = {};
        if (params.category) filters.categoryId = parseInt(params.category, 10);
        if (params.active === "true") filters.isActive = true;
        else if (params.active === "false") filters.isActive = false;
        if (params.featured === "true") filters.isFeatured = true;
        else if (params.featured === "false") filters.isFeatured = false;

        products = await withCircuit(
          "search-products",
          () =>
            retryDbOperation(() =>
              productRepository.searchProducts(params.search!, filters, limit, offset),
            ),
          DB_CIRCUIT_OPTIONS,
        );
        totalCount = await withCircuit(
          "search-products-count",
          () =>
            retryDbOperation(() => productRepository.searchProductsCount(params.search!, filters)),
          DB_CIRCUIT_OPTIONS,
        );
      } else if (params.tag) {
        products = await withCircuit(
          "get-products-by-tag",
          () =>
            retryDbOperation(() => productRepository.getProductsByTag(params.tag!, limit, offset)),
          DB_CIRCUIT_OPTIONS,
        );
        totalCount = await withCircuit(
          "get-products-by-tag-count",
          () => retryDbOperation(() => productRepository.getProductsByTagCount(params.tag!)),
          DB_CIRCUIT_OPTIONS,
        );
      } else if (params.category) {
        const categoryId = parseInt(params.category, 10);
        products = await withCircuit(
          "get-products-by-category",
          () =>
            retryDbOperation(() =>
              productRepository.getProductsByCategory(categoryId, limit, offset),
            ),
          DB_CIRCUIT_OPTIONS,
        );
        totalCount = await withCircuit(
          "get-products-by-category-count",
          () => retryDbOperation(() => productRepository.getProductsByCategoryCount(categoryId)),
          DB_CIRCUIT_OPTIONS,
        );
      } else if (params.featured === "true") {
        products = await withCircuit(
          "get-featured-products",
          () => retryDbOperation(() => productRepository.getFeaturedProducts(limit, offset)),
          DB_CIRCUIT_OPTIONS,
        );
        totalCount = await withCircuit(
          "get-featured-products-count",
          () => retryDbOperation(() => productRepository.getFeaturedProductsCount()),
          DB_CIRCUIT_OPTIONS,
        );
      } else {
        const result = await withCircuit(
          "get-products-summary",
          () => retryDbOperation(() => productRepository.getProductsSummary(limit, offset)),
          DB_CIRCUIT_OPTIONS,
        );
        products = result.products;
        totalCount = result.totalCount;
      }

      return ok({ products, totalCount });
    } catch (error) {
      return err(new DatabaseError("Failed to list products", { cause: error }));
    }
  }

  /**
   * Fetches a single product by ID.
   */
  async getProductById(id: number): Promise<Result<Product, AppError>> {
    try {
      const product = await withCircuit(
        `get-product-${id}`,
        () => retryDbOperation(() => productRepository.getProduct(id)),
        DB_CIRCUIT_OPTIONS,
      );

      if (!product) {
        return err(new NotFoundError(`Product with ID ${id}`));
      }

      return ok(product);
    } catch (error) {
      return err(new DatabaseError(`Failed to fetch product ${id}`, { cause: error }));
    }
  }

  /**
   * Resolves a product by its URL path.
   */
  async getProductByPath(path: string): Promise<Result<ProductWithContext, AppError>> {
    try {
      const productContext = await withCircuit(
        `get-product-by-path-${path}`,
        () => retryDbOperation(() => productRepository.getProductByPath(path)),
        DB_CIRCUIT_OPTIONS,
      );

      if (!productContext) {
        return err(new NotFoundError(`Product at path ${path}`));
      }

      return ok(productContext);
    } catch (error) {
      return err(new DatabaseError(`Failed to fetch product by path: ${path}`, { cause: error }));
    }
  }

  /**
   * Fetches 3D model metadata for a product.
   */
  async get3DModelMetadata(id: number): Promise<Result<any, AppError>> {
    try {
      const metadata = await withCircuit(
        `get-product-3d-model-${id}`,
        () => retryDbOperation(() => productRepository.get3DModelMetadata(id)),
        DB_CIRCUIT_OPTIONS,
      );

      if (!metadata) {
        return err(new NotFoundError(`3D model for product ${id}`));
      }

      return ok(metadata);
    } catch (error) {
      return err(
        new DatabaseError(`Failed to fetch 3D model metadata for product ${id}`, { cause: error }),
      );
    }
  }

  /**
   * Creates a new product.
   */
  async createProduct(data: InsertProduct): Promise<Result<Product, AppError>> {
    try {
      const product = await withCircuit(
        "create-product",
        () => retryDbOperation(() => productRepository.createProduct(data)),
        DB_CIRCUIT_OPTIONS,
      );
      return ok(product);
    } catch (error) {
      return err(new DatabaseError("Failed to create product", { cause: error }));
    }
  }

  /**
   * Updates an existing product.
   */
  async updateProduct(
    id: number,
    data: Partial<InsertProduct>,
  ): Promise<Result<Product, AppError>> {
    try {
      const product = await withCircuit(
        `update-product-${id}`,
        () => retryDbOperation(() => productRepository.updateProduct(id, data)),
        DB_CIRCUIT_OPTIONS,
      );

      if (!product) {
        return err(new NotFoundError(`Product with ID ${id}`));
      }

      return ok(product);
    } catch (error) {
      return err(new DatabaseError(`Failed to update product ${id}`, { cause: error }));
    }
  }

  /**
   * Deletes a product.
   */
  async deleteProduct(id: number): Promise<Result<boolean, AppError>> {
    try {
      const success = await withCircuit(
        `delete-product-${id}`,
        () => retryDbOperation(() => productRepository.deleteProduct(id)),
        DB_CIRCUIT_OPTIONS,
      );

      if (!success) {
        return err(new NotFoundError(`Product with ID ${id}`));
      }

      return ok(true);
    } catch (error) {
      return err(new DatabaseError(`Failed to delete product ${id}`, { cause: error }));
    }
  }
}

export const productService = new ProductService();
