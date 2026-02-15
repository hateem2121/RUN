/**
 * TDD Example: Service Layer Tests
 *
 * This file demonstrates the Red-Green-Refactor cycle for service layer testing.
 * Run with: npm run test service-tests.ts
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================================
// PHASE 1: RED - Write failing tests first
// ============================================================================

describe("ProductService - TDD Example", () => {
  // Mock dependencies
  const mockDb = {
    products: {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };

  const mockEventBus = {
    emit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Test: Create product with valid data
  // ---------------------------------------------------------------------------
  describe("createProduct", () => {
    it("should create product with valid data", async () => {
      // Arrange
      const input = {
        name: "Performance T-Shirt",
        category: "activewear" as const,
        price: 29.99,
        materials: ["polyester", "spandex"],
        sustainable: true,
      };

      mockDb.products.create.mockResolvedValue({
        id: "prod_123",
        ...input,
        createdAt: new Date("2026-02-15"),
      });

      // Act
      const result = await createProduct(input, mockDb as any);

      // Assert
      expect(result).toMatchObject({
        id: "prod_123",
        name: "Performance T-Shirt",
        price: 29.99,
      });
      expect(mockDb.products.create).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationError for invalid price", async () => {
      // Arrange
      const invalidInput = {
        name: "Test Product",
        category: "activewear" as const,
        price: -10, // Invalid: negative price
        materials: ["cotton"],
      };

      // Act & Assert
      await expect(createProduct(invalidInput, mockDb as any)).rejects.toThrow(
        "Price must be positive",
      );

      expect(mockDb.products.create).not.toHaveBeenCalled();
    });

    it("should throw ValidationError for empty materials", async () => {
      // Arrange
      const invalidInput = {
        name: "Test Product",
        category: "activewear" as const,
        price: 29.99,
        materials: [], // Invalid: empty array
      };

      // Act & Assert
      await expect(createProduct(invalidInput, mockDb as any)).rejects.toThrow(
        "At least one material required",
      );
    });

    it("should emit product.created event after creation", async () => {
      // Arrange
      const input = {
        name: "Test Product",
        category: "activewear" as const,
        price: 29.99,
        materials: ["cotton"],
      };

      mockDb.products.create.mockResolvedValue({
        id: "prod_123",
        ...input,
        createdAt: new Date(),
      });

      // Act
      await createProduct(input, mockDb as any, mockEventBus as any);

      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith("product.created", {
        id: "prod_123",
        name: "Test Product",
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Test: Get product by ID
  // ---------------------------------------------------------------------------
  describe("getProduct", () => {
    it("should return product by id", async () => {
      // Arrange
      const mockProduct = {
        id: "prod_123",
        name: "Test Product",
        price: 29.99,
        category: "activewear",
        materials: ["cotton"],
      };

      mockDb.products.findById.mockResolvedValue(mockProduct);

      // Act
      const result = await getProduct("prod_123", mockDb as any);

      // Assert
      expect(result).toEqual(mockProduct);
      expect(mockDb.products.findById).toHaveBeenCalledWith("prod_123");
    });

    it("should throw ProductNotFoundError for non-existent id", async () => {
      // Arrange
      mockDb.products.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(getProduct("nonexistent", mockDb as any)).rejects.toThrow(ProductNotFoundError);
    });
  });

  // ---------------------------------------------------------------------------
  // Test: List products with pagination
  // ---------------------------------------------------------------------------
  describe("listProducts", () => {
    it("should return paginated products", async () => {
      // Arrange
      const mockProducts = [
        { id: "1", name: "Product 1", price: 10 },
        { id: "2", name: "Product 2", price: 20 },
      ];

      mockDb.products.findAll.mockResolvedValue({
        data: mockProducts,
        total: 2,
        page: 1,
        pageSize: 10,
      });

      // Act
      const result = await listProducts({ page: 1, pageSize: 10 }, mockDb as any);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it("should filter by category", async () => {
      // Arrange
      mockDb.products.findAll.mockResolvedValue({
        data: [{ id: "1", category: "activewear" }],
        total: 1,
      });

      // Act
      const result = await listProducts(
        { page: 1, pageSize: 10, category: "activewear" },
        mockDb as any,
      );

      // Assert
      expect(mockDb.products.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ category: "activewear" }),
      );
    });
  });
});

// ============================================================================
// PHASE 2: GREEN - Implement to make tests pass
// ============================================================================

// Custom error class
class ProductNotFoundError extends Error {
  constructor(id: string) {
    super(`Product ${id} not found`);
    this.name = "ProductNotFoundError";
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// Service implementation
interface CreateProductInput {
  name: string;
  category: "activewear" | "teamwear" | "outerwear" | "casualwear";
  price: number;
  materials: string[];
  sustainable?: boolean;
}

interface Product extends CreateProductInput {
  id: string;
  createdAt: Date;
}

async function createProduct(input: CreateProductInput, db: any, eventBus?: any): Promise<Product> {
  // Validation
  if (input.price <= 0) {
    throw new ValidationError("Price must be positive");
  }

  if (input.materials.length === 0) {
    throw new ValidationError("At least one material required");
  }

  // Create product
  const product = await db.products.create({
    ...input,
    createdAt: new Date(),
  });

  // Emit event
  if (eventBus) {
    eventBus.emit("product.created", {
      id: product.id,
      name: product.name,
    });
  }

  return product;
}

async function getProduct(id: string, db: any): Promise<Product> {
  const product = await db.products.findById(id);

  if (!product) {
    throw new ProductNotFoundError(id);
  }

  return product;
}

async function listProducts(
  options: { page: number; pageSize: number; category?: string },
  db: any,
): Promise<{ data: Product[]; pagination: { total: number } }> {
  const result = await db.products.findAll(options);
  return result;
}

// ============================================================================
// PHASE 3: REFACTOR - Improve code quality
// ============================================================================

/**
 * Refactored version with Zod validation
 *
 * import { z } from 'zod';
 *
 * const createProductSchema = z.object({
 *   name: z.string().min(1).max(200),
 *   category: z.enum(['activewear', 'teamwear', 'outerwear', 'casualwear']),
 *   price: z.number().positive(),
 *   materials: z.array(z.string()).min(1),
 *   sustainable: z.boolean().optional(),
 * });
 *
 * async function createProductValidated(
 *   input: unknown,
 *   db: any,
 *   eventBus?: any
 * ): Promise<Product> {
 *   const validated = createProductSchema.parse(input);
 *   return createProduct(validated, db, eventBus);
 * }
 */
