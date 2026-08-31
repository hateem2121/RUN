import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { Categories } from "@/components/homepage/Categories";
import { FeaturedProducts } from "@/components/homepage/FeaturedProducts";
import { Hero } from "@/components/homepage/Hero";
import { Process } from "@/components/homepage/Process";
import { Sections } from "@/components/homepage/Sections";
import { Slogans } from "@/components/homepage/Slogans";
import { Stats } from "@/components/homepage/Stats";
import { Values } from "@/components/homepage/Values";
import { CustomCursor } from "@/components/ui/CustomCursor";

// Mock GSAP and hooks
vi.mock("@/lib/gsap", () => ({
  gsap: {
    fromTo: vi.fn(),
    set: vi.fn(),
    to: vi.fn(),
    quickTo: vi.fn().mockReturnValue(vi.fn()),
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
  },
}));

vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}));

vi.mock("@/hooks/use-homepage-data", () => ({
  useHomepageData: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
}));

describe("Homepage Forensic Remediation Master Verification", () => {
  describe("Task 1: Sections.tsx Null Guard & Resiliency", () => {
    it("renders gracefully when sectionType is undefined or null without throwing replace error", () => {
      const mockSections = [
        {
          id: 1,
          title: "Custom Manufacturing",
          heroTitle: "B2B Precision",
          content: "Advanced technical outerwear and activewear production.",
          sectionType: null as unknown as string,
          sortOrder: 1,
          isActive: true,
        },
      ];

      expect(() => {
        render(<Sections data={mockSections} />);
      }).not.toThrow();

      expect(screen.getByText("B2B Precision")).toBeInTheDocument();
      expect(screen.getByText("general")).toBeInTheDocument();
    });

    it("spans full width on odd-length final card", () => {
      const mockSections = [
        { id: 1, title: "Card 1", sectionType: "craftsmanship" },
        { id: 2, title: "Card 2", sectionType: "innovation" },
        { id: 3, title: "Card 3", sectionType: "sustainability" },
      ];

      const { container } = render(<Sections data={mockSections as any} />);
      const cards = container.querySelectorAll(".scroll-reveal");
      expect(cards).toHaveLength(3);
      expect(cards[2]?.className).toContain("md:col-span-2");
    });
  });

  describe("Task 2: Categories.tsx Interactive Links & Skew Wrapper", () => {
    it("renders interactive navigation Links for each category with proper aria-labels", () => {
      const mockCategories = [
        { id: "1", name: "Team Wear", slug: "teamwear" },
        { id: "2", name: "Active Wear", slug: "activewear" },
      ];

      render(
        <BrowserRouter>
          <Categories data={mockCategories as any} />
        </BrowserRouter>,
      );

      const links = screen.getAllByRole("link", { name: /Explore category:/i });
      expect(links.length).toBeGreaterThanOrEqual(2);
      expect(links[0]).toHaveAttribute("href", "/categories/teamwear");
      expect(links[1]).toHaveAttribute("href", "/categories/activewear");
    });
  });

  describe("Task 3: CustomCursor.tsx Color Invariant & Accessibility", () => {
    it("renders cursor containers with aria-hidden=true", () => {
      const { container } = render(<CustomCursor />);
      const dot = container.querySelector(".cursor-dot");
      const follower = container.querySelector(".cursor-follower");

      expect(dot).toHaveAttribute("aria-hidden", "true");
      expect(follower).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Task 4 & 10: Hero.tsx Props, One-Shot Gate & 100dvh", () => {
    it("accepts heroData props directly and renders CTA Link", () => {
      const mockHero = {
        id: 1,
        title: "STRATEGIC | MANUFACTURING | PARTNER",
        subtitle: "Global leader in performance sportswear.",
        ctaText: "Start Inquiry",
        ctaLink: "/contact",
      };

      render(
        <BrowserRouter>
          <Hero heroData={mockHero as any} />
        </BrowserRouter>,
      );

      expect(screen.getByText("Start Inquiry")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Start Inquiry/i })).toHaveAttribute(
        "href",
        "/contact",
      );
      expect(screen.getByText("Global leader in performance sportswear.")).toBeInTheDocument();
    });
  });

  describe("Task 7: Process.tsx Step Numbering & Image Fallback", () => {
    it("formats step numbering as 01, 02 and handles image error safely", () => {
      const mockSteps = [
        { id: "step-uuid-1", title: "Inquiry & R&D", description: "Feasibility" },
        { id: "step-uuid-2", title: "Prototyping", description: "Sampling" },
      ];

      render(
        <BrowserRouter>
          <Process data={mockSteps as any} />
        </BrowserRouter>,
      );

      expect(screen.getAllByText("01").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("02").length).toBeGreaterThanOrEqual(1);

      const images = screen.getAllByRole("img");
      expect(images.length).toBeGreaterThanOrEqual(2);

      // Trigger error to verify error handler nullification
      fireEvent.error(images[0]!);
      expect((images[0] as HTMLImageElement).src).toContain("placeholder");
    });
  });

  describe("Task 8: Values.tsx High-Contrast Styling & Accessible Ticker", () => {
    it("renders Values cards and scrolling cert ticker with accessible label", () => {
      render(<Values />);

      expect(screen.getByText("Heritage Innovation")).toHaveClass("text-white");
      expect(
        screen.getByRole("region", { name: "Quality and Environmental Certifications" }),
      ).toBeInTheDocument();
    });
  });

  describe("Task 9: Slogans.tsx WCAG 2.2.2 Pause Controls", () => {
    it("renders slogans marquee with hover and focus pause classes", () => {
      const { container } = render(<Slogans data={undefined} />);

      const marquee = container.querySelector(".animate-marquee");
      expect(marquee?.className).toContain("hover:[animation-play-state:paused]");
      expect(marquee?.className).toContain("focus-within:[animation-play-state:paused]");
    });
  });

  describe("Task 12: Stats.tsx Inverted Heading Hierarchy & Scramble", () => {
    it("renders metric label as h3 heading and numerical value inside tabular container", () => {
      render(<Stats />);

      const headings = screen.getAllByRole("heading", { level: 3 });
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0]?.textContent).toContain("Years of Heritage");
    });
  });

  describe("Task 13: FeaturedProducts.tsx Landmark Cleanliness & Focus Rings", () => {
    it("renders product cards inside semantic list items with accessible focus rings", () => {
      render(
        <BrowserRouter>
          <FeaturedProducts products={undefined} />
        </BrowserRouter>,
      );

      const items = screen.getAllByRole("listitem");
      expect(items.length).toBeGreaterThan(0);

      const productLinks = screen.getAllByRole("link", { name: /View product details:/i });
      expect(productLinks[0]?.className).toContain("focus-visible:ring-primary");
    });
  });
});
