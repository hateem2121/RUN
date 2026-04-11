/**
 * Media Repository Unit Tests
 * Tests media asset CRUD and folder operations with mocked database
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the database module
vi.mock("../../../server/db.js", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
  },
}));

// Mock unified cache
vi.mock("../../../server/lib/cache/unified-cache.js", () => ({
  UnifiedCache: {
    getInstance: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      getOrFetch: vi.fn().mockImplementation((_key, loader) => loader()),
      delete: vi.fn().mockResolvedValue(undefined),
      clearPattern: vi.fn().mockResolvedValue(undefined),
    }),
    TTL_PRESETS: {
      MEDIA: 6 * 60 * 60 * 1000,
    },
  },
}));

// Mock logger
vi.mock("../../../server/lib/monitoring/logger.js", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocking
import { db } from "../../../server/db.js";
import { MediaRepository } from "../../../server/lib/db/repositories/media-repository.js";

describe("MediaRepository", () => {
  let mediaRepository: MediaRepository;

  const mockMediaAsset = {
    id: 1,
    filename: "test-image.jpg",
    originalName: "Test Image.jpg",
    mimeType: "image/jpeg",
    type: "image",
    totalSize: 1024,
    url: "/api/media/1/content",
    storagePath: "media/images/2026/01/test-image.jpg",
    thumbnailUrl: "/api/media/thumbnail/1",
    isActive: true,
    folderId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockFolder = {
    id: 1,
    name: "Images",
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mediaRepository = new MediaRepository();
    vi.clearAllMocks();
  });

  describe("getMediaAsset", () => {
    it("should return media asset by ID", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockMediaAsset]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await mediaRepository.getMediaAsset(1);

      expect(result).toEqual(mockMediaAsset);
    });

    it("should return undefined for non-existent asset", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await mediaRepository.getMediaAsset(999);

      expect(result).toBeUndefined();
    });
  });

  describe("getMediaAssets", () => {
    it("should return media assets with pagination", async () => {
      const mockAssets = [mockMediaAsset, { ...mockMediaAsset, id: 2 }];
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockAssets),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await mediaRepository.getMediaAssets(10, 0);

      expect(result).toHaveLength(2);
    });

    it("should filter by type when provided", async () => {
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue([mockMediaAsset]),
              }),
            }),
          }),
        }),
      } as unknown as ReturnType<typeof db.select>);

      const result = await mediaRepository.getMediaAssets(10, 0, { type: "image" });

      expect(result).toHaveLength(1);
    });
  });

  describe("createMediaAsset", () => {
    it("should create a new media asset", async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockMediaAsset]),
        }),
      } as unknown as ReturnType<typeof db.insert>);

      const result = await mediaRepository.createMediaAsset({
        filename: "test-image.jpg",
        mimeType: "image/jpeg",
        type: "image",
        url: "/api/media/1/content",
        storagePath: "media/images/test.jpg",
        bucketName: "run-bucket",
      });

      expect(result).toEqual(mockMediaAsset);
    });
  });

  describe("updateMediaAsset", () => {
    it("should update an existing media asset", async () => {
      const updatedAsset = { ...mockMediaAsset, filename: "updated.jpg" };
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedAsset]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await mediaRepository.updateMediaAsset(1, { filename: "updated.jpg" });

      expect(result?.filename).toBe("updated.jpg");
    });
  });

  describe("deleteMediaAsset", () => {
    it("should soft delete a media asset", async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ ...mockMediaAsset, deletedAt: new Date() }]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await mediaRepository.deleteMediaAsset(1);

      expect(result).toBe(true);
    });

    it("should throw MediaNotFoundError for non-existent asset", async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      await expect(mediaRepository.deleteMediaAsset(999)).rejects.toThrow(
        "Media asset with ID 999 not found",
      );
    });
  });

  describe("Folder operations", () => {
    describe("getFolders", () => {
      it("should return all folders", async () => {
        vi.mocked(db.select).mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([mockFolder]),
            }),
          }),
        } as unknown as ReturnType<typeof db.select>);

        const result = await mediaRepository.getFolders();

        expect(result).toHaveLength(1);
        expect(result[0]?.name).toBe("Images");
      });
    });

    describe("createFolder", () => {
      it("should create a new folder", async () => {
        vi.mocked(db.insert).mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockFolder]),
          }),
        } as unknown as ReturnType<typeof db.insert>);

        const result = await mediaRepository.createFolder({
          name: "Images",
          parentId: null,
        });

        expect(result).toEqual(mockFolder);
      });
    });

    describe("deleteFolder", () => {
      it("should delete a folder", async () => {
        vi.mocked(db.delete).mockReturnValue({
          where: vi.fn().mockResolvedValue([mockFolder]),
        } as unknown as ReturnType<typeof db.delete>);

        const result = await mediaRepository.deleteFolder(1);

        expect(typeof result).toBe("boolean");
      });
    });
  });

  describe("moveMediaAsset", () => {
    it("should move asset to new folder", async () => {
      const movedAsset = { ...mockMediaAsset, folderId: 2 };
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([movedAsset]),
          }),
        }),
      } as unknown as ReturnType<typeof db.update>);

      const result = await mediaRepository.moveMediaAsset(1, 2);

      expect(result?.folderId).toBe(2);
    });
  });
});
