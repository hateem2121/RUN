import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Footer } from "../../../app/components/layout/Footer";

// Mock GSAP & GSAP React
vi.mock("@gsap/react", () => ({
  useGSAP: vi.fn((_cb: any) => {}),
}));

vi.mock("@/lib/gsap", () => ({
  gsap: {
    fromTo: vi.fn(),
    set: vi.fn(),
    to: vi.fn(),
    quickTo: vi.fn().mockReturnValue(vi.fn()),
  },
  ScrollTrigger: {
    refresh: vi.fn(),
    create: vi.fn(),
    getById: vi.fn(),
    getAll: vi.fn(() => []),
  },
}));

// Mock React Router
vi.mock("react-router", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useRouteLoaderData: () => ({ cspNonce: "test-nonce" }),
    Link: ({ to, children, ...props }: any) => (
      <a href={to} data-internal-link="true" {...props}>
        {children}
      </a>
    ),
  };
});

// Mock React Query
let mockFooterData: any = null;
let mockIsLoading = false;
let mockContactData: any = null;

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === "/api/footer") {
      return { data: mockFooterData, isLoading: mockIsLoading };
    }
    if (queryKey[0] === "/api/contact-info") {
      return { data: mockContactData, isLoading: false };
    }
    return { data: null, isLoading: false };
  }),
}));

describe("Footer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFooterData = null;
    mockIsLoading = false;
    mockContactData = null;

    // Stub IntersectionObserver
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = "";
      readonly thresholds: ReadonlyArray<number> = [];
      constructor(public callback: IntersectionObserverCallback) {}
      observe = vi.fn((target: Element) => {
        this.callback(
          [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
          this,
        );
      });
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    }
    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders factory timezone clocks for Sialkot and Zurich", () => {
    render(<Footer />);
    expect(screen.getByText(/SIALKOT, PK \(PKT\)/i)).toBeTruthy();
    expect(screen.getByText(/ZURICH, CH \(CET\)/i)).toBeTruthy();
  });

  it("renders lead gen form when contactFormEnabled is true", () => {
    mockFooterData = {
      contactFormEnabled: true,
      contactFormHeading: "BESPOKE ATHLETIC INQUIRY",
    };
    render(<Footer />);
    expect(screen.getByText("BESPOKE ATHLETIC INQUIRY")).toBeTruthy();
  });

  it("does NOT render lead gen form when contactFormEnabled is false", () => {
    mockFooterData = {
      contactFormEnabled: false,
    };
    render(<Footer />);
    expect(screen.queryByText(/Start Your/i)).toBeNull();
    expect(screen.queryByLabelText(/COMPANY NAME/i)).toBeNull();
  });

  it("renders company address with icon when provided in footer config", () => {
    mockFooterData = {
      companyAddress: "Industrial Estate Sector 4, Sialkot, Pakistan",
    };
    render(<Footer />);
    expect(screen.getByText("Industrial Estate Sector 4, Sialkot, Pakistan")).toBeTruthy();
  });

  it("renders navigation columns and uses React Router Link for internal links", () => {
    mockFooterData = {
      navigationColumns: [
        {
          title: "Production",
          links: [
            { label: "Fabric Milling", href: "/manufacturing/fabric" },
            { label: "Sublimation", href: "/manufacturing/sublimation" },
          ],
        },
      ],
    };
    render(<Footer />);

    const fabricLink = screen.getAllByText("Fabric Milling")[0];
    expect(fabricLink).toBeTruthy();
    expect(fabricLink.closest("a")?.getAttribute("href")).toBe("/manufacturing/fabric");
    expect(fabricLink.closest("a")?.getAttribute("data-internal-link")).toBe("true");
  });

  it("renders certification marquee with accessible pause control and Radix Dialog trigger", () => {
    mockFooterData = {
      certifications: [
        {
          id: 101,
          name: "OEKO-TEX Standard 100",
          imageUrl: "/certs/oeko-tex.svg",
          type: "sustainability",
          issuingOrganization: "OEKO-TEX Association",
        },
      ],
    };
    render(<Footer />);

    // Check ticker header and pause button
    expect(screen.getByText(/\[ CERTIFIED STANDARDS \(CLICK TO VERIFY\) \]/i)).toBeTruthy();
    const pauseBtn = screen.getByLabelText(/Pause certification ticker/i);
    expect(pauseBtn).toBeTruthy();

    // Toggle pause
    fireEvent.click(pauseBtn);
    expect(screen.getByLabelText(/Resume certification ticker/i)).toBeTruthy();

    // Verify click on cert opens dialog
    const certBtn = screen.getAllByText("OEKO-TEX Standard 100")[0].closest("button");
    expect(certBtn).toBeTruthy();
    if (certBtn) {
      fireEvent.click(certBtn);
    }

    expect(screen.getByText("VERIFIED B2B STANDARD")).toBeTruthy();
    expect(screen.getAllByText("OEKO-TEX Association").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("RUN-ISO-0101")).toBeTruthy();
  });

  it("renders brand tagline and copyright bar correctly", () => {
    mockFooterData = {
      companyName: "RUN APPAREL LTD",
      brandTagline: "Ethical High-Performance Sportswear",
      brandSubtext: "ISO 9001 Certified Factory",
      brandText: "RUN APPAREL ATELIER",
    };
    render(<Footer />);

    expect(screen.getByText(/RUN APPAREL LTD/i)).toBeTruthy();
    expect(screen.getByText(/Ethical High-Performance Sportswear/i)).toBeTruthy();
    expect(screen.getByText("ISO 9001 Certified Factory")).toBeTruthy();
    expect(screen.getByText("RUN APPAREL ATELIER")).toBeTruthy();
  });
});
