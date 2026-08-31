import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UnifiedModelViewer } from "@/components/ui/UnifiedModelViewerCore";
import * as queryClient from "@/lib/query-client";

// Mock dependencies
vi.mock("@/lib/model-viewer-loader", () => ({
  ensureModelViewerLoaded: vi.fn().mockImplementation(async () => {
    if (typeof customElements !== "undefined" && !customElements.get("model-viewer")) {
      customElements.define("model-viewer", class extends HTMLElement {});
    }
  }),
}));

vi.mock("@google/model-viewer", () => ({}));

vi.mock("@/lib/query-client", () => ({
  batchFetchMediaContent: vi.fn(),
}));

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: vi.fn().mockReturnValue(false),
}));

vi.mock("@/hooks/use-model-viewer-error-recovery", () => ({
  useModelViewerErrorRecovery: vi.fn().mockReturnValue({ errorBoundaryKey: 0 }),
}));

describe("UnifiedModelViewer Adversarial Tests", () => {
  const sampleAsset = {
    id: 101,
    name: "test-model",
    originalName: "test-model.glb",
    mimeType: "model/gltf-binary",
    size: 1024 * 1024 * 5, // 5MB
    url: "/api/media/101",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleAsset2 = {
    ...sampleAsset,
    id: 102,
    originalName: "test-model-2.glb",
  };

  const createMockBlob = (id: string) => `blob:http://localhost:5002/${id}`;

  let revokedUrls: string[] = [];
  let createdBlobUrls: string[] = [];

  beforeEach(() => {
    revokedUrls = [];
    createdBlobUrls = [];

    vi.spyOn(URL, "createObjectURL").mockImplementation(() => {
      const url = createMockBlob(`mock-${Math.random().toString(36).substring(2, 9)}`);
      createdBlobUrls.push(url);
      return url;
    });

    vi.spyOn(URL, "revokeObjectURL").mockImplementation((url: string) => {
      revokedUrls.push(url);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const flushAsync = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  };

  it("1. Eliminates dependency loop: initializeModelViewer runs only once on mount", async () => {
    const batchFetchSpy = vi.spyOn(queryClient, "batchFetchMediaContent").mockResolvedValue([
      {
        id: 101,
        success: true,
        content: "http://example.com/model.glb",
      },
    ]);

    const { unmount } = render(
      <UnifiedModelViewer asset={sampleAsset as any} config={{ loading: "auto" }} />,
    );

    await flushAsync();

    expect(batchFetchSpy).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("2. Binary GLTF content: creates blob URL and revokes it on unmount", async () => {
    vi.spyOn(queryClient, "batchFetchMediaContent").mockResolvedValue([
      {
        id: 101,
        success: true,
        content: new Uint8Array([1, 2, 3, 4]),
      },
    ]);

    const { unmount } = render(
      <UnifiedModelViewer asset={sampleAsset as any} config={{ loading: "auto" }} />,
    );

    await flushAsync();

    expect(createdBlobUrls.length).toBe(1);
    const createdUrl = createdBlobUrls[0];

    unmount();

    expect(revokedUrls).toContain(createdUrl);
  });

  it("3. Base64 GLTF content: decodes base64, creates blob URL, and revokes it on unmount", async () => {
    const base64Data = btoa("mock gltf content");
    vi.spyOn(queryClient, "batchFetchMediaContent").mockResolvedValue([
      {
        id: 101,
        success: true,
        content: base64Data,
      },
    ]);

    const { unmount } = render(
      <UnifiedModelViewer asset={sampleAsset as any} config={{ loading: "auto" }} />,
    );

    await flushAsync();

    expect(createdBlobUrls.length).toBe(1);
    const createdUrl = createdBlobUrls[0];

    unmount();

    expect(revokedUrls).toContain(createdUrl);
  });

  it("4. Optimized URL blob: revokes blob URL when optimizedModelUrl is a blob URL on unmount", async () => {
    const mockOptimizedBlobUrl = createMockBlob("optimized-blob-123");
    vi.spyOn(queryClient, "batchFetchMediaContent").mockResolvedValue([
      {
        id: 101,
        success: true,
        url: mockOptimizedBlobUrl,
      },
    ]);

    const { unmount } = render(
      <UnifiedModelViewer asset={sampleAsset as any} config={{ loading: "auto" }} />,
    );

    await flushAsync();

    unmount();

    expect(revokedUrls).toContain(mockOptimizedBlobUrl);
  });

  it("5. Asset change: revokes old blob URL when asset changes", async () => {
    vi.spyOn(queryClient, "batchFetchMediaContent").mockImplementation((ids: number[]) => {
      const id = ids[0];
      return Promise.resolve([
        {
          id,
          success: true,
          content: new Uint8Array([id, 2, 3]),
        },
      ]);
    });

    const { rerender, unmount } = render(
      <UnifiedModelViewer asset={sampleAsset as any} config={{ loading: "auto" }} />,
    );

    await flushAsync();

    const firstBlob = createdBlobUrls[0];
    expect(firstBlob).toBeDefined();

    // Rerender with asset2
    rerender(<UnifiedModelViewer asset={sampleAsset2 as any} config={{ loading: "auto" }} />);

    await flushAsync();

    expect(revokedUrls).toContain(firstBlob);
    expect(createdBlobUrls.length).toBe(2);

    unmount();

    const secondBlob = createdBlobUrls[1];
    expect(revokedUrls).toContain(secondBlob);
  });

  it("6. Timer safety: clears all retry timeouts on unmount", async () => {
    vi.spyOn(queryClient, "batchFetchMediaContent").mockRejectedValue(new Error("Network fail"));

    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

    const { unmount } = render(
      <UnifiedModelViewer asset={sampleAsset as any} config={{ loading: "auto" }} />,
    );

    await flushAsync();

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
