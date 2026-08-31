import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PublicHeroSection } from "@/components/public/manufacturing/PublicHeroSection";

// Mock GSAP and OptimizedImage since this is JSDOM
vi.mock("@/lib/gsap", () => ({
  gsap: {
    timeline: () => ({
      from: vi.fn().mockReturnThis(),
    }),
    from: vi.fn(),
  },
  useGSAP: (callback: any) => callback(),
}));

vi.mock("@/lib/gsap-animations", () => ({
  countUpAnimation: vi.fn(),
}));

vi.mock("@/components/ui/optimized-image", () => ({
  OptimizedImage: ({ alt }: { alt: string }) => <img alt={alt} data-testid="optimized-image" />,
}));

vi.mock("@/components/error-boundaries/manufacturing-error-boundary", () => ({
  ManufacturingErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("PublicHeroSection", () => {
  const mockHero = {
    headline: "Test Headline **Highlighted**",
    subheadline: "Test Subheadline",
    ctaLink: "/test-link",
    ctaText: "Click Here",
    backgroundMediaId: "123",
  };

  const mockMediaAssets = [{ id: "123", url: "test.jpg", alt: "Test" }];

  it("renders correctly with hero data", () => {
    render(<PublicHeroSection hero={mockHero as any} mediaAssets={mockMediaAssets as any} />);

    expect(screen.getByText(/Test Headline/i)).toBeDefined();
    expect(screen.getByText(/Highlighted/i)).toBeDefined();
    expect(screen.getByText(/Test Subheadline/i)).toBeDefined();
    expect(screen.getByText(/Click Here/i)).toBeDefined();
  });

  it("renders default stats if none provided", () => {
    render(<PublicHeroSection hero={mockHero as any} mediaAssets={mockMediaAssets as any} />);

    expect(screen.getByText("Machines")).toBeDefined();
    expect(screen.getByText("Capacity")).toBeDefined();
    expect(screen.getByText("Defects")).toBeDefined();
    expect(screen.getByText("Cycle")).toBeDefined();
  });

  it("renders provided stats", () => {
    const stats = [
      { label: "Stat1", value: 10, suffix: "x", icon: "test" },
      { label: "Stat2", value: 20, suffix: "y", icon: "test" },
      { label: "Stat3", value: 30, suffix: "z", icon: "test" },
      { label: "Stat4", value: 40, suffix: "w", icon: "test" },
    ];

    render(
      <PublicHeroSection
        hero={mockHero as any}
        mediaAssets={mockMediaAssets as any}
        stats={stats}
      />,
    );

    expect(screen.getByText("Stat1")).toBeDefined();
    expect(screen.getByText("Stat2")).toBeDefined();
    expect(screen.getByText("Stat3")).toBeDefined();
    expect(screen.getByText("Stat4")).toBeDefined();
  });
});
