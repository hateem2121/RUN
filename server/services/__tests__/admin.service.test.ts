import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStorage } from "../../lib/storage-singleton.js";
import { adminService } from "../admin/admin.service.js";

vi.mock("../../lib/storage-singleton.js", () => ({
  getStorage: vi.fn(),
}));

vi.mock("../../lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("AdminService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getInitialProductsData", () => {
    it("fetches and aggregates data correctly", async () => {
      const mockProducts = [
        { id: 1, name: "P1", isActive: true, deletedAt: null, primaryImageId: 10 },
        { id: 2, name: "P2", isActive: false, deletedAt: null }, // Inactive
      ];
      const mockMedia = [{ id: 10, filename: "img.jpg", type: "image", url: "/url" }];

      const mockStorage = {
        getProductsIncludingDeleted: vi.fn().mockResolvedValue(mockProducts),
        getProductsCount: vi.fn().mockResolvedValue(2),
        getCategories: vi.fn().mockResolvedValue([]),
        getFabrics: vi.fn().mockResolvedValue([]),
        getMediaAssetsByIds: vi.fn().mockResolvedValue(mockMedia),
        getMediaAssets: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const result = await adminService.getInitialProductsData(1, 50);

      expect(result.products).toHaveLength(1); // Only active and not deleted
      expect(result.products[0].name).toBe("P1");
      expect(result.meta.totalProducts).toBe(2);
      expect(result.mediaAssets).toHaveLength(1);
    });

    it("handles empty data gracefully", async () => {
      const mockStorage = {
        getProductsIncludingDeleted: vi.fn().mockResolvedValue([]),
        getProductsCount: vi.fn().mockResolvedValue(0),
        getCategories: vi.fn().mockResolvedValue([]),
        getFabrics: vi.fn().mockResolvedValue([]),
        getMediaAssetsByIds: vi.fn().mockResolvedValue([]),
        getMediaAssets: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const result = await adminService.getInitialProductsData();

      expect(result.products).toEqual([]);
      expect(result.meta.totalProducts).toBe(0);
    });
  });

  describe("fixCorruptedMedia", () => {
    it("identifies and fixes corrupted media URLs", async () => {
      const categories = [
        {
          id: 1,
          name: "Cat 1",
          featuredContent: {
            card1: { mediaUrl: "/api/media/undefined/content" }, // Corrupted
            card2: { mediaUrl: "/valid/url" },
          },
        },
        {
          id: 2,
          name: "Cat 2",
          featuredContent: { card1: { mediaUrl: "/valid/url" } },
        },
      ];

      const mockStorage = {
        getCategories: vi.fn().mockResolvedValue(categories),
        updateCategory: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const result = await adminService.fixCorruptedMedia();

      expect(result.fixedCount).toBe(1);
      expect(result.fixedCategories).toContain("Cat 1");
      expect(mockStorage.updateCategory).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          featuredContent: expect.objectContaining({
            card1: expect.objectContaining({ mediaUrl: "" }), // Fixed to empty string
          }),
        }),
      );
    });

    it("returns 0 if no corruption found", async () => {
      const categories = [
        { id: 1, name: "Cat 1", featuredContent: { card1: { mediaUrl: "/valid/url" } } },
      ];

      const mockStorage = {
        getCategories: vi.fn().mockResolvedValue(categories),
      };
      vi.mocked(getStorage).mockReturnValue(mockStorage as any);

      const result = await adminService.fixCorruptedMedia();

      expect(result.fixedCount).toBe(0);
      expect(result.fixedCategories).toEqual([]);
    });
  });
});
