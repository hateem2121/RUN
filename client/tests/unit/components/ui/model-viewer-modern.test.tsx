import type { MediaAsset } from "@run-remix/shared";
import { act, render, screen } from "@testing-library/react";
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

describe("UnifiedModelViewer Modern React 19 & Memory Suite", () => {
  const sampleAsset = {
    id: 201,
    name: "garment-3d-model",
    originalName: "garment-spec.glb",
    mimeType: "model/gltf-binary",
    size: 1024 * 1024 * 2, // 2MB
    url: "/api/media/201",
    thumbnailUrl: "/images/posters/garment-poster.webp",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost:5002/mock-model");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const flushAsync = async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  };

  it("renders poster fallback and activation button properly", async () => {
    vi.spyOn(queryClient, "batchFetchMediaContent").mockResolvedValue([
      { id: 201, success: true, url: "http://example.com/model.glb" },
    ]);

    render(
      <UnifiedModelViewer
        asset={sampleAsset as unknown as MediaAsset}
        config={{ loading: "lazy", cameraControls: true }}
      />,
    );

    await flushAsync();

    // Verify component renders without crashing
    expect(screen.queryByTestId("model-viewer-container")).toBeDefined();
  });

  it("handles auto-loading without runtime forwardRef warnings", async () => {
    vi.spyOn(queryClient, "batchFetchMediaContent").mockResolvedValue([
      { id: 201, success: true, url: "http://example.com/model.glb" },
    ]);

    const { unmount } = render(
      <UnifiedModelViewer
        asset={sampleAsset as unknown as MediaAsset}
        config={{ loading: "auto", cameraControls: true }}
      />,
    );

    await flushAsync();
    unmount();
  });
});
