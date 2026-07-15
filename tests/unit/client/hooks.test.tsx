import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock React Router
vi.mock("react-router", () => ({
  useNavigation: () => ({ state: "idle" }),
  useLocation: () => ({ pathname: "/" }),
  useMatches: () => [],
  useNavigate: () => vi.fn(),
  useLoaderData: () => ({}),
  useActionData: () => ({}),
  useFetcher: () => ({ state: "idle", load: vi.fn(), submit: vi.fn() }),
}));

// Mock GSAP
vi.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { create: vi.fn(), refresh: vi.fn() } }));
vi.mock("@gsap/react", () => ({ useGSAP: (cb: any) => cb() }));
vi.mock("gsap", () => ({ default: { timeline: vi.fn(() => ({ from: vi.fn(), to: vi.fn() })) } }));

import { useDebounce } from "../../../client/app/hooks/use-debounce.js";
import { useIsMobile } from "../../../client/app/hooks/use-is-mobile.js";
import { useMediaQuery } from "../../../client/app/hooks/use-media-query.js";
import { useOfflineStatus } from "../../../client/app/hooks/use-offline-status.js";
import { useReducedMotion } from "../../../client/app/hooks/use-reduced-motion.js";

describe("Client Hooks Auto", () => {
  it("useDebounce", () => {
    const { result } = renderHook(() => useDebounce("test", 100));
    expect(result.current).toBe("test");
  });

  it("useIsMobile", () => {
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe("boolean");
  });

  it("useMediaQuery", () => {
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(typeof result.current).toBe("boolean");
  });

  it("useOfflineStatus", () => {
    const { result } = renderHook(() => useOfflineStatus());
    expect(typeof result.current).toBe("boolean");
  });

  it("useReducedMotion", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(typeof result.current).toBe("boolean");
  });
});
