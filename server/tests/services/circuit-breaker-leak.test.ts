import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCircuitMetrics } from "../../lib/resilience/circuit-breaker.js";
import { appStorageService } from "../../lib/storage/app-service.js";
import { mediaContentService } from "../../services/media/media-content.service.js";

// Mock @google-cloud/storage
vi.mock("@google-cloud/storage", () => {
  const mockFile = {
    getMetadata: vi.fn().mockResolvedValue([{ size: 1024, contentType: "image/jpeg" }]),
    save: vi.fn().mockResolvedValue(undefined),
    download: vi.fn().mockResolvedValue([Buffer.from("mock-data")]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue([true]),
    getSignedUrl: vi
      .fn()
      .mockResolvedValue(["https://storage.googleapis.com/test-bucket/asset.jpg"]),
  };

  const mockBucket = {
    file: vi.fn().mockReturnValue(mockFile),
    getFiles: vi.fn().mockResolvedValue([[{ name: "asset-1.jpg", metadata: { size: 1024 } }]]),
  };

  return {
    Storage: class {
      bucket() {
        return mockBucket;
      }
    },
  };
});

// Mock mediaRepository
vi.mock("../../services/repositories/index.js", () => ({
  mediaRepository: {
    getMediaAsset: vi.fn().mockImplementation((id: number) =>
      Promise.resolve({
        id,
        filename: `asset-${id}.jpg`,
        storagePath: `uploads/asset-${id}.jpg`,
        mimeType: "image/jpeg",
        size: 1024,
        type: "image",
      }),
    ),
    getStorageStats: vi.fn().mockResolvedValue({ count: 10, totalSize: 10240 }),
  },
}));

describe("Circuit Breaker Memory Leak Prevention", () => {
  beforeEach(() => {
    process.env.GCS_BUCKET_NAME = "test-bucket";
  });

  it("should not create unbounded dynamic circuit breakers when querying media assets", async () => {
    // Invoke operations across multiple distinct asset IDs
    for (let i = 1; i <= 10; i++) {
      await mediaContentService.getSignedUrl(i);
      await mediaContentService.getThumbnailUrl(i);
    }

    const circuits = getCircuitMetrics();
    const dynamicCircuits = circuits.filter(
      (c) => c.name.startsWith("get-media-content-") || c.name.startsWith("get-media-thumbnail-"),
    );

    // There should be NO circuit breakers named with dynamic IDs
    expect(dynamicCircuits).toHaveLength(0);

    // Ensure singleton circuit breakers are used instead
    const staticAssetCircuit = circuits.find((c) => c.name === "media-content-asset");
    const staticThumbnailCircuit = circuits.find((c) => c.name === "media-content-thumbnail");
    expect(staticAssetCircuit).toBeDefined();
    expect(staticThumbnailCircuit).toBeDefined();
  });

  it("should not create dynamic circuit breakers with colons or keys for GCS operations", async () => {
    const testKeys = ["key-1.jpg", "key-2.jpg", "key-3.jpg"];

    for (const key of testKeys) {
      await appStorageService.getAssetMetadata(key);
      await appStorageService.uploadAsset(key, Buffer.from("test"));
      await appStorageService.downloadAsset(key);
      await appStorageService.deleteAsset(key);
      await appStorageService.assetExists(key);
      await appStorageService.generateSignedUrl(key);
    }

    await appStorageService.listAssets("prefix-a");
    await appStorageService.listAssets("prefix-b");
    await appStorageService.listAssetsWithMetadata("prefix-c");
    await appStorageService.listAssetsWithMetadata("prefix-d");

    const circuits = getCircuitMetrics();
    const dynamicCircuits = circuits.filter(
      (c) => c.name.includes(":") || c.name.includes("key-") || c.name.includes("prefix-"),
    );

    expect(dynamicCircuits).toHaveLength(0);
  });
});
