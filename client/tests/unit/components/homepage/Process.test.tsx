import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Process } from "@/components/homepage/Process";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ScrollTrigger } from "@/lib/gsap";

// Mock GSAP and hooks
vi.mock("@/lib/gsap", () => ({
  gsap: {
    fromTo: vi.fn(),
    set: vi.fn(),
    to: vi.fn(),
    matchMedia: vi.fn(() => ({
      add: vi.fn((_, cb) => cb()),
      revert: vi.fn(),
    })),
    timeline: vi.fn(() => ({
      to: vi.fn().mockReturnThis(),
      fromTo: vi.fn().mockReturnThis(),
    })),
    utils: {
      toArray: vi.fn((sel) => (Array.isArray(sel) ? sel : Array.from(sel || []))),
    },
  },
  useGSAP: vi.fn((cb) => {
    if (typeof cb === "function") cb();
  }),
  ScrollTrigger: {
    create: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
}));

vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}));

describe("Process.tsx Component Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <Process {...props} />
      </BrowserRouter>,
    );
  };

  it("renders the Production Pipeline section title and all 4 fallback cards by default", () => {
    renderComponent();

    // Section heading
    expect(
      screen.getByRole("heading", { name: /production pipeline/i, level: 2 }),
    ).toBeInTheDocument();

    // Interactive step navigator pills: 01, 02, 03, 04
    const stepTabs = screen.getAllByRole("tab");
    expect(stepTabs).toHaveLength(4);
    expect(stepTabs[0]).toHaveTextContent("01");
    expect(stepTabs[1]).toHaveTextContent("02");
    expect(stepTabs[2]).toHaveTextContent("03");
    expect(stepTabs[3]).toHaveTextContent("04");

    // Fallback step titles
    expect(screen.getByText("Inquiry & R&D")).toBeInTheDocument();
    expect(screen.getByText("Prototyping")).toBeInTheDocument();
    expect(screen.getByText("Production")).toBeInTheDocument();
    expect(screen.getByText("Logistics")).toBeInTheDocument();
  });

  it("renders custom CMS process cards when provided via data prop", () => {
    const customData = [
      {
        id: "step-custom-1",
        title: "Custom Yarn Spinning",
        description: "High-grade organic fiber extrusion.",
        imageUrl: "/images/custom-yarn.webp",
      },
      {
        id: "step-custom-2",
        title: "Robotic Weaving",
        description: "Seamless cylindrical knit architecture.",
        imageUrl: "/images/custom-weaving.webp",
      },
    ];

    renderComponent({ data: customData });

    // Custom titles
    expect(screen.getByText("Custom Yarn Spinning")).toBeInTheDocument();
    expect(screen.getByText("Robotic Weaving")).toBeInTheDocument();

    // 2 tabs rendered matching custom data length
    const stepTabs = screen.getAllByRole("tab");
    expect(stepTabs).toHaveLength(2);
  });

  it("handles step navigator clicks and triggers scroll navigation", () => {
    const mockScrollTo = vi.fn();
    window.scrollTo = mockScrollTo;

    // Mock ScrollTrigger instance
    const mockST = {
      start: 1000,
      end: 5000,
      trigger: document.createElement("div"),
    };
    (ScrollTrigger.getById as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockST);

    renderComponent();

    const stepTabs = screen.getAllByRole("tab");
    fireEvent.click(stepTabs[2]); // Click Step 03

    // window.scrollTo called
    expect(mockScrollTo).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: "smooth",
      }),
    );
  });

  it("respects reduced motion preference by skipping horizontal pinning", () => {
    (useReducedMotion as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    renderComponent();

    expect(
      screen.getByRole("heading", { name: /production pipeline/i, level: 2 }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
  });
});
