import { trace } from "@opentelemetry/api";
import type {
  InsertProduct,
  Product,
  ProductDetail,
  ProductDetailWithContext,
  ProductSummary,
} from "@run-remix/shared";
import { insertProductSchema } from "@run-remix/shared";
import { type Result, ResultAsync } from "neverthrow";
import { retryDbOperation } from "../lib/db/db-retry.js";
import { AppError, DatabaseError, NotFoundError } from "../lib/errors.js";
import { DB_CIRCUIT_OPTIONS, withCircuit } from "../lib/resilience/circuit-breaker.js";
import { sanitizeHtml } from "../lib/sanitize-html.js";
import { productRepository } from "./repositories/index.js";

/**
 * PRODUCT SERVICE
 * Handles business logic for product catalog operations.
 * Enforces Thin Controller pattern and Result-based error handling.
 */
const tracer = trace.getTracer("run-remix-services");

class ProductService {
  /**
   * Lists products with pagination and filtering.
   */
  async listProducts(params: {
    category?: string | undefined;
    active?: string | undefined;
    featured?: string | undefined;
    tag?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
  }): Promise<
    Result<
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
    >
  > {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(params.limit || 20, 100);
    const offset = (page - 1) * limit;

    return ResultAsync.fromPromise(
      (async (): Promise<{
        data: ProductSummary[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
          hasMore: boolean;
        };
      }> => {
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
            () =>
              retryDbOperation(() =>
                productRepository.searchProducts(params.search!, filters, limit, offset),
              ),
            DB_CIRCUIT_OPTIONS,
          );
          totalCount = await withCircuit(
            "search-products-count",
            () =>
              retryDbOperation(() =>
                productRepository.searchProductsCount(params.search!, filters),
              ),
            DB_CIRCUIT_OPTIONS,
          );
        } else if (params.tag) {
          products = await withCircuit(
            "get-products-by-tag",
            () =>
              retryDbOperation(() =>
                productRepository.getProductsByTag(params.tag!, limit, offset),
              ),
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
  async getProductById(id: number): Promise<Result<ProductDetail, AppError>> {
    return tracer.startActiveSpan(`ProductService.getProductById`, async (span) => {
      return ResultAsync.fromPromise(
        (async (): Promise<ProductDetail> => {
          const product = await withCircuit(
            `get-product-${id}`,
            () => retryDbOperation(() => productRepository.getProduct(id)),
            DB_CIRCUIT_OPTIONS,
          );

          if (!product) {
            span.recordException(new Error(`Product with ID ${id} not found`));
            span.end();
            throw new NotFoundError(`Product with ID ${id}`);
          }

          span.end();
          return product;
        })(),
        (error) => {
          if (error instanceof AppError) return error;
          span.recordException(error as Error);
          span.end();
          return new DatabaseError(`Failed to fetch product ${id}`, { cause: error });
        },
      );
    });
  }

  /**
   * Resolves a product by its URL path.
   */
  async getProductByPath(path: string): Promise<Result<ProductDetailWithContext, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<ProductDetailWithContext> => {
        const productContext = await withCircuit(
          `get-product-by-path-${path}`,
          () => retryDbOperation(() => productRepository.getProductByPath(path)),
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
  async get3DModelMetadata(id: number): Promise<Result<Record<string, unknown>, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Record<string, unknown>> => {
        const metadata = await withCircuit(
          `get-product-3d-model-${id}`,
          () => retryDbOperation(() => productRepository.get3DModelMetadata(id)),
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
  async createProduct(data: InsertProduct): Promise<Result<Product, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Product> => {
        const product = await withCircuit(
          "create-product",
          () =>
            retryDbOperation(() =>
              productRepository.createProduct(
                (() => {
                  const parsed = insertProductSchema.parse(data);
                  if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                  return parsed as typeof data;
                })(),
              ),
            ),
          DB_CIRCUIT_OPTIONS,
        );
        return product;
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
  async updateProduct(
    id: number,
    data: Partial<InsertProduct>,
  ): Promise<Result<Product, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<Product> => {
        const product = await withCircuit(
          `update-product-${id}`,
          () =>
            retryDbOperation(() =>
              productRepository.updateProduct(
                id,
                (() => {
                  const parsed = insertProductSchema.partial().parse(data);
                  if (parsed.description) parsed.description = sanitizeHtml(parsed.description);
                  return parsed as typeof data;
                })(),
              ),
            ),
          DB_CIRCUIT_OPTIONS,
        );

        if (!product) {
          throw new NotFoundError(`Product with ID ${id}`);
        }

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
  async deleteProduct(id: number): Promise<Result<boolean, AppError>> {
    return ResultAsync.fromPromise(
      (async (): Promise<boolean> => {
        const success = await withCircuit(
          `delete-product-${id}`,
          () => retryDbOperation(() => productRepository.deleteProduct(id)),
          DB_CIRCUIT_OPTIONS,
        );

        if (!success) {
          throw new NotFoundError(`Product with ID ${id}`);
        }

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
