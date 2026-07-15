import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useIsMobile } from "../../../../client/app/hooks/use-is-mobile.js";

describe("useIsMobile", () => {
  it("should return false by default", () => {
    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });
});
